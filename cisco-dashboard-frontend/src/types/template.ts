/**
 * Template types for Cisco SD-WAN Forensic Dashboard
 * These types mirror the backend models/template.go structures
 */

/**
 * FeatureTemplate represents a feature template attached to a device template.
 */
export interface FeatureTemplate {
  templateName: string;
  templateType: string;
  templateDescription: string;
  templateId: string;
  subTemplates?: FeatureTemplate[];
}

/**
 * TemplateHierarchy represents the full template structure for a device.
 * Returned by /api/device/{system-ip}/templates
 */
export interface TemplateHierarchy {
  deviceTemplateName: string;
  deviceTemplateId: string;
  deviceTemplateDescription: string;
  featureTemplates: FeatureTemplate[];
}

/**
 * Friendly labels for template types
 */
export const TEMPLATE_TYPE_LABELS: Record<string, string> = {
  cisco_vpn: "VPN",
  cisco_banner: "Banner",
  cedge_aaa: "AAA",
  cisco_system: "System",
  cisco_logging: "Logging",
  cisco_bfd: "BFD",
  cisco_omp: "OMP",
  cisco_security: "Security",
  cisco_ntp: "NTP",
  cisco_snmp: "SNMP",
  cedge_global: "Global Settings",
  cisco_vpn_interface: "VPN Interface",
  cisco_vpn_interface_ipsec: "IPsec Tunnel",
  "vpn-vedge-interface": "vEdge Interface",
};

/**
 * Get a human-readable label for a template type
 */
export function getTemplateTypeLabel(templateType: string): string {
  return TEMPLATE_TYPE_LABELS[templateType] || templateType;
}
