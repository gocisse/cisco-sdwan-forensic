import React, { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Box,
  Typography,
  Alert,
  Button,
  Chip,
  Tabs,
  Tab,
  Card,
  CardContent,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import {
  Refresh as RefreshIcon,
  Memory as MemoryIcon,
  Thermostat as ThermostatIcon,
  Warning as WarningIcon,
  Speed as SpeedIcon,
} from "@mui/icons-material";
import useApiFetch from "../hooks/useApiFetch";
import DeviceSelector from "../components/DeviceSelector";
import LoadingSpinner from "../components/LoadingSpinner";

function TabPanel({ children, value, index, ...other }) {
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
}

function DataTable({ data, title, emptyMessage }) {
  if (!data || data.length === 0) {
    return (
      <Alert severity="info" sx={{ mt: 2 }}>
        {emptyMessage || "No data available."}
      </Alert>
    );
  }

  // Get all unique keys from data
  const allKeys = [...new Set(data.flatMap((row) => Object.keys(row)))];
  // Filter out internal keys and format headers
  const displayKeys = allKeys.filter(
    (k) => !k.startsWith("vdevice-") && !k.includes("dataKey") && k !== "lastupdated"
  );

  const formatHeader = (key) => {
    return key
      .replace(/-/g, " ")
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  };

  const formatValue = (value, key) => {
    if (value === null || value === undefined) return "—";
    if (typeof value === "boolean") return value ? "Yes" : "No";
    if (typeof value === "object") return JSON.stringify(value);
    // Format temperature values
    if (key.toLowerCase().includes("temp") && typeof value === "number") {
      return `${value}°C`;
    }
    return String(value);
  };

  return (
    <TableContainer component={Paper} sx={{ mt: 2 }}>
      <Table size="small">
        <TableHead>
          <TableRow sx={{ backgroundColor: "primary.main" }}>
            {displayKeys.map((key) => (
              <TableCell key={key} sx={{ color: "white", fontWeight: 600, whiteSpace: "nowrap" }}>
                {formatHeader(key)}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((row, idx) => (
            <TableRow key={idx} hover>
              {displayKeys.map((key) => (
                <TableCell key={key} sx={{ fontSize: "0.8rem" }}>
                  {formatValue(row[key], key)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function DeviceInfoCard({ deviceInfo }) {
  if (!deviceInfo) return null;

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="caption" color="text.secondary">System IP</Typography>
            <Typography variant="body1" fontWeight={600}>{deviceInfo.systemIp || "—"}</Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="caption" color="text.secondary">Hostname</Typography>
            <Typography variant="body1" fontWeight={600}>{deviceInfo.hostName || "—"}</Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="caption" color="text.secondary">Model</Typography>
            <Typography variant="body1" fontWeight={600}>{deviceInfo.model || "—"}</Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="caption" color="text.secondary">Device Type</Typography>
            <Chip
              label={deviceInfo.isVedge ? "vEdge (Viptela)" : "Catalyst SD-WAN (IOS-XE)"}
              size="small"
              color={deviceInfo.isVedge ? "primary" : "secondary"}
              variant="outlined"
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}

export default function HardwareInventory() {
  const { systemIp: urlSystemIp } = useParams();
  const activeIp = urlSystemIp || null;
  const [tabValue, setTabValue] = useState(0);

  const apiUrl = useMemo(() => {
    if (!activeIp) return null;
    return `/api/device/${activeIp}/hardware-inventory`;
  }, [activeIp]);

  const { data: hardwareData, isLoading, error, refetch } = useApiFetch(apiUrl);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const inventoryCount = hardwareData?.inventory?.length || 0;
  const environmentCount = hardwareData?.environment?.length || 0;
  const alarmsCount = hardwareData?.alarms?.length || 0;
  const thresholdsCount = hardwareData?.thresholds?.length || 0;

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, flexWrap: "wrap", gap: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <MemoryIcon color="primary" />
          <Typography variant="h5">Hardware Inventory</Typography>
        </Box>
        <DeviceSelector navigatePrefix="/hardware-inventory" />
      </Box>

      {!activeIp && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Select an edge device to view its hardware inventory, environment status, and alarms.
          Supports both vEdge (Viptela) and Catalyst SD-WAN (IOS-XE) devices.
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

      {isLoading && <LoadingSpinner message="Fetching hardware inventory..." />}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {hardwareData && !isLoading && (
        <>
          <DeviceInfoCard deviceInfo={hardwareData.deviceInfo} />

          {alarmsCount > 0 && (
            <Alert severity="warning" sx={{ mb: 2 }} icon={<WarningIcon />}>
              {alarmsCount} active hardware alarm{alarmsCount > 1 ? "s" : ""} detected on this device.
            </Alert>
          )}

          <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
            <Tabs value={tabValue} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
              <Tab
                icon={<MemoryIcon />}
                iconPosition="start"
                label={`Inventory (${inventoryCount})`}
              />
              <Tab
                icon={<ThermostatIcon />}
                iconPosition="start"
                label={`Environment (${environmentCount})`}
              />
              <Tab
                icon={<WarningIcon />}
                iconPosition="start"
                label={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    Alarms
                    {alarmsCount > 0 ? (
                      <Chip label={alarmsCount} size="small" color="error" sx={{ height: 20, fontSize: "0.7rem" }} />
                    ) : (
                      <Chip label="0" size="small" color="success" sx={{ height: 20, fontSize: "0.7rem" }} />
                    )}
                  </Box>
                }
              />
              {hardwareData.deviceInfo?.isVedge && (
                <Tab
                  icon={<SpeedIcon />}
                  iconPosition="start"
                  label={`Thresholds (${thresholdsCount})`}
                />
              )}
            </Tabs>
          </Box>

          <TabPanel value={tabValue} index={0}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Hardware components inventory with serial numbers and part information.
            </Typography>
            <DataTable
              data={hardwareData.inventory}
              title="Inventory"
              emptyMessage="No inventory data available for this device."
            />
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Component status and temperature readings.
            </Typography>
            <DataTable
              data={hardwareData.environment}
              title="Environment"
              emptyMessage="No environment data available for this device."
            />
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Active hardware alarms and warnings.
            </Typography>
            {alarmsCount === 0 ? (
              <Alert severity="success" sx={{ mt: 2 }}>
                No active hardware alarms on this device.
              </Alert>
            ) : (
              <DataTable
                data={hardwareData.alarms}
                title="Alarms"
                emptyMessage="No alarm data available."
              />
            )}
          </TabPanel>

          {hardwareData.deviceInfo?.isVedge && (
            <TabPanel value={tabValue} index={3}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Temperature thresholds for green, yellow, and red alarms (vEdge only).
              </Typography>
              <DataTable
                data={hardwareData.thresholds}
                title="Thresholds"
                emptyMessage="No threshold data available for this device."
              />
            </TabPanel>
          )}
        </>
      )}

      {!hardwareData && !isLoading && !error && activeIp && (
        <Alert severity="info" sx={{ mb: 2 }}>
          No hardware data available for this device.
        </Alert>
      )}
    </Box>
  );
}
