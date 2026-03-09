package utils

import (
	"log"
)

// LogError logs errors in a standard format
func LogError(err error, message string) {
	if err != nil {
		log.Printf("[ERROR] %s: %v\n", message, err)
	}
}

// LogInfo logs general information messages
func LogInfo(message string) {
	log.Printf("[INFO] %s\n", message)
}
