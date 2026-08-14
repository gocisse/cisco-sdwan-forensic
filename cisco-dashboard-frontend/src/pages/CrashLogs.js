import React, { useMemo } from "react";
import { useParams } from "react-router-dom";
import {
  Box,
  Typography,
  Alert,
  Button,
  Chip,
} from "@mui/material";
import {
  Refresh as RefreshIcon,
  BugReport as BugReportIcon,
} from "@mui/icons-material";
import useApiFetch from "../hooks/useApiFetch";
import DataTable from "../components/DataTable";
import DeviceSelector from "../components/DeviceSelector";
import LoadingSpinner from "../components/LoadingSpinner";

const columns = [
  { field: "coreTime", label: "Crash Time", minWidth: 180 },
  { field: "coreFilename", label: "Core File", minWidth: 350 },
  { field: "vdeviceHostName", label: "Hostname", minWidth: 140 },
  { field: "index", label: "Index", minWidth: 70 },
];

export default function CrashLogs() {
  const { systemIp: urlSystemIp } = useParams();
  const activeIp = urlSystemIp || null;

  const apiUrl = useMemo(() => {
    if (!activeIp) return null;
    return `/api/device/${activeIp}/crashlog`;
  }, [activeIp]);

  const { data: rawCrashLogs, isLoading, error, refetch } = useApiFetch(apiUrl);

  const crashLogs = useMemo(() => {
    if (!rawCrashLogs) return [];
    const arr = Array.isArray(rawCrashLogs) ? rawCrashLogs : rawCrashLogs.data || [];
    return arr;
  }, [rawCrashLogs]);

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, flexWrap: "wrap", gap: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <BugReportIcon color="error" />
          <Typography variant="h5">Crash Logs</Typography>
        </Box>
        <DeviceSelector navigatePrefix="/crash-logs" />
      </Box>

      {!activeIp && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Select a device to view its crash logs (core files). This helps identify software crashes and system issues.
        </Alert>
      )}

      {activeIp && (
        <Box sx={{ display: "flex", gap: 1, mb: 2, alignItems: "center", justifyContent: "flex-end" }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<RefreshIcon />}
            onClick={refetch}
          >
            Refresh
          </Button>
        </Box>
      )}

      {isLoading && <LoadingSpinner message="Fetching crash logs..." />}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {crashLogs.length > 0 && !isLoading && (
        <>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Found {crashLogs.length} crash log{crashLogs.length > 1 ? "s" : ""} on this device. 
            Review core files to diagnose software crashes.
          </Alert>
          <DataTable
            columns={columns}
            rows={crashLogs}
            title={`Crash Logs — ${activeIp}`}
            defaultSort="coreTime"
            defaultOrder="desc"
            dense
            renderCell={(field, value, row) => {
              if (field === "coreTime") {
                return value || "—";
              }
              if (field === "coreFilename") {
                return (
                  <Box
                    sx={{
                      fontFamily: "monospace",
                      fontSize: "0.8rem",
                      color: "error.main",
                      fontWeight: 500,
                    }}
                    title={value || ""}
                  >
                    {value || "—"}
                  </Box>
                );
              }
              if (field === "index") {
                return (
                  <Chip
                    label={value}
                    size="small"
                    color="default"
                    variant="outlined"
                    sx={{ fontSize: "0.7rem" }}
                  />
                );
              }
              return value ?? "—";
            }}
          />
        </>
      )}

      {crashLogs.length === 0 && !isLoading && !error && activeIp && (
        <Alert severity="success" sx={{ mb: 2 }} icon={<BugReportIcon />}>
          No crash logs found on this device. The device appears to be running without any recorded crashes.
        </Alert>
      )}
    </Box>
  );
}
