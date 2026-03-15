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
  ToggleButton,
  ToggleButtonGroup,
  CircularProgress,
} from "@mui/material";
import {
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  CenterFocusStrong as FitIcon,
  Fullscreen as FullscreenIcon,
  AccountTree as ControlIcon,
  Hub as BfdIcon,
} from "@mui/icons-material";
import cytoscape from "cytoscape";
import dagre from "cytoscape-dagre";
import { useDeviceContext } from "../context/DeviceContext";

// Register dagre layout once
if (!cytoscape._dagreRegistered) {
  cytoscape.use(dagre);
  cytoscape._dagreRegistered = true;
}

// ── Transport / tunnel color map ────────────────────────────────────────────
const TRANSPORT_COLOR = {
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

// ── Device role helpers ─────────────────────────────────────────────────────
const CONTROL_ROLES = ["vmanage", "vsmart", "vbond"];

const ROLE_STYLE = {
  vmanage: { bg: "#B71C1C", border: "#FF5252", icon: "\u{1F5A5}\uFE0F", shape: "round-rectangle" },
  vsmart:  { bg: "#0D47A1", border: "#448AFF", icon: "\u{1F9E0}", shape: "round-rectangle" },
  vbond:   { bg: "#E65100", border: "#FF9100", icon: "\u{1F517}", shape: "diamond" },
  vedge:   { bg: "#1B5E20", border: "#69F0AE", icon: "\u{1F4E1}", shape: "ellipse" },
  cedge:   { bg: "#1B5E20", border: "#69F0AE", icon: "\u{1F4E1}", shape: "ellipse" },
  unknown: { bg: "#37474F", border: "#78909C", icon: "\u2753", shape: "ellipse" },
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

function devIsUp(dev) {
  return dev && (dev.reachability || "").toLowerCase() === "reachable";
}

function makeNode(dev, ip) {
  const role = getRoleKey(dev);
  const s = ROLE_STYLE[role] || ROLE_STYLE.unknown;
  const up = devIsUp(dev);
  const hostname = dev ? (dev["host-name"] || ip) : ip;
  const classes = [];
  if (CONTROL_ROLES.includes(role)) classes.push("control");
  classes.push(up ? "up" : "down");

  return {
    data: {
      id: ip,
      label: hostname,
      role,
      bgColor: s.bg,
      borderColor: up ? "#00E676" : "#FF1744",
      shape: s.shape,
      icon: s.icon,
      systemIp: ip,
      hostname,
      status: up ? "reachable" : "unreachable",
      deviceType: dev ? (dev["device-type"] || dev.personality || "N/A") : "N/A",
      siteId: dev ? (dev["site-id"] || "N/A") : "N/A",
    },
    classes: classes.join(" "),
  };
}

// ── Cytoscape stylesheet ────────────────────────────────────────────────────
const CY_STYLE = [
  {
    selector: "node",
    style: {
      content: "data(icon)", width: 50, height: 50,
      "background-color": "data(bgColor)", "border-width": 3, "border-color": "data(borderColor)",
      shape: "data(shape)", "font-weight": 600,
      "font-family": "'Inter', 'Roboto', sans-serif",
      color: "#E0E0E0", "text-outline-width": 2, "text-outline-color": "#0d1117",
      "text-outline-opacity": 0.9, "min-zoomed-font-size": 8, "overlay-padding": 6,
      "z-index": 10, "text-valign": "center", "text-halign": "center", "font-size": 22,
    },
  },
  { selector: "node.control", style: { width: 64, height: 64, "font-size": 28, "border-width": 4 } },
  { selector: "node.up", style: { "border-color": "#00E676", "shadow-blur": 12, "shadow-color": "#00E676", "shadow-opacity": 0.6 } },
  { selector: "node.down", style: { "border-color": "#FF1744", "shadow-blur": 12, "shadow-color": "#FF1744", "shadow-opacity": 0.8 } },
  { selector: "node.showLabel", style: { label: "data(label)", "text-valign": "bottom", "text-halign": "center", "text-margin-y": 8, "font-size": 10, "font-weight": 500 } },
  { selector: "node.center", style: { width: 80, height: 80, "font-size": 32, "border-width": 5, "border-color": "#FFD600", "shadow-blur": 24, "shadow-color": "#FFD600", "shadow-opacity": 0.9, "z-index": 9999 } },
  {
    selector: "edge",
    style: {
      width: 2, "line-color": "data(color)", "target-arrow-color": "data(color)",
      "target-arrow-shape": "triangle", "arrow-scale": 0.7, "curve-style": "bezier",
      opacity: 0.75, "overlay-padding": 4,
    },
  },
  { selector: "edge.control", style: { "line-style": "dashed", "line-dash-pattern": [6, 4], width: 1.5, opacity: 0.55, "target-arrow-shape": "none" } },
  { selector: "edge.down", style: { "line-color": "#FF1744", "target-arrow-color": "#FF1744", width: 3, opacity: 1 } },
  { selector: "edge.bfd", style: { width: 2.5, opacity: 0.85, "target-arrow-shape": "none" } },
  { selector: "node.dimmed", style: { opacity: 0.12 } },
  { selector: "edge.dimmed", style: { opacity: 0.06 } },
  { selector: "node.highlighted", style: { opacity: 1, "border-width": 5, "z-index": 999 } },
  { selector: "edge.highlighted", style: { opacity: 1, width: 3.5, "z-index": 999 } },
  { selector: "node.selected-node", style: { "border-width": 6, "border-color": "#FFD600", "shadow-blur": 20, "shadow-color": "#FFD600", "shadow-opacity": 0.9, "z-index": 9999 } },
];

// ═════════════════════════════════════════════════════════════════════════════
// Component
// ═════════════════════════════════════════════════════════════════════════════
export default function Topology() {
  const { selectedDevice, devices, selectDeviceByIp } = useDeviceContext();
  const [view, setView] = useState("control");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [controlData, setControlData] = useState({});
  const [bfdData, setBfdData] = useState([]);
  const [selectedNodeInfo, setSelectedNodeInfo] = useState(null);
  const [tooltip, setTooltip] = useState(null);

  const cyRef = useRef(null);
  const containerRef = useRef(null);
  const activeIp = selectedDevice ? selectedDevice["system-ip"] : null;

  const deviceMap = useMemo(() => {
    const m = {};
    (devices || []).forEach((d) => { m[d["system-ip"]] = d; });
    return m;
  }, [devices]);

  const { controllers, edgeDevices } = useMemo(() => {
    const ctrl = [];
    const edg = [];
    (devices || []).forEach((d) => {
      const role = getRoleKey(d);
      if (CONTROL_ROLES.includes(role)) ctrl.push(d);
      else edg.push(d);
    });
    return { controllers: ctrl, edgeDevices: edg };
  }, [devices]);

  // ── VIEW A: Fetch control connections for all controllers ──
  const fetchControlPlane = useCallback(async () => {
    if (!controllers.length) return;
    setLoading(true);
    setError("");
    setControlData({});
    const results = {};

    const fetches = controllers.map(async (ctrl) => {
      const ip = ctrl["system-ip"];
      try {
        const res = await fetch(`/api/connections/${ip}`);
        if (!res.ok) return;
        const json = await res.json();
        results[ip] = Array.isArray(json) ? json : json.data || [];
      } catch (e) {
        console.warn(`Control connections fetch failed for ${ip}:`, e);
      }
    });

    await Promise.all(fetches);
    setControlData(results);
    setLoading(false);
  }, [controllers]);

  useEffect(() => {
    if (view === "control" && controllers.length > 0) fetchControlPlane();
  }, [view, controllers, fetchControlPlane]);

  // ── VIEW B: Fetch BFD sessions for selected device ──
  const fetchBfd = useCallback(async (ip) => {
    if (!ip) return;
    setLoading(true);
    setError("");
    setBfdData([]);
    try {
      const res = await fetch(`/api/topology/${ip}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setBfdData(Array.isArray(json) ? json : json.data || []);
    } catch (e) {
      console.error("BFD fetch error:", e);
      setError("Failed to fetch BFD sessions");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (view === "bfd" && activeIp) fetchBfd(activeIp);
  }, [view, activeIp, fetchBfd]);

  // ── Build Control Plane elements ──
  const controlElements = useMemo(() => {
    if (view !== "control") return [];
    const nodesMap = {};
    const edgesList = [];

    controllers.forEach((d) => { nodesMap[d["system-ip"]] = makeNode(d, d["system-ip"]); });
    edgeDevices.forEach((d) => { nodesMap[d["system-ip"]] = makeNode(d, d["system-ip"]); });

    const edgeIdSet = new Set();
    Object.entries(controlData).forEach(([ctrlIp, connections]) => {
      (connections || []).forEach((conn) => {
        const peerIp = conn["system-ip"] || conn["peer-system-ip"] || conn["peer"];
        if (!peerIp || !nodesMap[peerIp]) return;
        const edgeKey = [ctrlIp, peerIp].sort().join("--");
        if (edgeIdSet.has(edgeKey)) return;
        edgeIdSet.add(edgeKey);

        const state = (conn["state"] || conn["peer-state"] || "").toLowerCase();
        const classes = ["control"];
        if (state === "down" || state === "connect" || state === "invalid") classes.push("down");

        edgesList.push({
          data: {
            id: `ctrl-${edgeKey}`,
            source: ctrlIp,
            target: peerIp,
            color: state.includes("up") || state === "operational" ? "#448AFF" : "#FF1744",
            transport: "control",
            state: conn["state"] || conn["peer-state"] || "N/A",
          },
          classes: classes.join(" "),
        });
      });
    });

    return [...Object.values(nodesMap), ...edgesList];
  }, [view, controllers, edgeDevices, controlData]);

  // ── Build BFD Star elements ──
  const bfdElements = useMemo(() => {
    if (view !== "bfd" || !bfdData.length || !activeIp) return [];
    const nodesMap = {};
    const edgesList = [];

    const centerDev = deviceMap[activeIp];
    const centerNode = makeNode(centerDev, activeIp);
    centerNode.classes += " center";
    nodesMap[activeIp] = centerNode;

    const seen = new Set();
    bfdData.forEach((bfd, idx) => {
      const dst = bfd["dst-ip"];
      if (!dst) return;

      if (!nodesMap[dst]) {
        nodesMap[dst] = makeNode(deviceMap[dst], dst);
      }

      const color = (bfd["color"] || "").toLowerCase();
      const pairKey = `${activeIp}-${dst}-${color}`;
      if (seen.has(pairKey)) return;
      seen.add(pairKey);

      const edgeColor = TRANSPORT_COLOR[color] || TRANSPORT_COLOR.default;
      const state = (bfd["state"] || "").toLowerCase();
      const classes = ["bfd"];
      if (state === "down") classes.push("down");

      edgesList.push({
        data: {
          id: `bfd-${idx}`,
          source: activeIp,
          target: dst,
          color: edgeColor,
          transport: color || "unknown",
          state: bfd["state"] || "N/A",
        },
        classes: classes.join(" "),
      });
    });

    return [...Object.values(nodesMap), ...edgesList];
  }, [view, bfdData, activeIp, deviceMap]);

  const elements = view === "control" ? controlElements : bfdElements;

  // ── Peer count for badge ──
  const peerCount = useMemo(() => {
    if (view !== "bfd" || !bfdElements.length) return 0;
    return bfdElements.filter((el) => el.data && !el.data.source && el.data.id !== activeIp).length;
  }, [view, bfdElements, activeIp]);

  // ── Initialize Cytoscape ──
  useEffect(() => {
    if (!containerRef.current || !elements.length) {
      if (cyRef.current) { cyRef.current.destroy(); cyRef.current = null; }
      return;
    }
    if (cyRef.current) { cyRef.current.destroy(); cyRef.current = null; }

    const layoutConfig = view === "control"
      ? {
          name: "dagre", rankDir: "TB", rankSep: 100, nodeSep: 40, edgeSep: 15, padding: 30,
          animate: true, animationDuration: 500,
          sort: (a, b) => (a.hasClass("control") ? 0 : 1) - (b.hasClass("control") ? 0 : 1),
        }
      : {
          name: "concentric",
          concentric: (node) => (node.hasClass("center") ? 10 : 1),
          levelWidth: () => 1,
          minNodeSpacing: 60, padding: 50, animate: true, animationDuration: 500,
        };

    const cy = cytoscape({
      container: containerRef.current,
      elements,
      style: CY_STYLE,
      layout: layoutConfig,
      minZoom: 0.15, maxZoom: 4, wheelSensitivity: 0.3,
    });

    cy.on("layoutstop", () => { cy.nodes().addClass("showLabel"); });

    // Tap node: highlight neighborhood
    cy.on("tap", "node", (evt) => {
      const node = evt.target;
      const nd = node.data();
      cy.elements().removeClass("highlighted dimmed selected-node");
      const neighborhood = node.neighborhood().add(node);
      cy.elements().not(neighborhood).addClass("dimmed");
      neighborhood.addClass("highlighted");
      node.addClass("selected-node");

      const sessions = (view === "bfd" ? bfdData : []).filter(
        (s) => (s["system-ip"] || s["src-ip"]) === nd.id || s["dst-ip"] === nd.id
      );
      setSelectedNodeInfo({ ...nd, sessions });

      const rp = node.renderedPosition();
      const rect = containerRef.current.getBoundingClientRect();
      setTooltip({ x: rect.left + rp.x, y: rect.top + rp.y - 60, data: nd });
    });

    // Double-tap in View A → switch to BFD for that device
    cy.on("dbltap", "node", (evt) => {
      if (view !== "control") return;
      const ip = evt.target.data().systemIp;
      if (ip) {
        selectDeviceByIp(ip);
        setView("bfd");
      }
    });

    cy.on("tap", (evt) => {
      if (evt.target === cy) {
        cy.elements().removeClass("highlighted dimmed selected-node");
        setTooltip(null);
        setSelectedNodeInfo(null);
      }
    });

    cy.on("mouseover", "node", (evt) => {
      const node = evt.target;
      if (!node.hasClass("selected-node")) {
        const rp = node.renderedPosition();
        const rect = containerRef.current.getBoundingClientRect();
        setTooltip({ x: rect.left + rp.x, y: rect.top + rp.y - 60, data: node.data() });
      }
      containerRef.current.style.cursor = "pointer";
    });

    cy.on("mouseout", "node", (evt) => {
      if (!evt.target.hasClass("selected-node")) setTooltip(null);
      containerRef.current.style.cursor = "default";
    });

    cyRef.current = cy;
    return () => { if (cyRef.current) { cyRef.current.destroy(); cyRef.current = null; } };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elements, view]);

  // Toolbar
  const handleZoomIn = () => cyRef.current?.zoom(cyRef.current.zoom() * 1.3);
  const handleZoomOut = () => cyRef.current?.zoom(cyRef.current.zoom() / 1.3);
  const handleFit = () => cyRef.current?.fit(undefined, 40);
  const handleFullscreen = () => { if (containerRef.current?.requestFullscreen) containerRef.current.requestFullscreen(); };

  const handleViewChange = (_, newView) => {
    if (!newView) return;
    setSelectedNodeInfo(null);
    setTooltip(null);
    setError("");
    setView(newView);
  };

  // Legend
  const legendItems = view === "control"
    ? [
        { label: "vManage", color: ROLE_STYLE.vmanage.bg, border: ROLE_STYLE.vmanage.border },
        { label: "vSmart", color: ROLE_STYLE.vsmart.bg, border: ROLE_STYLE.vsmart.border },
        { label: "vBond", color: ROLE_STYLE.vbond.bg, border: ROLE_STYLE.vbond.border },
        { label: "vEdge / cEdge", color: ROLE_STYLE.vedge.bg, border: ROLE_STYLE.vedge.border },
        { type: "divider" },
        { label: "Reachable", color: "#00E676", status: true },
        { label: "Unreachable", color: "#FF1744", status: true },
        { type: "divider" },
        { label: "Double-click node \u2192 BFD view", info: true },
      ]
    : [
        { label: "Selected Device", color: "#FFD600", border: "#FFD600" },
        { label: "Peer", color: ROLE_STYLE.vedge.bg, border: ROLE_STYLE.vedge.border },
        { type: "divider" },
        { label: "biz-internet", color: TRANSPORT_COLOR["biz-internet"], edge: true },
        { label: "public-internet", color: TRANSPORT_COLOR["public-internet"], edge: true },
        { label: "mpls", color: TRANSPORT_COLOR.mpls, edge: true },
        { label: "gold", color: TRANSPORT_COLOR.gold, edge: true },
        { label: "silver", color: TRANSPORT_COLOR.silver, edge: true },
        { type: "divider" },
        { label: "Up", color: "#00E676", status: true },
        { label: "Down", color: "#FF1744", status: true },
      ];

  const viewDescription = view === "control"
    ? "Control Plane Hierarchy \u2014 Controllers (top) \u2192 Edge Devices (bottom)"
    : activeIp
      ? `BFD Star Topology \u2014 ${selectedDevice?.["host-name"] || activeIp} and its direct tunnel peers`
      : "Select a device to view its BFD tunnels";

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2, flexWrap: "wrap", gap: 1 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Network Topology</Typography>
          <Typography variant="caption" color="text.secondary">{viewDescription}</Typography>
        </Box>
        <ToggleButtonGroup value={view} exclusive onChange={handleViewChange} size="small"
          sx={{ "& .MuiToggleButton-root": { textTransform: "none", fontWeight: 600, px: 2 } }}>
          <ToggleButton value="control">
            <ControlIcon sx={{ mr: 0.5, fontSize: 18 }} /> Control Plane
          </ToggleButton>
          <ToggleButton value="bfd">
            <BfdIcon sx={{ mr: 0.5, fontSize: 18 }} /> BFD Tunnels
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Legend */}
      <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", alignItems: "center", mb: 2 }}>
        {legendItems.map((l, i) =>
          l.type === "divider" ? (
            <Box key={i} sx={{ width: 1, height: 20, bgcolor: "divider", mx: 0.5 }} />
          ) : l.info ? (
            <Chip key={i} label={l.label} size="small" variant="outlined" color="info" sx={{ fontSize: "0.65rem", fontStyle: "italic" }} />
          ) : l.edge ? (
            <Chip key={l.label} label={l.label} size="small" sx={{ bgcolor: "transparent", color: l.color, border: `2px solid ${l.color}`, fontWeight: 600, fontSize: "0.65rem" }} />
          ) : l.status ? (
            <Chip key={l.label} label={l.label} size="small" sx={{ bgcolor: l.color, color: "#fff", fontWeight: 700, fontSize: "0.65rem" }} />
          ) : (
            <Chip key={l.label} label={l.label} size="small" sx={{ bgcolor: l.color, color: "#fff", border: `2px solid ${l.border}`, fontWeight: 600, fontSize: "0.65rem" }} />
          )
        )}
      </Box>

      {/* Alerts */}
      {view === "bfd" && !activeIp && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Select a device from the global search bar &mdash; or double-click a node in the Control Plane view &mdash; to see its BFD tunnel topology.
        </Alert>
      )}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Cytoscape Canvas */}
      <Paper variant="outlined" sx={{ position: "relative", width: "100%", height: 650, mb: 2, overflow: "hidden", bgcolor: "#0d1117", borderColor: "#30363d" }}>
        {loading && (
          <Box sx={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, display: "flex", justifyContent: "center", alignItems: "center", bgcolor: "rgba(13,17,23,0.8)", zIndex: 20 }}>
            <CircularProgress size={40} sx={{ color: "#58a6ff" }} />
            <Typography sx={{ ml: 2, color: "#8b949e" }}>Loading {view === "control" ? "control connections" : "BFD sessions"}...</Typography>
          </Box>
        )}

        <Box sx={{ position: "absolute", top: 12, right: 12, zIndex: 10 }}>
          <ButtonGroup size="small" variant="contained" sx={{ bgcolor: "rgba(13,17,23,0.85)", "& .MuiButton-root": { color: "#E0E0E0", borderColor: "#30363d", minWidth: 36, "&:hover": { bgcolor: "#21262d" } } }}>
            <Tooltip title="Zoom In"><Button onClick={handleZoomIn}><ZoomInIcon fontSize="small" /></Button></Tooltip>
            <Tooltip title="Zoom Out"><Button onClick={handleZoomOut}><ZoomOutIcon fontSize="small" /></Button></Tooltip>
            <Tooltip title="Fit to View"><Button onClick={handleFit}><FitIcon fontSize="small" /></Button></Tooltip>
            <Tooltip title="Fullscreen"><Button onClick={handleFullscreen}><FullscreenIcon fontSize="small" /></Button></Tooltip>
          </ButtonGroup>
        </Box>

        {/* Info badge */}
        <Box sx={{ position: "absolute", top: 12, left: 12, zIndex: 10 }}>
          <Chip
            icon={view === "control" ? <ControlIcon sx={{ fontSize: 14, color: "#8b949e !important" }} /> : <BfdIcon sx={{ fontSize: 14, color: "#8b949e !important" }} />}
            label={view === "control" ? `${controllers.length} Controllers \u00B7 ${edgeDevices.length} Edges` : `${peerCount} Peers`}
            size="small"
            sx={{ bgcolor: "rgba(13,17,23,0.85)", color: "#8b949e", fontWeight: 600, fontSize: "0.7rem", border: "1px solid #30363d" }}
          />
        </Box>

        <Box ref={containerRef} sx={{ width: "100%", height: "100%" }} />

        {/* Floating tooltip */}
        {tooltip && (
          <Box sx={{ position: "fixed", left: tooltip.x, top: tooltip.y, transform: "translate(-50%, -100%)", bgcolor: "rgba(13,17,23,0.95)", border: "1px solid #30363d", borderRadius: 1.5, px: 1.5, py: 1, zIndex: 9999, pointerEvents: "none", minWidth: 180, boxShadow: "0 4px 20px rgba(0,0,0,0.5)" }}>
            <Typography variant="subtitle2" sx={{ color: "#fff", fontWeight: 700 }}>{tooltip.data.hostname || tooltip.data.id}</Typography>
            <Typography variant="caption" sx={{ color: "#8b949e", display: "block" }}>System IP: {tooltip.data.systemIp || tooltip.data.id}</Typography>
            <Typography variant="caption" sx={{ color: "#8b949e", display: "block" }}>Type: {tooltip.data.deviceType}</Typography>
            <Typography variant="caption" sx={{ color: "#8b949e", display: "block" }}>Site: {tooltip.data.siteId}</Typography>
            <Chip label={tooltip.data.status || "unknown"} size="small"
              sx={{ mt: 0.5, fontWeight: 700, fontSize: "0.65rem", bgcolor: tooltip.data.status === "reachable" ? "#00E676" : "#FF1744", color: "#000" }} />
          </Box>
        )}
      </Paper>

      {/* Empty state */}
      {view === "bfd" && activeIp && bfdData.length === 0 && !loading && !error && (
        <Alert severity="info">No BFD sessions found for {selectedDevice?.["host-name"] || activeIp}.</Alert>
      )}

      {/* Session Detail Panel (BFD) */}
      {view === "bfd" && selectedNodeInfo && selectedNodeInfo.sessions && selectedNodeInfo.sessions.length > 0 && (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1, flexWrap: "wrap" }}>
            <Typography variant="h6">{selectedNodeInfo.hostname || selectedNodeInfo.id}</Typography>
            <Chip label={selectedNodeInfo.systemIp || selectedNodeInfo.id} size="small" variant="outlined" sx={{ fontFamily: "monospace" }} />
            <Chip label={selectedNodeInfo.status || "unknown"} size="small" color={selectedNodeInfo.status === "reachable" ? "success" : "error"} />
            <Chip label={selectedNodeInfo.deviceType || "N/A"} size="small" variant="outlined" />
            <Chip label={`Site ${selectedNodeInfo.siteId || "N/A"}`} size="small" variant="outlined" />
          </Box>
          <TableContainer sx={{ maxHeight: 350 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Peer</TableCell>
                  <TableCell>State</TableCell>
                  <TableCell>Transport</TableCell>
                  <TableCell>Src IP</TableCell>
                  <TableCell>Dst IP</TableCell>
                  <TableCell>Proto</TableCell>
                  <TableCell>Last Updated</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {selectedNodeInfo.sessions.map((s, i) => (
                  <TableRow key={i} hover>
                    <TableCell>{s["vdevice-host-name"] || s["dst-ip"] || "\u2014"}</TableCell>
                    <TableCell>
                      <Chip label={s["state"] || "\u2014"} size="small"
                        color={(s["state"] || "").toLowerCase() === "up" ? "success" : "error"}
                        variant="outlined" sx={{ fontSize: "0.7rem" }} />
                    </TableCell>
                    <TableCell>
                      <Chip label={s["color"] || "\u2014"} size="small"
                        sx={{ bgcolor: TRANSPORT_COLOR[(s["color"] || "").toLowerCase()] || "#78909C", color: "#fff", fontSize: "0.7rem", fontWeight: 600 }} />
                    </TableCell>
                    <TableCell sx={{ fontFamily: "monospace", fontSize: "0.8rem" }}>{s["src-ip"] || "\u2014"}</TableCell>
                    <TableCell sx={{ fontFamily: "monospace", fontSize: "0.8rem" }}>{s["dst-ip"] || "\u2014"}</TableCell>
                    <TableCell>{s["proto"] || "\u2014"}</TableCell>
                    <TableCell>{s["lastupdated"] ? new Date(s["lastupdated"]).toLocaleString() : "\u2014"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
    </Box>
  );
}
