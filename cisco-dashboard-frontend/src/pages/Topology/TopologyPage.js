/**
 * Main Topology Page Component
 * Shows Data Plane (BFD) and OMP Route topology for a selected device
 */

import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { Box, Typography, Alert, CircularProgress } from "@mui/material";
import cytoscape from "cytoscape";
import dagre from "cytoscape-dagre";

import { useDeviceContext } from "../../context/DeviceContext";
import { CY_STYLE } from "./constants";
import { makeNode, buildDeviceMap } from "./utils";
import { useTopologyData } from "./useTopologyData";
import TopologyControls from "./TopologyControls";
import NodeTooltip from "./NodeTooltip";
import { EdgeInfoPanel } from "./RelationshipDetails";

// Register dagre layout once
if (!cytoscape._dagreRegistered) {
  cytoscape.use(dagre);
  cytoscape._dagreRegistered = true;
}

export default function TopologyPage() {
  const { selectedDevice, devices, selectDeviceByIp } = useDeviceContext();
  // Default to dataplane view (no more control plane)
  const [view, setView] = useState("dataplane");
  const [showAllPeers, setShowAllPeers] = useState(false);
  const [selectedEdgeInfo, setSelectedEdgeInfo] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [selectedNodeInfo, setSelectedNodeInfo] = useState(null);
  const [tooltip, setTooltip] = useState(null);

  const cyRef = useRef(null);
  const containerRef = useRef(null);
  const activeIp = selectedDevice ? selectedDevice["system-ip"] : null;

  const deviceMap = useMemo(() => buildDeviceMap(devices), [devices]);

  // Use the custom hook for data fetching (only dataplane and omp now)
  const { loading, error, logicalData, ompData } = useTopologyData(
    view,
    activeIp,
    showAllPeers
  );

  // Build Data Plane elements
  const dataPlaneElements = useMemo(() => {
    if (view !== "dataplane" || !logicalData || !activeIp) return [];
    const nodesMap = {};
    const edgesList = [];

    const centerDev = deviceMap[activeIp];
    const centerNode = makeNode(centerDev, activeIp);
    centerNode.classes += " center";
    nodesMap[activeIp] = centerNode;

    (logicalData.relationships || []).forEach((rel, idx) => {
      const peerIP = rel.peerIp;
      if (!peerIP || peerIP === activeIp) return;

      if (!nodesMap[peerIP]) {
        const peerDev = deviceMap[peerIP] || {
          "host-name": rel.peerHostname,
          "device-type": rel.peerType,
          "site-id": rel.siteId,
        };
        nodesMap[peerIP] = makeNode(peerDev, peerIP);
      }

      let edgeColor = "#78909C";
      if (rel.healthStatus === "healthy") edgeColor = "#00E676";
      else if (rel.healthStatus === "degraded") edgeColor = "#FFC107";
      else if (rel.healthStatus === "down") edgeColor = "#FF1744";

      const edgeWidth = Math.min(2 + (rel.totalCount || 1), 6);
      const classes = ["relationship"];
      if (rel.healthStatus === "down") classes.push("down");
      if (rel.healthStatus === "degraded") classes.push("degraded");
      if ((rel.relationshipTypes || []).length > 1) classes.push("multi-type");

      edgesList.push({
        data: {
          id: `rel-${idx}`,
          source: activeIp,
          target: peerIP,
          color: edgeColor,
          width: edgeWidth,
          ...rel,
        },
        classes: classes.join(" "),
      });
    });

    return [...Object.values(nodesMap), ...edgesList];
  }, [view, logicalData, activeIp, deviceMap]);

  // Build OMP elements
  const ompElements = useMemo(() => {
    if (view !== "omp" || !ompData || !activeIp) return [];
    const nodesMap = {};
    const edgesList = [];

    const centerDev = deviceMap[activeIp] || {
      "host-name": activeIp,
      "device-type": "edge",
      "site-id": "N/A",
    };
    const centerNode = makeNode(centerDev, activeIp);
    centerNode.classes = "center";
    nodesMap[activeIp] = centerNode;

    (ompData.peers || []).forEach((peer, idx) => {
      const peerIP = peer.peerIp;
      if (!peerIP || peerIP === activeIp) return;

      if (!nodesMap[peerIP]) {
        const peerDev = deviceMap[peerIP] || {
          "host-name": peer.peerHostname,
          "device-type": peer.peerType,
          "site-id": peer.siteId,
        };
        nodesMap[peerIP] = makeNode(peerDev, peerIP);
      }

      const routeCount = peer.routeCount || 0;
      let edgeColor = "#78909C";
      if (routeCount >= 50) edgeColor = "#00E676";
      else if (routeCount >= 10) edgeColor = "#FFC107";
      else if (routeCount >= 1) edgeColor = "#2196F3";

      const edgeWidth = Math.min(2 + Math.floor(routeCount / 10), 8);

      edgesList.push({
        data: {
          id: `omp-${idx}`,
          source: activeIp,
          target: peerIP,
          color: edgeColor,
          width: edgeWidth,
          ...peer,
        },
        classes: "omp-route",
      });
    });

    return [...Object.values(nodesMap), ...edgesList];
  }, [view, ompData, activeIp, deviceMap]);

  // Select elements based on view
  const elements = view === "omp" ? ompElements : dataPlaneElements;

  // Peer count for badge
  const peerCount = useMemo(() => {
    if (view === "omp" && ompData) return ompData.totalPeers || 0;
    if (view === "dataplane" && logicalData) return logicalData.totalPeers || 0;
    return 0;
  }, [view, logicalData, ompData]);

  const hiddenCount = useMemo(() => {
    if (view === "dataplane" && logicalData) return logicalData.hiddenCount || 0;
    return 0;
  }, [view, logicalData]);

  // Initialize Cytoscape
  useEffect(() => {
    // Clean up previous instance
    if (cyRef.current) {
      cyRef.current.destroy();
      cyRef.current = null;
    }

    // Don't create if no container or no elements
    if (!containerRef.current || !elements.length) {
      return;
    }

    // Use concentric layout for device-centric views
    const layoutConfig = {
      name: "concentric",
      concentric: (node) => (node.hasClass("center") ? 10 : 1),
      levelWidth: () => 1,
      minNodeSpacing: 80,
      padding: 60,
      animate: true,
      animationDuration: 500,
    };

    const cy = cytoscape({
      container: containerRef.current,
      elements,
      style: CY_STYLE,
      layout: layoutConfig,
      minZoom: 0.15,
      maxZoom: 4,
      wheelSensitivity: 0.3,
    });

    cy.on("layoutstop", () => {
      cy.nodes().addClass("showLabel");
    });

    // Tap node: highlight neighborhood
    cy.on("tap", "node", (evt) => {
      const node = evt.target;
      const nd = node.data();
      cy.elements().removeClass("highlighted dimmed selected-node selected-edge");
      const neighborhood = node.neighborhood().add(node);
      cy.elements().not(neighborhood).addClass("dimmed");
      neighborhood.addClass("highlighted");
      node.addClass("selected-node");

      if (view === "dataplane" && logicalData) {
        const rel = (logicalData.relationships || []).find((r) => r.peerIp === nd.id);
        if (rel) {
          setSelectedNodeInfo({ ...nd, relationship: rel });
        } else {
          setSelectedNodeInfo({ ...nd });
        }
      } else {
        setSelectedNodeInfo({ ...nd });
      }
      setSelectedEdgeInfo(null);

      const rp = node.renderedPosition();
      const rect = containerRef.current.getBoundingClientRect();
      setTooltip({ x: rect.left + rp.x, y: rect.top + rp.y - 60, data: nd });
    });

    // Tap edge: show relationship details
    cy.on("tap", "edge", (evt) => {
      const edge = evt.target;
      const ed = edge.data();
      cy.elements().removeClass("highlighted dimmed selected-node selected-edge");
      edge.addClass("selected-edge");
      edge.source().addClass("highlighted");
      edge.target().addClass("highlighted");
      cy.elements().not(edge).not(edge.source()).not(edge.target()).addClass("dimmed");

      setSelectedEdgeInfo(ed);
      setSelectedNodeInfo(null);
      setTooltip(null);
    });

    // Double-tap node: switch to that device's topology
    cy.on("dbltap", "node", (evt) => {
      const node = evt.target;
      const nd = node.data();
      if (nd.systemIp && nd.systemIp !== activeIp) {
        selectDeviceByIp(nd.systemIp);
      }
    });

    // Tap background: reset
    cy.on("tap", (evt) => {
      if (evt.target === cy) {
        cy.elements().removeClass("highlighted dimmed selected-node selected-edge");
        setSelectedEdgeInfo(null);
        setSelectedNodeInfo(null);
        setTooltip(null);
      }
    });

    cyRef.current = cy;

    return () => {
      if (cyRef.current) {
        cyRef.current.destroy();
        cyRef.current = null;
      }
    };
  }, [elements, view, logicalData, activeIp, selectDeviceByIp]);

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    if (cyRef.current) cyRef.current.zoom(cyRef.current.zoom() * 1.2);
  }, []);

  const handleZoomOut = useCallback(() => {
    if (cyRef.current) cyRef.current.zoom(cyRef.current.zoom() / 1.2);
  }, []);

  const handleFit = useCallback(() => {
    if (cyRef.current) cyRef.current.fit(50);
  }, []);

  const handleFullscreen = useCallback(() => {
    if (containerRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        containerRef.current.requestFullscreen();
      }
    }
  }, []);

  // Show message if no device selected
  if (!activeIp) {
    return (
      <Box>
        <Typography variant="h5" gutterBottom>
          Network Topology
        </Typography>
        <Alert severity="info" sx={{ mt: 2 }}>
          Please select a device from the sidebar to view its topology.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Network Topology
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TopologyControls
        view={view}
        onViewChange={setView}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onFit={handleFit}
        onFullscreen={handleFullscreen}
        peerCount={peerCount}
        hiddenCount={hiddenCount}
        showAllPeers={showAllPeers}
        onToggleShowAll={() => setShowAllPeers(!showAllPeers)}
        activeIp={activeIp}
      />

      {/* Graph Container */}
      <Box
        ref={containerRef}
        sx={{
          width: "100%",
          height: 600,
          bgcolor: "#0d1117",
          borderRadius: 2,
          border: 1,
          borderColor: "divider",
          position: "relative",
        }}
      >
        {loading && (
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 10,
            }}
          >
            <CircularProgress />
          </Box>
        )}
      </Box>

      {/* Tooltip */}
      <NodeTooltip tooltip={tooltip} containerRef={containerRef} />

      {/* Edge Info Panel */}
      <EdgeInfoPanel selectedEdgeInfo={selectedEdgeInfo} view={view} />
    </Box>
  );
}
