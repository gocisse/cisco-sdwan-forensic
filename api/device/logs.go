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

// LogEntry represents a single syslog entry from vManage.
type LogEntry struct {
	VdeviceName  string `json:"vdeviceName"`
	HostName     string `json:"hostName"`
	SystemIP     string `json:"systemIp"`
	Severity     string `json:"severity"`
	Facility     string `json:"facility"`
	Message      string `json:"message"`
	EntryTime    string `json:"entryTime"`
	Component    string `json:"component"`
	ProcessName  string `json:"processName"`
	ProcessID    string `json:"processId"`
	SeverityNum  string `json:"severityNumber"`
}

// FetchDeviceLogs fetches syslog entries for a specific device from vManage.
// GET /api/device/{system-ip}/logs?severity=critical&query=bgp&limit=500
// Supports optional server-side filtering by severity level and keyword search.
func FetchDeviceLogs(apiClient *utils.APIClient) http.HandlerFunc {
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
			deviceID = systemIP
		}

		fullEndpoint := fmt.Sprintf("dataservice/device/syslog?deviceId=%s", deviceID)
		log.Printf("📋 Device logs: system-ip=%s → deviceId=%s", systemIP, deviceID)

		rawData, err := apiClient.Get(fullEndpoint)
		if err != nil {
			log.Printf("vManage API error: %s — %v", fullEndpoint, err)
			middleware.WriteError(w, http.StatusBadGateway, "VMANAGE_ERROR",
				"Failed to fetch device logs from vManage")
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

		// Parse query params for filtering
		severityFilter := strings.ToLower(strings.TrimSpace(r.URL.Query().Get("severity")))
		queryFilter := strings.ToLower(strings.TrimSpace(r.URL.Query().Get("query")))

		// Parse and normalize each log entry
		logs := make([]LogEntry, 0, len(envelope.Data))
		for _, raw := range envelope.Data {
			var item struct {
				VdeviceName string `json:"vdevice-name"`
				HostName    string `json:"host-name"`
				SystemIP    string `json:"system-ip"`
				Severity    string `json:"severity"`
				Facility    string `json:"facility"`
				Message     string `json:"msg"`
				EntryTime   string `json:"entry-time"`
				Component   string `json:"component"`
				ProcessName string `json:"process-name"`
				ProcessID   string `json:"pid"`
			}
			if err := json.Unmarshal(raw, &item); err != nil {
				// Try alternate field names
				var alt struct {
					VdeviceName string `json:"vdeviceName"`
					HostName    string `json:"hostName"`
					SystemIP    string `json:"systemIp"`
					Severity    string `json:"severity"`
					Facility    string `json:"facility"`
					Message     string `json:"message"`
					EntryTime   string `json:"entryTime"`
					Component   string `json:"component"`
					ProcessName string `json:"processName"`
					ProcessID   string `json:"processId"`
				}
				if err2 := json.Unmarshal(raw, &alt); err2 != nil {
					continue
				}
				item.VdeviceName = alt.VdeviceName
				item.HostName = alt.HostName
				item.SystemIP = alt.SystemIP
				item.Severity = alt.Severity
				item.Facility = alt.Facility
				item.Message = alt.Message
				item.EntryTime = alt.EntryTime
				item.Component = alt.Component
				item.ProcessName = alt.ProcessName
				item.ProcessID = alt.ProcessID
			}

			entry := LogEntry{
				VdeviceName: item.VdeviceName,
				HostName:    item.HostName,
				SystemIP:    item.SystemIP,
				Severity:    item.Severity,
				Facility:    item.Facility,
				Message:     item.Message,
				EntryTime:   item.EntryTime,
				Component:   item.Component,
				ProcessName: item.ProcessName,
				ProcessID:   item.ProcessID,
			}

			// Apply severity filter
			if severityFilter != "" && !strings.Contains(strings.ToLower(entry.Severity), severityFilter) {
				continue
			}

			// Apply keyword filter (search in message, component, processName)
			if queryFilter != "" {
				searchable := strings.ToLower(entry.Message + " " + entry.Component + " " + entry.ProcessName + " " + entry.HostName)
				if !strings.Contains(searchable, queryFilter) {
					continue
				}
			}

			logs = append(logs, entry)
		}

		log.Printf("📋 Device logs for %s: %d total, %d after filters (severity=%q, query=%q)",
			systemIP, len(envelope.Data), len(logs), severityFilter, queryFilter)

		payload, _ := json.Marshal(logs)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write(payload)
	}
}
