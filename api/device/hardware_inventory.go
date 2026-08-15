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

// HardwareInventoryResponse contains all hardware-related data for a device.
type HardwareInventoryResponse struct {
	Inventory   []map[string]interface{} `json:"inventory"`
	Environment []map[string]interface{} `json:"environment"`
	Alarms      []map[string]interface{} `json:"alarms"`
	Thresholds  []map[string]interface{} `json:"thresholds"`
	DeviceInfo  HardwareDeviceInfo       `json:"deviceInfo"`
}

// HardwareDeviceInfo contains basic device identification.
type HardwareDeviceInfo struct {
	SystemIP string `json:"systemIp"`
	HostName string `json:"hostName"`
	Model    string `json:"model"`
	DeviceOS string `json:"deviceOs"`
	IsVEdge  bool   `json:"isVedge"`
}

// FetchHardwareInventory fetches comprehensive hardware information for a device.
// GET /api/device/{system-ip}/hardware-inventory
//
// This aggregates data from multiple vManage hardware endpoints:
//   - /dataservice/hardware/synced/inventory (inventory with serial numbers)
//   - /dataservice/hardware/synced/environment (component status and temperature)
//   - /dataservice/hardware/synced/alarms (active hardware alarms)
//   - /dataservice/hardware/threshold (temperature thresholds - vEdge only)
//
// Returns a combined response with all hardware data.
func FetchHardwareInventory(apiClient *utils.APIClient) http.HandlerFunc {
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

		// Per Cisco best practice, use UUID from /dataservice/device for API calls
		// The uuid field contains the device's unique identifier (e.g., serial number)
		deviceID := dev.UUID
		if deviceID == "" {
			// Fallback to system-ip if UUID is not available
			deviceID = dev.DeviceID
			if deviceID == "" {
				deviceID = systemIP
			}
		}

		// Determine if this is a vEdge device
		isVEdge := isVEdgeDevice(dev.Model, dev.DeviceOS)

		log.Printf("🔧 Hardware inventory: system-ip=%s → deviceId=%s (model=%s, isVEdge=%v)",
			systemIP, deviceID, dev.Model, isVEdge)

		response := HardwareInventoryResponse{
			Inventory:   make([]map[string]interface{}, 0),
			Environment: make([]map[string]interface{}, 0),
			Alarms:      make([]map[string]interface{}, 0),
			Thresholds:  make([]map[string]interface{}, 0),
			DeviceInfo: HardwareDeviceInfo{
				SystemIP: systemIP,
				HostName: dev.HostName,
				Model:    dev.Model,
				DeviceOS: dev.DeviceOS,
				IsVEdge:  isVEdge,
			},
		}

		// Fetch inventory - try multiple endpoints
		// For vEdge: try direct endpoint first, then synced
		// For IOS-XE: try synced endpoint first, then direct
		if isVEdge {
			response.Inventory = fetchHardwareData(apiClient, "dataservice/hardware/inventory", deviceID, "inventory")
			if len(response.Inventory) == 0 {
				response.Inventory = fetchHardwareData(apiClient, "dataservice/hardware/synced/inventory", deviceID, "inventory")
			}
		} else {
			response.Inventory = fetchHardwareData(apiClient, "dataservice/hardware/synced/inventory", deviceID, "inventory")
			if len(response.Inventory) == 0 {
				response.Inventory = fetchHardwareData(apiClient, "dataservice/hardware/inventory", deviceID, "inventory")
			}
		}

		// Fetch environment - try multiple endpoints
		if isVEdge {
			response.Environment = fetchHardwareData(apiClient, "dataservice/hardware/environment", deviceID, "environment")
			if len(response.Environment) == 0 {
				response.Environment = fetchHardwareData(apiClient, "dataservice/hardware/synced/environment", deviceID, "environment")
			}
		} else {
			response.Environment = fetchHardwareData(apiClient, "dataservice/hardware/synced/environment", deviceID, "environment")
			if len(response.Environment) == 0 {
				response.Environment = fetchHardwareData(apiClient, "dataservice/hardware/environment", deviceID, "environment")
			}
		}

		// Fetch alarms - try multiple endpoints
		if isVEdge {
			response.Alarms = fetchHardwareData(apiClient, "dataservice/hardware/alarms", deviceID, "alarms")
			if len(response.Alarms) == 0 {
				response.Alarms = fetchHardwareData(apiClient, "dataservice/hardware/synced/alarms", deviceID, "alarms")
			}
		} else {
			response.Alarms = fetchHardwareData(apiClient, "dataservice/hardware/synced/alarms", deviceID, "alarms")
			if len(response.Alarms) == 0 {
				response.Alarms = fetchHardwareData(apiClient, "dataservice/hardware/alarms", deviceID, "alarms")
			}
		}

		// Fetch thresholds (vEdge only)
		if isVEdge {
			response.Thresholds = fetchHardwareData(apiClient, "dataservice/hardware/threshold", deviceID, "thresholds")
		}

		log.Printf("🔧 Hardware inventory for %s: inventory=%d, environment=%d, alarms=%d, thresholds=%d",
			systemIP, len(response.Inventory), len(response.Environment), len(response.Alarms), len(response.Thresholds))

		payload, _ := json.Marshal(response)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write(payload)
	}
}

// fetchHardwareData fetches data from a specific hardware endpoint.
func fetchHardwareData(apiClient *utils.APIClient, endpoint, deviceID, dataType string) []map[string]interface{} {
	fullEndpoint := fmt.Sprintf("%s?deviceId=%s", endpoint, deviceID)
	log.Printf("🔧 Fetching %s: %s", dataType, fullEndpoint)

	rawData, err := apiClient.Get(fullEndpoint)
	if err != nil {
		log.Printf("🔧 %s fetch failed: %v", dataType, err)
		return make([]map[string]interface{}, 0)
	}

	var envelope struct {
		Data []map[string]interface{} `json:"data"`
	}
	if err := json.Unmarshal(rawData, &envelope); err != nil {
		log.Printf("🔧 %s parse error: %v", dataType, err)
		return make([]map[string]interface{}, 0)
	}

	return envelope.Data
}

// isVEdgeDevice determines if the device is a vEdge (Viptela) device.
func isVEdgeDevice(model, deviceOS string) bool {
	// IOS-XE devices (Catalyst SD-WAN) have device-os = "next" or model contains C8/ISR/ASR
	if deviceOS == "next" {
		return false
	}
	// Check model patterns
	modelLower := toLowerCase(model)
	if contains(modelLower, "c8") || contains(modelLower, "isr") || contains(modelLower, "asr") {
		return false
	}
	// Default to vEdge for vedge-* models or unknown
	return true
}

func toLowerCase(s string) string {
	result := make([]byte, len(s))
	for i := 0; i < len(s); i++ {
		c := s[i]
		if c >= 'A' && c <= 'Z' {
			result[i] = c + 32
		} else {
			result[i] = c
		}
	}
	return string(result)
}

func contains(s, substr string) bool {
	return len(s) >= len(substr) && (s == substr || len(substr) == 0 || findSubstring(s, substr) >= 0)
}

func findSubstring(s, substr string) int {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return i
		}
	}
	return -1
}
