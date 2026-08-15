// main.go

//go:debug x509negativeserial=1

package main

import (
	"bufio"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"os"
	"strings"
	"time"

	"sdwan-app/internal/routes"
	"sdwan-app/middleware"
	"sdwan-app/utils"
)

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
	vManageURL = sanitizeVManageURL(strings.TrimSpace(vManageURL))

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

// sanitizeVManageURL strips paths, fragments, and query strings from the
// user-supplied vManage URL. Users often paste the full browser URL, e.g.
//
//	https://tenant.viptela.net/index.html#/app/dashboard
//
// We only need the scheme + host (+ port if present).
func sanitizeVManageURL(raw string) string {
	// Ensure there's a scheme so url.Parse doesn't misinterpret the host
	if !strings.Contains(raw, "://") {
		raw = "https://" + raw
	}
	u, err := url.Parse(raw)
	if err != nil {
		return raw // return as-is if unparseable
	}
	clean := fmt.Sprintf("%s://%s", u.Scheme, u.Host)
	if clean != raw {
		log.Printf("📎 Cleaned vManage URL: %s → %s", raw, clean)
	}
	return clean
}

func main() {
	// ─── Prompt for Credentials ──────────────────────────────────────
	config, port := getUserCredentials()

	// ─── Initialize API Client ─────────────────────────────────────────
	apiClient, err := utils.NewAPIClient(config)
	if err != nil {
		log.Fatalf("Failed to initialize API client: %v", err)
	}

	// ─── Build Router (API + SSE + Embedded Static) ─────────────────────
	r := routes.New(apiClient)

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
