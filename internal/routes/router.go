package routes

import (
	"io/fs"
	"log"
	"net/http"

	"sdwan-app/api/device"
	"sdwan-app/api/topology"
	"sdwan-app/frontend"
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
// The frontend is embedded in the binary at compile time.
func New(apiClient *utils.APIClient) *mux.Router {
	r := mux.NewRouter()

	registerAPIRoutes(r, apiClient)
	registerSSERoutes(r, apiClient)
	registerStaticRoutes(r)

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

	// ─── Policy Drill-Down (full definition with UUID resolution) ──────
	r.HandleFunc("/api/policy/definition/{type}/{id}",
		device.FetchPolicyDefinition(apiClient)).Methods("GET")

	// ─── Traffic Analysis / SLA ────────────────────────────────────────
	r.HandleFunc("/api/device/{system-ip}/app-route",
		device.FetchAppRoute(apiClient)).Methods("GET")
	r.HandleFunc("/api/device/{system-ip}/tunnel-health",
		device.FetchTunnelHealth(apiClient)).Methods("GET")

	// ─── Device Logs (syslog) ──────────────────────────────────────────
	r.HandleFunc("/api/device/{system-ip}/logs",
		device.FetchDeviceLogs(apiClient)).Methods("GET")

	// ─── Crash Logs (core files) ───────────────────────────────────────
	r.HandleFunc("/api/device/{system-ip}/crashlog",
		device.FetchCrashLogs(apiClient)).Methods("GET")

	// ─── Hardware Inventory ────────────────────────────────────────────
	r.HandleFunc("/api/device/{system-ip}/hardware-inventory",
		device.FetchHardwareInventory(apiClient)).Methods("GET")

	// ─── High Priority: Interfaces / BGP / OSPF ────────────────────────
	r.HandleFunc("/api/interfaces/{system-ip}",
		device.FetchWithUUID(apiClient, "dataservice/device/interface")).Methods("GET")
	r.HandleFunc("/api/bgp/{system-ip}",
		device.FetchWithUUID(apiClient, "dataservice/device/bgp")).Methods("GET")
	r.HandleFunc("/api/ospf/{system-ip}",
		device.FetchWithUUID(apiClient, "dataservice/device/ospf")).Methods("GET")

	// ─── Medium Priority: Environment / Hardware / Certs / Config / Software ─
	r.HandleFunc("/api/environment/{system-ip}",
		device.FetchWithUUID(apiClient, "dataservice/device/environment")).Methods("GET")
	r.HandleFunc("/api/hardware/{system-ip}",
		device.FetchWithUUID(apiClient, "dataservice/device/hardware")).Methods("GET")
	r.HandleFunc("/api/certificates",
		h(apiClient, "dataservice/certificate/managed", "")).Methods("GET")
	r.HandleFunc("/api/device-config/{system-ip}",
		device.FetchDeviceConfig(apiClient)).Methods("GET")
	r.HandleFunc("/api/software/{system-ip}",
		device.FetchWithUUID(apiClient, "dataservice/device/action/software")).Methods("GET")

	// ─── Low Priority: DHCP / ARP ──────────────────────────────────────
	r.HandleFunc("/api/dhcp/{system-ip}",
		device.FetchWithUUID(apiClient, "dataservice/device/dhcp")).Methods("GET")
	r.HandleFunc("/api/arp/{system-ip}",
		device.FetchWithUUID(apiClient, "dataservice/device/arp")).Methods("GET")

	// ─── Real-time (device-scoped, resolves system-ip → UUID) ──────────
	// vManage statistics/OMP endpoints require the device UUID, not system-ip.
	// FetchWithUUID resolves system-ip → UUID via /dataservice/device before calling vManage.
	r.HandleFunc("/api/control-plane/{system-ip}",
		device.FetchWithUUID(apiClient, "dataservice/device/control/synced/connections")).Methods("GET")
	r.HandleFunc("/api/connections/{system-ip}",
		device.FetchWithUUID(apiClient, "dataservice/device/control/connections")).Methods("GET")
	r.HandleFunc("/api/routes/received/{system-ip}",
		device.FetchOmpRoutes(apiClient, "dataservice/device/omp/routes/received")).Methods("GET")
	r.HandleFunc("/api/routes/advertised/{system-ip}",
		device.FetchOmpRoutes(apiClient, "dataservice/device/omp/routes/advertised")).Methods("GET")
	r.HandleFunc("/api/tlocs/received/{system-ip}",
		device.FetchWithUUID(apiClient, "dataservice/device/omp/tlocs/received")).Methods("GET")
	r.HandleFunc("/api/tlocs/advertised/{system-ip}",
		device.FetchWithUUID(apiClient, "dataservice/device/omp/tlocs/advertised")).Methods("GET")
	r.HandleFunc("/api/app-routes/{system-ip}",
		device.FetchWithUUID(apiClient, "dataservice/device/app-route/statistics")).Methods("GET")
	r.HandleFunc("/api/bfd/{system-ip}",
		device.FetchWithUUID(apiClient, "dataservice/device/tunnel/bfd_statistics")).Methods("GET")
	r.HandleFunc("/api/tunnel/{system-ip}",
		device.FetchWithUUID(apiClient, "dataservice/device/tunnel/statistics")).Methods("GET")
	r.HandleFunc("/api/ipsec/{system-ip}",
		device.FetchWithUUID(apiClient, "dataservice/device/ipsec/localsa")).Methods("GET")

	// ─── Cellular / LTE ─────────────────────────────────────────────────
	// Aggregated status (checks multiple sources: radio, connection, interfaces)
	r.HandleFunc("/api/cellular/{system-ip}",
		device.FetchCellularStatus(apiClient)).Methods("GET")
	// Individual endpoints for granular access
	r.HandleFunc("/api/cellular/connection/{system-ip}",
		device.FetchCellularConnection(apiClient)).Methods("GET")
	r.HandleFunc("/api/cellular/session/{system-ip}",
		device.FetchCellularSession(apiClient)).Methods("GET")
	r.HandleFunc("/api/cellular/hardware/{system-ip}",
		device.FetchCellularHardware(apiClient)).Methods("GET")
	r.HandleFunc("/api/cellular/radio/{system-ip}",
		device.FetchCellularRadio(apiClient)).Methods("GET")
	r.HandleFunc("/api/cellular/transport/{system-ip}",
		device.FetchCellularTransport(apiClient)).Methods("GET")

	// ─── Topology ───────────────────────────────────────────────────────
	// Logical topology: aggregates BFD sessions into device-to-device relationships
	r.HandleFunc("/api/topology/logical/{system-ip}",
		topology.FetchLogicalTopology(apiClient)).Methods("GET")
	// OMP routing topology: aggregates OMP routes by originator peer
	r.HandleFunc("/api/topology/omp/{system-ip}",
		topology.FetchOmpTopology(apiClient)).Methods("GET")
	// Raw BFD sessions (kept for backward compatibility)
	r.HandleFunc("/api/topology/{system-ip}",
		device.FetchWithUUID(apiClient, "dataservice/device/bfd/sessions")).Methods("GET")
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

	// ─── Edge Policies (device-scoped, resolves system-ip → UUID) ──────
	r.HandleFunc("/api/edgepolicy/accesslistassociations/{system-ip}",
		device.FetchWithUUID(apiClient, "dataservice/device/policy/accesslistassociations")).Methods("GET")
	r.HandleFunc("/api/edgepolicy/accesslistcounters/{system-ip}",
		device.FetchWithUUID(apiClient, "dataservice/device/policy/accesslistcounters")).Methods("GET")
	r.HandleFunc("/api/edgepolicy/accesslistnames/{system-ip}",
		device.FetchWithUUID(apiClient, "dataservice/device/policy/accesslistnames")).Methods("GET")
	r.HandleFunc("/api/edgepolicy/accesslistpolicers/{system-ip}",
		device.FetchWithUUID(apiClient, "dataservice/device/policy/accesslistpolicers")).Methods("GET")
	r.HandleFunc("/api/edgepolicy/approutepolicyfilter/{system-ip}",
		device.FetchWithUUID(apiClient, "dataservice/device/policy/approutepolicyfilter")).Methods("GET")
	r.HandleFunc("/api/edgepolicy/datapolicyfilter/{system-ip}",
		device.FetchWithUUID(apiClient, "dataservice/device/policy/datapolicyfilter")).Methods("GET")
	r.HandleFunc("/api/edgepolicy/devicepolicer/{system-ip}",
		device.FetchWithUUID(apiClient, "dataservice/device/policer")).Methods("GET")
	r.HandleFunc("/api/edgepolicy/qosmapinfo/{system-ip}",
		device.FetchWithUUID(apiClient, "dataservice/device/policy/qosmapinfo")).Methods("GET")
	r.HandleFunc("/api/edgepolicy/qosschedulerinfo/{system-ip}",
		device.FetchWithUUID(apiClient, "dataservice/device/policy/qosschedulerinfo")).Methods("GET")
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

// registerStaticRoutes serves the React SPA from the embedded filesystem.
// The catch-all fallback serves index.html for client-side routing.
func registerStaticRoutes(r *mux.Router) {
	// Get embedded frontend build
	buildFS, err := frontend.GetBuildFS()
	if err != nil {
		log.Fatalf("Failed to load embedded frontend: %v", err)
	}

	// Get the static subdirectory
	staticFS, err := fs.Sub(buildFS, "static")
	if err != nil {
		log.Fatalf("Failed to load static assets: %v", err)
	}

	// Serve /static/* assets (JS, CSS, media)
	r.PathPrefix("/static/").Handler(
		http.StripPrefix("/static/", http.FileServer(http.FS(staticFS))))

	// SPA catch-all: serve index.html for any unmatched route
	r.PathPrefix("/").HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
		indexHTML, err := fs.ReadFile(buildFS, "index.html")
		if err != nil {
			http.Error(w, "Frontend not found", http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		w.Write(indexHTML)
	})
}
