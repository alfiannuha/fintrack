package config

import (
	"fmt"
	"os"
)

type Config struct {
	Server   ServerConfig
	Database DatabaseConfig
	JWT      JWTConfig
	CORS     CORSConfig
}

type ServerConfig struct {
	Port string
}

type DatabaseConfig struct {
	MongoURI string
	DBName   string
}

type JWTConfig struct {
	Secret     string
	AccessExp  int // in minutes
	RefreshExp int // in days
}

type CORSConfig struct {
	AllowedOrigins []string
}

func Load() *Config {
	return &Config{
		Server: ServerConfig{
			Port: getEnv("PORT", "8080"),
		},
		Database: DatabaseConfig{
			MongoURI: getEnv("MONGO_URI", ""),
			DBName:   getEnv("DB_NAME", "fintrack"),
		},
		JWT: JWTConfig{
			Secret:     getEnv("JWT_SECRET", "change-this-secret-key"),
			AccessExp:  1440, // 1440 minutes (1 day)
			RefreshExp: 7,    // 7 days (1 week)
		},
		CORS: CORSConfig{
			AllowedOrigins: []string{
				getEnv("CORS_ORIGIN", "http://localhost:3000"),
			},
		},
	}
}

func getEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}

func (c *Config) Validate() error {
	if c.Database.MongoURI == "" {
		return fmt.Errorf("MONGO_URI is required")
	}
	if c.JWT.Secret == "change-this-secret-key" {
		fmt.Println("WARNING: Using default JWT secret. Change this in production!")
	}
	return nil
}
