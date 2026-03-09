import React from "react";
import { useParams, Link as RouterLink, useNavigate } from "react-router-dom";
import {
  Box,
  Breadcrumbs,
  Card,
  CardContent,
  Chip,
  Grid,
  Link,
  Paper,
  Typography,
  Alert,
} from "@mui/material";
import {
  Speed as SpeedIcon,
  Security as SecurityIcon,
  Analytics as AnalyticsIcon,
  Hub as HubIcon,
  NavigateNext as NavNextIcon,
} from "@mui/icons-material";
import useApiFetch from "../hooks/useApiFetch";
import LoadingSpinner from "../components/LoadingSpinner";

const quickNav = [
  { label: "BFD Sessions", path: "/realtime/bfd", icon: <SpeedIcon fontSize="small" /> },
  { label: "Tunnel Stats", path: "/realtime/tunnel", icon: <HubIcon fontSize="small" /> },
  { label: "IPSec", path: "/realtime/ipsec", icon: <SecurityIcon fontSize="small" /> },
  { label: "Control Plane", path: "/realtime/control-plane" },
  { label: "Connections", path: "/realtime/connections" },
  { label: "Advertised Routes", path: "/realtime/advertised-routes" },
  { label: "Received Routes", path: "/realtime/received-routes" },
  { label: "Advertised TLOCs", path: "/realtime/advertised-tlocs" },
  { label: "Received TLOCs", path: "/realtime/received-tlocs" },
  { label: "App Routes", path: "/realtime/app-routes" },
  { label: "Templates", path: "/templates" },
  { label: "Policy Forensics", path: "/policy-forensics", icon: <AnalyticsIcon fontSize="small" /> },
  { label: "SLA Dashboard", path: "/sla-dashboard", icon: <AnalyticsIcon fontSize="small" /> },
];

const infoFields = [
  { label: "System IP", key: "system-ip" },
  { label: "Device ID", key: "deviceId" },
  { label: "Model", key: "device-model" },
  { label: "Site ID", key: "site-id" },
  { label: "Status", key: "status" },
  { label: "State", key: "state" },
  { label: "Ctrl Connections", key: "controlConnections" },
  { label: "Device OS", key: "device-os" },
  { label: "Certificate", key: "certificate-validity" },
];

export default function DeviceDetail() {
  const { systemIp } = useParams();
  const navigate = useNavigate();
  const { data: devices, isLoading, error } = useApiFetch("/api/devices");

  const device = devices ? devices.find((d) => d["system-ip"] === systemIp) : null;

  if (isLoading) return <LoadingSpinner message="Loading device info..." />;
  if (error) return <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>;
  if (!device)
    return (
      <Alert severity="warning" sx={{ m: 2 }}>
        Device <strong>{systemIp}</strong> not found.{" "}
        <Link component={RouterLink} to="/">Back to Dashboard</Link>
      </Alert>
    );

  const isReachable = (device["reachability"] || "").toLowerCase() === "reachable";

  return (
    <Box>
      <Breadcrumbs separator={<NavNextIcon fontSize="small" />} sx={{ mb: 2 }}>
        <Link component={RouterLink} to="/" underline="hover" color="inherit">Dashboard</Link>
        <Typography color="text.primary" variant="body2" fontWeight={600}>
          {device["host-name"] || systemIp}
        </Typography>
      </Breadcrumbs>

      {/* Device Info Card */}
      <Card sx={{ mb: 3, borderLeft: 4, borderColor: isReachable ? "success.main" : "error.main" }}>
        <CardContent>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, flexWrap: "wrap", gap: 1 }}>
            <Typography variant="h5">
              {device["host-name"] || "Unnamed Device"}
            </Typography>
            <Chip
              label={isReachable ? "Reachable" : "Unreachable"}
              color={isReachable ? "success" : "error"}
              size="small"
            />
          </Box>
          <Grid container spacing={1.5}>
            {infoFields.map((f) => (
              <Grid item xs={6} sm={4} md={3} key={f.key}>
                <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase", fontSize: "0.7rem", letterSpacing: "0.05em" }}>
                  {f.label}
                </Typography>
                <Typography variant="body2" fontWeight={500}>
                  {device[f.key] || "N/A"}
                </Typography>
              </Grid>
            ))}
            <Grid item xs={6} sm={4} md={3}>
              <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase", fontSize: "0.7rem", letterSpacing: "0.05em" }}>
                Uptime
              </Typography>
              <Typography variant="body2" fontWeight={500}>
                {device["uptime-date"] ? new Date(device["uptime-date"]).toLocaleString() : "N/A"}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Quick Navigation */}
      <Typography variant="h6" sx={{ mb: 2 }}>Quick Navigation</Typography>
      <Grid container spacing={1.5}>
        {quickNav.map((item) => (
          <Grid item xs={6} sm={4} md={3} lg={2} key={item.path}>
            <Paper
              variant="outlined"
              sx={{
                p: 1.5,
                textAlign: "center",
                cursor: "pointer",
                transition: "all 0.15s",
                "&:hover": { bgcolor: "primary.main", color: "#fff", borderColor: "primary.main" },
              }}
              onClick={() => navigate(`${item.path}/${systemIp}`)}
            >
              {item.icon && <Box sx={{ mb: 0.5 }}>{item.icon}</Box>}
              <Typography variant="body2" fontWeight={500} fontSize="0.8rem">
                {item.label}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
