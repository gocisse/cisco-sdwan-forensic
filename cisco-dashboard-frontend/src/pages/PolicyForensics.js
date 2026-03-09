import React from "react";
import { useParams, useNavigate } from "react-router-dom";
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
} from "@mui/icons-material";
import useApiFetch from "../hooks/useApiFetch";
import LoadingSpinner from "../components/LoadingSpinner";
import { useDeviceContext } from "../context/DeviceContext";
import DeviceSelector from "../components/DeviceSelector";

export default function PolicyForensics() {
  const { systemIp: urlSystemIp } = useParams();
  const navigate = useNavigate();
  const { selectedDevice } = useDeviceContext();
  const activeIp = urlSystemIp || (selectedDevice ? selectedDevice["system-ip"] : null);

  const { data: localData, isLoading: localLoading, error: localError } = useApiFetch(activeIp ? `/api/device/${activeIp}/policy/local` : null);
  const { data: centralData, isLoading: centralLoading, error: centralError } = useApiFetch(activeIp ? `/api/device/${activeIp}/policy/centralized` : null);
  const isLoading = localLoading || centralLoading;
  const localTotal = localData ? localData.totalCount : 0;
  const centralTotal = centralData ? centralData.totalCount : 0;

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, flexWrap: "wrap", gap: 1 }}>
        <Typography variant="h5">Policy Forensics</Typography>
        <DeviceSelector onSelect={(ip) => navigate(`/policy-forensics/${ip}`)} />
      </Box>

      {!activeIp && <Alert severity="info">Select a device to compare Local vs Centralized policies.</Alert>}
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
            {/* Local Policies */}
            <Grid item xs={12} md={6}>
              <Card sx={{ borderTop: 3, borderColor: "success.main" }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Local Policies (Device)</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {localData?.hostName || activeIp} — Site {localData?.siteId || "N/A"}
                  </Typography>
                  {localData && (
                    <Box sx={{ mt: 2 }}>
                      <PolicySection title="Access Lists" icon={<ShieldIcon fontSize="small" />} items={localData.accessLists}
                        renderItem={(item, i) => (
                          <Box key={i} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", py: 0.5, borderBottom: "1px solid", borderColor: "divider" }}>
                            <Typography variant="body2" fontWeight={500}>{item.name}</Typography>
                            <Box sx={{ display: "flex", gap: 0.5 }}>
                              {item.direction && <Chip label={item.direction} size="small" color="info" variant="outlined" sx={{ fontSize: "0.7rem", height: 20 }} />}
                              {item.interface && <Chip label={item.interface} size="small" color="secondary" variant="outlined" sx={{ fontSize: "0.7rem", height: 20 }} />}
                            </Box>
                          </Box>
                        )}
                      />
                      <PolicySection title="QoS Maps" icon={<BarChartIcon fontSize="small" />} items={localData.qosMaps}
                        renderItem={(item, i) => (
                          <Box key={i} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", py: 0.5, borderBottom: "1px solid", borderColor: "divider" }}>
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
                          <Box key={i} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", py: 0.5, borderBottom: "1px solid", borderColor: "divider" }}>
                            <Typography variant="body2" fontWeight={500}>{item.name}</Typography>
                            <Box sx={{ display: "flex", gap: 0.5 }}>
                              {item.cir && <Chip label={`CIR: ${item.cir}`} size="small" color="info" variant="outlined" sx={{ fontSize: "0.7rem", height: 20 }} />}
                              {item.burst && <Chip label={`Burst: ${item.burst}`} size="small" color="secondary" variant="outlined" sx={{ fontSize: "0.7rem", height: 20 }} />}
                              {item.exceedAction && <Chip label={item.exceedAction} size="small" color="warning" variant="outlined" sx={{ fontSize: "0.7rem", height: 20 }} />}
                            </Box>
                          </Box>
                        )}
                      />
                      <PolicySection title="Zone-Based Firewall" icon={<FireIcon fontSize="small" />} items={localData.zoneFirewall}
                        renderItem={(item, i) => (
                          <Box key={i} sx={{ py: 0.5, borderBottom: "1px solid", borderColor: "divider" }}>
                            <Typography variant="body2" fontWeight={500}>{item.name}</Typography>
                          </Box>
                        )}
                      />
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Centralized Policies */}
            <Grid item xs={12} md={6}>
              <Card sx={{ borderTop: 3, borderColor: "primary.main" }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Centralized Policies (vSmart)</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Policies affecting Site {centralData?.siteId || "N/A"}
                  </Typography>
                  {centralData && (
                    <Box sx={{ mt: 2 }}>
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
          No {title.toLowerCase()} found.
        </Typography>
      )}
    </Box>
  );
}

function CentralSection({ title, icon, policies }) {
  const count = policies ? policies.length : 0;
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
        policies.map((pol, i) => (
          <Paper key={pol.policyId || i} variant="outlined" sx={{ p: 1.25, my: 0.5, borderLeft: 3, borderLeftColor: "primary.main" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
              <Typography variant="body2" fontWeight={600}>{pol.policyName}</Typography>
              <Chip label={pol.isActive ? "Active" : "Inactive"} size="small" color={pol.isActive ? "success" : "warning"} variant="outlined" sx={{ fontSize: "0.7rem", height: 20 }} />
            </Box>
            <Typography variant="caption" color="text.secondary">Type: {pol.policyType}</Typography>
            {pol.sequences && pol.sequences.length > 0 && (
              <Box sx={{ mt: 0.75, pl: 1, borderLeft: 2, borderColor: "divider" }}>
                {pol.sequences.map((seq, j) => (
                  <Box key={j} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", py: 0.25 }}>
                    <Typography variant="caption">{seq.sequenceName || `Sequence ${j + 1}`}</Typography>
                    <Chip label={seq.baseAction || "N/A"} size="small" color={seq.baseAction === "accept" ? "success" : "error"} variant="outlined" sx={{ fontSize: "0.65rem", height: 18 }} />
                  </Box>
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
