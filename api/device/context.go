// Package device provides handlers for the "device context" workflow:
// looking up a device's identity and its attached template hierarchy.
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
// Structs
// ──────────────────────────────────────────────────────────────────────────────

// DeviceDetails is the consolidated response for GET /api/device/{system-ip}/details.
type DeviceDetails struct {
	SystemIP           string `json:"systemIp"`
	HostName           string `json:"hostName"`
	DeviceID           string `json:"deviceId"`
	DeviceModel        string `json:"deviceModel"`
	SiteID             string `json:"siteId"`
	Reachability       string `json:"reachability"`
	Status             string `json:"status"`
	DeviceOS           string `json:"deviceOs"`
	Template           string `json:"template"`
	TemplateID         string `json:"templateId"`
	CertValidity       string `json:"certificateValidity"`
	ControlConnections string `json:"controlConnections"`
	UptimeDate         int64  `json:"uptimeDate"`
}

// FeatureTemplate is a single entry in the generalTemplates list from a device template.
type FeatureTemplate struct {
	Name         string            `json:"templateName"`
	Type         string            `json:"templateType"`
	Description  string            `json:"templateDescription"`
	TemplateID   string            `json:"templateId"`
	SubTemplates []FeatureTemplate `json:"subTemplates,omitempty"`
}

// TemplateHierarchy is the consolidated response for GET /api/device/{system-ip}/templates.
type TemplateHierarchy struct {
	DeviceTemplateName string            `json:"deviceTemplateName"`
	DeviceTemplateID   string            `json:"deviceTemplateId"`
	DeviceTemplateDesc string            `json:"deviceTemplateDescription"`
	FeatureTemplates   []FeatureTemplate `json:"featureTemplates"`
}

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

// deviceRecord is a minimal representation of a single device from /dataservice/device.
// We keep it flexible with json.RawMessage-free approach: just the fields we need.
type deviceRecord struct {
	SystemIP   string `json:"system-ip"`
	HostName   string `json:"host-name"`
	DeviceID   string `json:"deviceId"`
	Model      string `json:"device-model"`
	SiteID     string `json:"site-id"`
	Reach      string `json:"reachability"`
	Status     string `json:"status"`
	DeviceOS   string `json:"device-os"`
	Template   string `json:"template"`
	TemplateID string `json:"templateId"`
	CertValid  string `json:"certificate-validity"`
	CtrlConns  string `json:"controlConnections"`
	UptimeDate int64  `json:"uptime-date"`
}

// findDevice fetches /dataservice/device and locates the record matching systemIP.
func findDevice(apiClient *utils.APIClient, systemIP string) (*deviceRecord, error) {
	rawData, err := apiClient.Get("dataservice/device")
	if err != nil {
		return nil, fmt.Errorf("failed to fetch device list: %w", err)
	}

	var envelope struct {
		Data []deviceRecord `json:"data"`
	}
	if err := json.Unmarshal(rawData, &envelope); err != nil {
		return nil, fmt.Errorf("failed to parse device list: %w", err)
	}

	for i := range envelope.Data {
		if envelope.Data[i].SystemIP == systemIP {
			return &envelope.Data[i], nil
		}
	}
	return nil, nil // not found
}

// ──────────────────────────────────────────────────────────────────────────────
// Handlers
// ──────────────────────────────────────────────────────────────────────────────

// FetchDeviceDetails returns identity and template metadata for a single device.
// GET /api/device/{system-ip}/details
func FetchDeviceDetails(apiClient *utils.APIClient) http.HandlerFunc {
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

		details := DeviceDetails{
			SystemIP:           dev.SystemIP,
			HostName:           dev.HostName,
			DeviceID:           dev.DeviceID,
			DeviceModel:        dev.Model,
			SiteID:             dev.SiteID,
			Reachability:       dev.Reach,
			Status:             dev.Status,
			DeviceOS:           dev.DeviceOS,
			Template:           dev.Template,
			TemplateID:         dev.TemplateID,
			CertValidity:       dev.CertValid,
			ControlConnections: dev.CtrlConns,
			UptimeDate:         dev.UptimeDate,
		}

		middleware.RespondJSON(w, http.StatusOK, details)
	}
}

// FetchDeviceTemplates resolves the full template hierarchy for a device.
// GET /api/device/{system-ip}/templates
//
// Flow:
//  1. Look up the device to get its templateId.
//  2. Fetch /dataservice/template/device/object/{templateId} for the Device Template.
//  3. Extract generalTemplates → return as feature template list.
func FetchDeviceTemplates(apiClient *utils.APIClient) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		systemIP := mux.Vars(r)["system-ip"]
		if systemIP == "" {
			middleware.WriteError(w, http.StatusBadRequest, "MISSING_PARAM", "Missing 'system-ip' path parameter")
			return
		}

		// Step 1: Find device → get templateId
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
		if dev.TemplateID == "" {
			middleware.WriteError(w, http.StatusNotFound, "NO_TEMPLATE",
				fmt.Sprintf("Device %s has no attached device template", systemIP))
			return
		}

		// Step 2: Fetch the Device Template object
		templateEndpoint := fmt.Sprintf("dataservice/template/device/object/%s", dev.TemplateID)
		rawTemplate, err := apiClient.Get(templateEndpoint)
		if err != nil {
			log.Printf("Template fetch error for %s: %v", dev.TemplateID, err)
			middleware.WriteError(w, http.StatusBadGateway, "VMANAGE_ERROR", "Failed to fetch device template from vManage")
			return
		}

		// The device template object structure from vManage
		var tmpl struct {
			TemplateName        string `json:"templateName"`
			TemplateID          string `json:"templateId"`
			TemplateDescription string `json:"templateDescription"`
			GeneralTemplates    []struct {
				Name         string `json:"templateName"`
				Type         string `json:"templateType"`
				Description  string `json:"templateDescription"`
				TemplateID   string `json:"templateId"`
				SubTemplates []struct {
					Name        string `json:"templateName"`
					Type        string `json:"templateType"`
					Description string `json:"templateDescription"`
					TemplateID  string `json:"templateId"`
				} `json:"subTemplates"`
			} `json:"generalTemplates"`
		}
		if err := json.Unmarshal(rawTemplate, &tmpl); err != nil {
			log.Printf("Template parse error for %s: %v", dev.TemplateID, err)
			middleware.WriteError(w, http.StatusInternalServerError, "PARSE_ERROR", "Failed to parse device template")
			return
		}

		// Step 3: Build the response
		features := make([]FeatureTemplate, 0, len(tmpl.GeneralTemplates))
		for _, gt := range tmpl.GeneralTemplates {
			ft := FeatureTemplate{
				Name:        gt.Name,
				Type:        gt.Type,
				Description: gt.Description,
				TemplateID:  gt.TemplateID,
			}
			// Include sub-templates if present
			for _, st := range gt.SubTemplates {
				ft.SubTemplates = append(ft.SubTemplates, FeatureTemplate{
					Name:        st.Name,
					Type:        st.Type,
					Description: st.Description,
					TemplateID:  st.TemplateID,
				})
			}
			features = append(features, ft)
		}

		result := TemplateHierarchy{
			DeviceTemplateName: tmpl.TemplateName,
			DeviceTemplateID:   tmpl.TemplateID,
			DeviceTemplateDesc: tmpl.TemplateDescription,
			FeatureTemplates:   features,
		}

		middleware.RespondJSON(w, http.StatusOK, result)
	}
}
