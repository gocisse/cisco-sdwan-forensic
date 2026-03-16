package device

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"

	"sdwan-app/middleware"
	"sdwan-app/utils"

	"github.com/gorilla/mux"
)

// ──────────────────────────────────────────────────────────────────────────────
// UUID-Resolving Handlers for Real-Time Device Endpoints
// ──────────────────────────────────────────────────────────────────────────────
//
// vManage statistics/OMP endpoints require the device UUID (e.g. "C8K-xxxx"),
// NOT the system-ip (e.g. "2.0.0.5"). These handlers look up the device record
// to resolve system-ip → UUID, then call vManage with the correct deviceId.

// FetchOmpRoutes handles OMP routes with optional server-side prefix filtering.
// GET /api/routes/received/{system-ip}?prefix=10.0.0
// GET /api/routes/advertised/{system-ip}?prefix=10.0.0
// If ?prefix= is provided, only routes whose "prefix" field contains the search
// string are returned. This avoids timeouts on large routing tables.
func FetchOmpRoutes(apiClient *utils.APIClient, vManageEndpoint string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		systemIP := mux.Vars(r)["system-ip"]
		if systemIP == "" {
			middleware.WriteError(w, http.StatusBadRequest, "MISSING_PARAM", "Missing 'system-ip' path parameter")
			return
		}

		dev, err := findDevice(apiClient, systemIP)
		if err != nil {
			log.Printf("Device lookup error: %v", err)
			middleware.WriteError(w, http.StatusBadGateway, "VMANAGE_ERROR", "Failed to look up device")
			return
		}
		if dev == nil {
			middleware.WriteError(w, http.StatusNotFound, "NOT_FOUND",
				fmt.Sprintf("No device found with system-ip %s", systemIP))
			return
		}

		deviceID := dev.DeviceID
		if deviceID == "" {
			deviceID = systemIP
		}

		fullEndpoint := fmt.Sprintf("%s?deviceId=%s", vManageEndpoint, deviceID)
		log.Printf("📡 OMP routes: system-ip=%s → deviceId=%s → %s", systemIP, deviceID, fullEndpoint)

		rawData, err := apiClient.Get(fullEndpoint)
		if err != nil {
			log.Printf("vManage API error: %s — %v", fullEndpoint, err)
			middleware.WriteError(w, http.StatusBadGateway, "VMANAGE_ERROR",
				fmt.Sprintf("Failed to fetch OMP routes from vManage: %s", vManageEndpoint))
			return
		}

		var envelope struct {
			Data []json.RawMessage `json:"data"`
		}
		if err := json.Unmarshal(rawData, &envelope); err != nil {
			log.Printf("JSON unmarshal error for %s: %v", fullEndpoint, err)
			middleware.WriteError(w, http.StatusInternalServerError, "PARSE_ERROR", "Failed to parse vManage response")
			return
		}

		prefixFilter := strings.ToLower(strings.TrimSpace(r.URL.Query().Get("prefix")))

		if prefixFilter == "" {
			// No filter — return all routes
			payload, _ := json.Marshal(envelope.Data)
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			w.Write(payload)
			return
		}

		// Filter routes by prefix
		filtered := make([]json.RawMessage, 0)
		for _, raw := range envelope.Data {
			var route struct {
				Prefix string `json:"prefix"`
			}
			if json.Unmarshal(raw, &route) == nil {
				if strings.Contains(strings.ToLower(route.Prefix), prefixFilter) {
					filtered = append(filtered, raw)
				}
			}
		}

		log.Printf("📡 OMP routes for %s: %d total, %d matched prefix=%q",
			systemIP, len(envelope.Data), len(filtered), prefixFilter)

		payload, _ := json.Marshal(filtered)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write(payload)
	}
}

// FetchWithUUID creates a handler that resolves system-ip to device UUID before
// calling the given vManage endpoint with ?deviceId={uuid}.
// It unwraps the standard {"data": [...]} envelope.
func FetchWithUUID(apiClient *utils.APIClient, vManageEndpoint string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		systemIP := mux.Vars(r)["system-ip"]
		if systemIP == "" {
			middleware.WriteError(w, http.StatusBadRequest, "MISSING_PARAM", "Missing 'system-ip' path parameter")
			return
		}

		// Resolve system-ip → device UUID
		dev, err := findDevice(apiClient, systemIP)
		if err != nil {
			log.Printf("Device lookup error: %v", err)
			middleware.WriteError(w, http.StatusBadGateway, "VMANAGE_ERROR", "Failed to look up device")
			return
		}
		if dev == nil {
			middleware.WriteError(w, http.StatusNotFound, "NOT_FOUND",
				fmt.Sprintf("No device found with system-ip %s", systemIP))
			return
		}

		deviceID := dev.DeviceID
		if deviceID == "" {
			deviceID = systemIP // fallback for older vManage versions
		}

		fullEndpoint := fmt.Sprintf("%s?deviceId=%s", vManageEndpoint, deviceID)
		log.Printf("📡 UUID-resolved: system-ip=%s → deviceId=%s → %s", systemIP, deviceID, fullEndpoint)

		rawData, err := apiClient.Get(fullEndpoint)
		if err != nil {
			log.Printf("vManage API error: %s — %v", fullEndpoint, err)
			middleware.WriteError(w, http.StatusBadGateway, "VMANAGE_ERROR",
				fmt.Sprintf("Failed to fetch data from vManage: %s", vManageEndpoint))
			return
		}

		// Unwrap the {"data": [...]} envelope
		var envelope struct {
			Data json.RawMessage `json:"data"`
		}
		if err := json.Unmarshal(rawData, &envelope); err != nil {
			log.Printf("JSON unmarshal error for %s: %v", fullEndpoint, err)
			middleware.WriteError(w, http.StatusInternalServerError, "PARSE_ERROR", "Failed to parse vManage response")
			return
		}

		payload := envelope.Data
		if payload == nil {
			payload = rawData
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write(payload)
	}
}
