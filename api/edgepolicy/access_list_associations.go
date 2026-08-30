// access_list_associations.go
package edgepolicy

import (
	"encoding/json"
	"fmt"
	"net/http"

	"sdwan-app/middleware"
	"sdwan-app/utils"

	"github.com/gorilla/mux"
)

// AccessListAssociations represents the structure returned by
// /dataservice/device/policy/accesslistassociations?deviceId=system-ip
type AccessListAssociations struct {
	VdeviceDataKey     string `json:"vdevice-dataKey"`
	VdeviceName        string `json:"vdevice-name"`
	InterfaceName      string `json:"interface-name"`
	Name               string `json:"name"`
	Lastupdated        string `json:"lastupdated"`
	VdeviceHostName    string `json:"vdevice-host-name"`
	InterfaceDirection string `json:"interface-direction"`
}

// FetchAccessListAssociations retrieves the access-list associations for a given system IP.
func FetchAccessListAssociations(apiClient *utils.APIClient) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		systemIP := mux.Vars(r)["system-ip"]
		if systemIP == "" {
			middleware.WriteError(w, http.StatusBadRequest, "MISSING_PARAM", "Missing 'system-ip' path parameter")
			return
		}

		endpoint := fmt.Sprintf("dataservice/device/policy/accesslistassociations?deviceId=%s", systemIP)

		data, err := apiClient.Get(endpoint)
		if err != nil {
			middleware.WriteError(w, http.StatusBadGateway, "VMANAGE_ERROR", "Failed to fetch access list associations from vManage")
			return
		}

		var response struct {
			Data []AccessListAssociations `json:"data"`
		}
		if err := json.Unmarshal(data, &response); err != nil {
			middleware.WriteError(w, http.StatusInternalServerError, "PARSE_ERROR", "Failed to parse access list associations response")
			return
		}

		middleware.RespondJSON(w, http.StatusOK, response.Data)
	}
}
