// http_client.go
package utils

import (
	"crypto/tls"
	"errors"
	"fmt"
	"io"
	"log"
	"net"
	"net/http"
	"net/http/cookiejar"
	"net/url"
	"strings"
	"sync"
	"time"
)

type APIClient struct {
	BaseURL   string
	Client    *http.Client
	XsrfToken string

	username string
	password string

	mu sync.Mutex // protects re-auth
}

func NewAPIClient(config Config) (*APIClient, error) {
	jar, _ := cookiejar.New(nil)

	// 1. Create a custom Transport
	// This handles InsecureSkipVerify (for vManage certs), Proxy settings,
	// and extended timeouts for remote/cloud vManage instances.
	transport := &http.Transport{
		TLSClientConfig:       &tls.Config{InsecureSkipVerify: true},
		Proxy:                 http.ProxyFromEnvironment,
		DialContext:           (&net.Dialer{Timeout: 30 * time.Second, KeepAlive: 30 * time.Second}).DialContext,
		TLSHandshakeTimeout:   15 * time.Second,
		ResponseHeaderTimeout: 30 * time.Second,
	}

	// If user provided a proxy URL, use it explicitly
	if config.ProxyURL != "" {
		proxyURL, err := url.Parse(config.ProxyURL)
		if err != nil {
			return nil, fmt.Errorf("invalid proxy URL %q: %w", config.ProxyURL, err)
		}
		transport.Proxy = http.ProxyURL(proxyURL)
		log.Printf("\u2705 Using proxy: %s", config.ProxyURL)
	}

	client := &http.Client{
		Jar:       jar,
		Timeout:   60 * time.Second,
		Transport: transport,
	}
	apiClient := &APIClient{
		BaseURL:  config.VManageURL,
		Client:   client,
		username: config.Username,
		password: config.Password,
	}

	log.Printf("Connecting to vManage at %s ...", config.VManageURL)
	if err := apiClient.authenticate(config.Username, config.Password); err != nil {
		// Provide helpful error messages for common connection issues
		errMsg := err.Error()
		if strings.Contains(errMsg, "dial tcp") && (strings.Contains(errMsg, "timeout") || strings.Contains(errMsg, "connectex") || strings.Contains(errMsg, "i/o timeout")) {
			return nil, fmt.Errorf("authentication failed: %w\n\n"+
				"💡 Connection timed out. Possible causes:\n"+
				"   1. If you are behind a corporate proxy, re-run and enter the proxy URL\n"+
				"      (e.g. http://proxy.company.com:8080)\n"+
				"   2. Or set environment variable: set HTTPS_PROXY=http://proxy:port\n"+
				"   3. Verify the vManage URL is correct and reachable\n"+
				"   4. Check if a firewall is blocking outbound connections on port 443", err)
		}
		if strings.Contains(errMsg, "certificate") || strings.Contains(errMsg, "x509") {
			return nil, fmt.Errorf("authentication failed (TLS error): %w\n\n"+
				"💡 This is usually a certificate issue. The app already skips TLS verification,\n"+
				"   but a proxy may be intercepting the connection. Try setting the proxy URL.", err)
		}
		return nil, fmt.Errorf("authentication failed: %w", err)
	}

	if err := apiClient.getXsrfToken(); err != nil {
		return nil, fmt.Errorf("failed to retrieve XSRF token: %w", err)
	}

	return apiClient, nil
}

// authenticate logs in and sets the session cookie.
func (c *APIClient) authenticate(username, password string) error {
	authURL := fmt.Sprintf("%s/j_security_check", c.BaseURL)
	payload := strings.NewReader(fmt.Sprintf("j_username=%s&j_password=%s", username, password))

	req, err := http.NewRequest("POST", authURL, payload)
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	resp, err := c.Client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return errors.New("authentication failed: invalid username/password or API access denied")
	}
	return nil
}

// getXsrfToken retrieves the XSRF token from vManage.
func (c *APIClient) getXsrfToken() error {
	tokenURL := fmt.Sprintf("%s/dataservice/client/token", c.BaseURL)
	req, err := http.NewRequest("GET", tokenURL, nil)
	if err != nil {
		return err
	}

	resp, err := c.Client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("failed to retrieve XSRF token, status code: %d", resp.StatusCode)
	}

	tokenBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return err
	}

	// --- FIX STARTS HERE ---

	// 1. Convert to string
	rawToken := string(tokenBytes)

	// 2. Aggressively remove ALL newlines and carriage returns (fixes the header panic)
	//    This handles cases where vManage returns a token with trailing whitespace.
	cleanToken := strings.ReplaceAll(rawToken, "\n", "")
	cleanToken = strings.ReplaceAll(cleanToken, "\r", "")

	// 3. Trim spaces from the edges
	cleanToken = strings.TrimSpace(cleanToken)

	// 4. Validation: If we received HTML (starts with '<'), the URL is wrong (http vs https)
	if strings.HasPrefix(cleanToken, "<") {
		return fmt.Errorf("received HTML instead of a token. Please ensure you are using 'https://' in the vManage URL")
	}

	// 5. Validation: Check if token is empty
	if cleanToken == "" {
		return fmt.Errorf("received empty token (session might not be established)")
	}

	c.XsrfToken = cleanToken

	// --- FIX ENDS HERE ---

	return nil
}

// reAuthenticate does a full re-auth and re-fetch of the XSRF token.
func (c *APIClient) reAuthenticate() error {
	// Lock so only one goroutine attempts re-auth at a time.
	c.mu.Lock()
	defer c.mu.Unlock()

	// Double-check if we were already re-authenticated by another goroutine
	// (Optional optimization: make a dummy request, see if 401/403, etc.)
	if err := c.authenticate(c.username, c.password); err != nil {
		return err
	}
	if err := c.getXsrfToken(); err != nil {
		return err
	}
	return nil
}

func (c *APIClient) Get(endpoint string) ([]byte, error) {
	url := fmt.Sprintf("%s/%s", c.BaseURL, endpoint)

	// Define a helper function for making the request
	doRequest := func() (*http.Response, error) {
		req, err := http.NewRequest("GET", url, nil)
		if err != nil {
			return nil, fmt.Errorf("failed to create request: %w", err)
		}
		req.Header.Set("X-XSRF-TOKEN", c.XsrfToken)
		req.Header.Set("Content-Type", "application/json")
		return c.Client.Do(req)
	}

	maxRetries := 3
	for i := 0; i < maxRetries; i++ {
		resp, err := doRequest()
		if err != nil {
			log.Printf("❌ GET %s failed: %v", endpoint, err)
			continue
		}
		defer resp.Body.Close()

		// Check for session expiration
		if resp.StatusCode == http.StatusUnauthorized || resp.StatusCode == http.StatusForbidden {
			log.Println("⚠️ Session expired. Attempting re-authentication...")
			if err := c.reAuthenticate(); err != nil {
				return nil, fmt.Errorf("re-auth failed: %w", err)
			}
			continue
		}

		// Check for success
		if resp.StatusCode == http.StatusOK {
			bodyBytes, err := io.ReadAll(resp.Body)
			if err != nil {
				return nil, fmt.Errorf("failed to read response body: %w", err)
			}
			return bodyBytes, nil
		}

		// Log non-success responses
		bodyBytes, _ := io.ReadAll(resp.Body)
		log.Printf("❌ GET %s failed: %s, Body: %s", endpoint, resp.Status, string(bodyBytes))
	}

	return nil, fmt.Errorf("max retries exceeded for endpoint: %s", endpoint)
}
