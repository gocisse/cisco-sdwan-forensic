// sitetopology.go
package topology

import (
	"encoding/json"
	"net/http"
	"regexp"
	"sdwan-app/middleware"
	"sdwan-app/utils"
	"strings"

	"github.com/gorilla/mux"
)

var ipRegex = regexp.MustCompile(`(\d{1,3}\.){3}\d{1,3}\s*`)

// This pattern matches something like "7.7.7.20 " (any IPv4 address plus optional trailing spaces).

type SiteTopology struct {
	Links []struct {
		LinkKey        string `json:"linkKey"`
		Source         string `json:"source"`
		Target         string `json:"target"`
		LinkType       string `json:"linkType"`
		Group          int    `json:"group"`
		Status         string `json:"status"`
		LinkKeyDisplay string `json:"linkKeyDisplay"`
	} `json:"links"`
}

// FetchSiteTopology retrieves the site topology for a given system IP and strips IPs from LinkKeyDisplay.
func FetchSiteTopology(apiClient *utils.APIClient) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		params := mux.Vars(r)
		systemIP := params["system-ip"]
		if systemIP == "" {
			middleware.WriteError(w, http.StatusBadRequest, "MISSING_PARAM", "Missing 'system-ip' URL parameter")
			return
		}

		// Construct the API endpoint URL.
		endpoint := "dataservice/topology/device?deviceId=" + systemIP

		// Fetch raw JSON data from the API.
		rawData, err := apiClient.Get(endpoint)
		if err != nil {
			middleware.WriteError(w, http.StatusBadGateway, "VMANAGE_ERROR", "Failed to fetch site topology")
			return
		}

		// Parse the raw JSON response into a SiteTopology struct.
		var topology SiteTopology
		if err := json.Unmarshal(rawData, &topology); err != nil {
			middleware.WriteError(w, http.StatusInternalServerError, "PARSE_ERROR", "Failed to parse site topology response")
			return
		}

		// Strip IP addresses from linkKeyDisplay.
		for i := range topology.Links {
			original := topology.Links[i].LinkKeyDisplay
			// Remove any occurrences of "<IP> " using our regex, then trim extra spaces.
			stripped := ipRegex.ReplaceAllString(original, "")
			stripped = strings.TrimSpace(stripped)
			topology.Links[i].LinkKeyDisplay = stripped
		}

		middleware.RespondJSON(w, http.StatusOK, topology)
	}
}
