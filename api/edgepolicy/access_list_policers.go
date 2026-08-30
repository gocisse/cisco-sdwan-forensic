// access_list_policers.go
package edgepolicy

import (
	"encoding/json"
	"fmt"
	"net/http"

	"sdwan-app/middleware"
	"sdwan-app/utils"

	"github.com/gorilla/mux"
)

// AccessListPolicers represents the structure returned by
// /dataservice/device/policy/accesslistpolicers?deviceId=system-ip
type AccessListPolicers struct {
	Name            string `json:"name"`
	Lastupdated     int64  `json:"lastupdated"`
	VdeviceDataKey  string `json:"vdevice-dataKey"`
	VdeviceName     string `json:"vdevice-name"`
	VdeviceHostName string `json:"vdevice-host-name"`
}

// FetchAccessListPolicers retrieves the Access List Policers for a given system IP.
func FetchAccessListPolicers(apiClient *utils.APIClient) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		systemIP := mux.Vars(r)["system-ip"]
		if systemIP == "" {
			middleware.WriteError(w, http.StatusBadRequest, "MISSING_PARAM", "Missing 'system-ip' path parameter")
			return
		}

		endpoint := fmt.Sprintf("dataservice/device/policy/accesslistpolicers?deviceId=%s", systemIP)

		data, err := apiClient.Get(endpoint)
		if err != nil {
			middleware.WriteError(w, http.StatusBadGateway, "VMANAGE_ERROR", "Failed to fetch access list policers from vManage")
			return
		}

		var response struct {
			Data []AccessListPolicers `json:"data"`
		}
		if err := json.Unmarshal(data, &response); err != nil {
			middleware.WriteError(w, http.StatusInternalServerError, "PARSE_ERROR", "Failed to parse access list policers response")
			return
		}

		middleware.RespondJSON(w, http.StatusOK, response.Data)
	}
}
