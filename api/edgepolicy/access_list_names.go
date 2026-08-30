// access_list_names.go
package edgepolicy

import (
	"encoding/json"
	"fmt"
	"net/http"

	"sdwan-app/middleware"
	"sdwan-app/utils"

	"github.com/gorilla/mux"
)

// AccessListNames represents the structure returned by
// /dataservice/device/policy/accesslistnames?deviceId=system-ip
type AccessListNames struct {
	VdeviceDataKey  string `json:"vdevice-dataKey"`
	VdeviceName     string `json:"vdevice-name"`
	Name            string `json:"name"`
	Lastupdated     int64  `json:"lastupdated"`
	VdeviceHostName string `json:"vdevice-host-name"`
}

// FetchAccessListNames retrieves the Access List Names for a given system IP.
func FetchAccessListNames(apiClient *utils.APIClient) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		systemIP := mux.Vars(r)["system-ip"]
		if systemIP == "" {
			middleware.WriteError(w, http.StatusBadRequest, "MISSING_PARAM", "Missing 'system-ip' path parameter")
			return
		}

		endpoint := fmt.Sprintf("dataservice/device/policy/accesslistnames?deviceId=%s", systemIP)

		data, err := apiClient.Get(endpoint)
		if err != nil {
			middleware.WriteError(w, http.StatusBadGateway, "VMANAGE_ERROR", "Failed to fetch access list names from vManage")
			return
		}

		var response struct {
			Data []AccessListNames `json:"data"`
		}
		if err := json.Unmarshal(data, &response); err != nil {
			middleware.WriteError(w, http.StatusInternalServerError, "PARSE_ERROR", "Failed to parse access list names response")
			return
		}

		middleware.RespondJSON(w, http.StatusOK, response.Data)
	}
}
