import React, { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  Paper,
  Typography,
  Alert,
} from "@mui/material";
import {
  Shield as ShieldIcon,
  BarChart as BarChartIcon,
  Traffic as TrafficIcon,
  LocalFireDepartment as FireIcon,
  Description as DescIcon,
  AltRoute as RouteIcon,
  DeviceHub as HubIcon,
  ArrowForward as ArrowIcon,
  ExpandMore as ExpandMoreIcon,
  AccountTree as TreeIcon,
  Layers as LayersIcon,
  Info as InfoIcon,
} from "@mui/icons-material";
import useApiFetch from "../hooks/useApiFetch";
import LoadingSpinner from "../components/LoadingSpinner";
import { useDeviceContext } from "../context/DeviceContext";
import PolicyDrillDown from "../components/PolicyDrillDown";

// ── Friendly labels for template types ──
const templateTypeLabel = {
  "cisco_vpn": "VPN",
  "cisco_banner": "Banner",
  "cedge_aaa": "AAA",
  "cisco_system": "System",
  "cisco_logging": "Logging",
  "cisco_bfd": "BFD",
  "cisco_omp": "OMP",
  "cisco_security": "Security",
  "cisco_ntp": "NTP",
  "cisco_snmp": "SNMP",
  "cedge_global": "Global Settings",
  "cisco_vpn_interface": "VPN Interface",
  "cisco_vpn_interface_ipsec": "IPsec Tunnel",
  "vpn-vedge-interface": "vEdge Interface",
};

// ── Friendly labels for match/action field names ──
const fieldLabel = {
  "sourceDataPrefixList": "Source Prefix",
  "destinationDataPrefixList": "Dest Prefix",
  "sourceIp": "Source IP",
  "destinationIp": "Dest IP",
  "sourcePort": "Source Port",
  "destinationPort": "Dest Port",
  "protocol": "Protocol",
  "dscp": "DSCP",
  "app": "Application",
  "appList": "App List",
  "dnsAppList": "DNS App",
  "dns": "DNS",
  "packetLength": "Pkt Length",
  "plp": "PLP",
  "trafficTo": "Traffic To",
  "localTlocColor": "Local TLOC Color",
  "preferredColorGroup": "Preferred Color",
  "set": "Set",
  "nat": "NAT",
  "redirect": "Redirect",
  "log": "Log",
  "count": "Counter",
  "cflowd": "Cflowd",
  "tcpOptimization": "TCP Opt",
  "lossCorrection": "FEC",
  "sig": "SIG Redirect",
};

function fmtField(f) { return fieldLabel[f] || f.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase()); }

