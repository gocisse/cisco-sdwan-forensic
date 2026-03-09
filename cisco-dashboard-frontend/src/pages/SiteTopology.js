// src/pages/SiteTopology.js
// src/pages/SiteTopology.js
import React, { useEffect, useRef, useState } from 'react';
import cytoscape from 'cytoscape';

function SiteTopology() {
  const [systemIp, setSystemIp] = useState('');
  const [error, setError] = useState('');
  const [topologyData, setTopologyData] = useState(null);
  const [selectedNodeInfo, setSelectedNodeInfo] = useState(null); // Track selected node details
  const cyRef = useRef(null);

  // Initialize Cytoscape once
  const initializeCytoscape = () => {
    if (!cyRef.current) {
      cyRef.current = cytoscape({
        container: document.getElementById('site-cy'),
        style: [
          {
            selector: 'node',
            style: {
              'background-image': 'url(/router.png)', // Ensure router.png is in /public
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
              'text-background-padding': '2px',
              'z-index': 999, // Ensure labels appear above nodes
            },
          },
          {
            selector: 'edge',
            style: {
              'width': 3,
              'line-color': 'data(color)', // Dynamic edge color
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

  // Fetch site topology from the Go backend
  const handleFetchSiteTopology = async () => {
    if (!systemIp.trim()) {
      setError('System IP is required');
      return;
    }

    setError('');
    try {
      const response = await fetch(`/api/topology/site/${systemIp.trim()}`);
      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const data = await response.json();
      setTopologyData(data);

      const links = data.links || [];
      const edges = links.map((link) => ({
        data: {
          id: link.linkKey,
          source: link.source,
          target: link.target,
          label: link.linkKeyDisplay || '', // Use linkKeyDisplay as the label
          color: link.status === 'up' ? '#00a000' : '#FF0000', // Green for up, red for down
        },
      }));

      const nodeSet = new Set();
      links.forEach((link) => {
        nodeSet.add(link.source);
        nodeSet.add(link.target);
      });

      const nodes = Array.from(nodeSet).map((nodeId) => ({
        data: {
          id: nodeId,
          label: nodeId,
        },
      }));

      initializeCytoscape();

      cyRef.current.elements().remove(); // Clear existing elements
      cyRef.current.add([...nodes, ...edges]); // Add new nodes and edges

      cyRef.current.layout({ name: 'cose' }).run(); // Apply layout

      // Add tooltips for nodes
      cyRef.current.nodes().forEach((node) => {
        node.on('mouseover', (event) => {
          const tooltip = document.createElement('div');
          tooltip.className = 'cy-tooltip'; // Add a class for easier cleanup
          tooltip.style.position = 'absolute';
          tooltip.style.backgroundColor = 'white';
          tooltip.style.border = '1px solid #ccc';
          tooltip.style.padding = '5px';
          tooltip.style.pointerEvents = 'none';
          tooltip.textContent = node.id(); // Display only the node ID
          document.body.appendChild(tooltip);

          const pos = event.renderedPosition; // Use event position for accuracy
          tooltip.style.left = `${pos.x + 10}px`;
          tooltip.style.top = `${pos.y + 10}px`;
        });

        node.on('mouseout', () => {
          // Remove all tooltips with the class 'cy-tooltip'
          const tooltips = document.querySelectorAll('.cy-tooltip');
          tooltips.forEach((tooltip) => tooltip.remove());
        });

        // Add click handler to show node details
        node.on('tap', () => {
          const nodeId = node.id();
          const relatedLinks = links.filter(
            (link) => link.source === nodeId || link.target === nodeId
          );
          setSelectedNodeInfo({ id: nodeId, links: relatedLinks });
        });
      });
    } catch (err) {
      console.error('Failed to fetch site topology:', err);
      setError(`Failed to fetch site topology: ${err.message}`);
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
      <h1>Site Topology</h1>
      <div style={{ marginBottom: '1rem' }}>
        <input
          type="text"
          placeholder="Enter system IP"
          value={systemIp}
          onChange={(e) => setSystemIp(e.target.value)}
          style={{ marginRight: '0.5rem' }}
        />
        <button onClick={handleFetchSiteTopology}>Visualize Site Topology</button>
      </div>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <div
        id="site-cy"
        style={{
          width: '100%',
          height: '600px',
          border: '1px solid #ccc',
        }}
      ></div>

      {/* Details Panel */}
      {selectedNodeInfo && (
        <div
          style={{
            marginTop: '1rem',
            padding: '1rem',
            border: '1px solid #ccc',
            backgroundColor: '#f9f9f9',
          }}
        >
          <h2>Details for Node: {selectedNodeInfo.id}</h2>
          {selectedNodeInfo.links.length > 0 ? (
            <table style={{ borderCollapse: 'collapse', width: '100%' }}>
              <thead>
                <tr>
                  <th style={thStyle}>Source</th>
                  <th style={thStyle}>Target</th>
                  <th style={thStyle}>Link Type</th>
                  <th style={thStyle}>Group</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Link Key Display</th>
                </tr>
              </thead>
              <tbody>
                {selectedNodeInfo.links.map((link, index) => (
                  <tr key={index}>
                    <td style={tdStyle}>{link.source}</td>
                    <td style={tdStyle}>{link.target}</td>
                    <td style={tdStyle}>{link.linkType}</td>
                    <td style={tdStyle}>{link.group}</td>
                    <td style={tdStyle}>{link.status}</td>
                    <td style={tdStyle}>{link.linkKeyDisplay}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No links found for this node.</p>
          )}
        </div>
      )}
    </div>
  );
}

// Basic table styling
const thStyle = {
  border: '1px solid #ccc',
  padding: '8px',
  backgroundColor: '#f2f2f2',
};
const tdStyle = {
  border: '1px solid #ccc',
  padding: '8px',
};

export default SiteTopology;



// // src/pages/SiteTopology.js
// import React, { useEffect, useRef, useState } from 'react';
// import cytoscape from 'cytoscape';

// function SiteTopology() {
//   const [systemIp, setSystemIp] = useState('');
//   const [error, setError] = useState('');
//   const [topologyData, setTopologyData] = useState(null);
//   const cyRef = useRef(null);

//   // Initialize Cytoscape once
//   const initializeCytoscape = () => {
//     if (!cyRef.current) {
//       cyRef.current = cytoscape({
//         container: document.getElementById('site-cy'),
//         style: [
//           {
//             selector: 'node',
//             style: {
//               'background-image': 'url(/router.png)', // Ensure router.png is in /public
//               'background-fit': 'cover',
//               'width': '40px',
//               'height': '40px',
//               'label': 'data(label)',
//               'text-valign': 'bottom',
//               'text-margin-y': '5px',
//               'font-size': '10px',
//               'color': '#000',
//               'text-background-opacity': 1,
//               'text-background-color': '#fff',
//               'text-background-padding': '2px',
//               'z-index': 999, // Ensure labels appear above nodes
//             },
//           },
//           {
//             selector: 'edge',
//             style: {
//               'width': 3,
//               'line-color': 'data(color)', // Dynamic edge color
//               'target-arrow-color': 'data(color)',
//               'target-arrow-shape': 'triangle',
//               'curve-style': 'bezier',
//               'label': 'data(label)',
//               'font-size': '10px',
//               'text-background-opacity': 1,
//               'text-background-color': '#fff',
//               'text-background-padding': '2px',
//             },
//           },
//         ],
//         layout: { name: 'grid' },
//       });
//     }
//   };

//   // Fetch site topology from the Go backend
//   const handleFetchSiteTopology = async () => {
//     if (!systemIp.trim()) {
//       setError('System IP is required');
//       return;
//     }

//     setError('');
//     try {
//       const response = await fetch(`/api/topology/site/${systemIp.trim()}`);
//       if (!response.ok) {
//         throw new Error(`Server returned status ${response.status}`);
//       }

//       const data = await response.json();
//       setTopologyData(data);

//       const links = data.links || [];
//       const edges = links.map((link) => ({
//         data: {
//           id: link.linkKey,
//           source: link.source,
//           target: link.target,
//           label: link.linkKeyDisplay || '', // Use linkKeyDisplay as the label
//           color: link.status === 'up' ? '#00a000' : '#FF0000', // Green for up, red for down
//         },
//       }));

//       const nodeSet = new Set();
//       links.forEach((link) => {
//         nodeSet.add(link.source);
//         nodeSet.add(link.target);
//       });

//       const nodes = Array.from(nodeSet).map((nodeId) => ({
//         data: {
//           id: nodeId,
//           label: nodeId,
//         },
//       }));

//       initializeCytoscape();

//       cyRef.current.elements().remove(); // Clear existing elements
//       cyRef.current.add([...nodes, ...edges]); // Add new nodes and edges

//       cyRef.current.layout({ name: 'cose' }).run(); // Apply layout

//       // Add tooltips for nodes
//       cyRef.current.nodes().forEach((node) => {
//         node.on('mouseover', (event) => {
//           const tooltip = document.createElement('div');
//           tooltip.className = 'cy-tooltip'; // Add a class for easier cleanup
//           tooltip.style.position = 'absolute';
//           tooltip.style.backgroundColor = 'white';
//           tooltip.style.border = '1px solid #ccc';
//           tooltip.style.padding = '5px';
//           tooltip.style.pointerEvents = 'none';
//           tooltip.textContent = node.id(); // Display only the node ID
//           document.body.appendChild(tooltip);

//           const pos = event.renderedPosition; // Use event position for accuracy
//           tooltip.style.left = `${pos.x + 10}px`;
//           tooltip.style.top = `${pos.y + 10}px`;
//         });

//         node.on('mouseout', () => {
//           // Remove all tooltips with the class 'cy-tooltip'
//           const tooltips = document.querySelectorAll('.cy-tooltip');
//           tooltips.forEach((tooltip) => tooltip.remove());
//         });
//       });
//     } catch (err) {
//       console.error('Failed to fetch site topology:', err);
//       setError(`Failed to fetch site topology: ${err.message}`);
//     }
//   };

//   useEffect(() => {
//     initializeCytoscape();

//     return () => {
//       if (cyRef.current) {
//         cyRef.current.destroy();
//         cyRef.current = null;
//       }
//     };
//   }, []);

//   return (
//     <div style={{ padding: '1rem' }}>
//       <h1>Site Topology</h1>
//       <div style={{ marginBottom: '1rem' }}>
//         <input
//           type="text"
//           placeholder="Enter system IP"
//           value={systemIp}
//           onChange={(e) => setSystemIp(e.target.value)}
//           style={{ marginRight: '0.5rem' }}
//         />
//         <button onClick={handleFetchSiteTopology}>Visualize Site Topology</button>
//       </div>
//       {error && <p style={{ color: 'red' }}>{error}</p>}
//       <div
//         id="site-cy"
//         style={{
//           width: '100%',
//           height: '600px',
//           border: '1px solid #ccc',
//         }}
//       ></div>
//     </div>
//   );
// }

// export default SiteTopology;


// // src/pages/SiteTopology.js
// import React, { useEffect, useRef, useState } from 'react';
// import cytoscape from 'cytoscape';

// function SiteTopology() {
//   const [systemIp, setSystemIp] = useState('');
//   const [error, setError] = useState('');
//   const [topologyData, setTopologyData] = useState(null);
//   const cyRef = useRef(null);

//   // Initialize Cytoscape once
//   const initializeCytoscape = () => {
//     if (!cyRef.current) {
//       cyRef.current = cytoscape({
//         container: document.getElementById('site-cy'),
//         style: [
//           {
//             selector: 'node',
//             style: {
//               'background-image': 'url(/router.png)', // Ensure router.png is in /public
//               'background-fit': 'cover',
//               'width': '40px',
//               'height': '40px',
//               'label': 'data(label)',
//               'text-valign': 'bottom',
//               'text-margin-y': '5px',
//               'font-size': '10px',
//               'color': '#000',
//               'text-background-opacity': 1,
//               'text-background-color': '#fff',
//               'text-background-padding': '2px',
//               'z-index': 999, // Ensure labels appear above nodes
//             },
//           },
//           {
//             selector: 'edge',
//             style: {
//               'width': 3,
//               'line-color': 'data(color)', // Dynamic edge color
//               'target-arrow-color': 'data(color)',
//               'target-arrow-shape': 'triangle',
//               'curve-style': 'bezier',
//               'label': 'data(label)',
//               'font-size': '10px',
//               'text-background-opacity': 1,
//               'text-background-color': '#fff',
//               'text-background-padding': '2px',
//             },
//           },
//         ],
//         layout: { name: 'grid' },
//       });
//     }
//   };

//   // Fetch site topology from the Go backend
//   const handleFetchSiteTopology = async () => {
//     if (!systemIp.trim()) {
//       setError('System IP is required');
//       return;
//     }

//     setError('');
//     try {
//       const response = await fetch(`/api/topology/site/${systemIp.trim()}`);
//       if (!response.ok) {
//         throw new Error(`Server returned status ${response.status}`);
//       }

//       const data = await response.json();
//       setTopologyData(data);

//       const links = data.links || [];
//       const edges = links.map((link) => ({
//         data: {
//           id: link.linkKey,
//           source: link.source,
//           target: link.target,
//           label: link.linkKeyDisplay || '', // Use linkKeyDisplay as the label
//           color: link.status === 'up' ? '#00a000' : '#FF0000', // Green for up, red for down
//         },
//       }));

//       const nodeSet = new Set();
//       links.forEach((link) => {
//         nodeSet.add(link.source);
//         nodeSet.add(link.target);
//       });

//       const nodes = Array.from(nodeSet).map((nodeId) => ({
//         data: {
//           id: nodeId,
//           label: nodeId,
//         },
//       }));

//       initializeCytoscape();

//       cyRef.current.elements().remove(); // Clear existing elements
//       cyRef.current.add([...nodes, ...edges]); // Add new nodes and edges

//       cyRef.current.layout({ name: 'cose' }).run(); // Apply layout

//       // Add tooltips for nodes
//       cyRef.current.nodes().forEach((node) => {
//         node.on('mouseover', () => {
//           const tooltip = document.createElement('div');
//           tooltip.style.position = 'absolute';
//           tooltip.style.backgroundColor = 'white';
//           tooltip.style.border = '1px solid #ccc';
//           tooltip.style.padding = '5px';
//           tooltip.style.pointerEvents = 'none';
//           tooltip.textContent = `Node ID: ${node.id()}`;
//           document.body.appendChild(tooltip);

//           const pos = node.renderedPosition();
//           tooltip.style.left = `${pos.x + 10}px`;
//           tooltip.style.top = `${pos.y + 10}px`;
//         });

//         node.on('mouseout', () => {
//           const tooltips = document.querySelectorAll('.cy-tooltip');
//           tooltips.forEach((tooltip) => tooltip.remove());
//         });
//       });
//     } catch (err) {
//       console.error('Failed to fetch site topology:', err);
//       setError(`Failed to fetch site topology: ${err.message}`);
//     }
//   };

//   useEffect(() => {
//     initializeCytoscape();

//     return () => {
//       if (cyRef.current) {
//         cyRef.current.destroy();
//         cyRef.current = null;
//       }
//     };
//   }, []);

//   return (
//     <div style={{ padding: '1rem' }}>
//       <h1>Site Topology</h1>
//       <div style={{ marginBottom: '1rem' }}>
//         <input
//           type="text"
//           placeholder="Enter system IP"
//           value={systemIp}
//           onChange={(e) => setSystemIp(e.target.value)}
//           style={{ marginRight: '0.5rem' }}
//         />
//         <button onClick={handleFetchSiteTopology}>Visualize Site Topology</button>
//       </div>
//       {error && <p style={{ color: 'red' }}>{error}</p>}
//       <div
//         id="site-cy"
//         style={{
//           width: '100%',
//           height: '600px',
//           border: '1px solid #ccc',
//         }}
//       ></div>
//     </div>
//   );
// }

// export default SiteTopology;


// // src/pages/SiteTopology.js
// import React, { useEffect, useRef, useState } from 'react';
// import cytoscape from 'cytoscape';

// function SiteTopology() {
//   const [systemIp, setSystemIp] = useState('');
//   const [error, setError] = useState('');
//   const [topologyData, setTopologyData] = useState(null);
//   const cyRef = useRef(null);

//   // Initialize Cytoscape once
//   const initializeCytoscape = () => {
//     if (!cyRef.current) {
//       cyRef.current = cytoscape({
//         container: document.getElementById('site-cy'),
//         style: [
//           {
//             selector: 'node',
//             style: {
//               'background-image': 'url(/router.png)', // place router.png in /public
//               'background-fit': 'cover',
//               'width': '40px',
//               'height': '40px',
//               'label': 'data(label)',
//               'text-valign': 'bottom',
//               'text-margin-y': '5px',
//               'font-size': '10px',
//               'color': '#000',
//               'text-background-opacity': 1,
//               'text-background-color': '#fff',
//               'text-background-padding': '2px'
//             },
//           },
//           {
//             selector: 'edge',
//             style: {
//               'width': 3,
//               'line-color': '#888',
//               'target-arrow-color': '#888',
//               'target-arrow-shape': 'triangle',
//               'curve-style': 'bezier',
//               'label': 'data(label)',
//               'font-size': '10px',
//               'text-background-opacity': 1,
//               'text-background-color': '#fff',
//               'text-background-padding': '2px',
//             },
//           },
//         ],
//         layout: { name: 'grid' },
//       });
//     }
//   };

//   // Fetch site topology from the Go backend
//   const handleFetchSiteTopology = async () => {
//     if (!systemIp.trim()) {
//       setError('System IP is required');
//       return;
//     }
//     setError('');

//     try {
//       const response = await fetch(`/api/topology/site/${systemIp.trim()}`);
//       if (!response.ok) {
//         throw new Error(`Server returned status ${response.status}`);
//       }
//       const data = await response.json();
//       setTopologyData(data);

//       // data looks like:
//       // {
//       //   "links": [
//       //     {
//       //       "linkKey": "...",
//       //       "source": "...",
//       //       "target": "...",
//       //       "linkType": "data",
//       //       "group": 2,
//       //       "status": "down",
//       //       "linkKeyDisplay": "7.7.7.20 (mpls) - 7.7.7.42 (biz-internet)"
//       //     }
//       //   ]
//       // }
//       const links = data.links || [];

//       // Build edges using linkKeyDisplay for the label
//       const edges = links.map((link) => ({
//         data: {
//           id: link.linkKey,
//           source: link.source,
//           target: link.target,
//           label: link.linkKeyDisplay || '',  // <--- Use linkKeyDisplay here
//         },
//       }));

//       // Collect all unique nodes from "source" and "target"
//       const nodeSet = new Set();
//       links.forEach((link) => {
//         nodeSet.add(link.source);
//         nodeSet.add(link.target);
//       });

//       // Convert nodeSet into Cytoscape nodes
//       const nodes = Array.from(nodeSet).map((nodeId) => ({
//         data: {
//           id: nodeId,
//           label: nodeId,
//         },
//       }));

//       // Initialize Cytoscape if not already
//       initializeCytoscape();

//       // Clear any existing elements in the graph
//       cyRef.current.elements().remove();

//       // Add new nodes and edges
//       cyRef.current.add([...nodes, ...edges]);

//       // Run a layout
//       cyRef.current.layout({ name: 'cose' }).run();

//     } catch (err) {
//       console.error('Failed to fetch site topology:', err);
//       setError(`Failed to fetch site topology: ${err.message}`);
//     }
//   };

//   useEffect(() => {
//     initializeCytoscape();
//     // Cleanup on unmount
//     return () => {
//       if (cyRef.current) {
//         cyRef.current.destroy();
//         cyRef.current = null;
//       }
//     };
//   }, []);

//   return (
//     <div style={{ padding: '1rem' }}>
//       <h1>Site Topology</h1>
//       <div style={{ marginBottom: '1rem' }}>
//         <input
//           type="text"
//           placeholder="Enter system IP"
//           value={systemIp}
//           onChange={(e) => setSystemIp(e.target.value)}
//           style={{ marginRight: '0.5rem' }}
//         />
//         <button onClick={handleFetchSiteTopology}>Visualize Site Topology</button>
//       </div>
//       {error && <p style={{ color: 'red' }}>{error}</p>}
//       <div
//         id="site-cy"
//         style={{
//           width: '100%',
//           height: '600px',
//           border: '1px solid #ccc',
//         }}
//       ></div>
//     </div>
//   );
// }

// export default SiteTopology;



// // src/pages/SiteTopology.js
// import React, { useEffect, useRef, useState } from 'react';
// import cytoscape from 'cytoscape';

// function SiteTopology() {
//   const [systemIp, setSystemIp] = useState('');
//   const [error, setError] = useState('');
//   const [topologyData, setTopologyData] = useState(null);
//   const cyRef = useRef(null);

//   // Initialize Cytoscape once
//   const initializeCytoscape = () => {
//     if (!cyRef.current) {
//       cyRef.current = cytoscape({
//         container: document.getElementById('site-cy'),
//         style: [
//           {
//             selector: 'node',
//             style: {
//               'background-image': 'url(/router.png)', // place router.png in /public
//               'background-fit': 'cover',
//               'width': '40px',
//               'height': '40px',
//               'label': 'data(label)',
//               'text-valign': 'bottom',
//               'text-margin-y': '5px',
//               'font-size': '10px',
//               'color': '#000',
//               'text-background-opacity': 1,
//               'text-background-color': '#fff',
//               'text-background-padding': '2px'
//             },
//           },
//           {
//             selector: 'edge',
//             style: {
//               'width': 3,
//               'line-color': '#888',
//               'target-arrow-color': '#888',
//               'target-arrow-shape': 'triangle',
//               'curve-style': 'bezier',
//               'label': 'data(label)',
//               'font-size': '10px',
//               'text-background-opacity': 1,
//               'text-background-color': '#fff',
//               'text-background-padding': '2px',
//             },
//           },
//         ],
//         layout: { name: 'grid' },
//       });
//     }
//   };

//   // Fetch site topology from the Go backend
//   const handleFetchSiteTopology = async () => {
//     if (!systemIp.trim()) {
//       setError('System IP is required');
//       return;
//     }
//     setError('');

//     try {
//       const response = await fetch(`/api/topology/site/${systemIp.trim()}`);
//       if (!response.ok) {
//         throw new Error(`Server returned status ${response.status}`);
//       }
//       const data = await response.json();
//       setTopologyData(data);

//       // data should look like:
//       // {
//       //   "links": [
//       //     {
//       //       "linkKey": "...",
//       //       "source": "...",
//       //       "target": "...",
//       //       "linkType": "...",
//       //       "group": 0,
//       //       "status": "...",
//       //       "linkKeyDisplay": "..."
//       //     }
//       //   ]
//       // }
//       const links = data.links || [];

//       // Build edges based on links
//       const edges = links.map((link) => ({
//         data: {
//           id: link.linkKey,             // unique edge ID
//           source: link.source,
//           target: link.target,
//           label: link.linkType || '',   // show linkType as edge label
//         },
//       }));

//       // Collect all unique nodes from "source" and "target"
//       const nodeSet = new Set();
//       links.forEach((link) => {
//         nodeSet.add(link.source);
//         nodeSet.add(link.target);
//       });

//       // Convert nodeSet into Cytoscape nodes
//       const nodes = Array.from(nodeSet).map((nodeId) => ({
//         data: {
//           id: nodeId,
//           label: nodeId,
//         },
//       }));

//       // Initialize Cytoscape if not already
//       initializeCytoscape();

//       // Clear any existing elements in the graph
//       cyRef.current.elements().remove();

//       // Add new nodes and edges
//       cyRef.current.add([...nodes, ...edges]);

//       // Run a layout
//       cyRef.current.layout({ name: 'cose' }).run();

//     } catch (err) {
//       console.error('Failed to fetch site topology:', err);
//       setError(`Failed to fetch site topology: ${err.message}`);
//     }
//   };

//   useEffect(() => {
//     initializeCytoscape();
//     // Cleanup on unmount
//     return () => {
//       if (cyRef.current) {
//         cyRef.current.destroy();
//         cyRef.current = null;
//       }
//     };
//   }, []);

//   return (
//     <div style={{ padding: '1rem' }}>
//       <h1>Site Topology</h1>
//       <div style={{ marginBottom: '1rem' }}>
//         <input
//           type="text"
//           placeholder="Enter system IP"
//           value={systemIp}
//           onChange={(e) => setSystemIp(e.target.value)}
//           style={{ marginRight: '0.5rem' }}
//         />
//         <button onClick={handleFetchSiteTopology}>Visualize Site Topology</button>
//       </div>
//       {error && <p style={{ color: 'red' }}>{error}</p>}
//       <div
//         id="site-cy"
//         style={{
//           width: '100%',
//           height: '600px',
//           border: '1px solid #ccc',
//         }}
//       ></div>
//     </div>
//   );
// }

// export default SiteTopology;



// // src/pages/SiteTopology.js
// import React, { useEffect, useRef, useState } from 'react';
// import cytoscape from 'cytoscape';

// function SiteTopology() {
//   const [systemIp, setSystemIp] = useState('');
//   const [error, setError] = useState('');
//   const [topologyData, setTopologyData] = useState(null);
//   const cyRef = useRef(null);

//   // Initialize Cytoscape
//   const initializeCytoscape = () => {
//     if (!cyRef.current) {
//       cyRef.current = cytoscape({
//         container: document.getElementById('site-cy'),
//         style: [
//           {
//             selector: 'node',
//             style: {
//               'background-image': 'url(/router.png)', // Make sure you have a /router.png in public
//               'background-fit': 'cover',
//               'width': '40px',
//               'height': '40px',
//               'label': 'data(label)',
//               'text-valign': 'bottom',
//               'text-margin-y': '5px',
//               'font-size': '10px',
//               'color': '#000',
//               'text-background-opacity': 1,
//               'text-background-color': '#fff',
//               'text-background-padding': '2px'
//             },
//           },
//           {
//             selector: 'edge',
//             style: {
//               'width': 3,
//               'line-color': '#888',
//               'target-arrow-color': '#888',
//               'target-arrow-shape': 'triangle',
//               'curve-style': 'bezier',
//               'label': 'data(label)',
//               'font-size': '10px',
//               'text-background-opacity': 1,
//               'text-background-color': '#fff',
//               'text-background-padding': '2px',
//             },
//           },
//         ],
//         layout: { name: 'grid' },
//       });
//     }
//   };

//   // Fetch site topology data
//   const handleFetchSiteTopology = async () => {
//     if (!systemIp.trim()) {
//       setError('System IP is required');
//       return;
//     }
//     setError('');

//     try {
//       // Call your Go backend: /api/topology/site/{system-ip}
//       const response = await fetch(`/api/topology/site/${systemIp.trim()}`);
//       if (!response.ok) {
//         throw new Error(`Server returned status ${response.status}`);
//       }
//       const data = await response.json();
//       setTopologyData(data);

//       // Build the Cytoscape elements from data.
//       // The returned structure is something like:
//       // {
//       //   "Data": [...],
//       //   "Links": [
//       //     {
//       //       "linkKey": "...",
//       //       "source": "...",
//       //       "target": "...",
//       //       "linkType": "...",
//       //       "group": ...,
//       //       "status": "...",
//       //       "linkKeyDisplay": "..."
//       //     }
//       //   ]
//       // }

//       // 1. Create edges from Links
//       const edges = (data.Links || []).map((link) => ({
//         data: {
//           id: link.linkKey,
//           source: link.source,
//           target: link.target,
//           label: link.linkType,
//         },
//       }));

//       // 2. Create nodes from all unique sources and targets
//       const nodeSet = new Set();
//       edges.forEach((edge) => {
//         nodeSet.add(edge.data.source);
//         nodeSet.add(edge.data.target);
//       });

//       // If you have additional node info in data.Data, you could also combine it here.
//       // But if not, we'll just create basic nodes:
//       const nodes = Array.from(nodeSet).map((nodeId) => ({
//         data: {
//           id: nodeId,
//           label: nodeId,
//         },
//       }));

//       // Initialize Cytoscape if not already
//       initializeCytoscape();

//       // Clear any existing elements
//       cyRef.current.elements().remove();

//       // Add new nodes & edges
//       cyRef.current.add([...nodes, ...edges]);

//       // Run layout
//       cyRef.current.layout({ name: 'cose' }).run();

//     } catch (err) {
//       console.error('Failed to fetch site topology:', err);
//       setError(`Failed to fetch site topology: ${err.message}`);
//     }
//   };

//   // Setup Cytoscape on mount
//   useEffect(() => {
//     initializeCytoscape();
//     return () => {
//       if (cyRef.current) {
//         cyRef.current.destroy();
//         cyRef.current = null;
//       }
//     };
//   }, []);

//   return (
//     <div style={{ padding: '1rem' }}>
//       <h1>Site Topology</h1>
//       <div style={{ marginBottom: '1rem' }}>
//         <input
//           type="text"
//           placeholder="Enter system IP"
//           value={systemIp}
//           onChange={(e) => setSystemIp(e.target.value)}
//           style={{ marginRight: '0.5rem' }}
//         />
//         <button onClick={handleFetchSiteTopology}>Visualize Site Topology</button>
//       </div>
//       {error && <p style={{ color: 'red' }}>{error}</p>}
//       <div
//         id="site-cy"
//         style={{
//           width: '100%',
//           height: '600px',
//           border: '1px solid #ccc',
//         }}
//       ></div>
//     </div>
//   );
// }

// export default SiteTopology;



// import React, { useEffect, useRef, useState } from 'react';
// import cytoscape from 'cytoscape';

// function SiteTopology() {
//   const [systemIp, setSystemIp] = useState('');
//   const [error, setError] = useState('');
//   const [topologyData, setTopologyData] = useState(null);
//   const cyRef = useRef(null);

//   // Initialize Cytoscape (once).
//   const initializeCytoscape = () => {
//     if (!cyRef.current) {
//       cyRef.current = cytoscape({
//         container: document.getElementById('site-cy'), // A different container ID
//         style: [
//           {
//             selector: 'node',
//             style: {
//               'background-image': 'url(/router.png)',
//               'background-fit': 'cover',
//               'width': '40px',
//               'height': '40px',
//               'label': 'data(label)',
//               'text-valign': 'bottom',
//               'text-margin-y': '5px',
//               'font-size': '10px',
//               'color': '#000',
//               'text-background-opacity': 1,
//               'text-background-color': '#fff',
//               'text-background-padding': '2px'
//             },
//           },
//           {
//             selector: 'edge',
//             style: {
//               'width': 3,
//               'line-color': '#888',
//               'target-arrow-color': '#888',
//               'target-arrow-shape': 'triangle',
//               'curve-style': 'bezier',
//               'label': 'data(label)',
//               'font-size': '10px',
//               'text-background-opacity': 1,
//               'text-background-color': '#fff',
//               'text-background-padding': '2px',
//             },
//           },
//         ],
//         layout: { name: 'grid' },
//       });
//     }
//   };

//   // Handle the button click to fetch site topology.
//   const handleFetchSiteTopology = async () => {
//     if (!systemIp.trim()) {
//       setError('System IP is required');
//       return;
//     }
//     setError('');

//     try {
//       // Fetch data from your new Go endpoint: /api/sitetopology/{systemIp}
//       const response = await fetch(`/api/sitetopology/${systemIp.trim()}`);
//       if (!response.ok) {
//         throw new Error(`Server returned status ${response.status}`);
//       }
//       const data = await response.json();
//       setTopologyData(data);

//       // Build Cytoscape elements from the returned data.
//       // The returned object structure is:
//       // {
//       //   "data": [],
//       //   "links": [
//       //     {
//       //       "linkKey": "...",
//       //       "source": "...",
//       //       "target": "...",
//       //       "linkType": "...",
//       //       "group": ...,
//       //       "status": "...",
//       //       "linkKeyDisplay": "..."
//       //     }
//       //   ]
//       // }

//       // 1. Nodes from data[]. We don’t know the exact structure of each object in data[],
//       //    but we’ll assume each node can be represented by an ID or we’ll generate one.
//       const nodes = (data.data || []).map((item, index) => {
//         // If item has a 'systemIp' or a 'hostName', use that, otherwise fallback to index.
//         const nodeId = item.systemIp || item.hostName || `node-${index}`;
//         return {
//           data: {
//             id: nodeId,
//             label: nodeId,
//           },
//         };
//       });

//       // 2. Edges from links[]. We'll use source, target, and linkType for the label.
//       const edges = (data.links || []).map((link) => ({
//         data: {
//           id: link.linkKey,
//           source: link.source,
//           target: link.target,
//           label: link.linkType,
//         },
//       }));

//       // Initialize Cytoscape if needed.
//       initializeCytoscape();

//       // Clear existing elements.
//       cyRef.current.elements().remove();

//       // Add new nodes and edges.
//       cyRef.current.add([...nodes, ...edges]);

//       // Run a layout.
//       cyRef.current.layout({ name: 'cose' }).run();

//     } catch (err) {
//       console.error('Failed to fetch site topology:', err);
//       setError(`Failed to fetch site topology: ${err.message}`);
//     }
//   };

//   // Initialize Cytoscape on first mount.
//   useEffect(() => {
//     initializeCytoscape();
//     return () => {
//       // Cleanup: destroy cytoscape instance if needed
//       if (cyRef.current) {
//         cyRef.current.destroy();
//         cyRef.current = null;
//       }
//     };
//   }, []);

//   return (
//     <div style={{ padding: '1rem' }}>
//       <h1>Site Topology</h1>
//       <div style={{ marginBottom: '1rem' }}>
//         <input
//           type="text"
//           placeholder="Enter system IP"
//           value={systemIp}
//           onChange={(e) => setSystemIp(e.target.value)}
//           style={{ marginRight: '0.5rem' }}
//         />
//         <button onClick={handleFetchSiteTopology}>Visualize Site Topology</button>
//       </div>
//       {error && <p style={{ color: 'red' }}>{error}</p>}

//       <div
//         id="site-cy"
//         style={{
//           width: '100%',
//           height: '600px',
//           border: '1px solid #ccc',
//         }}
//       ></div>
//     </div>
//   );
// }

// export default SiteTopology;
