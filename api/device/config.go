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

// FetchDeviceConfig fetches the running configuration for a specific device.
// Unlike other endpoints that use ?deviceId={uuid}, the config endpoint uses
// a path-based parameter: dataservice/template/device/config/{uuid}
func FetchDeviceConfig(apiClient *utils.APIClient) http.HandlerFunc {
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

		deviceID := dev.UUID
		if deviceID == "" {
			deviceID = systemIP
		}

		fullEndpoint := fmt.Sprintf("dataservice/template/device/config/%s", deviceID)
		log.Printf("🔧 Running config: system-ip=%s → deviceId=%s", systemIP, deviceID)

		rawData, err := apiClient.Get(fullEndpoint)
		if err != nil {
			log.Printf("vManage API error: %s — %v", fullEndpoint, err)
			middleware.WriteError(w, http.StatusBadGateway, "VMANAGE_ERROR",
				"Failed to fetch running config from vManage")
			return
		}

		var envelope struct {
			Data []struct {
				Config string `json:"config"`
			} `json:"data"`
		}
		if err := json.Unmarshal(rawData, &envelope); err != nil {
			log.Printf("JSON unmarshal error for %s: %v", fullEndpoint, err)
			middleware.WriteError(w, http.StatusInternalServerError, "PARSE_ERROR", "Failed to parse vManage response")
			return
		}

		if len(envelope.Data) == 0 {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{"config":""}`))
			return
		}

		payload, _ := json.Marshal(map[string]string{
			"config": envelope.Data[0].Config,
		})
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write(payload)
	}
}
