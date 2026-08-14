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

// LogEntry represents a single log entry from vManage.
// Works for both vEdge (vsyslog) and IOS-XE (show logging) devices.
type LogEntry struct {
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
	SeverityNum string `json:"severityNumber"`
	LogSource   string `json:"logSource"` // "syslog" or "logging" to indicate source
}

// logEndpoint defines a vManage log endpoint to try
type logEndpoint struct {
	path   string
	source string
}

// FetchDeviceLogs fetches log entries for a specific device from vManage.
// GET /api/device/{system-ip}/logs?severity=critical&query=bgp&limit=500
//
// This handler supports both device types:
//   - vEdge (Viptela): uses /dataservice/device/syslog (vsyslog from /var/log/vsyslog)
//   - IOS-XE (C8000, ISR): uses /dataservice/device/logging (show logging equivalent)
//
// The handler tries multiple endpoints and returns the first successful result.
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

		deviceID := dev.UUID
		if deviceID == "" {
			deviceID = systemIP
		}

		// Determine device type from model to optimize endpoint order
		// vEdge models: vEdge-*, vedge-*
		// IOS-XE models: C8*, ISR*, ASR*, vedge-C8* (Catalyst 8000 running SD-WAN)
		isIOSXE := strings.Contains(strings.ToLower(dev.Model), "c8") ||
			strings.Contains(strings.ToLower(dev.Model), "isr") ||
			strings.Contains(strings.ToLower(dev.Model), "asr") ||
			strings.Contains(strings.ToLower(dev.DeviceOS), "next") // IOS-XE SD-WAN uses "next"

		// Order endpoints based on device type for faster response
		var endpoints []logEndpoint
		if isIOSXE {
			endpoints = []logEndpoint{
				{path: "dataservice/device/logging", source: "logging"},
				{path: "dataservice/device/syslog", source: "syslog"},
				{path: "dataservice/device/log", source: "log"},
			}
		} else {
			endpoints = []logEndpoint{
				{path: "dataservice/device/syslog", source: "syslog"},
				{path: "dataservice/device/logging", source: "logging"},
				{path: "dataservice/device/log", source: "log"},
			}
		}

		log.Printf("📋 Device logs: system-ip=%s → deviceId=%s (model=%s, os=%s, isIOSXE=%v)",
			systemIP, deviceID, dev.Model, dev.DeviceOS, isIOSXE)

		// Try each endpoint until one succeeds with data
		var rawData []byte
		var successEndpoint logEndpoint
		var lastErr error

		for _, ep := range endpoints {
			fullEndpoint := fmt.Sprintf("%s?deviceId=%s", ep.path, deviceID)
			log.Printf("📋 Trying endpoint: %s", fullEndpoint)

			data, err := apiClient.Get(fullEndpoint)
			if err != nil {
				log.Printf("📋 Endpoint %s failed: %v", ep.path, err)
				lastErr = err
				continue
			}

			// Check if response has data
			var envelope struct {
				Data []json.RawMessage `json:"data"`
			}
			if err := json.Unmarshal(data, &envelope); err != nil {
				log.Printf("📋 Endpoint %s parse error: %v", ep.path, err)
				lastErr = err
				continue
			}

			if len(envelope.Data) > 0 {
				rawData = data
				successEndpoint = ep
				log.Printf("📋 Endpoint %s returned %d entries", ep.path, len(envelope.Data))
				break
			}

			log.Printf("📋 Endpoint %s returned empty data, trying next...", ep.path)
		}

		// If no endpoint returned data, return empty array (not an error)
		if rawData == nil {
			if lastErr != nil {
				log.Printf("📋 All log endpoints failed for %s, last error: %v", systemIP, lastErr)
			} else {
				log.Printf("📋 All log endpoints returned empty for %s", systemIP)
			}
			// Return empty array instead of error - device may simply have no logs
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			w.Write([]byte("[]"))
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

		// Parse query params for filtering
		severityFilter := strings.ToLower(strings.TrimSpace(r.URL.Query().Get("severity")))
		queryFilter := strings.ToLower(strings.TrimSpace(r.URL.Query().Get("query")))

		// Parse and normalize each log entry
		logs := make([]LogEntry, 0, len(envelope.Data))
		for _, raw := range envelope.Data {
			entry := parseLogEntry(raw, successEndpoint.source)
			if entry == nil {
				continue
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

			logs = append(logs, *entry)
		}

		log.Printf("📋 Device logs for %s: %d total, %d after filters (severity=%q, query=%q, source=%s)",
			systemIP, len(envelope.Data), len(logs), severityFilter, queryFilter, successEndpoint.source)

		payload, _ := json.Marshal(logs)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write(payload)
	}
}

