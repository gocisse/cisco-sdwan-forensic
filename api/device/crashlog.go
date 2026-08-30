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

// CrashLogEntry represents a single crash log (core file) entry from vManage.
type CrashLogEntry struct {
	VdeviceName     string `json:"vdeviceName"`
	VdeviceHostName string `json:"vdeviceHostName"`
	Index           int    `json:"index"`
	CoreFilename    string `json:"coreFilename"`
	CoreTime        string `json:"coreTime"`
	CoreTimeDate    int64  `json:"coreTimeDate"`
	LastUpdated     int64  `json:"lastUpdated"`
}

// FetchCrashLogs fetches crash log (core file) entries for a specific device from vManage.
// GET /api/device/{system-ip}/crashlog
//
// This calls the vManage real-time monitoring endpoint:
//
//	GET /dataservice/device/crashlog?deviceId={deviceId}
//
// Returns a list of core files on the device, useful for troubleshooting crashes.
func FetchCrashLogs(apiClient *utils.APIClient) http.HandlerFunc {
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

		log.Printf("💥 Crash logs: system-ip=%s → deviceId=%s", systemIP, deviceID)

		// Try real-time endpoint first, then synced endpoint
		// GET /dataservice/device/crashlog?deviceId=deviceId (real-time)
		// GET /dataservice/device/crashlog/synced?deviceId=deviceId (from NMS)
		endpoints := []string{
			fmt.Sprintf("dataservice/device/crashlog?deviceId=%s", deviceID),
			fmt.Sprintf("dataservice/device/crashlog/synced?deviceId=%s", deviceID),
		}

		var rawData []byte
		var lastErr error
		for _, endpoint := range endpoints {
			log.Printf("💥 Trying endpoint: %s", endpoint)
			data, err := apiClient.Get(endpoint)
			if err != nil {
				log.Printf("💥 Endpoint %s failed: %v", endpoint, err)
				lastErr = err
				continue
			}
			rawData = data
			break
		}

		if rawData == nil {
			log.Printf("vManage API error: all crash log endpoints failed, last error: %v", lastErr)
			middleware.WriteError(w, http.StatusBadGateway, "VMANAGE_ERROR",
				"Failed to fetch crash logs from vManage")
			return
		}

		var envelope struct {
			Data []json.RawMessage `json:"data"`
		}
		if err := json.Unmarshal(rawData, &envelope); err != nil {
			log.Printf("JSON unmarshal error: %v", err)
			middleware.WriteError(w, http.StatusInternalServerError, "PARSE_ERROR", "Failed to parse vManage response")
			return
		}

		// Parse and normalize each crash log entry
		crashLogs := make([]CrashLogEntry, 0, len(envelope.Data))
		for _, raw := range envelope.Data {
			entry := parseCrashLogEntry(raw)
			if entry != nil {
				crashLogs = append(crashLogs, *entry)
			}
		}

		log.Printf("💥 Crash logs for %s: %d entries found", systemIP, len(crashLogs))

		payload, _ := json.Marshal(crashLogs)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write(payload)
	}
}

// parseCrashLogEntry parses a raw JSON crash log entry, handling different field name formats.
func parseCrashLogEntry(raw json.RawMessage) *CrashLogEntry {
	// Try hyphenated field names (vManage format)
	var vmanage struct {
		VdeviceName     string `json:"vdevice-name"`
		VdeviceHostName string `json:"vdevice-host-name"`
		Index           int    `json:"index"`
		CoreFilename    string `json:"core-filename"`
		CoreTime        string `json:"core-time"`
		CoreTimeDate    int64  `json:"core-time-date"`
		LastUpdated     int64  `json:"lastupdated"`
	}
	if err := json.Unmarshal(raw, &vmanage); err == nil && vmanage.CoreFilename != "" {
		return &CrashLogEntry{
			VdeviceName:     vmanage.VdeviceName,
			VdeviceHostName: vmanage.VdeviceHostName,
			Index:           vmanage.Index,
			CoreFilename:    vmanage.CoreFilename,
			CoreTime:        vmanage.CoreTime,
			CoreTimeDate:    vmanage.CoreTimeDate,
			LastUpdated:     vmanage.LastUpdated,
		}
	}

	// Try camelCase field names
	var camel struct {
		VdeviceName     string `json:"vdeviceName"`
		VdeviceHostName string `json:"vdeviceHostName"`
		Index           int    `json:"index"`
		CoreFilename    string `json:"coreFilename"`
		CoreTime        string `json:"coreTime"`
		CoreTimeDate    int64  `json:"coreTimeDate"`
		LastUpdated     int64  `json:"lastUpdated"`
	}
	if err := json.Unmarshal(raw, &camel); err == nil && camel.CoreFilename != "" {
		return &CrashLogEntry{
			VdeviceName:     camel.VdeviceName,
			VdeviceHostName: camel.VdeviceHostName,
			Index:           camel.Index,
			CoreFilename:    camel.CoreFilename,
			CoreTime:        camel.CoreTime,
			CoreTimeDate:    camel.CoreTimeDate,
			LastUpdated:     camel.LastUpdated,
		}
	}

	return nil
}
