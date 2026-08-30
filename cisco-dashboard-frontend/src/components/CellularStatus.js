import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Paper,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tooltip,
  LinearProgress,
} from "@mui/material";
import {
  SignalCellular4Bar as Signal4Icon,
  SignalCellular3Bar as Signal3Icon,
  SignalCellular2Bar as Signal2Icon,
  SignalCellular1Bar as Signal1Icon,
  SignalCellular0Bar as Signal0Icon,
  SignalCellularConnectedNoInternet0Bar as NoSignalIcon,
  ExpandMore as ExpandMoreIcon,
  SimCard as SimIcon,
  Router as ModemIcon,
  Speed as SpeedIcon,
  Error as ErrorIcon,
  CheckCircle as CheckIcon,
  CellTower as RadioIcon,
} from "@mui/icons-material";

// Signal strength icon based on bars (0-5)
const SignalIcon = ({ bars, connected }) => {
  if (!connected) return <NoSignalIcon sx={{ color: "#FF1744" }} />;
  const iconProps = { sx: { color: bars >= 3 ? "#00E676" : bars >= 2 ? "#FFC107" : "#FF9800" } };
  switch (bars) {
    case 5:
    case 4:
      return <Signal4Icon {...iconProps} />;
    case 3:
      return <Signal3Icon {...iconProps} />;
    case 2:
      return <Signal2Icon {...iconProps} />;
    case 1:
      return <Signal1Icon {...iconProps} />;
    default:
      return <Signal0Icon {...iconProps} />;
  }
};

