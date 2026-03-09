package routes

import (
	"net/http"

	"sdwan-app/api/device"
	"sdwan-app/api/topology"
	"sdwan-app/handler"
	"sdwan-app/sse"
	"sdwan-app/utils"

	"github.com/gorilla/mux"
)

// h is a shorthand for the generic handler factory
func h(apiClient *utils.APIClient, endpoint, pathParam string) http.HandlerFunc {
	return handler.ProxyDataEndpoint(apiClient, endpoint, pathParam)
}

// New creates and returns a fully configured mux.Router with all API routes,
// SSE endpoints, and static file serving for the React SPA.
//
// The staticDir parameter is the path to the React build output directory
// (e.g., "cisco-dashboard-frontend/build").
func New(apiClient *utils.APIClient, staticDir string) *mux.Router {
	r := mux.NewRouter()

	registerAPIRoutes(r, apiClient)
	registerSSERoutes(r, apiClient)
	registerStaticRoutes(r, staticDir)

	return r
}

// registerAPIRoutes sets up all /api/* routes.
func registerAPIRoutes(r *mux.Router, apiClient *utils.APIClient) {
	// ─── Devices ────────────────────────────────────────────────────────
	r.HandleFunc("/api/devices",
		h(apiClient, "dataservice/device", "")).Methods("GET")

	// ─── Alarms ─────────────────────────────────────────────────────────
	r.HandleFunc("/api/alarms",
		h(apiClient, "dataservice/alarms", "")).Methods("GET")

	// ─── Device Context (details + template hierarchy) ─────────────────
	r.HandleFunc("/api/device/{system-ip}/details",
		device.FetchDeviceDetails(apiClient)).Methods("GET")
	r.HandleFunc("/api/device/{system-ip}/templates",
		device.FetchDeviceTemplates(apiClient)).Methods("GET")

	// ─── Policy Forensics (local + centralized per device) ──────────────
	r.HandleFunc("/api/device/{system-ip}/policy/local",
		device.FetchLocalPolicy(apiClient)).Methods("GET")
	r.HandleFunc("/api/device/{system-ip}/policy/centralized",
		device.FetchCentralizedPolicy(apiClient)).Methods("GET")

	// ─── Traffic Analysis / SLA ────────────────────────────────────────
	r.HandleFunc("/api/device/{system-ip}/app-route",
		device.FetchAppRoute(apiClient)).Methods("GET")
	r.HandleFunc("/api/device/{system-ip}/tunnel-health",
		device.FetchTunnelHealth(apiClient)).Methods("GET")

	// ─── Real-time (device-scoped, uses {system-ip}) ────────────────────
	r.HandleFunc("/api/control-plane/{system-ip}",
		h(apiClient, "dataservice/device/control/synced/connections?deviceId=", "system-ip")).Methods("GET")
	r.HandleFunc("/api/connections/{system-ip}",
		h(apiClient, "dataservice/device/control/connections?deviceId=", "system-ip")).Methods("GET")
	r.HandleFunc("/api/routes/received/{system-ip}",
		h(apiClient, "dataservice/device/omp/routes/received?deviceId=", "system-ip")).Methods("GET")
	r.HandleFunc("/api/routes/advertised/{system-ip}",
		h(apiClient, "dataservice/device/omp/routes/advertised?deviceId=", "system-ip")).Methods("GET")
	r.HandleFunc("/api/tlocs/received/{system-ip}",
		h(apiClient, "dataservice/device/omp/tlocs/received?deviceId=", "system-ip")).Methods("GET")
	r.HandleFunc("/api/tlocs/advertised/{system-ip}",
		h(apiClient, "dataservice/device/omp/tlocs/advertised?deviceId=", "system-ip")).Methods("GET")
	r.HandleFunc("/api/app-routes/{system-ip}",
		h(apiClient, "dataservice/device/app-route/statistics?deviceId=", "system-ip")).Methods("GET")
	r.HandleFunc("/api/bfd/{system-ip}",
		h(apiClient, "dataservice/device/tunnel/bfd_statistics?deviceId=", "system-ip")).Methods("GET")
	r.HandleFunc("/api/tunnel/{system-ip}",
		h(apiClient, "dataservice/device/tunnel/statistics?deviceId=", "system-ip")).Methods("GET")
	r.HandleFunc("/api/ipsec/{system-ip}",
		h(apiClient, "dataservice/device/ipsec/localsa?deviceId=", "system-ip")).Methods("GET")

	// ─── Topology ───────────────────────────────────────────────────────
	r.HandleFunc("/api/topology/{system-ip}",
		h(apiClient, "dataservice/device/bfd/sessions?deviceId=", "system-ip")).Methods("GET")
	// Site topology has custom post-processing (IP stripping), keep dedicated handler
	r.HandleFunc("/api/topology/site/{system-ip}",
		topology.FetchSiteTopology(apiClient)).Methods("GET")

	// ─── Policies (static endpoints, no path param) ─────────────────────
	r.HandleFunc("/api/policies/control",
		h(apiClient, "dataservice/template/policy/definition/control", "")).Methods("GET")
	r.HandleFunc("/api/policies/sla",
		h(apiClient, "dataservice/template/policy/list/sla", "")).Methods("GET")
	r.HandleFunc("/api/policies/prefix",
		h(apiClient, "dataservice/template/policy/list/dataprefix", "")).Methods("GET")
	r.HandleFunc("/api/policies/sites",
		h(apiClient, "dataservice/template/policy/list/site", "")).Methods("GET")
	r.HandleFunc("/api/policies/approute",
		h(apiClient, "dataservice/template/policy/definition/approute", "")).Methods("GET")
	r.HandleFunc("/api/policies/ipprefix",
		h(apiClient, "dataservice/template/policy/list/ipprefixall", "")).Methods("GET")
	r.HandleFunc("/api/policies/vpn",
		h(apiClient, "dataservice/template/policy/list/vpn", "")).Methods("GET")
	r.HandleFunc("/api/policies/prefix-list",
		h(apiClient, "dataservice/template/policy/list/prefix", "")).Methods("GET")
	r.HandleFunc("/api/policies/app",
		h(apiClient, "dataservice/template/policy/list/app", "")).Methods("GET")
	r.HandleFunc("/api/policy/color",
		h(apiClient, "dataservice/template/policy/list/color", "")).Methods("GET")
	r.HandleFunc("/api/policy/definition/data",
		h(apiClient, "dataservice/template/policy/definition/data", "")).Methods("GET")
	r.HandleFunc("/api/policy/list/dataprefixall",
		h(apiClient, "dataservice/template/policy/list/dataprefixall", "")).Methods("GET")
	r.HandleFunc("/api/policy/list/class",
		h(apiClient, "dataservice/template/policy/list/class", "")).Methods("GET")
	r.HandleFunc("/api/policy/list/policer",
		h(apiClient, "dataservice/template/policy/list", "")).Methods("GET")
	r.HandleFunc("/api/policy/definition/qosmap",
		h(apiClient, "dataservice/template/policy/definition/qosmap", "")).Methods("GET")
	r.HandleFunc("/api/policy/list/tloc",
		h(apiClient, "dataservice/template/policy/list/tloc", "")).Methods("GET")

	// ─── Edge Policies (device-scoped) ──────────────────────────────────
	r.HandleFunc("/api/edgepolicy/accesslistassociations/{system-ip}",
		h(apiClient, "dataservice/device/policy/accesslistassociations?deviceId=", "system-ip")).Methods("GET")
	r.HandleFunc("/api/edgepolicy/accesslistcounters/{system-ip}",
		h(apiClient, "dataservice/device/policy/accesslistcounters?deviceId=", "system-ip")).Methods("GET")
	r.HandleFunc("/api/edgepolicy/accesslistnames/{system-ip}",
		h(apiClient, "dataservice/device/policy/accesslistnames?deviceId=", "system-ip")).Methods("GET")
	r.HandleFunc("/api/edgepolicy/accesslistpolicers/{system-ip}",
		h(apiClient, "dataservice/device/policy/accesslistpolicers?deviceId=", "system-ip")).Methods("GET")
	r.HandleFunc("/api/edgepolicy/approutepolicyfilter/{system-ip}",
		h(apiClient, "dataservice/device/policy/approutepolicyfilter?deviceId=", "system-ip")).Methods("GET")
	r.HandleFunc("/api/edgepolicy/datapolicyfilter/{system-ip}",
		h(apiClient, "dataservice/device/policy/datapolicyfilter?deviceId=", "system-ip")).Methods("GET")
	r.HandleFunc("/api/edgepolicy/devicepolicer/{system-ip}",
		h(apiClient, "dataservice/device/policer?deviceId=", "system-ip")).Methods("GET")
	r.HandleFunc("/api/edgepolicy/qosmapinfo/{system-ip}",
		h(apiClient, "dataservice/device/policy/qosmapinfo?deviceId=", "system-ip")).Methods("GET")
	r.HandleFunc("/api/edgepolicy/qosschedulerinfo/{system-ip}",
		h(apiClient, "dataservice/device/policy/qosschedulerinfo?deviceId=", "system-ip")).Methods("GET")
	r.HandleFunc("/api/edgepolicy/vsmart",
		h(apiClient, "dataservice/template/policy/vsmart", "")).Methods("GET")
}

