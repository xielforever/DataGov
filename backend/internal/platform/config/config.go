package config

import (
	"bufio"
	"errors"
	"fmt"
	"log/slog"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"
)

type Config struct {
	Environment string
	LogLevel    slog.Level
	HTTP        HTTPConfig
	Postgres    PostgresConfig
	Redis       RedisConfig
	Auth        AuthConfig
	Sample      SampleDataSourceConfig
	AI          AIConfig
}

type HTTPConfig struct {
	Host string
	Port int
}

func (cfg HTTPConfig) Addr() string {
	return fmt.Sprintf("%s:%d", cfg.Host, cfg.Port)
}

type PostgresConfig struct {
	DatabaseURL    string
	ConnectTimeout time.Duration
	MigrationsDir  string
	AutoMigrate    bool
}

type RedisConfig struct {
	Addr      string
	Password  string
	DB        int
	KeyPrefix string
}

type AuthConfig struct {
	TokenTTLHours          int
	RememberTokenTTLHours  int
	BootstrapAdminUsername string
	BootstrapAdminPassword string
	BootstrapAdminRealName string
}

type SampleDataSourceConfig struct {
	DatabaseURL string
}

type AIConfig struct {
	BaseURL                  string
	APIKey                   string
	Model                    string
	DailyQuotaTokens         int
	UserRateLimitPerMinute   int
	GlobalRateLimitPerMinute int
	CacheKeyPrefix           string
}

func Load() (Config, error) {
	_ = loadDotEnv(".env.local")
	_ = loadDotEnv(filepath.Join("backend", ".env.local"))

	cfg := Config{
		Environment: envString("DATAGOV_ENV", "development"),
		LogLevel:    parseLogLevel(envString("DATAGOV_LOG_LEVEL", "info")),
		HTTP: HTTPConfig{
			Host: envString("DATAGOV_API_HOST", "127.0.0.1"),
			Port: envInt("DATAGOV_API_PORT", 8080),
		},
		Postgres: PostgresConfig{
			DatabaseURL:    envString("DATAGOV_DATABASE_URL", ""),
			ConnectTimeout: time.Duration(envInt("DATAGOV_PG_CONNECT_TIMEOUT_SECONDS", 5)) * time.Second,
			MigrationsDir:  firstExistingPath(envString("DATAGOV_MIGRATIONS_DIR", ""), filepath.Join("backend", "migrations"), "migrations"),
			AutoMigrate:    envBool("DATAGOV_AUTO_MIGRATE", true),
		},
		Redis: RedisConfig{
			Addr:      envString("DATAGOV_REDIS_ADDR", "127.0.0.1:6379"),
			Password:  envString("DATAGOV_REDIS_PASSWORD", ""),
			DB:        envInt("DATAGOV_REDIS_DB", 0),
			KeyPrefix: envString("DATAGOV_REDIS_KEY_PREFIX", "datagov:dev:"),
		},
		Auth: AuthConfig{
			TokenTTLHours:          envInt("DATAGOV_AUTH_TOKEN_TTL_HOURS", 8),
			RememberTokenTTLHours:  envInt("DATAGOV_AUTH_REMEMBER_TTL_HOURS", 168),
			BootstrapAdminUsername: envString("DATAGOV_BOOTSTRAP_ADMIN_USERNAME", "admin"),
			BootstrapAdminPassword: envString("DATAGOV_BOOTSTRAP_ADMIN_PASSWORD", developmentDefaultPassword()),
			BootstrapAdminRealName: envString("DATAGOV_BOOTSTRAP_ADMIN_REAL_NAME", "系统管理员"),
		},
		Sample: SampleDataSourceConfig{
			DatabaseURL: envString("DATAGOV_SAMPLE_DATABASE_URL", ""),
		},
		AI: AIConfig{
			BaseURL:                  firstNonEmpty(envString("ANTHROPIC_BASE_URL", ""), envString("MINIMAX_BASE_URL", "")),
			APIKey:                   firstNonEmpty(envString("ANTHROPIC_API_KEY", ""), envString("MINIMAX_API_KEY", "")),
			Model:                    firstNonEmpty(envString("ANTHROPIC_MODEL", ""), envString("MINIMAX_MODEL", ""), "MiniMax-M3"),
			DailyQuotaTokens:         envInt("DATAGOV_AI_DAILY_QUOTA_TOKENS", 200000),
			UserRateLimitPerMinute:   envInt("DATAGOV_AI_USER_RATE_LIMIT_PER_MINUTE", 20),
			GlobalRateLimitPerMinute: envInt("DATAGOV_AI_GLOBAL_RATE_LIMIT_PER_MINUTE", 120),
			CacheKeyPrefix:           envString("DATAGOV_AI_REDIS_KEY_PREFIX", envString("DATAGOV_REDIS_KEY_PREFIX", "datagov:dev:")+"ai:"),
		},
	}

	if cfg.Postgres.DatabaseURL == "" {
		return cfg, errors.New("DATAGOV_DATABASE_URL is required")
	}
	if cfg.Redis.KeyPrefix == "" {
		return cfg, errors.New("DATAGOV_REDIS_KEY_PREFIX is required")
	}
	if cfg.Environment == "production" && cfg.Auth.BootstrapAdminPassword == "" {
		return cfg, errors.New("DATAGOV_BOOTSTRAP_ADMIN_PASSWORD is required in production")
	}

	return cfg, nil
}

func loadDotEnv(path string) error {
	file, err := os.Open(path)
	if err != nil {
		return err
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}

		key, value, ok := strings.Cut(line, "=")
		if !ok {
			continue
		}

		key = strings.TrimSpace(key)
		value = strings.Trim(strings.TrimSpace(value), `"'`)
		if key == "" {
			continue
		}

		if _, exists := os.LookupEnv(key); !exists {
			_ = os.Setenv(key, value)
		}
	}

	return scanner.Err()
}

func envString(key string, fallback string) string {
	value, ok := os.LookupEnv(key)
	if !ok || strings.TrimSpace(value) == "" {
		return fallback
	}
	return strings.TrimSpace(value)
}

func envInt(key string, fallback int) int {
	value := envString(key, "")
	if value == "" {
		return fallback
	}
	parsed, err := strconv.Atoi(value)
	if err != nil {
		return fallback
	}
	return parsed
}

func envBool(key string, fallback bool) bool {
	value := strings.ToLower(envString(key, ""))
	if value == "" {
		return fallback
	}
	return value == "1" || value == "true" || value == "yes" || value == "on"
}

func parseLogLevel(value string) slog.Level {
	switch strings.ToLower(value) {
	case "debug":
		return slog.LevelDebug
	case "warn", "warning":
		return slog.LevelWarn
	case "error":
		return slog.LevelError
	default:
		return slog.LevelInfo
	}
}

func firstExistingPath(values ...string) string {
	for _, value := range values {
		if strings.TrimSpace(value) == "" {
			continue
		}
		if _, err := os.Stat(value); err == nil {
			return value
		}
	}
	for _, value := range values {
		if strings.TrimSpace(value) != "" {
			return value
		}
	}
	return ""
}

func firstNonEmpty(values ...string) string {
	for _, value := range values {
		if strings.TrimSpace(value) != "" {
			return strings.TrimSpace(value)
		}
	}
	return ""
}

func developmentDefaultPassword() string {
	if strings.EqualFold(os.Getenv("DATAGOV_ENV"), "production") {
		return ""
	}
	return "DataGov@123"
}
