/**
 * Policy types for Cisco SD-WAN Forensic Dashboard
 * These types mirror the backend models/policy.go structures
 */

/**
 * LocalPolicyEntry represents a single policy item running on a device.
 */
export interface LocalPolicyEntry {
  name: string;
  type: string;
  direction?: string;
  interface?: string;
  sequence?: string;
  cir?: string;
  burst?: string;
  exceedAction?: string;
  defaultAction?: string;
  action?: string;
}

/**
 * LocalPolicyResponse is the response from /api/device/{system-ip}/policy/local
 */
export interface LocalPolicyResponse {
  systemIp: string;
  hostName: string;
  siteId: string;
  accessLists: LocalPolicyEntry[];
  qosMaps: LocalPolicyEntry[];
  policers: LocalPolicyEntry[];
  zoneFirewall: LocalPolicyEntry[];
  totalCount: number;
}

/**
 * PolicySequenceInfo holds simplified sequence match/action info.
 */
export interface PolicySequenceInfo {
  sequenceName: string;
  sequenceType: string;
  baseAction: string;
  match?: Record<string, string>;
  actions?: Record<string, string>;
}

/**
 * CentralPolicyMatch represents a centralized policy that affects a device.
 */
export interface CentralPolicyMatch {
  policyName: string;
  policyId: string;
  policyType: string;
  isActive: boolean;
  sequences?: PolicySequenceInfo[];
}

/**
 * CentralPolicyResponse is the response from /api/device/{system-ip}/policy/centralized
 */
export interface CentralPolicyResponse {
  systemIp: string;
  hostName: string;
  siteId: string;
  dataPolicies: CentralPolicyMatch[];
  controlPolicies: CentralPolicyMatch[];
  appRoutePolicies: CentralPolicyMatch[];
  totalCount: number;
}

/**
 * Friendly labels for match/action field names
 */
export const FIELD_LABELS: Record<string, string> = {
  sourceDataPrefixList: "Source Prefix",
  destinationDataPrefixList: "Dest Prefix",
  sourceIp: "Source IP",
  destinationIp: "Dest IP",
  sourcePort: "Source Port",
  destinationPort: "Dest Port",
  protocol: "Protocol",
  dscp: "DSCP",
  app: "Application",
  appList: "App List",
  dnsAppList: "DNS App",
  dns: "DNS",
  packetLength: "Pkt Length",
  plp: "PLP",
  trafficTo: "Traffic To",
  localTlocColor: "Local TLOC Color",
  preferredColorGroup: "Preferred Color",
  set: "Set",
  nat: "NAT",
  redirect: "Redirect",
  log: "Log",
  count: "Counter",
  cflowd: "Cflowd",
  tcpOptimization: "TCP Opt",
  lossCorrection: "FEC",
  sig: "SIG Redirect",
};

/**
 * Format a field name to a human-readable label
 */
export function formatFieldLabel(field: string): string {
  if (FIELD_LABELS[field]) {
    return FIELD_LABELS[field];
  }
  // Convert camelCase to Title Case
  return field
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (s) => s.toUpperCase());
}

/**
 * Determine if an action is a drop/deny action
 */
export function isDropAction(action: string): boolean {
  const lower = (action || "").toLowerCase();
  return lower === "drop" || lower === "reject" || lower === "deny";
}

/**
 * Determine if an action is an accept/permit action
 */
export function isAcceptAction(action: string): boolean {
  const lower = (action || "").toLowerCase();
  return lower === "accept" || lower === "forward" || lower === "permit" || lower === "pass";
}
