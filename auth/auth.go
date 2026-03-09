package auth

import (
	"encoding/json"
	"net/http"
)

// Credentials struct for login
type Credentials struct {
	VManageURL string `json:"vManageURL"`
	Username   string `json:"username"`
	Password   string `json:"password"`
}

// AuthResponse struct
type AuthResponse struct {
	Token string `json:"token"`
}

// LoginHandler authenticates users and returns a session token
func LoginHandler(w http.ResponseWriter, r *http.Request) {
	var creds Credentials
	if err := json.NewDecoder(r.Body).Decode(&creds); err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	// Replace with real authentication logic
	sessionToken := "dummy-session-token"

	json.NewEncoder(w).Encode(AuthResponse{Token: sessionToken})
}
