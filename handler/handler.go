package handler

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"

	"sdwan-app/middleware"
	"sdwan-app/utils"

	"github.com/gorilla/mux"
)

// ======================
// Generic Handler Factory
// ======================

// ProxyDataEndpoint creates a handler that proxies a vManage "dataservice" endpoint.
// It fetches JSON from vManage, unwraps the {"data": [...]} envelope, and writes
// the inner array as the HTTP response.
//
// Pattern 1 — static endpoint (no path param):
//
//	ProxyDataEndpoint(apiClient, "dataservice/device", "")
//
// Pattern 2 — device-scoped endpoint (uses {system-ip} from the URL path):
//
//	ProxyDataEndpoint(apiClient, "dataservice/device/bfd/sessions?deviceId=", "system-ip")
//
// The vManage endpoint string is built as:  <endpoint> + <pathParamValue>
func ProxyDataEndpoint(apiClient *utils.APIClient, endpoint string, pathParam string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Build the full vManage endpoint
		fullEndpoint := endpoint
		if pathParam != "" {
			vars := mux.Vars(r)
			paramValue := vars[pathParam]
			if paramValue == "" {
				middleware.WriteError(w, http.StatusBadRequest,
					"MISSING_PARAM",
					fmt.Sprintf("Missing '%s' path parameter", pathParam))
				return
			}
			fullEndpoint = endpoint + paramValue
		}

		// Fetch from vManage
		rawData, err := apiClient.Get(fullEndpoint)
		if err != nil {
			log.Printf("vManage API error: %s — %v", fullEndpoint, err)
			middleware.WriteError(w, http.StatusBadGateway,
				"VMANAGE_ERROR",
				"Failed to fetch data from vManage")
			return
		}

		// Unwrap the {"data": [...]} envelope
		var envelope struct {
			Data json.RawMessage `json:"data"`
		}
		if err := json.Unmarshal(rawData, &envelope); err != nil {
			log.Printf("JSON unmarshal error for %s: %v", fullEndpoint, err)
			middleware.WriteError(w, http.StatusInternalServerError,
				"PARSE_ERROR",
				"Failed to parse vManage response")
			return
		}

		// If the "data" key exists, return it; otherwise return the raw response
		payload := envelope.Data
		if payload == nil {
			payload = rawData
		}

		writeRawJSON(w, http.StatusOK, payload)
	}
}

// ProxyRawEndpoint creates a handler that proxies a vManage endpoint and returns
// the full response body as-is (no {"data": [...]} unwrapping).
// Useful for endpoints like topology that return a different structure.
func ProxyRawEndpoint(apiClient *utils.APIClient, endpoint string, pathParam string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		fullEndpoint := endpoint
		if pathParam != "" {
			vars := mux.Vars(r)
			paramValue := vars[pathParam]
			if paramValue == "" {
				middleware.WriteError(w, http.StatusBadRequest,
					"MISSING_PARAM",
					fmt.Sprintf("Missing '%s' path parameter", pathParam))
				return
			}
			fullEndpoint = endpoint + paramValue
		}

		rawData, err := apiClient.Get(fullEndpoint)
		if err != nil {
			log.Printf("vManage API error: %s — %v", fullEndpoint, err)
			middleware.WriteError(w, http.StatusBadGateway,
				"VMANAGE_ERROR",
				"Failed to fetch data from vManage")
			return
		}

		writeRawJSON(w, http.StatusOK, rawData)
	}
}

// writeRawJSON writes pre-encoded JSON bytes to the response.
// For structured Go values, use middleware.RespondJSON instead.
func writeRawJSON(w http.ResponseWriter, status int, data []byte) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	w.Write(data)
}
