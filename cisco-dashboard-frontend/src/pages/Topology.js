import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import cytoscape from "cytoscape";

const colorMap = {
  "public-internet": "#FF5733",
  "biz-internet": "#33FF57",
  "3g": "#3357FF",
  lte: "#FF33A8",
  blue: "#007acc",
  green: "#00a000",
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

const cyStyles = [
  {
    selector: "node",
    style: {
      "background-image": "url(/router.png)",
      "background-fit": "cover",
      width: "40px",
      height: "40px",
      label: "data(label)",
      "text-valign": "bottom",
      "text-margin-y": "5px",
      "font-size": "10px",
      color: "#000",
      "text-background-opacity": 1,
      "text-background-color": "#fff",
      "text-background-padding": "2px",
    },
  },
  {
    selector: "edge",
    style: {
      width: 3,
      "line-color": "data(color)",
      "target-arrow-color": "data(color)",
      "target-arrow-shape": "triangle",
      "curve-style": "bezier",
      label: "data(label)",
      "font-size": "10px",
      "text-background-opacity": 1,
      "text-background-color": "#fff",
      "text-background-padding": "2px",
    },
  },
];

export default function Topology() {
  const [systemIp, setSystemIp] = useState("");
  const [error, setError] = useState("");
  const [selectedNodeInfo, setSelectedNodeInfo] = useState(null);
  const cyRef = useRef(null);
  const containerRef = useRef(null);

  const initCy = useCallback(() => {
    if (!cyRef.current && containerRef.current) {
      cyRef.current = cytoscape({
        container: containerRef.current,
        style: cyStyles,
        layout: { name: "grid" },
      });
    }
  }, []);

  useEffect(() => {
    initCy();
    return () => {
      if (cyRef.current) {
        cyRef.current.destroy();
        cyRef.current = null;
      }
    };
  }, [initCy]);

  const handleFetch = async () => {
    if (!systemIp.trim()) {
      setError("System IP is required");
      return;
    }
    setError("");
    setSelectedNodeInfo(null);
    try {
      const res = await fetch(`/api/topology/${systemIp}`);
      if (!res.ok) throw new Error(`Error: ${res.status}`);
      const data = await res.json();

      const nodesSet = new Set();
      const edges = [];
      data.forEach((bfd) => {
        const src = bfd["src-ip"];
        const dst = bfd["dst-ip"];
        nodesSet.add(src);
        nodesSet.add(dst);
        const raw = bfd["color"] ? bfd["color"].toLowerCase() : "";
        edges.push({
          data: {
            id: `${src}->${dst}`,
            source: src,
            target: dst,
            label: `${src} → ${dst}`,
            color: colorMap[raw] || "#bbb",
          },
        });
      });

      const nodes = Array.from(nodesSet).map((ip) => ({
        data: { id: ip, label: ip },
      }));

      initCy();
      cyRef.current.elements().remove();
      cyRef.current.add([...nodes, ...edges]);
      cyRef.current.layout({ name: "cose" }).run();

      cyRef.current.off("tap", "node");
      cyRef.current.on("tap", "node", (event) => {
        const nodeId = event.target.id();
        const sessions = data.filter(
          (s) => s["src-ip"] === nodeId || s["dst-ip"] === nodeId
        );
        setSelectedNodeInfo({ id: nodeId, sessions });
      });
    } catch (err) {
      console.error("Failed to fetch topology data:", err);
      setError("Failed to fetch topology data");
    }
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Topology Diagram (BFD Sessions)
      </Typography>

      <Box sx={{ display: "flex", gap: 1, mb: 2, alignItems: "center" }}>
        <TextField
          size="small"
          placeholder="Enter system IP"
          value={systemIp}
          onChange={(e) => setSystemIp(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleFetch()}
        />
        <Button variant="contained" onClick={handleFetch}>
          Visualize
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper
        variant="outlined"
        ref={containerRef}
        sx={{ width: "100%", height: 600, mb: 2 }}
      />

      {selectedNodeInfo && (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Details for Node: {selectedNodeInfo.id}
          </Typography>
          {selectedNodeInfo.sessions.length > 0 ? (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Device Name</TableCell>
                    <TableCell>Hostname</TableCell>
                    <TableCell>State</TableCell>
                    <TableCell>Uptime</TableCell>
                    <TableCell>Proto</TableCell>
                    <TableCell>Src IP</TableCell>
                    <TableCell>Dst IP</TableCell>
                    <TableCell>Last Updated</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedNodeInfo.sessions.map((s, i) => (
                    <TableRow key={i}>
                      <TableCell>{s["vdevice-name"]}</TableCell>
                      <TableCell>{s["vdevice-host-name"]}</TableCell>
                      <TableCell>{s["state"]}</TableCell>
                      <TableCell>{s["uptime"]}</TableCell>
                      <TableCell>{s["proto"]}</TableCell>
                      <TableCell>{s["src-ip"]}</TableCell>
                      <TableCell>{s["dst-ip"]}</TableCell>
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
