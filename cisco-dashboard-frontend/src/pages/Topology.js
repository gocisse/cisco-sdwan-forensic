import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import {
  Box,
  Typography,
  Alert,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Tooltip,
  ButtonGroup,
  Button,
} from "@mui/material";
import {
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  CenterFocusStrong as FitIcon,
  Fullscreen as FullscreenIcon,
} from "@mui/icons-material";
import cytoscape from "cytoscape";
import dagre from "cytoscape-dagre";
import { useDeviceContext } from "../context/DeviceContext";

// Register dagre layout once
cytoscape.use(dagre);

// ── Transport / tunnel color map ────────────────────────────────────────────
const transportColor = {
  "public-internet": "#E53935",
  "biz-internet": "#1E88E5",
  "3g": "#3357FF",
  lte: "#FF33A8",
  blue: "#007acc",
  green: "#43A047",
  red: "#FF0000",
  bronze: "#CD7F32",
  silver: "#C0C0C0",
  gold: "#FFD700",
  custom1: "#8A2BE2",
  custom2: "#FF8C00",
  custom3: "#20B2AA",
  mpls: "#F4A460",
  "metro-ethernet": "#8A2BE2",
  private1: "#FFA500",
  private2: "#A52A2A",
  default: "#78909C",
};

// ── Device role → styling ───────────────────────────────────────────────────
const CONTROL_ROLES = ["vmanage", "vsmart", "vbond"];

const roleStyle = {
  vmanage:  { bg: "#B71C1C", border: "#FF5252", icon: "🖥️", shape: "round-rectangle" },
  vsmart:   { bg: "#0D47A1", border: "#448AFF", icon: "🧠", shape: "round-rectangle" },
  vbond:    { bg: "#E65100", border: "#FF9100", icon: "🔗", shape: "diamond" },
  vedge:    { bg: "#1B5E20", border: "#69F0AE", icon: "📡", shape: "ellipse" },
  cedge:    { bg: "#1B5E20", border: "#69F0AE", icon: "📡", shape: "ellipse" },
  unknown:  { bg: "#37474F", border: "#78909C", icon: "❓", shape: "ellipse" },
};

function getRoleKey(dev) {
  if (!dev) return "unknown";
  const dt = (dev["device-type"] || dev.personality || "").toLowerCase();
  if (dt.includes("vmanage")) return "vmanage";
  if (dt.includes("vsmart")) return "vsmart";
  if (dt.includes("vbond")) return "vbond";
  if (dt.includes("cedge") || dt.includes("c8000")) return "cedge";
  if (dt.includes("vedge") || dt.includes("edge")) return "vedge";
  return "unknown";
}

function isUp(dev) {
  if (!dev) return false;
  const r = (dev.reachability || "").toLowerCase();
  return r === "reachable";
}

