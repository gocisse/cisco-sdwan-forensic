import React, { useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import {
  Box,
  Typography,
  Alert,
  Button,
  TextField,
  InputAdornment,
  MenuItem,
  Chip,
} from "@mui/material";
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import useApiFetch from "../hooks/useApiFetch";
import DataTable from "../components/DataTable";
import DeviceSelector from "../components/DeviceSelector";
import LoadingSpinner from "../components/LoadingSpinner";

const columns = [
  { field: "entryTime", label: "Time", minWidth: 160 },
  { field: "severity", label: "Severity", minWidth: 90 },
  { field: "facility", label: "Facility", minWidth: 90 },
  { field: "component", label: "Component", minWidth: 120 },
  { field: "processName", label: "Process", minWidth: 110 },
  { field: "message", label: "Message", minWidth: 400 },
];

const severityColors = {
  emergency: "error",
  alert: "error",
  critical: "error",
  error: "error",
  warning: "warning",
  notice: "info",
  info: "default",
  debug: "default",
};

const severityLevels = [
  { value: "", label: "All Severities" },
  { value: "critical", label: "Critical" },
  { value: "error", label: "Error" },
  { value: "warning", label: "Warning" },
  { value: "info", label: "Info" },
  { value: "debug", label: "Debug" },
];

export default function DeviceLogs() {
  const { systemIp: urlSystemIp } = useParams();
  const activeIp = urlSystemIp || null;

  const [severity, setSeverity] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSeverity, setActiveSeverity] = useState("");
  const [activeQuery, setActiveQuery] = useState("");

  const apiUrl = useMemo(() => {
    if (!activeIp) return null;
    const params = new URLSearchParams();
    if (activeSeverity) params.set("severity", activeSeverity);
    if (activeQuery) params.set("query", activeQuery);
    const qs = params.toString();
    return `/api/device/${activeIp}/logs${qs ? `?${qs}` : ""}`;
  }, [activeIp, activeSeverity, activeQuery]);

  const { data: rawLogs, isLoading, error, refetch } = useApiFetch(apiUrl);

  const logs = useMemo(() => {
    if (!rawLogs) return [];
    const arr = Array.isArray(rawLogs) ? rawLogs : rawLogs.data || [];
    return arr;
  }, [rawLogs]);

  const handleSearch = () => {
    setActiveSeverity(severity);
    setActiveQuery(searchQuery.trim());
  };

  const handleClear = () => {
    setSeverity("");
    setSearchQuery("");
    setActiveSeverity("");
    setActiveQuery("");
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, flexWrap: "wrap", gap: 1 }}>
        <Typography variant="h5">Device Logs</Typography>
        <DeviceSelector navigatePrefix="/device-logs" />
      </Box>

      {!activeIp && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Select a device to view its syslog entries.
        </Alert>
      )}

      {activeIp && (
        <Box sx={{ display: "flex", gap: 1, mb: 2, alignItems: "center", flexWrap: "wrap" }}>
          <TextField
            select
            size="small"
            label="Severity"
            value={severity}
            onChange={(e) => setSeverity(e.target.value)}
            sx={{ minWidth: 150 }}
          >
            {severityLevels.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            size="small"
            placeholder="Search messages (e.g. bgp, ospf, tunnel)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
            sx={{ minWidth: 300 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" sx={{ color: "text.secondary" }} />
                </InputAdornment>
              ),
            }}
          />
          <Button variant="contained" size="small" onClick={handleSearch}>
            Filter
          </Button>
          <Button variant="outlined" size="small" onClick={handleClear}>
            Clear
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<RefreshIcon />}
            onClick={refetch}
            sx={{ ml: "auto" }}
          >
            Refresh
          </Button>
        </Box>
      )}

      {isLoading && <LoadingSpinner message="Fetching device logs..." />}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {logs.length > 0 && !isLoading && (
        <DataTable
          columns={columns}
          rows={logs}
          title={`Device Logs — ${activeIp}${activeSeverity ? ` (${activeSeverity})` : ""}${activeQuery ? ` · "${activeQuery}"` : ""}`}
          defaultSort="entryTime"
          defaultOrder="desc"
          dense
          renderCell={(field, value) => {
            if (field === "entryTime") {
              return value ? new Date(value).toLocaleString() : "—";
            }
            if (field === "severity") {
              const color = severityColors[(value || "").toLowerCase()] || "default";
              return (
                <Chip
                  label={value || "N/A"}
                  size="small"
                  color={color}
                  variant="outlined"
                  sx={{ fontWeight: 600, fontSize: "0.7rem" }}
                />
              );
            }
            if (field === "message") {
              return (
                <Box
                  sx={{
                    maxWidth: 600,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    fontSize: "0.8rem",
                    fontFamily: "monospace",
                  }}
                  title={value || ""}
                >
                  {value || "—"}
                </Box>
              );
            }
            return value ?? "—";
          }}
        />
      )}

      {logs.length === 0 && !isLoading && !error && activeIp && (
        <Alert severity="info" sx={{ mb: 2 }}>
          No log entries found{activeSeverity || activeQuery ? " matching the current filters." : "."}
        </Alert>
      )}
    </Box>
  );
}