export default function PolicyForensics() {
  const { systemIp: urlSystemIp } = useParams();
  const { selectedDevice } = useDeviceContext();
  const activeIp = urlSystemIp || (selectedDevice ? selectedDevice["system-ip"] : null);
  const [drillDown, setDrillDown] = useState({ open: false, type: "", id: "", name: "" });

  const handlePolicyClick = (policyType, policyId, policyName) => {
    setDrillDown({ open: true, type: policyType, id: policyId, name: policyName });
  };
  const handleDrillDownClose = () => {
    setDrillDown({ open: false, type: "", id: "", name: "" });
  };

  const { data: localData, isLoading: localLoading, error: localError } = useApiFetch(activeIp ? `/api/device/${activeIp}/policy/local` : null);
  const { data: centralData, isLoading: centralLoading, error: centralError } = useApiFetch(activeIp ? `/api/device/${activeIp}/policy/centralized` : null);
  const { data: templateData, isLoading: templateLoading } = useApiFetch(activeIp ? `/api/device/${activeIp}/templates` : null);
  const isLoading = localLoading || centralLoading || templateLoading;
  const localTotal = localData ? localData.totalCount : 0;
  const centralTotal = centralData ? centralData.totalCount : 0;

  const trafficSummary = useMemo(() => {
    if (!localData && !centralData) return [];
    const lines = [];
    const host = localData?.hostName || activeIp;
    const site = localData?.siteId || centralData?.siteId || "N/A";

    if (centralData?.dataPolicies?.length > 0) {
      centralData.dataPolicies.forEach((p) => {
        (p.sequences || []).forEach((seq) => {
          const action = seq.baseAction || "accept";
          const matchKeys = Object.keys(seq.match || {});
          const actionKeys = Object.keys(seq.actions || {});
          const matchStr = matchKeys.length > 0
            ? matchKeys.map((k) => `${fmtField(k)}: ${seq.match[k]}`).join(", ")
            : "all traffic";
          const actionStr = actionKeys.length > 0
            ? actionKeys.filter((k) => k !== "type").map((k) => `${fmtField(k)}=${seq.actions[k]}`).join(", ")
            : action;
          lines.push(`Data Policy "${p.policyName}" on Site ${site}: traffic matching [${matchStr}] → ${action}${actionStr !== action ? ` (${actionStr})` : ""}.`);
        });
      });
    }
    if (centralData?.appRoutePolicies?.length > 0) {
      centralData.appRoutePolicies.forEach((p) => {
        lines.push(`App-Route Policy "${p.policyName}" steers application traffic for Site ${site} based on SLA classes.`);
      });
    }
    if (centralData?.controlPolicies?.length > 0) {
      centralData.controlPolicies.forEach((p) => {
        lines.push(`Control Policy "${p.policyName}" modifies OMP route advertisements for Site ${site}.`);
      });
    }
    if ((localData?.accessLists || []).length > 0) {
      const aclNames = localData.accessLists.map((a) => a.name).join(", ");
      lines.push(`Local ACLs on ${host}: ${aclNames} — filtering traffic at the interface level.`);
    }
    if ((localData?.zoneFirewall || []).length > 0) {
      lines.push(`Zone-Based Firewall active on ${host} — inter-zone traffic is inspected.`);
    }
    if ((localData?.qosMaps || []).length > 0) {
      lines.push(`QoS Maps active on ${host} — traffic is classified and queued.`);
    }
    if (lines.length === 0) {
      lines.push(`No active policies affecting ${host} (Site ${site}). Traffic flows based on default routing.`);
    }
    return lines;
  }, [localData, centralData, activeIp]);

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
        <Typography variant="h5">Policy Impact Analysis</Typography>
        {activeIp && (
          <Box sx={{ display: "flex", gap: 0.5 }}>
            <Chip label={`${centralTotal} Centralized`} size="small" color="primary" variant="outlined" />
            <Chip label={`${localTotal} Local`} size="small" color="success" variant="outlined" />
          </Box>
        )}
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        How do centralized and local policies work together on this device? What is the traffic impact?
      </Typography>

      {!activeIp && <Alert severity="info">Select a device from the global search bar to trace its policy hierarchy.</Alert>}
      {isLoading && <LoadingSpinner message="Tracing policy hierarchy..." />}
      {(localError || centralError) && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {localError && <div>{localError}</div>}
          {centralError && <div>{centralError}</div>}
        </Alert>
      )}

      {activeIp && !isLoading && (
        <>
          {/* ── Policy Trace: Two-column layout ── */}
          <Grid container spacing={2} sx={{ mb: 2 }}>

            {/* ── Column A: Local Policy (Device Template) ── */}
            <Grid item xs={12} md={6}>
              <Card sx={{ borderTop: 3, borderColor: "success.main", height: "100%" }}>
                <CardContent sx={{ pb: "16px !important" }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                    <TreeIcon color="success" fontSize="small" />
                    <Typography variant="h6">Local Policy</Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2 }}>
                    Device Template &amp; Feature Templates for {localData?.hostName || activeIp} (Site {localData?.siteId || "N/A"})
                  </Typography>

                  {/* Device Template Hierarchy */}
                  {templateData && (
                    <Paper variant="outlined" sx={{ p: 1.5, mb: 2, borderLeft: 3, borderLeftColor: "success.main" }}>
                      <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                        <LayersIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: "text-bottom" }} />
                        {templateData.deviceTemplateName || "Unknown Template"}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
                        {templateData.deviceTemplateDescription || "Device template"}
                      </Typography>
                      {(templateData.featureTemplates || []).length > 0 && (
                        <Box sx={{ pl: 1, borderLeft: 2, borderColor: "divider" }}>
                          {templateData.featureTemplates.map((ft, i) => (
                            <Box key={i} sx={{ py: 0.25 }}>
                              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                <Typography variant="caption" fontWeight={600}>{ft.templateName}</Typography>
                                <Chip
                                  label={templateTypeLabel[ft.templateType] || ft.templateType}
                                  size="small"
                                  variant="outlined"
                                  sx={{ fontSize: "0.6rem", height: 16, color: "text.secondary" }}
                                />
                              </Box>
                              {ft.subTemplates && ft.subTemplates.length > 0 && (
                                <Box sx={{ pl: 2, borderLeft: 1, borderColor: "divider", ml: 1, mt: 0.25 }}>
                                  {ft.subTemplates.map((st, j) => (
                                    <Typography key={j} variant="caption" color="text.secondary" sx={{ display: "block" }}>
                                      ↳ {st.templateName} ({templateTypeLabel[st.templateType] || st.templateType})
                                    </Typography>
                                  ))}
                                </Box>
                              )}
                            </Box>
                          ))}
                        </Box>
                      )}
                    </Paper>
                  )}

                  {/* Local Policy Items */}
                  {localData && (
                    <Box>
                      <PolicySection title="Access Control Lists (ACLs)" icon={<ShieldIcon fontSize="small" />} items={localData.accessLists}
                        renderItem={(item, i) => (
                          <Box key={i} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", py: 0.75, borderBottom: "1px solid", borderColor: "divider" }}>
                            <Box>
                              <Typography variant="body2" fontWeight={600}>{item.name}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {item.interface && `Interface: ${item.interface}`}
                                {item.direction && ` · ${item.direction}`}
                              </Typography>
                            </Box>
                            <ActionChip action={item.defaultAction || item.action} />
                          </Box>
                        )}
                      />
                      <PolicySection title="Zone-Based Firewall" icon={<FireIcon fontSize="small" />} items={localData.zoneFirewall}
                        renderItem={(item, i) => (
                          <Box key={i} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", py: 0.75, borderBottom: "1px solid", borderColor: "divider" }}>
                            <Box>
                              <Typography variant="body2" fontWeight={600}>{item.name}</Typography>
                            </Box>
                            <ActionChip action={item.defaultAction || item.action} />
                          </Box>
                        )}
                      />
                      <PolicySection title="QoS Maps" icon={<BarChartIcon fontSize="small" />} items={localData.qosMaps}
                        renderItem={(item, i) => (
                          <Box key={i} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", py: 0.75, borderBottom: "1px solid", borderColor: "divider" }}>
                            <Typography variant="body2" fontWeight={500}>{item.name}</Typography>
                            <Box sx={{ display: "flex", gap: 0.5 }}>
                              {item.direction && <Chip label={item.direction} size="small" color="info" variant="outlined" sx={{ fontSize: "0.7rem", height: 20 }} />}
                              {item.interface && <Chip label={item.interface} size="small" color="secondary" variant="outlined" sx={{ fontSize: "0.7rem", height: 20 }} />}
                            </Box>
                          </Box>
                        )}
                      />
                      <PolicySection title="Policers" icon={<TrafficIcon fontSize="small" />} items={localData.policers}
                        renderItem={(item, i) => (
                          <Box key={i} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", py: 0.75, borderBottom: "1px solid", borderColor: "divider" }}>
                            <Typography variant="body2" fontWeight={500}>{item.name}</Typography>
                            <Box sx={{ display: "flex", gap: 0.5 }}>
                              {item.cir && <Chip label={`CIR: ${item.cir}`} size="small" color="info" variant="outlined" sx={{ fontSize: "0.7rem", height: 20 }} />}
                              {item.burst && <Chip label={`Burst: ${item.burst}`} size="small" color="secondary" variant="outlined" sx={{ fontSize: "0.7rem", height: 20 }} />}
                              {item.exceedAction && <ActionChip action={item.exceedAction} />}
                            </Box>
                          </Box>
                        )}
                      />
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* ── Column B: Centralized Policy (vSmart) ── */}
            <Grid item xs={12} md={6}>
              <Card sx={{ borderTop: 3, borderColor: "primary.main", height: "100%" }}>
                <CardContent sx={{ pb: "16px !important" }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                    <HubIcon color="primary" fontSize="small" />
                    <Typography variant="h6">Centralized Policy</Typography>
                    <Chip label="Active Only" size="small" color="success" variant="filled" sx={{ fontSize: "0.65rem", height: 20, fontWeight: 700, ml: "auto" }} />
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2 }}>
                    vSmart policies affecting Site {centralData?.siteId || "N/A"} — sequence flow shows Match → Action
                  </Typography>

                  {centralData && (
                    <Box>
                      <CentralSection title="Data Policies" subtitle="Controls data-plane forwarding in VPN segments" icon={<DescIcon fontSize="small" />} policies={centralData.dataPolicies} onPolicyClick={handlePolicyClick} />
                      <CentralSection title="Control Policies" subtitle="Affects OMP route advertisements and routing" icon={<HubIcon fontSize="small" />} policies={centralData.controlPolicies} onPolicyClick={handlePolicyClick} />
                      <CentralSection title="App-Route Policies" subtitle="Application-aware routing with SLA classes" icon={<RouteIcon fontSize="small" />} policies={centralData.appRoutePolicies} onPolicyClick={handlePolicyClick} />
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* ── Traffic Flow Impact Summary ── */}
          <Paper variant="outlined" sx={{ p: 2, bgcolor: "rgba(25,118,210,0.04)", borderColor: "primary.main" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
              <InfoIcon color="primary" fontSize="small" />
              <Typography variant="subtitle1" fontWeight={700}>Traffic Flow Impact</Typography>
            </Box>
            <Divider sx={{ mb: 1.5 }} />
            {trafficSummary.map((line, i) => (
              <Typography key={i} variant="body2" sx={{ mb: 0.75, pl: 1, borderLeft: 2, borderColor: "primary.light", lineHeight: 1.6 }}>
                {line}
              </Typography>
            ))}
          </Paper>

          {/* Policy Drill-Down Modal */}
          <PolicyDrillDown
            open={drillDown.open}
            onClose={handleDrillDownClose}
            policyType={drillDown.type}
            policyId={drillDown.id}
            policyName={drillDown.name}
          />
        </>
      )}
    </Box>
  );
}

