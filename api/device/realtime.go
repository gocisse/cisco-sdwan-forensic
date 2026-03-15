package device

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"

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
