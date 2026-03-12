import React, { useState, useMemo, useCallback, useRef } from "react";
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
} from "@mui/material";
import ForceGraph2D from "react-force-graph-2d";
import { useDeviceContext } from "../context/DeviceContext";

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
};

const deviceTypeColor = {
  vedge: "#43A047",
  vsmart: "#1E88E5",
  vmanage: "#E53935",
  vbond: "#FF9800",
};

export default function Topology() {
  const { selectedDevice, devices } = useDeviceContext();
  const [error, setError] = useState("");
  const [rawData, setRawData] = useState([]);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [selectedNodeInfo, setSelectedNodeInfo] = useState(null);
  const fgRef = useRef();
  const activeIp = selectedDevice ? selectedDevice["system-ip"] : null;

  const deviceMap = useMemo(() => {
    const m = {};
    (devices || []).forEach((d) => {
      m[d["system-ip"]] = d;
    });
    return m;
  }, [devices]);

  const fetchTopology = useCallback(async () => {
    if (!activeIp) return;
    setError("");
    setSelectedNodeInfo(null);
    try {
      const res = await fetch(`/api/topology/${activeIp}`);
      if (!res.ok) throw new Error(`Error: ${res.status}`);
      const data = await res.json();
      const arr = Array.isArray(data) ? data : data.data || [];
      setRawData(arr);
    } catch (err) {
      console.error("Failed to fetch topology data:", err);
      setError("Failed to fetch topology data");
    }
  }, [activeIp]);

  React.useEffect(() => {
    if (activeIp) fetchTopology();
  }, [activeIp, fetchTopology]);

  const graphData = useMemo(() => {
    if (!rawData.length) return { nodes: [], links: [] };
    const nodesMap = {};
    const links = [];

    rawData.forEach((bfd) => {
      const src = bfd["src-ip"];
      const dst = bfd["dst-ip"];
      if (src && !nodesMap[src]) {
        const dev = deviceMap[src];
        const devType = dev ? (dev["device-type"] || dev.personality || "").toLowerCase() : "";
        nodesMap[src] = {
          id: src,
          label: dev ? `${dev["host-name"] || src}` : src,
          deviceType: devType,
          color: deviceTypeColor[devType] || "#78909C",
        };
      }
      if (dst && !nodesMap[dst]) {
        const dev = deviceMap[dst];
        const devType = dev ? (dev["device-type"] || dev.personality || "").toLowerCase() : "";
        nodesMap[dst] = {
          id: dst,
          label: dev ? `${dev["host-name"] || dst}` : dst,
          deviceType: devType,
          color: deviceTypeColor[devType] || "#78909C",
        };
      }
      const raw = bfd["color"] ? bfd["color"].toLowerCase() : "";
      links.push({
        source: src,
        target: dst,
        color: transportColor[raw] || "#bbb",
        transportColor: raw,
        state: bfd["state"],
      });
    });

    return { nodes: Object.values(nodesMap), links };
  }, [rawData, deviceMap]);

  const neighborSet = useMemo(() => {
    if (!hoveredNode) return new Set();
    const s = new Set([hoveredNode]);
    graphData.links.forEach((l) => {
      const src = typeof l.source === "object" ? l.source.id : l.source;
      const tgt = typeof l.target === "object" ? l.target.id : l.target;
      if (src === hoveredNode) s.add(tgt);
      if (tgt === hoveredNode) s.add(src);
    });
    return s;
  }, [hoveredNode, graphData.links]);

  const handleNodeClick = useCallback((node) => {
    const sessions = rawData.filter(
      (s) => s["src-ip"] === node.id || s["dst-ip"] === node.id
    );
    setSelectedNodeInfo({ id: node.id, label: node.label, sessions });
  }, [rawData]);

  const nodeCanvasObject = useCallback((node, ctx, globalScale) => {
    const isHighlighted = !hoveredNode || neighborSet.has(node.id);
    const size = node.id === hoveredNode ? 8 : 6;
    const alpha = isHighlighted ? 1 : 0.15;

    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(node.x, node.y, size, 0, 2 * Math.PI);
    ctx.fillStyle = node.color || "#78909C";
    ctx.fill();

    if (node.id === hoveredNode) {
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    const fontSize = Math.max(10 / globalScale, 2);
    ctx.font = `${fontSize}px Sans-Serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillStyle = isHighlighted ? "#fff" : "rgba(255,255,255,0.15)";
    ctx.fillText(node.label, node.x, node.y + size + 2);
    ctx.globalAlpha = 1;
  }, [hoveredNode, neighborSet]);

  const linkCanvasObject = useCallback((link, ctx) => {
    const src = typeof link.source === "object" ? link.source : { x: 0, y: 0 };
    const tgt = typeof link.target === "object" ? link.target : { x: 0, y: 0 };
    const srcId = typeof link.source === "object" ? link.source.id : link.source;
    const tgtId = typeof link.target === "object" ? link.target.id : link.target;
    const isHighlighted = !hoveredNode || (neighborSet.has(srcId) && neighborSet.has(tgtId));

    ctx.globalAlpha = isHighlighted ? 0.8 : 0.08;
    ctx.beginPath();
    ctx.moveTo(src.x, src.y);
    ctx.lineTo(tgt.x, tgt.y);
    ctx.strokeStyle = link.color || "#bbb";
    ctx.lineWidth = isHighlighted ? 2 : 0.5;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }, [hoveredNode, neighborSet]);

  const legend = [
    { label: "vEdge", color: deviceTypeColor.vedge },
    { label: "vSmart", color: deviceTypeColor.vsmart },
    { label: "vManage", color: deviceTypeColor.vmanage },
    { label: "vBond", color: deviceTypeColor.vbond },
    { label: "biz-internet", color: transportColor["biz-internet"], dash: true },
    { label: "public-internet", color: transportColor["public-internet"], dash: true },
    { label: "mpls", color: transportColor.mpls, dash: true },
  ];

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, flexWrap: "wrap", gap: 1 }}>
        <Typography variant="h5">Topology Diagram (BFD Sessions)</Typography>
        <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
          {legend.map((l) => (
            <Chip
              key={l.label}
              label={l.label}
              size="small"
              sx={{
                bgcolor: l.dash ? "transparent" : l.color,
                color: l.dash ? l.color : "#fff",
                border: l.dash ? `2px solid ${l.color}` : "none",
                fontWeight: 600,
                fontSize: "0.7rem",
              }}
            />
          ))}
        </Box>
      </Box>

      {!activeIp && <Alert severity="info">Select a device from the global search bar to visualize its topology.</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {activeIp && graphData.nodes.length > 0 && (
        <Paper variant="outlined" sx={{ width: "100%", height: 600, mb: 2, overflow: "hidden", bgcolor: "#1a1a2e" }}>
          <ForceGraph2D
            ref={fgRef}
            graphData={graphData}
            nodeCanvasObject={nodeCanvasObject}
            linkCanvasObject={linkCanvasObject}
            onNodeHover={(node) => setHoveredNode(node ? node.id : null)}
            onNodeClick={handleNodeClick}
            nodePointerAreaPaint={(node, color, ctx) => {
              ctx.beginPath();
              ctx.arc(node.x, node.y, 8, 0, 2 * Math.PI);
              ctx.fillStyle = color;
              ctx.fill();
            }}
            cooldownTicks={100}
            width={undefined}
            height={598}
            backgroundColor="#1a1a2e"
          />
        </Paper>
      )}

      {activeIp && graphData.nodes.length === 0 && !error && (
        <Alert severity="info">No BFD session data available for this device.</Alert>
      )}

      {selectedNodeInfo && (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Details for: {selectedNodeInfo.label} ({selectedNodeInfo.id})
          </Typography>
          {selectedNodeInfo.sessions.length > 0 ? (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Device Name</TableCell>
                    <TableCell>Hostname</TableCell>
                    <TableCell>State</TableCell>
                    <TableCell>Color</TableCell>
                    <TableCell>Proto</TableCell>
                    <TableCell>Src IP</TableCell>
                    <TableCell>Dst IP</TableCell>
                    <TableCell>Last Updated</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedNodeInfo.sessions.map((s, i) => (
                    <TableRow key={i}>
                      <TableCell>{s["vdevice-name"] || "—"}</TableCell>
                      <TableCell>{s["vdevice-host-name"] || "—"}</TableCell>
                      <TableCell>
                        <Chip
                          label={s["state"] || "—"}
                          size="small"
                          color={s["state"] === "up" ? "success" : "error"}
                          variant="outlined"
                          sx={{ fontSize: "0.7rem" }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={s["color"] || "—"}
                          size="small"
                          sx={{
                            bgcolor: transportColor[(s["color"] || "").toLowerCase()] || "#bbb",
                            color: "#fff",
                            fontSize: "0.7rem",
                          }}
                        />
                      </TableCell>
                      <TableCell>{s["proto"] || "—"}</TableCell>
                      <TableCell>{s["src-ip"] || "—"}</TableCell>
                      <TableCell>{s["dst-ip"] || "—"}</TableCell>
                      <TableCell>
                        {s["lastupdated"]
                          ? new Date(s["lastupdated"]).toLocaleString()
                          : "—"}
                      </TableCell>
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