/* ── Reusable Components ── */

function ActionChip({ action }) {
  if (!action) return null;
  const lower = (action || "").toLowerCase();
  const isDrop = lower === "drop" || lower === "reject" || lower === "deny";
  const isAccept = lower === "accept" || lower === "forward" || lower === "permit" || lower === "pass";
  const color = isDrop ? "error" : isAccept ? "success" : "warning";
  return (
    <Chip
      label={action}
      size="small"
      color={color}
      variant="filled"
      sx={{ fontSize: "0.7rem", height: 22, fontWeight: 700, color: "#fff" }}
    />
  );
}

function PolicySection({ title, icon, items, renderItem }) {
  const count = items ? items.length : 0;
  return (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", bgcolor: "background.default", px: 1.5, py: 0.75, borderRadius: 1, mb: 0.5 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
          {icon}
          <Typography variant="subtitle2">{title}</Typography>
        </Box>
        <Chip label={count} size="small" sx={{ fontWeight: 600, height: 22 }} />
      </Box>
      {count > 0 ? (
        <Box sx={{ px: 1 }}>{items.map(renderItem)}</Box>
      ) : (
        <Typography variant="caption" color="text.secondary" sx={{ pl: 1.5, fontStyle: "italic" }}>
          None configured.
        </Typography>
      )}
    </Box>
  );
}

