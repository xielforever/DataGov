package redisx

import (
	"datagov/backend/internal/platform/config"

	"github.com/redis/go-redis/v9"
)

func Open(cfg config.RedisConfig) *redis.Client {
	return redis.NewClient(&redis.Options{
		Addr:     cfg.Addr,
		Password: cfg.Password,
		DB:       cfg.DB,
	})
}