// Format bytes to human readable
const formatBytes = (bytes) => {
  if (bytes === undefined || bytes === null || isNaN(bytes)) return "—";
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

// Parse raw JSON data
const parseRawData = (rawArray) => {
  return (rawArray || []).map((raw) => {
    try {
      return typeof raw === "string" ? JSON.parse(raw) : raw;
    } catch {
      return raw;
    }
  });
};

export default function CellularStatus({ systemIp }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [expanded, setExpanded] = useState({ connection: true });

  const fetchCellularStatus = useCallback(async () => {
    if (!systemIp) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/cellular/${systemIp}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      console.log("Cellular data:", json); // Debug log
      setData(json);
    } catch (e) {
      console.error("Cellular fetch error:", e);
      setError("Failed to fetch cellular status");
    }
    setLoading(false);
  }, [systemIp]);

  useEffect(() => {
    fetchCellularStatus();
  }, [fetchCellularStatus]);

  const handleAccordionChange = (panel) => (event, isExpanded) => {
    setExpanded((prev) => ({ ...prev, [panel]: isExpanded }));
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <CircularProgress size={32} />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (!data || !data.hasCellular) {
    return (
      <Alert severity="info" icon={<SimIcon />}>
        No cellular interfaces detected on this device
      </Alert>
    );
  }

  // Parse raw data arrays
  const connections = parseRawData(data.connection);
  const sessions = parseRawData(data.session);
  const hardware = parseRawData(data.hardware);
  const radios = parseRawData(data.radio);
  const transports = parseRawData(data.transport);

  // Use interfaces array as primary source (already merged by backend)
  const interfaces = data.interfaces || [];

  // Find connection data for an interface
  const findConnectionData = (ifaceName) => {
    return connections.find(c => 
      c["if-name"] === ifaceName || 
      c["cellular-interface-name"] === ifaceName
    ) || {};
  };

  // Find radio data for an interface
  const findRadioData = (ifaceName) => {
    return radios.find(r => 
      r["cellular-interface-name"] === ifaceName || 
      r["if-name"] === ifaceName
    ) || {};
  };

  return (
    <Box>
      {/* Status Summary */}
      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
          <Typography variant="h6" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <SimIcon /> Cellular Status
          </Typography>
          <Chip
            icon={data.isConnected ? <CheckIcon /> : <ErrorIcon />}
            label={data.isConnected ? "Connected" : "Disconnected"}
            color={data.isConnected ? "success" : "error"}
            sx={{ fontWeight: 700 }}
          />
          <Chip
            label={`${interfaces.length} Interface${interfaces.length !== 1 ? "s" : ""}`}
            variant="outlined"
          />
        </Box>

        {/* Interface Cards */}
        <Box sx={{ display: "flex", gap: 2, mt: 2, flexWrap: "wrap" }}>
          {interfaces.map((iface, idx) => (
            <Paper
              key={idx}
              elevation={2}
              sx={{
                p: 2,
                minWidth: 200,
                bgcolor: iface.isConnected ? "rgba(0,230,118,0.1)" : "rgba(255,23,68,0.1)",
                border: `1px solid ${iface.isConnected ? "#00E676" : "#FF1744"}`,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                <SignalIcon bars={iface.signalBars} connected={iface.isConnected} />
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  {iface.name || `Cellular ${idx}`}
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
                {iface.ipAddress || "0.0.0.0"}
              </Typography>
              {iface.radioMode && (
                <Chip label={iface.radioMode} size="small" sx={{ mt: 1, mr: 0.5 }} />
              )}
              {iface.band && (
                <Chip label={iface.band} size="small" color="info" variant="outlined" sx={{ mt: 1, mr: 0.5 }} />
              )}
              {iface.carrier && (
                <Chip label={iface.carrier} size="small" variant="outlined" sx={{ mt: 1 }} />
              )}
            </Paper>
          ))}
        </Box>
      </Paper>

      {/* Connection Details - Using interfaces array */}
      <Accordion expanded={expanded.connection !== false} onChange={handleAccordionChange("connection")}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <SpeedIcon color="primary" />
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Connection Details
            </Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Interface</TableCell>
                  <TableCell>IP Address</TableCell>
                  <TableCell>Radio Mode</TableCell>
                  <TableCell>Band</TableCell>
                  <TableCell>Signal</TableCell>
                  <TableCell>RX/TX Packets</TableCell>
                  <TableCell>RX/TX Bytes</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {interfaces.map((iface, idx) => {
                  const conn = findConnectionData(iface.name);
                  const radio = findRadioData(iface.name);
                  
                  // Get signal values from interface or radio data
                  const rssi = iface.rssi || radio.RSSI || conn.rssi;
                  const rsrp = iface.rsrp || radio.RSRP || conn.rsrp;
                  const rsrq = iface.rsrq || radio.RSRQ || conn.rsrq;
                  const snr = iface.snr || radio.SNR || conn.snr;
                  
                  // Parse RSSI for progress bar (handle string or number)
                  let rssiNum = typeof rssi === 'string' ? parseInt(rssi, 10) : rssi;
                  if (isNaN(rssiNum)) rssiNum = -100;
                  
                  return (
                    <TableRow key={idx} hover>
                      <TableCell sx={{ fontWeight: 600 }}>{iface.name || `Cellular ${idx}`}</TableCell>
                      <TableCell sx={{ fontFamily: "monospace" }}>{iface.ipAddress || "0.0.0.0"}</TableCell>
                      <TableCell>
                        {iface.radioMode ? (
                          <Chip label={iface.radioMode} size="small" />
                        ) : "—"}
                      </TableCell>
                      <TableCell>{iface.band || "—"}</TableCell>
                      <TableCell>
                        <Tooltip title={`RSSI: ${rssi || "—"} dBm, RSRP: ${rsrp || "—"}, RSRQ: ${rsrq || "—"}, SNR: ${snr || "—"}`}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                            <LinearProgress
                              variant="determinate"
                              value={Math.min(100, Math.max(0, (rssiNum + 120) * 1.25))}
                              sx={{ width: 60, height: 8, borderRadius: 1 }}
                              color={rssiNum >= -75 ? "success" : rssiNum >= -95 ? "warning" : "error"}
                            />
                            <Typography variant="caption">{rssi || "—"} dBm</Typography>
                          </Box>
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        {conn["rx-packets"] !== undefined 
                          ? `${conn["rx-packets"]?.toLocaleString() || 0} / ${conn["tx-packets"]?.toLocaleString() || 0}`
                          : "—"}
                      </TableCell>
                      <TableCell>
                        {conn["rx-bytes"] !== undefined 
                          ? `${formatBytes(conn["rx-bytes"])} / ${formatBytes(conn["tx-bytes"])}`
                          : "—"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </AccordionDetails>
      </Accordion>

      {/* Radio Details (if available) */}
      {radios.length > 0 && (
        <Accordion expanded={expanded.radio} onChange={handleAccordionChange("radio")}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <RadioIcon color="secondary" />
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Radio Information
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Interface</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>RAT</TableCell>
                    <TableCell>Band</TableCell>
                    <TableCell>RSSI</TableCell>
                    <TableCell>RSRP</TableCell>
                    <TableCell>RSRQ</TableCell>
                    <TableCell>SNR</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {radios.map((radio, idx) => (
                    <TableRow key={idx} hover>
                      <TableCell sx={{ fontWeight: 600 }}>
                        {radio["cellular-interface-name"] || radio["if-name"] || `Radio ${idx}`}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={radio["Radio-Status"] || "—"}
                          size="small"
                          color={
                            (radio["Radio-Status"] || "").toLowerCase().includes("online") ||
                            (radio["Radio-Status"] || "").toLowerCase().includes("up")
                              ? "success"
                              : "warning"
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Chip label={radio["RAT-Selected"] || "—"} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>
                        {radio["LTE-Band"] ? `B${radio["LTE-Band"]}` : "—"}
                        {radio["LTE-Bandwidth"] && ` (${radio["LTE-Bandwidth"]})`}
                      </TableCell>
                      <TableCell>{radio.RSSI || "—"}</TableCell>
                      <TableCell>{radio.RSRP || "—"}</TableCell>
                      <TableCell>{radio.RSRQ || "—"}</TableCell>
                      <TableCell>{radio.SNR || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </AccordionDetails>
        </Accordion>
      )}

      {/* Session Details (EIOLTE) */}
      {sessions.length > 0 && (
        <Accordion expanded={expanded.session} onChange={handleAccordionChange("session")}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <CheckIcon color="success" />
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Session / Operational State
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Interface</TableCell>
                    <TableCell>Attach State</TableCell>
                    <TableCell>Data State</TableCell>
                    <TableCell>APN</TableCell>
                    <TableCell>Gateway</TableCell>
                    <TableCell>Errors (RX/TX)</TableCell>
                    <TableCell>Drops (RX/TX)</TableCell>
                    <TableCell>Uptime</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sessions.map((sess, idx) => (
                    <TableRow key={idx} hover>
                      <TableCell>{sess["if-name"] || "—"}</TableCell>
                      <TableCell>
                        <Chip
                          label={sess["attach-state"] || "—"}
                          size="small"
                          color={(sess["attach-state"] || "").toLowerCase() === "attached" ? "success" : "default"}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={sess["data-state"] || "—"}
                          size="small"
                          color={(sess["data-state"] || "").toLowerCase() === "connected" ? "success" : "warning"}
                        />
                      </TableCell>
                      <TableCell>{sess.apn || "—"}</TableCell>
                      <TableCell sx={{ fontFamily: "monospace" }}>{sess.gateway || "—"}</TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          color={(sess["rx-errors"] || 0) + (sess["tx-errors"] || 0) > 0 ? "error" : "inherit"}
                        >
                          {sess["rx-errors"] || 0} / {sess["tx-errors"] || 0}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          color={(sess["rx-drops"] || 0) + (sess["tx-drops"] || 0) > 0 ? "warning.main" : "inherit"}
                        >
                          {sess["rx-drops"] || 0} / {sess["tx-drops"] || 0}
                        </Typography>
                      </TableCell>
                      <TableCell>{sess.uptime || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </AccordionDetails>
        </Accordion>
      )}

      {/* Hardware Details */}
      {hardware.length > 0 && (
        <Accordion expanded={expanded.hardware} onChange={handleAccordionChange("hardware")}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <ModemIcon color="info" />
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Modem Hardware
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Interface</TableCell>
                    <TableCell>Carrier</TableCell>
                    <TableCell>Modem Model</TableCell>
                    <TableCell>Firmware</TableCell>
                    <TableCell>IMEI</TableCell>
                    <TableCell>ICCID</TableCell>
                    <TableCell>SIM Status</TableCell>
                    <TableCell>Temp</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {hardware.map((hw, idx) => (
                    <TableRow key={idx} hover>
                      <TableCell>{hw["if-name"] || "—"}</TableCell>
                      <TableCell>
                        <Chip label={hw.carrier || "—"} size="small" color="primary" variant="outlined" />
                      </TableCell>
                      <TableCell>{hw["modem-model"] || "—"}</TableCell>
                      <TableCell>{hw["firmware-version"] || "—"}</TableCell>
                      <TableCell sx={{ fontFamily: "monospace", fontSize: "0.75rem" }}>
                        {hw.imei || "—"}
                      </TableCell>
                      <TableCell sx={{ fontFamily: "monospace", fontSize: "0.75rem" }}>
                        {hw.iccid || "—"}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={hw["sim-status"] || "—"}
                          size="small"
                          color={(hw["sim-status"] || "").toLowerCase() === "ok" ? "success" : "warning"}
                        />
                      </TableCell>
                      <TableCell>
                        {hw.temperature ? (
                          <Chip
                            label={`${hw.temperature}°C`}
                            size="small"
                            color={hw.temperature > 70 ? "error" : hw.temperature > 50 ? "warning" : "default"}
                          />
                        ) : (
                          "—"
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </AccordionDetails>
        </Accordion>
      )}

      {/* Transport Details */}
      {transports.length > 0 && (
        <Accordion expanded={expanded.transport} onChange={handleAccordionChange("transport")}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <SpeedIcon color="secondary" />
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                SD-WAN Transport
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Interface</TableCell>
                    <TableCell>State</TableCell>
                    <TableCell>Color</TableCell>
                    <TableCell>TLOC</TableCell>
                    <TableCell>Source IP</TableCell>
                    <TableCell>Destination</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {transports.map((tr, idx) => (
                    <TableRow key={idx} hover>
                      <TableCell>{tr["if-name"] || tr.interface || "—"}</TableCell>
                      <TableCell>
                        <Chip
                          label={tr.state || "—"}
                          size="small"
                          color={(tr.state || "").toLowerCase() === "up" ? "success" : "error"}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip label={tr.color || "—"} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell sx={{ fontFamily: "monospace" }}>{tr.tloc || "—"}</TableCell>
                      <TableCell sx={{ fontFamily: "monospace" }}>{tr["src-ip"] || tr.sourceIp || "—"}</TableCell>
                      <TableCell sx={{ fontFamily: "monospace" }}>{tr["dst-ip"] || tr.destIp || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </AccordionDetails>
        </Accordion>
      )}

      {/* Not connected warning */}
      {!data.isConnected && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          Cellular interface detected but not connected. Session and hardware details may be limited.
        </Alert>
      )}
    </Box>
  );
}