function CentralSection({ title, subtitle, icon, policies, onPolicyClick }) {
  const count = policies ? policies.length : 0;
  return (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", bgcolor: "background.default", px: 1.5, py: 0.75, borderRadius: 1, mb: 0.5 }}>
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
            {icon}
            <Typography variant="subtitle2">{title}</Typography>
          </Box>
          {subtitle && <Typography variant="caption" color="text.secondary">{subtitle}</Typography>}
        </Box>
        <Chip label={count} size="small" sx={{ fontWeight: 600, height: 22 }} />
      </Box>
      {count > 0 ? (
        policies.map((pol, i) => (
          <Accordion
            key={pol.policyId || i}
            defaultExpanded={i === 0}
            disableGutters
            elevation={0}
            sx={{ border: 1, borderColor: "divider", borderRadius: "4px !important", mb: 0.75, "&:before": { display: "none" } }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ minHeight: 40, "& .MuiAccordionSummary-content": { my: 0.5 } }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, width: "100%" }}>
                <Typography variant="body2" fontWeight={700} sx={{ flexGrow: 1, cursor: "pointer", "&:hover": { color: "primary.main", textDecoration: "underline" } }}
                onClick={(e) => { e.stopPropagation(); onPolicyClick && onPolicyClick(pol.policyType, pol.policyId, pol.policyName); }}>
                {pol.policyName}
              </Typography>
                <Chip label={pol.policyType} size="small" variant="outlined" sx={{ fontSize: "0.65rem", height: 18 }} />
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ pt: 0, pb: 1 }}>
              {pol.sequences && pol.sequences.length > 0 ? (
                pol.sequences.map((seq, j) => (
                  <SequenceFlowCard key={j} seq={seq} index={j} />
                ))
              ) : (
                <Typography variant="caption" color="text.secondary" fontStyle="italic">No sequences defined (default action applies).</Typography>
              )}
            </AccordionDetails>
          </Accordion>
        ))
      ) : (
        <Typography variant="caption" color="text.secondary" sx={{ pl: 1.5, fontStyle: "italic" }}>
          No active {title.toLowerCase()} for this site.
        </Typography>
      )}
    </Box>
  );
}

