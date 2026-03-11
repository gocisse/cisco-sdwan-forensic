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

// resolveStaticDir finds the frontend build directory.
// Production (zip): frontend/
// Development:      cisco-dashboard-frontend/build/
func resolveStaticDir() string {
	candidates := []string{"frontend", "cisco-dashboard-frontend/build"}
	for _, dir := range candidates {
		if info, err := os.Stat(dir + "/index.html"); err == nil && !info.IsDir() {
			log.Printf("📁 Serving frontend from: %s", dir)
			return dir
		}
	}
	log.Println("⚠️ No frontend build found. Checked: frontend/, cisco-dashboard-frontend/build/")
	return "frontend"
}

func getUserCredentials() (utils.Config, string) {
	// Load proxy settings from .env file
	envConfig := utils.LoadConfig()
	reader := bufio.NewReader(os.Stdin)

	// Show proxy settings loaded from .env
	if envConfig.ProxyURL != "" {
		fmt.Printf("📄 Loaded from .env: PROXY_URL=%s\n", envConfig.ProxyURL)
	}
	if envConfig.ProxyUser != "" {
		fmt.Printf("📄 Loaded from .env: PROXY_USER=%s\n", envConfig.ProxyUser)
	}
	if envConfig.ProxyPass != "" {
		fmt.Println("📄 Loaded from .env: PROXY_PASS=****")
	}

	// Always prompt for vManage credentials
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

	return utils.Config{
		VManageURL: vManageURL,
		Username:   username,
		Password:   password,
		ProxyURL:   envConfig.ProxyURL,
		ProxyUser:  envConfig.ProxyUser,
		ProxyPass:  envConfig.ProxyPass,
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
	r := routes.New(apiClient, resolveStaticDir())

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
