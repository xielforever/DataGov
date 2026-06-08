package main

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
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
	if err := run(); err != nil {
		slog.Error("datagov api stopped", "error", err)
		os.Exit(1)
	}
}

func run() error {
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
