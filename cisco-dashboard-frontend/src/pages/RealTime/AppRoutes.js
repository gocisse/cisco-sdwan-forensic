// src/pages/RealTime/AppRoutes.js
import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import useApiFetch from '../../hooks/useApiFetch';
import LoadingSpinner from '../../components/LoadingSpinner';

function AppRoutes() {
  const { systemIp: urlSystemIp } = useParams();
  const [inputIp, setInputIp] = useState(urlSystemIp || '');
  const [activeIp, setActiveIp] = useState(urlSystemIp || '');

  const apiUrl = activeIp ? `/api/app-routes/${activeIp}` : null;
  const { data: routes, isLoading, error, refetch } = useApiFetch(apiUrl);

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
      <h1>Application-Aware Routes {activeIp && <span style={{ fontSize: '1rem', color: '#666' }}>({activeIp})</span>}</h1>
      <div style={{ marginBottom: '1rem' }}>
        <input type="text" placeholder="Enter system IP" value={inputIp}
          onChange={(e) => setInputIp(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleFetch()}
          style={{ marginRight: '0.5rem', padding: '6px 10px' }} />
        <button onClick={handleFetch} style={{ padding: '6px 16px', marginRight: '0.5rem' }}>Fetch Data</button>
        {activeIp && <button onClick={refetch} style={{ padding: '6px 16px' }}>Refresh</button>}
      </div>

      {isLoading && <LoadingSpinner message="Fetching app routes..." />}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {!isLoading && routes && routes.length > 0 && (
        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
              <th style={thStyle}>Hostname</th>
              <th style={thStyle}>src-ip</th>
              <th style={thStyle}>dst-ip</th>
              <th style={thStyle}>Remote Color</th>
              <th style={thStyle}>proto</th>
              <th style={thStyle}>average-latency</th>
              <th style={thStyle}>average-jitter</th>
              <th style={thStyle}>loss</th>
              <th style={thStyle}>lastupdated</th>
            </tr>
          </thead>
          <tbody>
            {routes.map((route, index) => (
              <tr key={index}>
                <td style={tdStyle}>{route["vdevice-host-name"]}</td>
                <td style={tdStyle}>{route["src-ip"]}</td>
                <td style={tdStyle}>{route["dst-ip"]}</td>
                <td style={tdStyle}>{route["remote-color"]}</td>
                <td style={tdStyle}>{route["proto"]}</td>
                <td style={tdStyle}>{route["average-latency"]}</td>
                <td style={tdStyle}>{route["average-jitter"]}</td>
                <td style={tdStyle}>{route["loss"]}</td>
                <td style={tdStyle}>
                  {route["lastupdated"] ? new Date(route["lastupdated"]).toLocaleString() : "N/A"}
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

export default AppRoutes;