function SequenceFlowCard({ seq, index }) {
  const action = seq.baseAction || "N/A";
  const lower = action.toLowerCase();
  const isDrop = lower === "drop" || lower === "reject" || lower === "deny";
  const isAccept = lower === "accept" || lower === "forward" || lower === "permit";
  const actionColor = isDrop ? "#E53935" : isAccept ? "#43A047" : "#FF9800";
  const actionBg = isDrop ? "rgba(229,57,53,0.06)" : isAccept ? "rgba(67,160,71,0.06)" : "rgba(255,152,0,0.06)";

  const matchEntries = Object.entries(seq.match || {});
  const actionEntries = Object.entries(seq.actions || {}).filter(([k]) => k !== "type");
  const actionType = seq.actions?.type;

  return (
    <Paper variant="outlined" sx={{ p: 1.25, mb: 0.75, bgcolor: actionBg, borderLeft: 3, borderLeftColor: actionColor }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 0.5 }}>
        <Chip label={`#${index + 1}`} size="small" sx={{ fontSize: "0.65rem", height: 18, fontWeight: 700 }} />
        <Typography variant="body2" fontWeight={600}>
          {seq.sequenceName || `Sequence ${index + 1}`}
        </Typography>
        {seq.sequenceType && (
          <Chip label={seq.sequenceType} size="small" variant="outlined" sx={{ fontSize: "0.6rem", height: 16, ml: "auto" }} />
        )}
      </Box>

      {/* Match → Action Flow */}
      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1, flexWrap: "wrap" }}>
        {/* Match box */}
        <Paper variant="outlined" sx={{ px: 1, py: 0.5, bgcolor: "background.paper", minWidth: 120, flex: 1 }}>
          <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ display: "block", mb: 0.25 }}>Match</Typography>
          {matchEntries.length > 0 ? matchEntries.map(([k, v]) => (
            <Typography key={k} variant="caption" sx={{ display: "block" }}>
              <strong>{fmtField(k)}:</strong> {v}
            </Typography>
          )) : (
            <Typography variant="caption" color="text.secondary" fontStyle="italic">All traffic</Typography>
          )}
        </Paper>

        <ArrowIcon sx={{ fontSize: 20, color: actionColor, mt: 1.5, flexShrink: 0 }} />

        {/* Action box */}
        <Paper variant="outlined" sx={{ px: 1, py: 0.5, bgcolor: "background.paper", minWidth: 120, flex: 1 }}>
          <Typography variant="caption" fontWeight={600} sx={{ display: "block", mb: 0.25, color: actionColor }}>
            Action: {actionType || action}
          </Typography>
          {actionEntries.length > 0 ? actionEntries.map(([k, v]) => (
            <Typography key={k} variant="caption" sx={{ display: "block" }}>
              <strong>{fmtField(k)}:</strong> {v}
            </Typography>
          )) : (
            <Typography variant="caption" color="text.secondary">{action}</Typography>
          )}
        </Paper>
      </Box>
    </Paper>
  );
}