// ── Cytoscape stylesheet ────────────────────────────────────────────────────
const cyStylesheet = [
  // ─ Nodes ─
  {
    selector: "node",
    style: {
      label: "data(label)",
      width: 50,
      height: 50,
      "background-color": "data(bgColor)",
      "border-width": 3,
      "border-color": "data(borderColor)",
      shape: "data(shape)",
      "font-weight": 600,
      "font-family": "'Inter', 'Roboto', sans-serif",
      color: "#E0E0E0",
      "text-outline-width": 2,
      "text-outline-color": "#0d1117",
      "text-outline-opacity": 0.9,
      "min-zoomed-font-size": 8,
      "overlay-padding": 6,
      "z-index": 10,
      content: "data(icon)",
      "text-valign": "center",
      "text-halign": "center",
      "font-size": 22,
    },
  },
  // Control-plane nodes are larger
  {
    selector: "node.control",
    style: {
      width: 64,
      height: 64,
      "font-size": 28,
      "border-width": 4,
    },
  },
  // Status glow: reachable
  {
    selector: "node.up",
    style: {
      "border-color": "#00E676",
      "shadow-blur": 12,
      "shadow-color": "#00E676",
      "shadow-opacity": 0.6,
    },
  },
  // Status glow: unreachable
  {
    selector: "node.down",
    style: {
      "border-color": "#FF1744",
      "shadow-blur": 12,
      "shadow-color": "#FF1744",
      "shadow-opacity": 0.8,
    },
  },
  // Label shown below node (second label via a dedicated class)
  {
    selector: "node.showLabel",
    style: {
      label: "data(label)",
      "text-valign": "bottom",
      "text-halign": "center",
      "text-margin-y": 8,
      "font-size": 10,
      "font-weight": 500,
    },
  },
  // ─ Edges: Data / BFD (solid) ─
  {
    selector: "edge",
    style: {
      width: 2,
      "line-color": "data(color)",
      "target-arrow-color": "data(color)",
      "target-arrow-shape": "triangle",
      "arrow-scale": 0.7,
      "curve-style": "bezier",
      opacity: 0.75,
      "overlay-padding": 4,
    },
  },
  // Control connections: dashed
  {
    selector: "edge.control",
    style: {
      "line-style": "dashed",
      "line-dash-pattern": [6, 4],
      width: 1.5,
      opacity: 0.55,
      "target-arrow-shape": "none",
    },
  },
  // Edge state = down
  {
    selector: "edge.down",
    style: {
      "line-color": "#FF1744",
      "target-arrow-color": "#FF1744",
      width: 3,
      opacity: 1,
    },
  },
  // ─ Highlight & Dim ─
  {
    selector: "node.dimmed",
    style: { opacity: 0.12 },
  },
  {
    selector: "edge.dimmed",
    style: { opacity: 0.06 },
  },
  {
    selector: "node.highlighted",
    style: {
      opacity: 1,
      "border-width": 5,
      "z-index": 999,
    },
  },
  {
    selector: "edge.highlighted",
    style: {
      opacity: 1,
      width: 3.5,
      "z-index": 999,
    },
  },
  {
    selector: "node.selected-node",
    style: {
      "border-width": 6,
      "border-color": "#FFD600",
      "shadow-blur": 20,
      "shadow-color": "#FFD600",
      "shadow-opacity": 0.9,
      "z-index": 9999,
    },
  },
];

// ── Legend data ──────────────────────────────────────────────────────────────
const legendItems = [
  { label: "vManage", color: roleStyle.vmanage.bg, border: roleStyle.vmanage.border },
  { label: "vSmart", color: roleStyle.vsmart.bg, border: roleStyle.vsmart.border },
  { label: "vBond", color: roleStyle.vbond.bg, border: roleStyle.vbond.border },
  { label: "vEdge / cEdge", color: roleStyle.vedge.bg, border: roleStyle.vedge.border },
  { type: "divider" },
  { label: "biz-internet", color: transportColor["biz-internet"], edge: true },
  { label: "public-internet", color: transportColor["public-internet"], edge: true },
  { label: "mpls", color: transportColor.mpls, edge: true },
  { label: "gold", color: transportColor.gold, edge: true },
  { label: "silver", color: transportColor.silver, edge: true },
  { type: "divider" },
  { label: "Up", color: "#00E676", status: true },
  { label: "Down", color: "#FF1744", status: true },
];

