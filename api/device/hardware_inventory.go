package device

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"

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
// Per Cisco API docs, deviceId = system-ip (DeviceIP)
//
// Endpoints used (verified against vManage API):
//   - /dataservice/device/hardware/inventory?deviceId=x.x.x.x (inventory with serial numbers)
//   - /dataservice/device/hardware/environment?deviceId=x.x.x.x (environment/temperature)
//   - /dataservice/device/hardware/alarms?deviceId=x.x.x.x (hardware alarms)
//   - /dataservice/hardware/threshold?deviceId=x.x.x.x (thresholds - vEdge only)
//
// Returns a combined response with all hardware data.
func FetchHardwareInventory(apiClient *utils.APIClient) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		systemIP := mux.Vars(r)["system-ip"]
		dev := requireDevice(apiClient, w, systemIP)
		if dev == nil {
			return // Error already written
		}

		// Per Cisco API docs, deviceId parameter is the device's system-ip
		deviceID := dev.SystemIP
		if deviceID == "" {
			deviceID = systemIP
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

		// Fetch inventory
		// GET /dataservice/device/hardware/inventory?deviceId=x.x.x.x
		response.Inventory = fetchHardwareData(apiClient, "dataservice/device/hardware/inventory", deviceID, "inventory")

		// Fetch environment
		// GET /dataservice/device/hardware/environment?deviceId=x.x.x.x
		response.Environment = fetchHardwareData(apiClient, "dataservice/device/hardware/environment", deviceID, "environment")

		// Fetch alarms
		// GET /dataservice/device/hardware/alarms?deviceId=x.x.x.x
		response.Alarms = fetchHardwareData(apiClient, "dataservice/device/hardware/alarms", deviceID, "alarms")

		// Fetch thresholds (vEdge only)
		// GET /dataservice/hardware/threshold?deviceId=x.x.x.x
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
