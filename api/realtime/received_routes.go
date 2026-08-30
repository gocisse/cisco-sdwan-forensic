package realtime

import (
	"encoding/json"
	"net/http"

	"sdwan-app/middleware"
	"sdwan-app/utils"

	"github.com/gorilla/mux"
)

// FetchReceivedRoutes retrieves and filters received OMP routes for a device
func FetchReceivedRoutes(apiClient *utils.APIClient) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		systemIP := mux.Vars(r)["system-ip"]
		if systemIP == "" {
			middleware.WriteError(w, http.StatusBadRequest, "MISSING_PARAM", "Missing 'system-ip' path parameter")
			return
		}

		rawData, err := apiClient.Get("dataservice/device/omp/routes/received?deviceId=" + systemIP)
		if err != nil {
			middleware.WriteError(w, http.StatusBadGateway, "VMANAGE_ERROR", "Failed to fetch received routes from vManage")
			return
		}

		var response struct {
			Data []Routes `json:"data"`
		}

		if err := json.Unmarshal(rawData, &response); err != nil {
			middleware.WriteError(w, http.StatusInternalServerError, "PARSE_ERROR", "Failed to parse routes response")
			return
		}

		middleware.RespondJSON(w, http.StatusOK, response.Data)
	}
}
