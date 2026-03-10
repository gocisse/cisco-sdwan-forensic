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

func getUserCredentials() (utils.Config, string) {
	reader := bufio.NewReader(os.Stdin)

	fmt.Print("Enter vManage URL: ")
	vManageURL, _ := reader.ReadString('\n')
	vManageURL = strings.TrimSpace(vManageURL)

	fmt.Print("Enter Username: ")
	username, _ := reader.ReadString('\n')
	username = strings.TrimSpace(username)

	fmt.Print("Enter Password: ")
	password, _ := reader.ReadString('\n')
	password = strings.TrimSpace(password)

	fmt.Print("Enter Port Number: ")
	port, _ := reader.ReadString('\n')
	port = strings.TrimSpace(port)

	fmt.Print("Enter Proxy URL (leave blank if none, e.g. http://proxy.company.com:8080): ")
	proxyURL, _ := reader.ReadString('\n')
	proxyURL = strings.TrimSpace(proxyURL)

	return utils.Config{
		VManageURL: vManageURL,
		Username:   username,
		Password:   password,
		ProxyURL:   proxyURL,
	}, port
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
