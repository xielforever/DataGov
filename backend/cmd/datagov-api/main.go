package main

import (
	"context"
	"errors"
	"flag"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"datagov/backend/internal/modules/ai"
	"datagov/backend/internal/modules/development"
	"datagov/backend/internal/modules/iam"
	"datagov/backend/internal/modules/metadata"
	"datagov/backend/internal/platform/config"
	"datagov/backend/internal/platform/database"
	"datagov/backend/internal/platform/redisx"
	"datagov/backend/internal/platform/server"
)

func main() {
	if err := run(os.Args[1:]); err != nil {
		slog.Error("datagov api stopped", "error", err)
		os.Exit(1)
	}
}

type runtimeOptions struct {
	CheckMigrations bool
	MigrateOnly     bool
}

func run(args []string) error {
	options, err := parseRuntimeOptions(args)
	if err != nil {
		return err
	}

	cfg, err := config.Load()
	if err != nil {
		return err
	}

	logger := slog.New(slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{
		Level: cfg.LogLevel,
	}))
	slog.SetDefault(logger)

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	dbPool, err := database.Open(ctx, cfg.Postgres)
	if err != nil {
		return err
	}
	defer dbPool.Close()

	if options.MigrateOnly {
		if err := database.RunMigrations(ctx, dbPool, cfg.Postgres.MigrationsDir); err != nil {
			return err
		}
		status, err := database.CheckMigrationStatus(ctx, dbPool, cfg.Postgres.MigrationsDir)
		if err != nil {
			return err
		}
		logger.Info("database migrations applied", "total", status.Total, "applied", status.Applied, "pending", status.Pending)
		return nil
	}

	if options.CheckMigrations {
		status, err := database.CheckMigrationStatus(ctx, dbPool, cfg.Postgres.MigrationsDir)
		if err != nil {
			return err
		}
		if status.Pending > 0 {
			return fmt.Errorf("%d pending database migration(s): %s", status.Pending, strings.Join(status.PendingVersions, ", "))
		}
		logger.Info("database migrations are up to date", "total", status.Total, "applied", status.Applied)
		return nil
	}

	if cfg.Postgres.AutoMigrate {
		if err := database.RunMigrations(ctx, dbPool, cfg.Postgres.MigrationsDir); err != nil {
			return err
		}
	}

	iamService := iam.NewService(dbPool, cfg.Auth, logger)
	if err := iamService.Bootstrap(ctx); err != nil {
		return err
	}
	metadataService := metadata.NewService(dbPool, cfg.Sample, logger)
	if err := metadataService.Bootstrap(ctx); err != nil {
		return err
	}
	developmentService := development.NewService(dbPool, logger)
	if err := developmentService.Bootstrap(ctx); err != nil {
		return err
	}
	aiService := ai.NewService(dbPool, cfg.AI, logger)
	if err := aiService.Bootstrap(ctx); err != nil {
		return err
	}

	redisClient := redisx.Open(cfg.Redis)
	defer func() {
		if err := redisClient.Close(); err != nil {
			logger.Warn("redis close failed", "error", err)
		}
	}()

	api := server.New(server.Dependencies{
		Config: cfg,
		DB:     dbPool,
		Redis:  redisClient,
		Logger: logger,
	})

	httpServer := &http.Server{
		Addr:              cfg.HTTP.Addr(),
		Handler:           api.Handler(),
		ReadHeaderTimeout: 5 * time.Second,
	}

	serverErr := make(chan error, 1)
	go func() {
		logger.Info("datagov api listening", "addr", cfg.HTTP.Addr(), "env", cfg.Environment)
		serverErr <- httpServer.ListenAndServe()
	}()

	select {
	case <-ctx.Done():
		shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		return httpServer.Shutdown(shutdownCtx)
	case err := <-serverErr:
		if errors.Is(err, http.ErrServerClosed) {
			return nil
		}
		return err
	}
}

func parseRuntimeOptions(args []string) (runtimeOptions, error) {
	flags := flag.NewFlagSet("datagov-api", flag.ContinueOnError)
	flags.SetOutput(os.Stderr)

	var options runtimeOptions
	flags.BoolVar(&options.CheckMigrations, "check-migrations", false, "check whether all database migrations have been applied and exit")
	flags.BoolVar(&options.MigrateOnly, "migrate-only", false, "run pending database migrations and exit")

	if err := flags.Parse(args); err != nil {
		return options, err
	}
	if options.CheckMigrations && options.MigrateOnly {
		return options, errors.New("--check-migrations and --migrate-only cannot be used together")
	}
	return options, nil
}
