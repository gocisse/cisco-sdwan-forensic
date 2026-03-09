// src/pages/Topology.js
import React, { useEffect, useRef, useState } from 'react';
import cytoscape from 'cytoscape';

function Topology() {
  const [systemIp, setSystemIp] = useState('');
  const [error, setError] = useState('');
  // Store all fetched BFD session data here.
  const [topologyData, setTopologyData] = useState([]);
  // Store details for the selected node.
  const [selectedNodeInfo, setSelectedNodeInfo] = useState(null);
  const cyRef = useRef(null);

  // Mapping of Cisco SD-WAN color names to HEX codes.
  const colorMap = {
    // Public Colors
    "public-internet": "#FF5733",  
    "biz-internet": "#33FF57",     
    "3g": "#3357FF",               
    "lte": "#FF33A8",              
    "blue": "#007acc",
    "green": "#00a000",
    "red": "#FF0000",
    "bronze": "#CD7F32",
    "silver": "#C0C0C0",
    "gold": "#FFD700",
    "custom1": "#8A2BE2",
    "custom2": "#FF8C00",
    "custom3": "#20B2AA",
    // Private Colors
    "mpls": "#F4A460",
    "metro-ethernet": "#8A2BE2",
    "private1": "#FFA500",
    "private2": "#A52A2A",
  };

  // Initialize Cytoscape if not already created.
  const initializeCytoscape = () => {
    if (!cyRef.current) {
      cyRef.current = cytoscape({
        container: document.getElementById('cy'),
        style: [
          {
            selector: 'node',
            style: {
              // Use a router image; make sure /router.png exists in your public folder.
              'background-image': 'url(/router.png)',
              'background-fit': 'cover',
              'width': '40px',
              'height': '40px',
              'label': 'data(label)',
              'text-valign': 'bottom',
              'text-margin-y': '5px',
              'font-size': '10px',
              'color': '#000',
              'text-background-opacity': 1,
              'text-background-color': '#fff',
              'text-background-padding': '2px'
            },
          },
          {
            selector: 'edge',
            style: {
              'width': 3,
              'line-color': 'data(color)',
              'target-arrow-color': 'data(color)',
              'target-arrow-shape': 'triangle',
              'curve-style': 'bezier',
              'label': 'data(label)',
              'font-size': '10px',
              'text-background-opacity': 1,
              'text-background-color': '#fff',
              'text-background-padding': '2px',
            },
          },
        ],
        layout: { name: 'grid' },
      });
    }
  };

  const handleFetchTopology = async () => {
    if (!systemIp.trim()) {
      setError('System IP is required');
      return;
    }
    setError('');
    setSelectedNodeInfo(null); // Clear any previously selected node.
    try {
      // Fetch BFD session data from your Go endpoint.
      const response = await fetch(`/api/topology/${systemIp}`);
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      const data = await response.json(); // data is an array of BFD objects.
      setTopologyData(data);

      // Process the data into nodes and edges.
      const nodesSet = new Set();
      const edges = [];
      data.forEach((bfd) => {
        const srcIp = bfd["src-ip"];
        const dstIp = bfd["dst-ip"];
        nodesSet.add(srcIp);
        nodesSet.add(dstIp);

        // Lookup color from mapping.
        const rawColor = bfd["color"] ? bfd["color"].toLowerCase() : '';
        const edgeColor = colorMap[rawColor] || '#bbb';

        edges.push({
          data: {
            id: `${srcIp}->${dstIp}`,
            source: srcIp,
            target: dstIp,
            label: `${srcIp} → ${dstIp}`,
            color: edgeColor,
          },
        });
      });

      const nodes = Array.from(nodesSet).map((ip) => ({
        data: { id: ip, label: ip },
      }));

      // Initialize Cytoscape if needed.
      initializeCytoscape();

      // Clear any existing elements.
      cyRef.current.elements().remove();

      // Add nodes and edges.
      cyRef.current.add([...nodes, ...edges]);

      // Run a layout.
      cyRef.current.layout({ name: 'cose' }).run();

      // Add event listener for node clicks.
      cyRef.current.on('tap', 'node', (event) => {
        const nodeId = event.target.id();
        // Filter topologyData to find sessions that involve this node.
        const sessions = data.filter(
          (session) => session["src-ip"] === nodeId || session["dst-ip"] === nodeId
        );
        setSelectedNodeInfo({ id: nodeId, sessions });
      });
    } catch (err) {
      console.error('Failed to fetch topology data:', err);
      setError('Failed to fetch topology data');
    }
  };

  useEffect(() => {
    initializeCytoscape();
    return () => {
      if (cyRef.current) {
        cyRef.current.destroy();
        cyRef.current = null;
      }
    };
  }, []);

  return (
    <div style={{ padding: '1rem' }}>
      <h1>Topology Diagram (BFD Sessions)</h1>
      <div style={{ marginBottom: '1rem' }}>
        <input
          type="text"
          placeholder="Enter system IP"
          value={systemIp}
          onChange={(e) => setSystemIp(e.target.value)}
          style={{ marginRight: '0.5rem' }}
        />
        <button onClick={handleFetchTopology}>Visualize</button>
      </div>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <div
        id="cy"
        style={{
          width: '100%',
          height: '600px',
          border: '1px solid #ccc',
        }}
      ></div>
      {/* Details Panel */}
      {selectedNodeInfo && (
        <div style={{ marginTop: '1rem', padding: '1rem', border: '1px solid #ccc' }}>
          <h2>Details for Node: {selectedNodeInfo.id}</h2>
          {selectedNodeInfo.sessions.length > 0 ? (
            <table style={{ borderCollapse: 'collapse', width: '100%' }}>
              <thead>
                <tr>
                  <th style={thStyle}>vdevice-name</th>
                  <th style={thStyle}>vdevice-host-name</th>
                  <th style={thStyle}>state</th>
                  <th style={thStyle}>uptime</th>
                  <th style={thStyle}>proto</th>
                  <th style={thStyle}>src-ip</th>
                  <th style={thStyle}>dst-ip</th>
                  <th style={thStyle}>lastupdated</th>
                </tr>
              </thead>
              <tbody>
                {selectedNodeInfo.sessions.map((session, index) => (
                  <tr key={index}>
                    <td style={tdStyle}>{session["vdevice-name"]}</td>
                    <td style={tdStyle}>{session["vdevice-host-name"]}</td>
                    <td style={tdStyle}>{session["state"]}</td>
                    <td style={tdStyle}>{session["uptime"]}</td>
                    <td style={tdStyle}>{session["proto"]}</td>
                    <td style={tdStyle}>{session["src-ip"]}</td>
                    <td style={tdStyle}>{session["dst-ip"]}</td>
                    <td style={tdStyle}>
                      {session["lastupdated"]
                        ? new Date(session["lastupdated"]).toLocaleString()
                        : "N/A"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No sessions found for this node.</p>
          )}
        </div>
      )}
    </div>
  );
}

// Basic table styling reused from before.
const thStyle = {
  border: '1px solid #ccc',
  padding: '8px',
  backgroundColor: '#f2f2f2',
};
const tdStyle = {
  border: '1px solid #ccc',
  padding: '8px',
};

export default Topology;
