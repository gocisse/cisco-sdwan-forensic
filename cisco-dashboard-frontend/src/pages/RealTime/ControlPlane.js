// src/pages/RealTime/ControlPlane.js
import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import useApiFetch from '../../hooks/useApiFetch';
import LoadingSpinner from '../../components/LoadingSpinner';

function ControlPlane() {
  const { systemIp: urlSystemIp } = useParams();
  const [inputIp, setInputIp] = useState(urlSystemIp || '');
  const [activeIp, setActiveIp] = useState(urlSystemIp || '');

  const apiUrl = activeIp ? `/api/control-plane/${activeIp}` : null;
  const { data: controlPlaneData, isLoading, error, refetch } = useApiFetch(apiUrl);

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
      <h1>Control Plane {activeIp && <span style={{ fontSize: '1rem', color: '#666' }}>({activeIp})</span>}</h1>
      <div style={{ marginBottom: '1rem' }}>
        <input type="text" placeholder="Enter system IP" value={inputIp}
          onChange={(e) => setInputIp(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleFetch()}
          style={{ marginRight: '0.5rem', padding: '6px 10px' }} />
        <button onClick={handleFetch} style={{ padding: '6px 16px', marginRight: '0.5rem' }}>Fetch Data</button>
        {activeIp && <button onClick={refetch} style={{ padding: '6px 16px' }}>Refresh</button>}
      </div>

      {isLoading && <LoadingSpinner message="Fetching control plane data..." />}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {!isLoading && controlPlaneData && controlPlaneData.length > 0 && (
        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
              <th style={thStyle}>vdevice-name</th>
              <th style={thStyle}>peer</th>
              <th style={thStyle}>state</th>
              <th style={thStyle}>type</th>
              <th style={thStyle}>site-id</th>
              <th style={thStyle}>domain-id</th>
              <th style={thStyle}>up-time</th>
              <th style={thStyle}>lastupdated</th>
            </tr>
          </thead>
          <tbody>
            {controlPlaneData.map((item, index) => (
              <tr key={index}>
                <td style={tdStyle}>{item["vdevice-name"]}</td>
                <td style={tdStyle}>{item["peer"]}</td>
                <td style={tdStyle}>{item["state"]}</td>
                <td style={tdStyle}>{item["type"]}</td>
                <td style={tdStyle}>{item["site-id"]}</td>
                <td style={tdStyle}>{item["domain-id"]}</td>
                <td style={tdStyle}>{item["up-time"]}</td>
                <td style={tdStyle}>
                  {item["lastupdated"] ? new Date(item["lastupdated"]).toLocaleString() : "N/A"}
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

export default ControlPlane;