// parseLogEntry parses a raw JSON log entry, handling different field name formats
// used by vEdge (syslog) vs IOS-XE (logging) devices.
func parseLogEntry(raw json.RawMessage, source string) *LogEntry {
	// Try vEdge syslog format first (hyphenated field names)
	var vedge struct {
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
	if err := json.Unmarshal(raw, &vedge); err == nil && (vedge.Message != "" || vedge.Severity != "") {
		return &LogEntry{
			VdeviceName: vedge.VdeviceName,
			HostName:    vedge.HostName,
			SystemIP:    vedge.SystemIP,
			Severity:    vedge.Severity,
			Facility:    vedge.Facility,
			Message:     vedge.Message,
			EntryTime:   vedge.EntryTime,
			Component:   vedge.Component,
			ProcessName: vedge.ProcessName,
			ProcessID:   vedge.ProcessID,
			LogSource:   source,
		}
	}

	// Try IOS-XE logging format (camelCase field names)
	var iosxe struct {
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
		// IOS-XE specific fields
		LogMessage string `json:"logMessage"`
		Timestamp  string `json:"timestamp"`
		Level      string `json:"level"`
	}
	if err := json.Unmarshal(raw, &iosxe); err == nil {
		msg := iosxe.Message
		if msg == "" {
			msg = iosxe.LogMessage
		}
		sev := iosxe.Severity
		if sev == "" {
			sev = iosxe.Level
		}
		entryTime := iosxe.EntryTime
		if entryTime == "" {
			entryTime = iosxe.Timestamp
		}
		if msg != "" || sev != "" {
			return &LogEntry{
				VdeviceName: iosxe.VdeviceName,
				HostName:    iosxe.HostName,
				SystemIP:    iosxe.SystemIP,
				Severity:    sev,
				Facility:    iosxe.Facility,
				Message:     msg,
				EntryTime:   entryTime,
				Component:   iosxe.Component,
				ProcessName: iosxe.ProcessName,
				ProcessID:   iosxe.ProcessID,
				LogSource:   source,
			}
		}
	}

	// Try generic format as fallback
	var generic map[string]interface{}
	if err := json.Unmarshal(raw, &generic); err == nil {
		entry := &LogEntry{LogSource: source}
		if v, ok := generic["message"].(string); ok {
			entry.Message = v
		} else if v, ok := generic["msg"].(string); ok {
			entry.Message = v
		} else if v, ok := generic["logMessage"].(string); ok {
			entry.Message = v
		}
		if v, ok := generic["severity"].(string); ok {
			entry.Severity = v
		} else if v, ok := generic["level"].(string); ok {
			entry.Severity = v
		}
		if v, ok := generic["entry-time"].(string); ok {
			entry.EntryTime = v
		} else if v, ok := generic["entryTime"].(string); ok {
			entry.EntryTime = v
		} else if v, ok := generic["timestamp"].(string); ok {
			entry.EntryTime = v
		}
		if v, ok := generic["host-name"].(string); ok {
			entry.HostName = v
		} else if v, ok := generic["hostName"].(string); ok {
			entry.HostName = v
		}
		if v, ok := generic["facility"].(string); ok {
			entry.Facility = v
		}
		if v, ok := generic["component"].(string); ok {
			entry.Component = v
		}
		if entry.Message != "" || entry.Severity != "" {
			return entry
		}
	}

	return nil
}
