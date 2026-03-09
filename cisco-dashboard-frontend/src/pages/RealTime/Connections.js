// src/pages/RealTime/Connections.js
import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import useApiFetch from '../../hooks/useApiFetch';
import LoadingSpinner from '../../components/LoadingSpinner';

function Connections() {
  const { systemIp: urlSystemIp } = useParams();
  const [inputIp, setInputIp] = useState(urlSystemIp || '');
  const [activeIp, setActiveIp] = useState(urlSystemIp || '');

  const apiUrl = activeIp ? `/api/connections/${activeIp}` : null;
  const { data: connections, isLoading, error, refetch } = useApiFetch(apiUrl);

  const handleFetch = () => {
    if (!inputIp.trim()) return;
    setActiveIp(inputIp.trim());
  };

  return (
    <div style={{ padding: '1rem' }}>
      {urlSystemIp && (
        <p style={{ marginBottom: '0.5rem', color: '#666' }}>
          <Link to={`/device/${urlSystemIp}`} style={{ color: '#1A73E8', textDecoration: 'none' }}>&larr; Back to {urlSystemIp}</Link>
        </p>
      )}
      <h1>Control Connections {activeIp && <span style={{ fontSize: '1rem', color: '#666' }}>({activeIp})</span>}</h1>
      <div style={{ marginBottom: '1rem' }}>
        <input type="text" placeholder="Enter system IP" value={inputIp}
          onChange={(e) => setInputIp(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleFetch()}
          style={{ marginRight: '0.5rem', padding: '6px 10px' }} />
        <button onClick={handleFetch} style={{ padding: '6px 16px', marginRight: '0.5rem' }}>Fetch Data</button>
        {activeIp && <button onClick={refetch} style={{ padding: '6px 16px' }}>Refresh</button>}
      </div>

      {isLoading && <LoadingSpinner message="Fetching connections..." />}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {!isLoading && connections && connections.length > 0 && (
        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
              <th style={thStyle}>system-ip</th>
              <th style={thStyle}>state</th>
              <th style={thStyle}>protocol</th>
              <th style={thStyle}>peer-type</th>
              <th style={thStyle}>uptime</th>
              <th style={thStyle}>local-color</th>
              <th style={thStyle}>remote-color</th>
              <th style={thStyle}>private-ip</th>
              <th style={thStyle}>public-ip</th>
              <th style={thStyle}>lastupdated</th>
            </tr>
          </thead>
          <tbody>
            {connections.map((conn, index) => (
              <tr key={index}>
                <td style={tdStyle}>{conn["system-ip"]}</td>
                <td style={tdStyle}>{conn["state"]}</td>
                <td style={tdStyle}>{conn["protocol"]}</td>
                <td style={tdStyle}>{conn["peer-type"]}</td>
                <td style={tdStyle}>{conn["uptime"]}</td>
                <td style={tdStyle}>{conn["local-color"]}</td>
                <td style={tdStyle}>{conn["remote-color"]}</td>
                <td style={tdStyle}>{conn["private-ip"]}</td>
                <td style={tdStyle}>{conn["public-ip"]}</td>
                <td style={tdStyle}>
                  {conn["lastupdated"] ? new Date(conn["lastupdated"]).toLocaleString() : "N/A"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

const thStyle = { border: '1px solid #ccc', padding: '8px', backgroundColor: '#f2f2f2' };
const tdStyle = { border: '1px solid #ccc', padding: '8px' };

export default Connections;
