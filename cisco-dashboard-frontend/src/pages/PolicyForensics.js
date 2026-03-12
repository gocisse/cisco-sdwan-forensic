import React from "react";
import { useParams } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  Chip,
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
} from "@mui/icons-material";
import useApiFetch from "../hooks/useApiFetch";
import LoadingSpinner from "../components/LoadingSpinner";
import { useDeviceContext } from "../context/DeviceContext";

export default function PolicyForensics() {
  const { systemIp: urlSystemIp } = useParams();
  const { selectedDevice } = useDeviceContext();
  const activeIp = urlSystemIp || (selectedDevice ? selectedDevice["system-ip"] : null);

  const { data: localData, isLoading: localLoading, error: localError } = useApiFetch(activeIp ? `/api/device/${activeIp}/policy/local` : null);
  const { data: centralData, isLoading: centralLoading, error: centralError } = useApiFetch(activeIp ? `/api/device/${activeIp}/policy/centralized` : null);
  const isLoading = localLoading || centralLoading;
  const localTotal = localData ? localData.totalCount : 0;
  const centralTotal = centralData ? centralData.totalCount : 0;

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
        <Typography variant="h5">Policy Forensics</Typography>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        What policies apply to this device and what do they do?
      </Typography>

      {!activeIp && <Alert severity="info">Select a device from the global search bar to analyze its policies.</Alert>}
      {isLoading && <LoadingSpinner message="Analyzing policies..." />}
      {(localError || centralError) && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {localError && <div>{localError}</div>}
          {centralError && <div>{centralError}</div>}
        </Alert>
      )}

      {activeIp && !isLoading && (
        <>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            {/* ── Local Policy (Device Template) ── */}
            <Grid item xs={12} md={6}>
              <Card sx={{ borderTop: 3, borderColor: "success.main", height: "100%" }}>
                <CardContent>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                    <Typography variant="h6">Local Policy (Device Template)</Typography>
                    <Chip label={`${localTotal} rules`} size="small" color="success" variant="outlined" />
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2 }}>
                    {localData?.hostName || activeIp} — Site {localData?.siteId || "N/A"}
                  </Typography>

                  {localData && (
                    <Box>
                      {/* Access Lists with action colors */}
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

                      {/* Zone-Based Firewall with action colors */}
                      <PolicySection title="Zone-Based Firewall" icon={<FireIcon fontSize="small" />} items={localData.zoneFirewall}
                        renderItem={(item, i) => (
                          <Box key={i} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", py: 0.75, borderBottom: "1px solid", borderColor: "divider" }}>
                            <Box>
                              <Typography variant="body2" fontWeight={600}>{item.name}</Typography>
                              {item.srcZone && (
                                <Typography variant="caption" color="text.secondary">
                                  {item.srcZone} → {item.dstZone}
                                </Typography>
                              )}
                            </Box>
                            <ActionChip action={item.defaultAction || item.action} />
                          </Box>
                        )}
                      />

                      {/* QoS Maps */}
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

                      {/* Policers */}
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

            {/* ── Centralized Policy (vSmart) ── */}
            <Grid item xs={12} md={6}>
              <Card sx={{ borderTop: 3, borderColor: "primary.main", height: "100%" }}>
                <CardContent>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                    <Typography variant="h6">Centralized Policy (vSmart)</Typography>
                    <Chip label={`${centralTotal} policies`} size="small" color="primary" variant="outlined" />
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2 }}>
                    Policies filtered for Site {centralData?.siteId || "N/A"}
                  </Typography>

                  {centralData && (
                    <Box>
                      <CentralSection title="Data Policies" icon={<DescIcon fontSize="small" />} policies={centralData.dataPolicies} />
                      <CentralSection title="Control Policies" icon={<HubIcon fontSize="small" />} policies={centralData.controlPolicies} />
                      <CentralSection title="App-Route Policies" icon={<RouteIcon fontSize="small" />} policies={centralData.appRoutePolicies} />
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Paper variant="outlined" sx={{ p: 2, textAlign: "center" }}>
            <Typography variant="body2">
              <strong>Summary:</strong> Device <strong>{localData?.hostName || activeIp}</strong> (Site {localData?.siteId || "N/A"}) has{" "}
              <Chip label={`${centralTotal} Centralized`} size="small" color="primary" sx={{ mx: 0.5 }} /> and{" "}
              <Chip label={`${localTotal} Local`} size="small" color="success" sx={{ mx: 0.5 }} /> policies.
            </Typography>
          </Paper>
        </>
      )}
    </Box>
  );
}

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
    <Box sx={{ mb: 2.5 }}>
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
          No {title.toLowerCase()} found.
        </Typography>
      )}
    </Box>
  );
}

