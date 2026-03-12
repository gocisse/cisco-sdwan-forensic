import React from "react";
import {
  Box,
  Typography,
  Button,
  Chip,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import {
  FiberManualRecord as DotIcon,
} from "@mui/icons-material";
import useSSE from "../hooks/useSSE";
import { useDeviceContext } from "../context/DeviceContext";

export default function SSEPage({ title, eventPath, columns, renderCell }) {
  const { selectedDevice } = useDeviceContext();
  const activeIp = selectedDevice ? selectedDevice["system-ip"] : "";

  const sseUrl = activeIp
    ? `${eventPath}?system-ip=${encodeURIComponent(activeIp)}`
    : null;

  const { data: updates, isConnected, error, reconnect } = useSSE(sseUrl);

  const rows = Array.isArray(updates) ? updates : [];

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, flexWrap: "wrap", gap: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Typography variant="h5">{title}</Typography>
          <Chip
            icon={<DotIcon sx={{ fontSize: 10 }} />}
            label={isConnected ? "Live" : "Offline"}
            size="small"
            color={isConnected ? "success" : "default"}
            variant="outlined"
          />
          {activeIp && (
            <Chip label={selectedDevice["host-name"] || activeIp} size="small" variant="outlined" sx={{ fontSize: "0.75rem" }} />
          )}
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} action={<Button size="small" onClick={reconnect}>Reconnect</Button>}>
          {error.message || "Connection error"}
        </Alert>
      )}

      {rows.length === 0 ? (
        <Alert severity="info">
          {!sseUrl
            ? "Select a device from the global search bar to start receiving live data."
            : "Waiting for data..."}
        </Alert>
      ) : (
        <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 600 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                {columns.map((col) => (
                  <TableCell key={col.field} sx={{ whiteSpace: "nowrap" }}>
                    {col.label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row, i) => (
                <TableRow key={i} hover>
                  {columns.map((col) => (
                    <TableCell key={col.field} sx={{ whiteSpace: "nowrap", fontSize: "0.85rem" }}>
                      {renderCell
                        ? renderCell(col.field, row[col.field], row)
                        : (row[col.field] ?? "—")}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
