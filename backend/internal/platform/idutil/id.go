package idutil

import (
	"crypto/rand"
	"encoding/base64"
	"fmt"
)

func New(prefix string) string {
	bytes := make([]byte, 16)
	if _, err := rand.Read(bytes); err != nil {
		panic(fmt.Errorf("generate id: %w", err))
	}
	return prefix + "_" + base64.RawURLEncoding.EncodeToString(bytes)
}

func Token() string {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		panic(fmt.Errorf("generate token: %w", err))
	}
	return base64.RawURLEncoding.EncodeToString(bytes)
}
