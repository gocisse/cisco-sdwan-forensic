package utils

import "fmt"

// vManage API endpoint constants.
// These are the dataservice endpoints used throughout the application.
const (
	// Device endpoints
	EndpointDevices     = "dataservice/device"
	EndpointDeviceByID  = "dataservice/device?deviceId=%s"
	
	// Template endpoints
	EndpointDeviceTemplates     = "dataservice/template/device"
	EndpointDeviceTemplateByID  = "dataservice/template/device/object/%s"
	
	// Real-time device data endpoints (require deviceId query param)
	EndpointBFDSessions         = "dataservice/device/bfd/sessions"
	EndpointBFDStatistics       = "dataservice/device/tunnel/bfd_statistics"
	EndpointTunnelStatistics    = "dataservice/device/tunnel/statistics"
	EndpointControlConnections  = "dataservice/device/control/connections"
	EndpointControlSynced       = "dataservice/device/control/synced/connections"
	EndpointOmpRoutesReceived   = "dataservice/device/omp/routes/received"
	EndpointOmpRoutesAdvertised = "dataservice/device/omp/routes/advertised"
	EndpointOmpTlocsReceived    = "dataservice/device/omp/tlocs/received"
	EndpointOmpTlocsAdvertised  = "dataservice/device/omp/tlocs/advertised"
	EndpointAppRouteStats       = "dataservice/device/app-route/statistics"
	EndpointIPSecLocalSA        = "dataservice/device/ipsec/localsa"
	EndpointInterface           = "dataservice/device/interface"
	EndpointBGP                 = "dataservice/device/bgp"
	EndpointOSPF                = "dataservice/device/ospf"
	EndpointEnvironment         = "dataservice/device/environment"
	EndpointHardware            = "dataservice/device/hardware"
	EndpointDHCP                = "dataservice/device/dhcp"
	EndpointARP                 = "dataservice/device/arp"
	EndpointSoftware            = "dataservice/device/action/software"
	EndpointPolicer             = "dataservice/device/policer"
	
	// Device policy endpoints
	EndpointAccessListNames    = "dataservice/device/policy/accesslistnames"
	EndpointAccessListAssoc    = "dataservice/device/policy/accesslistassociations"
	EndpointAccessListCounters = "dataservice/device/policy/accesslistcounters"
	EndpointAccessListPolicers = "dataservice/device/policy/accesslistpolicers"
	EndpointQosMapInfo         = "dataservice/device/policy/qosmapinfo"
	EndpointQosSchedulerInfo   = "dataservice/device/policy/qosschedulerinfo"
	EndpointZoneFWDPSessions   = "dataservice/device/policy/zonebfwdp/sessions"
	EndpointAppRoutePolicyFilter = "dataservice/device/policy/approutepolicyfilter"
	EndpointDataPolicyFilter   = "dataservice/device/policy/datapolicyfilter"
	
	// Topology endpoints
	EndpointTopologyDevice = "dataservice/topology/device"
	
	// Centralized policy endpoints
	EndpointVSmartPolicies      = "dataservice/template/policy/vsmart"
	EndpointPolicyDefControl    = "dataservice/template/policy/definition/control"
	EndpointPolicyDefData       = "dataservice/template/policy/definition/data"
	EndpointPolicyDefAppRoute   = "dataservice/template/policy/definition/approute"
	EndpointPolicyDefQosMap     = "dataservice/template/policy/definition/qosmap"
	
	// Policy list endpoints
	EndpointPolicyListSLA        = "dataservice/template/policy/list/sla"
	EndpointPolicyListSite       = "dataservice/template/policy/list/site"
	EndpointPolicyListVPN        = "dataservice/template/policy/list/vpn"
	EndpointPolicyListPrefix     = "dataservice/template/policy/list/prefix"
	EndpointPolicyListDataPrefix = "dataservice/template/policy/list/dataprefix"
	EndpointPolicyListDataPrefixAll = "dataservice/template/policy/list/dataprefixall"
	EndpointPolicyListIPPrefix   = "dataservice/template/policy/list/ipprefixall"
	EndpointPolicyListApp        = "dataservice/template/policy/list/app"
	EndpointPolicyListColor      = "dataservice/template/policy/list/color"
	EndpointPolicyListClass      = "dataservice/template/policy/list/class"
	EndpointPolicyListPolicer    = "dataservice/template/policy/list"
	EndpointPolicyListTLOC       = "dataservice/template/policy/list/tloc"
	
	// Alarms
	EndpointAlarms = "dataservice/alarms"
	
	// Certificates
	EndpointCertificates = "dataservice/certificate/managed"
	
	// Authentication
	EndpointAuth      = "j_security_check"
	EndpointXSRFToken = "dataservice/client/token"
)

// WithDeviceID appends the deviceId query parameter to an endpoint.
func WithDeviceID(endpoint, deviceID string) string {
	return fmt.Sprintf("%s?deviceId=%s", endpoint, deviceID)
}

// PolicyDefinitionEndpoint returns the endpoint for a specific policy definition type.
func PolicyDefinitionEndpoint(policyType, definitionID string) string {
	// Map policy types to URL path segments
	typeMap := map[string]string{
		"appRoute":      "approute",
		"data":          "data",
		"control":       "control",
		"cflowd":        "cflowd",
		"mesh":          "mesh",
		"hubAndSpoke":   "hubandspoke",
		"vpnMemberShip": "vpnmembershipgroup",
	}
	
	apiType := policyType
	if mapped, ok := typeMap[policyType]; ok {
		apiType = mapped
	}
	
	return fmt.Sprintf("dataservice/template/policy/definition/%s/%s", apiType, definitionID)
}

// SiteListEndpoint returns the endpoint for a specific site list.
func SiteListEndpoint(siteListID string) string {
	return fmt.Sprintf("dataservice/template/policy/list/site/%s", siteListID)
}
