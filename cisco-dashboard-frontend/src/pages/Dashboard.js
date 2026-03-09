import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Grid,
  TextField,
  InputAdornment,
  Typography,
  Alert,
} from "@mui/material";
import {
  Search as SearchIcon,
  Router as RouterIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
} from "@mui/icons-material";
import useApiFetch from "../hooks/useApiFetch";
import LoadingSpinner from "../components/LoadingSpinner";

export default function Dashboard() {
  const { data: devices, isLoading, error } = useApiFetch("/api/devices");
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!devices) return [];
    if (!search.trim()) return devices;
    const q = search.toLowerCase();
    return devices.filter(
      (d) =>
        (d["host-name"] || "").toLowerCase().includes(q) ||
        (d["system-ip"] || "").includes(q) ||
        (d["device-model"] || "").toLowerCase().includes(q) ||
        (d["site-id"] || "").includes(q)
    );
  }, [devices, search]);

  const reachableCount = (devices || []).filter(
    (d) => (d["reachability"] || "").toLowerCase() === "reachable"
  ).length;
  const totalCount = (devices || []).length;

  if (isLoading) return <LoadingSpinner message="Loading devices..." />;

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Typography variant="h5">Devices Overview</Typography>
          <Typography variant="subtitle2">
            {reachableCount}/{totalCount} reachable
          </Typography>
        </Box>
        <TextField
          size="small"
          placeholder="Search devices..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ minWidth: 280 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" color="action" />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={2}>
        {filtered.map((device, i) => {
          const isReachable = (device["reachability"] || "").toLowerCase() === "reachable";
          const sysIp = device["system-ip"];

          return (
            <Grid item xs={12} sm={6} md={4} lg={3} key={sysIp || i}>
              <Card
                sx={{
                  borderLeft: 4,
                  borderColor: isReachable ? "success.main" : "error.main",
                  transition: "transform 0.15s, box-shadow 0.15s",
                  "&:hover": { transform: "translateY(-2px)" },
                }}
              >
                <CardActionArea onClick={() => sysIp && navigate(`/device/${sysIp}`)}>
                  <CardContent>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <RouterIcon sx={{ color: isReachable ? "success.main" : "error.main", fontSize: 20 }} />
                        <Typography variant="subtitle1" noWrap sx={{ maxWidth: 160 }}>
                          {device["host-name"] || "Unnamed"}
                        </Typography>
                      </Box>
                      <Chip
                        icon={isReachable ? <CheckCircleIcon /> : <CancelIcon />}
                        label={isReachable ? "Up" : "Down"}
                        size="small"
                        color={isReachable ? "success" : "error"}
                        variant="outlined"
                        sx={{ fontSize: "0.7rem", height: 24 }}
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.3 }}>
                      <strong>IP:</strong> {sysIp || "N/A"}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.3 }}>
                      <strong>Model:</strong> {device["device-model"] || "N/A"}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.3 }}>
                      <strong>Site:</strong> {device["site-id"] || "N/A"}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Ctrl:</strong> {device["controlConnections"] || "0"} connections
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
}