// registerSSERoutes sets up SSE broker endpoints and starts background broadcasters.
func registerSSERoutes(r *mux.Router, apiClient *utils.APIClient) {
	sse.InitBrokers()

	r.HandleFunc("/events/bfd", sse.BfdBroker.SSEHandler()).Methods("GET")
	r.HandleFunc("/events/interface-usage", sse.UsageBroker.SSEHandler()).Methods("GET")
	r.HandleFunc("/events/interface-stats", sse.StatsBroker.SSEHandler()).Methods("GET")
	r.HandleFunc("/events/app-route", sse.AppRouteBroker.SSEHandler()).Methods("GET")

	go sse.BroadcastBFD(apiClient)
	go sse.BroadcastUsage(apiClient)
	go sse.BroadcastStats(apiClient)
	go sse.BroadcastAppRoute(apiClient)
}

// registerStaticRoutes serves the React SPA build from the given directory.
// The catch-all fallback serves index.html for client-side routing.
func registerStaticRoutes(r *mux.Router, staticDir string) {
	// Serve /static/* assets (JS, CSS, media)
	r.PathPrefix("/static/").Handler(
		http.StripPrefix("/static/", http.FileServer(http.Dir(staticDir+"/static"))))

	// SPA catch-all: serve index.html for any unmatched route
	r.PathPrefix("/").HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, staticDir+"/index.html")
	})
}
