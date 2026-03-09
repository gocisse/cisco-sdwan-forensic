package middleware

import (
	"encoding/json"
	"log"
	"net/http"
	"runtime/debug"
	"time"
)

// ======================
// Structured Error Response
// ======================

// APIError represents a structured JSON error response
type APIError struct {
	Error   string `json:"error"`
	Code    string `json:"code"`
	Status  int    `json:"status"`
	Details string `json:"details,omitempty"`
}

// WriteError writes a structured JSON error to the response
func WriteError(w http.ResponseWriter, status int, code string, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(APIError{
		Error:  message,
		Code:   code,
		Status: status,
	})
}

// WriteErrorWithDetails writes a structured JSON error with extra detail
func WriteErrorWithDetails(w http.ResponseWriter, status int, code string, message string, details string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(APIError{
		Error:   message,
		Code:    code,
		Status:  status,
		Details: details,
	})
}

// ======================
// JSON Response Helper
// ======================

// RespondJSON writes data as a JSON response with the given HTTP status code.
// Handlers can call RespondJSON(w, http.StatusOK, myData) to avoid repetitive
// Content-Type / Encode boilerplate.
func RespondJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if data != nil {
		json.NewEncoder(w).Encode(data)
	}
}

// ======================
// Logging Middleware
// ======================

// Logging logs method, path, status, and duration of every request
func Logging(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()

		// Wrap ResponseWriter to capture status code
		wrapped := &statusResponseWriter{ResponseWriter: w, statusCode: http.StatusOK}

		next.ServeHTTP(wrapped, r)

		duration := time.Since(start)
		log.Printf("%-6s %-50s %d %s",
			r.Method,
			r.URL.Path,
			wrapped.statusCode,
			duration,
		)
	})
}

// statusResponseWriter wraps http.ResponseWriter to capture the status code
type statusResponseWriter struct {
	http.ResponseWriter
	statusCode int
}

func (w *statusResponseWriter) WriteHeader(code int) {
	w.statusCode = code
	w.ResponseWriter.WriteHeader(code)
}

// Flush implements http.Flusher for SSE compatibility
func (w *statusResponseWriter) Flush() {
	if flusher, ok := w.ResponseWriter.(http.Flusher); ok {
		flusher.Flush()
	}
}

// ======================
// CORS Middleware
// ======================

// CORS adds Cross-Origin Resource Sharing headers for development
func CORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")

		// Allow localhost origins for development
		allowedOrigins := map[string]bool{
			"http://localhost:3000": true,
			"http://localhost:3001": true,
		}

		if allowedOrigins[origin] {
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-XSRF-TOKEN")
			w.Header().Set("Access-Control-Allow-Credentials", "true")
		}

		// Handle preflight requests
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}

// ======================
// Recovery Middleware
// ======================

// Recovery catches panics and returns a structured error instead of crashing
func Recovery(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if err := recover(); err != nil {
				log.Printf("PANIC recovered: %v\n%s", err, debug.Stack())
				WriteError(w, http.StatusInternalServerError, "PANIC", "Internal server error")
			}
		}()
		next.ServeHTTP(w, r)
	})
}

// ======================
// Chain Helper
// ======================

// Chain applies a list of middleware to a handler in order
func Chain(handler http.Handler, middlewares ...func(http.Handler) http.Handler) http.Handler {
	for i := len(middlewares) - 1; i >= 0; i-- {
		handler = middlewares[i](handler)
	}
	return handler
}
