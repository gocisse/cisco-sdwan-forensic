// main.go

package main

import (
	"bufio"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"sdwan-app/internal/routes"
	"sdwan-app/middleware"
	"sdwan-app/utils"
)

const staticDir = "cisco-dashboard-frontend/build"

// promptIfEmpty reads a value from stdin only if the current value is empty.
func promptIfEmpty(reader *bufio.Reader, label, current string) string {
	if current != "" {
		return current
	}
	fmt.Printf("Enter %s: ", label)
	val, _ := reader.ReadString('\n')
	return strings.TrimSpace(val)
}

func getUserCredentials() (utils.Config, string) {
	// Load defaults from .env file first
	config := utils.LoadConfig()
	reader := bufio.NewReader(os.Stdin)

	// Show what was loaded from .env
	if config.VManageURL != "" {
		fmt.Printf("📄 Loaded from .env: VMANAGE_URL=%s\n", config.VManageURL)
	}
	if config.ProxyURL != "" {
		fmt.Printf("📄 Loaded from .env: PROXY_URL=%s\n", config.ProxyURL)
	}
	if config.ProxyUser != "" {
		fmt.Printf("📄 Loaded from .env: PROXY_USER=%s\n", config.ProxyUser)
	}
	if config.ProxyPass != "" {
		fmt.Println("📄 Loaded from .env: PROXY_PASS=****")
	}

	// Prompt only for missing values
	config.VManageURL = promptIfEmpty(reader, "vManage URL", config.VManageURL)
	config.Username = promptIfEmpty(reader, "Username", config.Username)
	config.Password = promptIfEmpty(reader, "Password", config.Password)
	port := promptIfEmpty(reader, "Port Number", config.Port)

	// Proxy: only prompt if not set in .env
	config.ProxyURL = promptIfEmpty(reader, "Proxy URL (leave blank if none, e.g. http://proxy.company.com:8080)", config.ProxyURL)

	if config.ProxyURL != "" && config.ProxyUser == "" {
		fmt.Print("Enter Proxy Username (leave blank if none, e.g. DOMAIN\\user): ")
		proxyUser, _ := reader.ReadString('\n')
		config.ProxyUser = strings.TrimSpace(proxyUser)
		if config.ProxyUser != "" {
			fmt.Print("Enter Proxy Password: ")
			proxyPass, _ := reader.ReadString('\n')
			config.ProxyPass = strings.TrimSpace(proxyPass)
		}
	}

	return config, port
}

func main() {
	// ─── Prompt for Credentials ──────────────────────────────────────
	config, port := getUserCredentials()

	// ─── Initialize API Client ─────────────────────────────────────────
	apiClient, err := utils.NewAPIClient(config)
	if err != nil {
		log.Fatalf("Failed to initialize API client: %v", err)
	}

	// ─── Build Router (API + SSE + Static) ─────────────────────────────
	r := routes.New(apiClient, staticDir)

	// ─── Apply Middleware Chain ─────────────────────────────────────────
	app := middleware.Chain(r,
		middleware.Recovery,
		middleware.CORS,
		middleware.Logging,
	)

	// ─── Start Server ──────────────────────────────────────────────────
	server := &http.Server{
		Addr:           ":" + port,
		Handler:        app,
		ReadTimeout:    10 * time.Second,
		WriteTimeout:   0, // Disabled for SSE streaming
		MaxHeaderBytes: 1 << 20,
	}

	fmt.Printf("Server running on http://localhost:%s\n", port)
	log.Fatal(server.ListenAndServe())
}
