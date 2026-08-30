/**
 * Centralized API endpoint definitions
 * Use these instead of hardcoding URLs throughout the app
 */

export const API = {
  // Device endpoints
  devices: () => "/api/devices",
  deviceDetails: (systemIp: string) => `/api/device/${systemIp}/details`,
  deviceTemplates: (systemIp: string) => `/api/device/${systemIp}/templates`,
  deviceConfig: (systemIp: string) => `/api/device-config/${systemIp}`,

  // Policy endpoints
  localPolicy: (systemIp: string) => `/api/device/${systemIp}/policy/local`,
  centralizedPolicy: (systemIp: string) => `/api/device/${systemIp}/policy/centralized`,
  policyDefinition: (type: string, id: string) => `/api/policy/definition/${type}/${id}`,

  // Traffic analysis
  appRoute: (systemIp: string) => `/api/device/${systemIp}/app-route`,
  tunnelHealth: (systemIp: string) => `/api/device/${systemIp}/tunnel-health`,

  // Logs
  deviceLogs: (systemIp: string) => `/api/device/${systemIp}/logs`,
  crashLogs: (systemIp: string) => `/api/device/${systemIp}/crashlog`,

  // Hardware
  hardwareInventory: (systemIp: string) => `/api/device/${systemIp}/hardware-inventory`,

  // Real-time monitoring
  controlPlane: (systemIp: string) => `/api/control-plane/${systemIp}`,
  connections: (systemIp: string) => `/api/connections/${systemIp}`,
  receivedRoutes: (systemIp: string, prefix?: string) =>
    prefix ? `/api/routes/received/${systemIp}?prefix=${encodeURIComponent(prefix)}` : `/api/routes/received/${systemIp}`,
  advertisedRoutes: (systemIp: string, prefix?: string) =>
    prefix ? `/api/routes/advertised/${systemIp}?prefix=${encodeURIComponent(prefix)}` : `/api/routes/advertised/${systemIp}`,
  receivedTlocs: (systemIp: string) => `/api/tlocs/received/${systemIp}`,
  advertisedTlocs: (systemIp: string) => `/api/tlocs/advertised/${systemIp}`,
  appRoutes: (systemIp: string) => `/api/app-routes/${systemIp}`,
  bfd: (systemIp: string) => `/api/bfd/${systemIp}`,
  tunnel: (systemIp: string) => `/api/tunnel/${systemIp}`,
  ipsec: (systemIp: string) => `/api/ipsec/${systemIp}`,
  interfaces: (systemIp: string) => `/api/interfaces/${systemIp}`,
  bgp: (systemIp: string) => `/api/bgp/${systemIp}`,
  ospf: (systemIp: string) => `/api/ospf/${systemIp}`,
  environment: (systemIp: string) => `/api/environment/${systemIp}`,
  hardware: (systemIp: string) => `/api/hardware/${systemIp}`,
  software: (systemIp: string) => `/api/software/${systemIp}`,
  dhcp: (systemIp: string) => `/api/dhcp/${systemIp}`,
  arp: (systemIp: string) => `/api/arp/${systemIp}`,

  // Cellular
  cellular: (systemIp: string) => `/api/cellular/${systemIp}`,
  cellularConnection: (systemIp: string) => `/api/cellular/connection/${systemIp}`,
  cellularSession: (systemIp: string) => `/api/cellular/session/${systemIp}`,
  cellularHardware: (systemIp: string) => `/api/cellular/hardware/${systemIp}`,
  cellularTransport: (systemIp: string) => `/api/cellular/transport/${systemIp}`,

  // Topology
  logicalTopology: (systemIp: string, showAll = false) =>
    showAll ? `/api/topology/logical/${systemIp}?showAll=true` : `/api/topology/logical/${systemIp}`,
  ompTopology: (systemIp: string) => `/api/topology/omp/${systemIp}`,
  topology: (systemIp: string) => `/api/topology/${systemIp}`,
  siteTopology: (systemIp: string) => `/api/topology/site/${systemIp}`,

  // Centralized policies
  policiesControl: () => "/api/policies/control",
  policiesAppRoute: () => "/api/policies/approute",
  policiesSla: () => "/api/policies/sla",
  policiesSites: () => "/api/policies/sites",
  policiesPrefix: () => "/api/policies/prefix",
  policiesIpPrefix: () => "/api/policies/ipprefix",
  policiesVpn: () => "/api/policies/vpn",
  policiesApp: () => "/api/policies/app",
  policyColor: () => "/api/policy/color",
  policyDefinitionData: () => "/api/policy/definition/data",
  policyListDataPrefixAll: () => "/api/policy/list/dataprefixall",
  policyListClass: () => "/api/policy/list/class",
  policyListPolicer: () => "/api/policy/list/policer",
  policyDefinitionQosMap: () => "/api/policy/definition/qosmap",
  policyListTloc: () => "/api/policy/list/tloc",

  // Edge policies
  edgePolicyAccessListAssociations: (systemIp: string) => `/api/edgepolicy/accesslistassociations/${systemIp}`,
  edgePolicyAccessListCounters: (systemIp: string) => `/api/edgepolicy/accesslistcounters/${systemIp}`,
  edgePolicyAccessListNames: (systemIp: string) => `/api/edgepolicy/accesslistnames/${systemIp}`,
  edgePolicyAccessListPolicers: (systemIp: string) => `/api/edgepolicy/accesslistpolicers/${systemIp}`,
  edgePolicyAppRouteFilter: (systemIp: string) => `/api/edgepolicy/approutepolicyfilter/${systemIp}`,
  edgePolicyDataFilter: (systemIp: string) => `/api/edgepolicy/datapolicyfilter/${systemIp}`,
  edgePolicyDevicePolicer: (systemIp: string) => `/api/edgepolicy/devicepolicer/${systemIp}`,
  edgePolicyQosMapInfo: (systemIp: string) => `/api/edgepolicy/qosmapinfo/${systemIp}`,
  edgePolicyQosSchedulerInfo: (systemIp: string) => `/api/edgepolicy/qosschedulerinfo/${systemIp}`,
  edgePolicyVsmart: () => "/api/edgepolicy/vsmart",

  // Alarms
  alarms: () => "/api/alarms",

  // Certificates
  certificates: () => "/api/certificates",

  // SSE endpoints
  sseBfd: (systemIp: string) => `/events/bfd?system-ip=${systemIp}`,
  sseInterfaceUsage: (systemIp: string) => `/events/interface-usage?system-ip=${systemIp}`,
  sseInterfaceStats: (systemIp: string) => `/events/interface-stats?system-ip=${systemIp}`,
  sseAppRoute: (systemIp: string) => `/events/app-route?system-ip=${systemIp}`,
} as const;

export default API;
