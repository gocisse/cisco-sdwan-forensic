package utils

import (
	"log/slog"
	"os"
)

// Logger is the application-wide structured logger.
// Use this instead of log.Printf for consistent, structured logging.
var Logger *slog.Logger

func init() {
	// Default to text handler for human-readable output
	// In production, this could be switched to JSON via environment variable
	logFormat := os.Getenv("LOG_FORMAT")

	var handler slog.Handler
	opts := &slog.HandlerOptions{
		Level: slog.LevelDebug,
	}

	if logFormat == "json" {
		handler = slog.NewJSONHandler(os.Stderr, opts)
	} else {
		handler = slog.NewTextHandler(os.Stderr, opts)
	}

	Logger = slog.New(handler)
}

// LogInfo logs an info-level message with optional key-value pairs.
func LogInfo(msg string, args ...any) {
	Logger.Info(msg, args...)
}

// LogError logs an error-level message with optional key-value pairs.
func LogError(msg string, args ...any) {
	Logger.Error(msg, args...)
}

// LogWarn logs a warning-level message with optional key-value pairs.
func LogWarn(msg string, args ...any) {
	Logger.Warn(msg, args...)
}

// LogDebug logs a debug-level message with optional key-value pairs.
func LogDebug(msg string, args ...any) {
	Logger.Debug(msg, args...)
}
