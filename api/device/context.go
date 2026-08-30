// Package device provides handlers for the "device context" workflow:
// looking up a device's identity and its attached template hierarchy.
package device

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"

	"sdwan-app/middleware"
	"sdwan-app/models"
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

// getDevice looks up a device by system-ip using the cached device list.
// This is the preferred method - uses TTL cache to avoid repeated API calls.
func getDevice(apiClient *utils.APIClient, systemIP string) (*models.Device, error) {
	return apiClient.GetDevice(systemIP)
}

// requireDevice is a helper that looks up a device and writes an error response if not found.
// Returns the device if found, or nil if an error was written to the response.
func requireDevice(apiClient *utils.APIClient, w http.ResponseWriter, systemIP string) *models.Device {
	if systemIP == "" {
		middleware.WriteError(w, http.StatusBadRequest, "MISSING_PARAM", "Missing 'system-ip' path parameter")
		return nil
	}

	dev, err := apiClient.GetDevice(systemIP)
	if err != nil {
		log.Printf("Device lookup error: %v", err)
		middleware.WriteError(w, http.StatusBadGateway, "VMANAGE_ERROR", "Failed to look up device")
		return nil
	}
	if dev == nil {
		middleware.WriteError(w, http.StatusNotFound, "NOT_FOUND",
			fmt.Sprintf("No device found with system-ip %s", systemIP))
		return nil
	}
	return dev
}

// ──────────────────────────────────────────────────────────────────────────────
// Handlers
// ──────────────────────────────────────────────────────────────────────────────

// FetchDeviceDetails returns identity and template metadata for a single device.
// GET /api/device/{system-ip}/details
func FetchDeviceDetails(apiClient *utils.APIClient) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		systemIP := mux.Vars(r)["system-ip"]
		dev := requireDevice(apiClient, w, systemIP)
		if dev == nil {
			return // Error already written
		}

		// If template info is missing, look it up from template list
		templateName := dev.Template
		templateID := dev.TemplateID
		if templateID == "" && dev.UUID != "" {
			log.Printf("Device %s has no template info, looking up by UUID %s", systemIP, dev.UUID)
			name, id, err := apiClient.FindTemplateForDevice(dev.UUID)
			if err != nil {
				log.Printf("Template lookup error for %s: %v", systemIP, err)
			} else if id != "" {
				templateName = name
				templateID = id
			}
		}

		details := DeviceDetails{
			SystemIP:           dev.SystemIP,
			HostName:           dev.HostName,
			DeviceID:           dev.DeviceID,
			DeviceModel:        dev.Model,
			SiteID:             dev.SiteID,
			Reachability:       dev.Reachability,
			Status:             dev.Status,
			DeviceOS:           dev.DeviceOS,
			Template:           templateName,
			TemplateID:         templateID,
			CertValidity:       dev.CertificateValidity,
			ControlConnections: dev.ControlConnections,
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
		dev := requireDevice(apiClient, w, systemIP)
		if dev == nil {
			return // Error already written
		}

		// Resolve template ID: prefer templateId from device record,
		// fall back to looking up by template name or by device UUID
		templateID := dev.TemplateID
		if templateID == "" && dev.Template != "" {
			log.Printf("Device %s has template name %q but no templateId — resolving by name", systemIP, dev.Template)
			resolved, err := apiClient.ResolveTemplateID(dev.Template)
			if err != nil {
				log.Printf("Template name resolution error for %s: %v", systemIP, err)
			} else {
				templateID = resolved
			}
		}
		// If still no templateID, try looking up by device UUID
		if templateID == "" && dev.UUID != "" {
			log.Printf("Device %s has no template info, looking up by UUID %s", systemIP, dev.UUID)
			_, id, err := apiClient.FindTemplateForDevice(dev.UUID)
			if err != nil {
				log.Printf("Template lookup error for %s: %v", systemIP, err)
			} else if id != "" {
				templateID = id
			}
		}
		if templateID == "" {
			middleware.WriteError(w, http.StatusNotFound, "NO_TEMPLATE",
				fmt.Sprintf("Device %s has no attached device template", systemIP))
			return
		}

		// Step 2: Fetch the Device Template object
		templateEndpoint := fmt.Sprintf("dataservice/template/device/object/%s", templateID)
		rawTemplate, err := apiClient.Get(templateEndpoint)
		if err != nil {
			log.Printf("Template fetch error for %s: %v", templateID, err)
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