function CentralSection({ title, icon, policies }) {
  const count = policies ? policies.length : 0;
  return (
    <Box sx={{ mb: 2.5 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", bgcolor: "background.default", px: 1.5, py: 0.75, borderRadius: 1, mb: 0.5 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
          {icon}
          <Typography variant="subtitle2">{title}</Typography>
        </Box>
        <Chip label={count} size="small" sx={{ fontWeight: 600, height: 22 }} />
      </Box>
      {count > 0 ? (
        policies.map((pol, i) => (
          <Paper key={pol.policyId || i} variant="outlined" sx={{ p: 1.5, my: 0.75, borderLeft: 3, borderLeftColor: "primary.main" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.75 }}>
              <Typography variant="body2" fontWeight={700}>{pol.policyName}</Typography>
              <Chip label={pol.isActive ? "Active" : "Inactive"} size="small" color={pol.isActive ? "success" : "warning"} variant="outlined" sx={{ fontSize: "0.7rem", height: 20 }} />
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>Type: {pol.policyType}</Typography>

            {pol.sequences && pol.sequences.length > 0 && (
              <Box sx={{ mt: 1 }}>
                {pol.sequences.map((seq, j) => (
                  <SequenceRule key={j} seq={seq} index={j} />
                ))}
              </Box>
            )}
          </Paper>
        ))
      ) : (
        <Typography variant="caption" color="text.secondary" sx={{ pl: 1.5, fontStyle: "italic" }}>
          No {title.toLowerCase()} affecting this site.
        </Typography>
      )}
    </Box>
  );
}

function SequenceRule({ seq, index }) {
  const action = seq.baseAction || "N/A";
  const lower = action.toLowerCase();
  const isDrop = lower === "drop" || lower === "reject" || lower === "deny";
  const isAccept = lower === "accept" || lower === "forward" || lower === "permit";
  const actionColor = isDrop ? "#E53935" : isAccept ? "#43A047" : "#FF9800";
  const actionBg = isDrop ? "rgba(229,57,53,0.08)" : isAccept ? "rgba(67,160,71,0.08)" : "rgba(255,152,0,0.08)";

  const matchParts = [];
  if (seq.sourceDataPrefixList) matchParts.push(`Src: ${seq.sourceDataPrefixList}`);
  if (seq.destinationDataPrefixList) matchParts.push(`Dst: ${seq.destinationDataPrefixList}`);
  if (seq.sourceIp) matchParts.push(`Src: ${seq.sourceIp}`);
  if (seq.destinationIp) matchParts.push(`Dst: ${seq.destinationIp}`);
  if (seq.app) matchParts.push(`App: ${seq.app}`);
  if (seq.sequenceType) matchParts.push(seq.sequenceType);

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, py: 0.5, px: 1, mb: 0.5, borderRadius: 1, bgcolor: actionBg, flexWrap: "wrap" }}>
      <Chip label={`#${index + 1}`} size="small" variant="outlined" sx={{ fontSize: "0.65rem", height: 18, fontWeight: 600 }} />
      <Typography variant="caption" fontWeight={500} sx={{ flexShrink: 0 }}>
        {seq.sequenceName || `Sequence ${index + 1}`}
      </Typography>
      {matchParts.length > 0 && (
        <>
          <Typography variant="caption" color="text.secondary">Match</Typography>
          <Chip label={matchParts.join(", ")} size="small" variant="outlined" sx={{ fontSize: "0.65rem", height: 18 }} />
        </>
      )}
      <ArrowIcon sx={{ fontSize: 14, color: "text.secondary" }} />
      <Typography variant="caption" sx={{ fontWeight: 700, color: actionColor }}>
        Action: {action}
      </Typography>
    </Box>
  );
}
