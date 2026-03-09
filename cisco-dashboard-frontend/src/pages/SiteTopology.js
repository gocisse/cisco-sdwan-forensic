import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  Paper,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import cytoscape from "cytoscape";

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
      "z-index": 999,
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

export default function SiteTopology() {
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
      const res = await fetch(`/api/topology/site/${systemIp.trim()}`);
      if (!res.ok) throw new Error(`Server returned status ${res.status}`);
      const data = await res.json();

      const links = data.links || [];
      const edges = links.map((link) => ({
        data: {
          id: link.linkKey,
          source: link.source,
          target: link.target,
          label: link.linkKeyDisplay || "",
          color: link.status === "up" ? "#00a000" : "#FF0000",
        },
      }));

      const nodeSet = new Set();
      links.forEach((link) => {
        nodeSet.add(link.source);
        nodeSet.add(link.target);
      });
      const nodes = Array.from(nodeSet).map((id) => ({
        data: { id, label: id },
      }));

      initCy();
      cyRef.current.elements().remove();
      cyRef.current.add([...nodes, ...edges]);
      cyRef.current.layout({ name: "cose" }).run();

      cyRef.current.nodes().forEach((node) => {
        node.on("mouseover", (event) => {
          const tooltip = document.createElement("div");
          tooltip.className = "cy-tooltip";
          tooltip.style.cssText =
            "position:absolute;background:#fff;border:1px solid #ccc;padding:5px;pointer-events:none;z-index:9999;border-radius:4px;font-size:12px;";
          tooltip.textContent = node.id();
          document.body.appendChild(tooltip);
          const pos = event.renderedPosition;
          tooltip.style.left = `${pos.x + 10}px`;
          tooltip.style.top = `${pos.y + 10}px`;
        });
        node.on("mouseout", () => {
          document.querySelectorAll(".cy-tooltip").forEach((t) => t.remove());
        });
        node.on("tap", () => {
          const nodeId = node.id();
          const relatedLinks = links.filter(
            (l) => l.source === nodeId || l.target === nodeId
          );
          setSelectedNodeInfo({ id: nodeId, links: relatedLinks });
        });
      });
    } catch (err) {
      console.error("Failed to fetch site topology:", err);
      setError(`Failed to fetch site topology: ${err.message}`);
    }
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Site Topology
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
          {selectedNodeInfo.links.length > 0 ? (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Source</TableCell>
                    <TableCell>Target</TableCell>
                    <TableCell>Link Type</TableCell>
                    <TableCell>Group</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Link Key</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedNodeInfo.links.map((link, i) => (
                    <TableRow key={i}>
                      <TableCell>{link.source}</TableCell>
                      <TableCell>{link.target}</TableCell>
                      <TableCell>{link.linkType}</TableCell>
                      <TableCell>{link.group}</TableCell>
                      <TableCell>
                        <Chip
                          label={link.status}
                          color={link.status === "up" ? "success" : "error"}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{link.linkKeyDisplay}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Alert severity="info">No links found for this node.</Alert>
          )}
        </Paper>
      )}
    </Box>
  );
}
