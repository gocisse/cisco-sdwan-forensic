package utils

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

// Config struct holds configuration settings
type Config struct {
	VManageURL string
	Username   string
	Password   string
	Port       string
	ProxyURL   string
	ProxyUser  string
	ProxyPass  string
}

// LoadConfig loads environment variables from .env file
func LoadConfig() Config {
	err := godotenv.Load()
	if err != nil {
		log.Println("No .env file found, using default environment variables")
	}

	port := os.Getenv("SDWAN_PORT")
	if port == "" {
		port = "8080"
	}

	return Config{
		VManageURL: os.Getenv("VMANAGE_URL"),
		Username:   os.Getenv("VMANAGE_USERNAME"),
		Password:   os.Getenv("VMANAGE_PASSWORD"),
		Port:       port,
	}
}
