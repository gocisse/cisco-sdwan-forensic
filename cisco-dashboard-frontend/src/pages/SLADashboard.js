import React, { useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  Chip,
  Grid,
  Tab,
  Tabs,
  Typography,
  Alert,
} from "@mui/material";
import {
  FiberManualRecord as DotIcon,
} from "@mui/icons-material";
import useApiFetch from "../hooks/useApiFetch";
import useSSE from "../hooks/useSSE";
import LoadingSpinner from "../components/LoadingSpinner";
import DataTable from "../components/DataTable";
import { useDeviceContext } from "../context/DeviceContext";

const appRouteColumns = [
  { field: "slaStatus", label: "Status" },
  { field: "srcIp", label: "Source IP" },
  { field: "dstIp", label: "Dest IP" },
  { field: "application", label: "Application" },
  { field: "localColor", label: "Local Color" },
  { field: "remoteColor", label: "Remote Color" },
  { field: "latency", label: "Latency (ms)" },
  { field: "loss", label: "Loss (%)" },
  { field: "jitter", label: "Jitter (ms)" },
];

const tunnelColumns = [
  { field: "slaStatus", label: "Status" },
  { field: "srcIp", label: "Source IP" },
  { field: "dstIp", label: "Dest IP" },
  { field: "localColor", label: "Local Color" },
  { field: "remoteColor", label: "Remote Color" },
  { field: "state", label: "State" },
  { field: "txPackets", label: "TX Packets" },
  { field: "rxPackets", label: "RX Packets" },
  { field: "lossPercentage", label: "Loss (%)" },
];

const statusColor = { CRITICAL: "error", WARNING: "warning", OK: "success" };

function formatNum(val) {
  if (val === undefined || val === null) return "—";
  const n = Number(val);
  return isNaN(n) ? val : n.toFixed(2);
}

function normalize(row) {
  return {
    ...row,
    srcIp: row.srcIp || row["src-ip"] || "N/A",
    dstIp: row.dstIp || row["dst-ip"] || "N/A",
    application: row.application || row["app-probe-class-name"] || row.appName || "N/A",
    localColor: row.localColor || row["local-color"] || "N/A",
    remoteColor: row.remoteColor || row["remote-color"] || "N/A",
    state: row.state || "N/A",
    lossPercentage: row.lossPercentage ?? row["loss-percentage"] ?? "N/A",
  };
}

export default function SLADashboard() {
  const { systemIp: urlSystemIp } = useParams();
  const { selectedDevice } = useDeviceContext();
  const [tab, setTab] = useState(0);
  const activeIp = urlSystemIp || (selectedDevice ? selectedDevice["system-ip"] : null);

  const { data: appRouteData, isLoading: appRouteLoading, error: appRouteError } = useApiFetch(activeIp ? `/api/device/${activeIp}/app-route` : null);
  const { data: tunnelData, isLoading: tunnelLoading, error: tunnelError } = useApiFetch(activeIp ? `/api/device/${activeIp}/tunnel-health` : null);
  const { data: liveFlows, isConnected: sseConnected } = useSSE(activeIp ? `/events/app-route?system-ip=${activeIp}` : null);

  const isLoading = appRouteLoading || tunnelLoading;

  const flows = useMemo(() => {
    if (liveFlows && Array.isArray(liveFlows) && liveFlows.length > 0) return liveFlows.map(normalize);
    return (appRouteData?.flows || []).map(normalize);
  }, [liveFlows, appRouteData]);

  const tunnels = useMemo(() => {
    return (tunnelData?.tunnels || []).map(normalize);
  }, [tunnelData]);

  const renderSlaCell = (field, value, row) => {
    if (field === "slaStatus") {
      return <Chip label={value || "—"} size="small" color={statusColor[value] || "default"} variant="outlined" sx={{ fontWeight: 700, fontSize: "0.7rem" }} />;
    }
    if (field === "state") {
      const isUp = typeof value === "string" && value.toLowerCase() === "up";
      return <Chip label={value || "N/A"} size="small" color={isUp ? "success" : "warning"} variant="outlined" sx={{ fontSize: "0.7rem" }} />;
    }
    if (field === "latency" || field === "loss" || field === "jitter" || field === "lossPercentage") return formatNum(value);
    if (field === "txPackets" || field === "rxPackets") return value != null ? Number(value).toLocaleString() : "—";
    return value ?? "N/A";
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, flexWrap: "wrap", gap: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Typography variant="h5">SLA &amp; Traffic Analysis</Typography>
          {sseConnected && <Chip icon={<DotIcon sx={{ fontSize: 10 }} />} label="Live" size="small" color="success" variant="outlined" />}
        </Box>
      </Box>

      {!activeIp && <Alert severity="info">Select a device from the global search bar to view SLA and traffic analysis.</Alert>}
      {isLoading && <LoadingSpinner message="Fetching traffic data..." />}
      {(appRouteError || tunnelError) && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {appRouteError && <div>{appRouteError}</div>}
          {tunnelError && <div>{tunnelError}</div>}
        </Alert>
      )}

      {activeIp && !isLoading && (
        <>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {[
              { title: "App-Route Flows", total: appRouteData?.totalFlows ?? 0, critical: appRouteData?.criticalCount ?? 0, warning: appRouteData?.warningCount ?? 0, ok: appRouteData?.okCount ?? 0 },
              { title: "Tunnel Health", total: tunnelData?.totalTunnels ?? 0, critical: tunnelData?.criticalCount ?? 0, warning: tunnelData?.warningCount ?? 0, ok: tunnelData?.okCount ?? 0 },
            ].map((c) => (
              <Grid item xs={12} sm={6} key={c.title}>
                <Card>
                  <CardContent sx={{ textAlign: "center" }}>
                    <Typography variant="subtitle2" color="text.secondary">{c.title}</Typography>
                    <Typography variant="h4" fontWeight={700} sx={{ my: 1 }}>{c.total}</Typography>
                    <Box sx={{ display: "flex", justifyContent: "center", gap: 1.5 }}>
                      <Chip label={`${c.critical} Critical`} size="small" color="error" variant="outlined" sx={{ fontSize: "0.7rem" }} />
                      <Chip label={`${c.warning} Warning`} size="small" color="warning" variant="outlined" sx={{ fontSize: "0.7rem" }} />
                      <Chip label={`${c.ok} OK`} size="small" color="success" variant="outlined" sx={{ fontSize: "0.7rem" }} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2, borderBottom: 1, borderColor: "divider" }}>
            <Tab label="App-Route SLA" />
            <Tab label="Tunnel Health" />
          </Tabs>

          {tab === 0 && (
            <DataTable columns={appRouteColumns} rows={flows} defaultSort="slaStatus" dense renderCell={renderSlaCell} />
          )}
          {tab === 1 && (
            <DataTable columns={tunnelColumns} rows={tunnels} defaultSort="slaStatus" dense renderCell={renderSlaCell} />
          )}
        </>
      )}
    </Box>
  );
}