// ═════════════════════════════════════════════════════════════════════════════
// Component
// ═════════════════════════════════════════════════════════════════════════════
export default function Topology() {
  const { selectedDevice, devices } = useDeviceContext();
  const [error, setError] = useState("");
  const [rawData, setRawData] = useState([]);
  const [selectedNodeInfo, setSelectedNodeInfo] = useState(null);
  const [tooltip, setTooltip] = useState(null);

  const cyRef = useRef(null);
  const containerRef = useRef(null);
  const activeIp = selectedDevice ? selectedDevice["system-ip"] : null;

  // ── Device lookup map ──
  const deviceMap = useMemo(() => {
    const m = {};
    (devices || []).forEach((d) => { m[d["system-ip"]] = d; });
    return m;
  }, [devices]);

  // ── Fetch BFD topology data ──
  const fetchTopology = useCallback(async () => {
    if (!activeIp) return;
    setError("");
    setSelectedNodeInfo(null);
    setTooltip(null);
    try {
      const res = await fetch(`/api/topology/${activeIp}`);
      if (!res.ok) throw new Error(`Error: ${res.status}`);
      const data = await res.json();
      setRawData(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      console.error("Failed to fetch topology data:", err);
      setError("Failed to fetch topology data");
    }
  }, [activeIp]);

  useEffect(() => {
    if (activeIp) fetchTopology();
  }, [activeIp, fetchTopology]);

  // ── Build Cytoscape elements from raw BFD data ──
  const elements = useMemo(() => {
    if (!rawData.length) return [];
    const nodesMap = {};
    const edges = [];

    rawData.forEach((bfd, idx) => {
      const src = bfd["system-ip"] || bfd["src-ip"];
      const dst = bfd["dst-ip"];
      if (!src || !dst) return;

      // Build nodes
      [src, dst].forEach((ip) => {
        if (nodesMap[ip]) return;
        const dev = deviceMap[ip];
        const role = getRoleKey(dev);
        const style = roleStyle[role] || roleStyle.unknown;
        const hostname = dev ? (dev["host-name"] || ip) : ip;
        const classes = [];
        if (CONTROL_ROLES.includes(role)) classes.push("control");
        classes.push(isUp(dev) ? "up" : "down");

        nodesMap[ip] = {
          data: {
            id: ip,
            label: hostname,
            role,
            bgColor: style.bg,
            borderColor: isUp(dev) ? "#00E676" : "#FF1744",
            shape: style.shape,
            icon: style.icon,
            systemIp: ip,
            hostname,
            status: isUp(dev) ? "reachable" : "unreachable",
            deviceType: dev ? (dev["device-type"] || dev.personality || "N/A") : "N/A",
            siteId: dev ? (dev["site-id"] || "N/A") : "N/A",
          },
          classes: classes.join(" "),
        };
      });

      // Build edge
      const color = (bfd["color"] || "").toLowerCase();
      const edgeColor = transportColor[color] || transportColor.default;
      const srcRole = getRoleKey(deviceMap[src]);
      const dstRole = getRoleKey(deviceMap[dst]);
      const isControl = CONTROL_ROLES.includes(srcRole) || CONTROL_ROLES.includes(dstRole);
      const state = (bfd["state"] || "").toLowerCase();
      const classes = [];
      if (isControl) classes.push("control");
      if (state === "down") classes.push("down");

      edges.push({
        data: {
          id: `e-${idx}`,
          source: src,
          target: dst,
          color: edgeColor,
          transport: color || "unknown",
          state: bfd["state"] || "N/A",
        },
        classes: classes.join(" "),
      });
    });

    return [...Object.values(nodesMap), ...edges];
  }, [rawData, deviceMap]);

  // ── Initialize / update Cytoscape ──
  useEffect(() => {
    if (!containerRef.current || !elements.length) return;

    // Destroy previous instance
    if (cyRef.current) {
      cyRef.current.destroy();
      cyRef.current = null;
    }

    const cy = cytoscape({
      container: containerRef.current,
      elements,
      style: cyStylesheet,
      layout: {
        name: "dagre",
        rankDir: "TB",
        rankSep: 120,
        nodeSep: 60,
        edgeSep: 20,
        padding: 40,
        animate: true,
        animationDuration: 600,
        // Place control-plane nodes at the top
        sort: (a, b) => {
          const aCtrl = a.hasClass("control") ? 0 : 1;
          const bCtrl = b.hasClass("control") ? 0 : 1;
          return aCtrl - bCtrl;
        },
      },
      minZoom: 0.2,
      maxZoom: 4,
      wheelSensitivity: 0.3,
    });

    // After layout, add labels below icons
    cy.on("layoutstop", () => {
      cy.nodes().addClass("showLabel");
    });

    // ── Tap interaction: highlight neighborhood ──
    cy.on("tap", "node", (evt) => {
      const node = evt.target;
      const nodeData = node.data();

      // Reset previous highlights
      cy.elements().removeClass("highlighted dimmed selected-node");

      // Highlight neighborhood
      const neighborhood = node.neighborhood().add(node);
      cy.elements().not(neighborhood).addClass("dimmed");
      neighborhood.addClass("highlighted");
      node.addClass("selected-node");

      // Show detail panel
      const sessions = rawData.filter(
        (s) => (s["system-ip"] || s["src-ip"]) === nodeData.id || s["dst-ip"] === nodeData.id
      );
      setSelectedNodeInfo({ ...nodeData, sessions });

      // Show tooltip
      const renderedPos = node.renderedPosition();
      const containerRect = containerRef.current.getBoundingClientRect();
      setTooltip({
        x: containerRect.left + renderedPos.x,
        y: containerRect.top + renderedPos.y - 60,
        data: nodeData,
      });
    });

    // Tap on background: clear selection
    cy.on("tap", (evt) => {
      if (evt.target === cy) {
        cy.elements().removeClass("highlighted dimmed selected-node");
        setTooltip(null);
      }
    });

    // ── Mouseover tooltip ──
    cy.on("mouseover", "node", (evt) => {
      const node = evt.target;
      const renderedPos = node.renderedPosition();
      const containerRect = containerRef.current.getBoundingClientRect();
      if (!node.hasClass("selected-node")) {
        setTooltip({
          x: containerRect.left + renderedPos.x,
          y: containerRect.top + renderedPos.y - 60,
          data: node.data(),
        });
      }
      containerRef.current.style.cursor = "pointer";
    });

    cy.on("mouseout", "node", (evt) => {
      if (!evt.target.hasClass("selected-node")) {
        setTooltip(null);
      }
      containerRef.current.style.cursor = "default";
    });

    cyRef.current = cy;

    return () => {
      if (cyRef.current) {
        cyRef.current.destroy();
        cyRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elements]);

  // ── Toolbar actions ──
  const handleZoomIn = () => cyRef.current?.zoom(cyRef.current.zoom() * 1.3);
  const handleZoomOut = () => cyRef.current?.zoom(cyRef.current.zoom() / 1.3);
  const handleFit = () => cyRef.current?.fit(undefined, 40);
  const handleFullscreen = () => {
    if (containerRef.current?.requestFullscreen) containerRef.current.requestFullscreen();
  };

  return (
    <Box>
      {/* ── Header ── */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, flexWrap: "wrap", gap: 1 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Network Topology</Typography>
          <Typography variant="caption" color="text.secondary">
            BFD Sessions — Cytoscape Directed Graph (dagre layout)
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", alignItems: "center" }}>
          {legendItems.map((l, i) =>
            l.type === "divider" ? (
              <Box key={i} sx={{ width: 1, height: 20, bgcolor: "divider", mx: 0.5 }} />
            ) : l.edge ? (
              <Chip key={l.label} label={l.label} size="small" sx={{ bgcolor: "transparent", color: l.color, border: `2px solid ${l.color}`, fontWeight: 600, fontSize: "0.65rem" }} />
            ) : l.status ? (
              <Chip key={l.label} label={l.label} size="small" sx={{ bgcolor: l.color, color: "#fff", fontWeight: 700, fontSize: "0.65rem" }} />
            ) : (
              <Chip key={l.label} label={l.label} size="small" sx={{ bgcolor: l.color, color: "#fff", border: `2px solid ${l.border}`, fontWeight: 600, fontSize: "0.65rem" }} />
            )
          )}
        </Box>
      </Box>

      {!activeIp && <Alert severity="info">Select a device from the global search bar to visualize its topology.</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* ── Cytoscape Canvas ── */}
      {activeIp && elements.length > 0 && (
        <Paper variant="outlined" sx={{ position: "relative", width: "100%", height: 650, mb: 2, overflow: "hidden", bgcolor: "#0d1117", borderColor: "#30363d" }}>
          {/* Toolbar */}
          <Box sx={{ position: "absolute", top: 12, right: 12, zIndex: 10 }}>
            <ButtonGroup size="small" variant="contained" sx={{ bgcolor: "rgba(13,17,23,0.85)", "& .MuiButton-root": { color: "#E0E0E0", borderColor: "#30363d", minWidth: 36, "&:hover": { bgcolor: "#21262d" } } }}>
              <Tooltip title="Zoom In"><Button onClick={handleZoomIn}><ZoomInIcon fontSize="small" /></Button></Tooltip>
              <Tooltip title="Zoom Out"><Button onClick={handleZoomOut}><ZoomOutIcon fontSize="small" /></Button></Tooltip>
              <Tooltip title="Fit to View"><Button onClick={handleFit}><FitIcon fontSize="small" /></Button></Tooltip>
              <Tooltip title="Fullscreen"><Button onClick={handleFullscreen}><FullscreenIcon fontSize="small" /></Button></Tooltip>
            </ButtonGroup>
          </Box>

          {/* Canvas */}
          <Box ref={containerRef} sx={{ width: "100%", height: "100%" }} />

          {/* Floating tooltip */}
          {tooltip && (
            <Box
              sx={{
                position: "fixed",
                left: tooltip.x,
                top: tooltip.y,
                transform: "translate(-50%, -100%)",
                bgcolor: "rgba(13,17,23,0.95)",
                border: "1px solid #30363d",
                borderRadius: 1.5,
                px: 1.5,
                py: 1,
                zIndex: 9999,
                pointerEvents: "none",
                minWidth: 180,
                boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
              }}
            >
              <Typography variant="subtitle2" sx={{ color: "#fff", fontWeight: 700 }}>{tooltip.data.hostname || tooltip.data.id}</Typography>
              <Typography variant="caption" sx={{ color: "#8b949e", display: "block" }}>System IP: {tooltip.data.systemIp || tooltip.data.id}</Typography>
              <Typography variant="caption" sx={{ color: "#8b949e", display: "block" }}>Type: {tooltip.data.deviceType}</Typography>
              <Typography variant="caption" sx={{ color: "#8b949e", display: "block" }}>Site: {tooltip.data.siteId}</Typography>
              <Chip
                label={tooltip.data.status || "unknown"}
                size="small"
                sx={{
                  mt: 0.5,
                  fontWeight: 700,
                  fontSize: "0.65rem",
                  bgcolor: tooltip.data.status === "reachable" ? "#00E676" : "#FF1744",
                  color: "#000",
                }}
              />
            </Box>
          )}
        </Paper>
      )}

      {activeIp && elements.length === 0 && !error && (
        <Alert severity="info">No BFD session data available for this device.</Alert>
      )}

      {/* ── Session Detail Panel ── */}
      {selectedNodeInfo && (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
            <Typography variant="h6">
              {selectedNodeInfo.hostname || selectedNodeInfo.id}
            </Typography>
            <Chip label={selectedNodeInfo.systemIp || selectedNodeInfo.id} size="small" variant="outlined" />
            <Chip
              label={selectedNodeInfo.status || "unknown"}
              size="small"
              color={selectedNodeInfo.status === "reachable" ? "success" : "error"}
            />
            <Chip label={selectedNodeInfo.deviceType || "N/A"} size="small" variant="outlined" />
            <Chip label={`Site ${selectedNodeInfo.siteId || "N/A"}`} size="small" variant="outlined" />
          </Box>

          {selectedNodeInfo.sessions && selectedNodeInfo.sessions.length > 0 ? (
            <TableContainer sx={{ maxHeight: 350 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Device Name</TableCell>
                    <TableCell>Hostname</TableCell>
                    <TableCell>State</TableCell>
                    <TableCell>Transport</TableCell>
                    <TableCell>Proto</TableCell>
                    <TableCell>Src IP</TableCell>
                    <TableCell>Dst IP</TableCell>
                    <TableCell>Last Updated</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedNodeInfo.sessions.map((s, i) => (
                    <TableRow key={i} hover>
                      <TableCell>{s["vdevice-name"] || "—"}</TableCell>
                      <TableCell>{s["vdevice-host-name"] || "—"}</TableCell>
                      <TableCell>
                        <Chip
                          label={s["state"] || "—"}
                          size="small"
                          color={(s["state"] || "").toLowerCase() === "up" ? "success" : "error"}
                          variant="outlined"
                          sx={{ fontSize: "0.7rem" }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={s["color"] || "—"}
                          size="small"
                          sx={{
                            bgcolor: transportColor[(s["color"] || "").toLowerCase()] || "#78909C",
                            color: "#fff",
                            fontSize: "0.7rem",
                            fontWeight: 600,
                          }}
                        />
                      </TableCell>
                      <TableCell>{s["proto"] || "—"}</TableCell>
                      <TableCell sx={{ fontFamily: "monospace", fontSize: "0.8rem" }}>{s["src-ip"] || "—"}</TableCell>
                      <TableCell sx={{ fontFamily: "monospace", fontSize: "0.8rem" }}>{s["dst-ip"] || "—"}</TableCell>
                      <TableCell>{s["lastupdated"] ? new Date(s["lastupdated"]).toLocaleString() : "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Alert severity="info">No sessions found for this node.</Alert>
          )}
        </Paper>
      )}
    </Box>
  );
}
