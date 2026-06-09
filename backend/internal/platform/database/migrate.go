package database

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type MigrationStatus struct {
	Directory       string   `json:"directory"`
	Status          string   `json:"status"`
	Total           int      `json:"total"`
	Applied         int      `json:"applied"`
	Pending         int      `json:"pending"`
	PendingVersions []string `json:"pendingVersions,omitempty"`
	Message         string   `json:"message,omitempty"`
}

func RunMigrations(ctx context.Context, pool *pgxpool.Pool, migrationsDir string) error {
	files, err := listMigrationFiles(migrationsDir)
	if err != nil {
		return err
	}
	if len(files) == 0 {
		return fmt.Errorf("no migration files found in %s", migrationsDir)
	}

	if _, err := pool.Exec(ctx, `
		CREATE TABLE IF NOT EXISTS schema_migrations (
			version text PRIMARY KEY,
			applied_at timestamptz NOT NULL DEFAULT now()
		)
	`); err != nil {
		return err
	}

	for _, file := range files {
		version := strings.TrimSuffix(filepath.Base(file), filepath.Ext(file))
		applied, err := migrationApplied(ctx, pool, version)
		if err != nil {
			return err
		}
		if applied {
			continue
		}

		sqlBytes, err := os.ReadFile(file)
		if err != nil {
			return err
		}

		tx, err := pool.Begin(ctx)
		if err != nil {
			return err
		}

		if _, err := tx.Exec(ctx, string(sqlBytes)); err != nil {
			_ = tx.Rollback(ctx)
			return fmt.Errorf("migration %s failed: %w", version, err)
		}
		if _, err := tx.Exec(ctx, `INSERT INTO schema_migrations (version, applied_at) VALUES ($1, $2)`, version, time.Now().UTC()); err != nil {
			_ = tx.Rollback(ctx)
			return err
		}
		if err := tx.Commit(ctx); err != nil {
			return err
		}
	}

	return nil
}

func CheckMigrationStatus(ctx context.Context, pool *pgxpool.Pool, migrationsDir string) (MigrationStatus, error) {
	status := MigrationStatus{
		Directory: migrationsDir,
		Status:    "unknown",
	}

	files, err := listMigrationFiles(migrationsDir)
	if err != nil {
		status.Status = "error"
		status.Message = err.Error()
		return status, err
	}
	if len(files) == 0 {
		err := fmt.Errorf("no migration files found in %s", migrationsDir)
		status.Status = "error"
		status.Message = err.Error()
		return status, err
	}

	appliedVersions, err := appliedMigrationVersions(ctx, pool)
	if err != nil {
		status.Status = "error"
		status.Message = err.Error()
		return status, err
	}

	status.Total = len(files)
	for _, file := range files {
		version := migrationVersion(file)
		if appliedVersions[version] {
			status.Applied++
			continue
		}
		status.Pending++
		status.PendingVersions = append(status.PendingVersions, version)
	}

	if status.Pending > 0 {
		status.Status = "pending"
		status.Message = fmt.Sprintf("%d migration(s) pending", status.Pending)
		return status, nil
	}

	status.Status = "ok"
	return status, nil
}

func migrationApplied(ctx context.Context, pool *pgxpool.Pool, version string) (bool, error) {
	var exists bool
	err := pool.QueryRow(ctx, `SELECT EXISTS (SELECT 1 FROM schema_migrations WHERE version = $1)`, version).Scan(&exists)
	return exists, err
}

func appliedMigrationVersions(ctx context.Context, pool *pgxpool.Pool) (map[string]bool, error) {
	applied := map[string]bool{}

	var tableExists bool
	if err := pool.QueryRow(ctx, `SELECT to_regclass('public.schema_migrations') IS NOT NULL`).Scan(&tableExists); err != nil {
		return applied, err
	}
	if !tableExists {
		return applied, nil
	}

	rows, err := pool.Query(ctx, `SELECT version FROM schema_migrations`)
	if err != nil {
		return applied, err
	}
	defer rows.Close()

	for rows.Next() {
		var version string
		if err := rows.Scan(&version); err != nil {
			return applied, err
		}
		applied[version] = true
	}
	return applied, rows.Err()
}

func listMigrationFiles(migrationsDir string) ([]string, error) {
	files, err := filepath.Glob(filepath.Join(migrationsDir, "*.sql"))
	if err != nil {
		return nil, err
	}
	sort.Strings(files)
	return files, nil
}

func migrationVersion(file string) string {
	return strings.TrimSuffix(filepath.Base(file), filepath.Ext(file))
}
