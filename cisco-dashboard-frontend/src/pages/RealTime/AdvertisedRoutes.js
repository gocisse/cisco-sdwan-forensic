// src/pages/RealTime/AdvertisedRoutes.js
import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import useApiFetch from '../../hooks/useApiFetch';
import LoadingSpinner from '../../components/LoadingSpinner';

function AdvertisedRoutes() {
  const { systemIp: urlSystemIp } = useParams();
  const [inputIp, setInputIp] = useState(urlSystemIp || '');
  const [activeIp, setActiveIp] = useState(urlSystemIp || '');

  const apiUrl = activeIp ? `/api/routes/advertised/${activeIp}` : null;
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
      <h1>Advertised Routes {activeIp && <span style={{ fontSize: '1rem', color: '#666' }}>({activeIp})</span>}</h1>
      <div style={{ marginBottom: '1rem' }}>
        <input type="text" placeholder="Enter system IP" value={inputIp}
          onChange={(e) => setInputIp(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleFetch()}
          style={{ marginRight: '0.5rem', padding: '6px 10px' }} />
        <button onClick={handleFetch} style={{ padding: '6px 16px', marginRight: '0.5rem' }}>Fetch Data</button>
        {activeIp && <button onClick={refetch} style={{ padding: '6px 16px' }}>Refresh</button>}
      </div>

      {isLoading && <LoadingSpinner message="Fetching advertised routes..." />}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {!isLoading && routes && routes.length > 0 && (
        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
              <th style={thStyle}>Prefix</th>
              <th style={thStyle}>Protocol</th>
              <th style={thStyle}>Color</th>
              <th style={thStyle}>From Peer</th>
              <th style={thStyle}>Last Updated</th>
              <th style={thStyle}>Overlay ID</th>
            </tr>
          </thead>
          <tbody>
            {routes.map((route, index) => (
              <tr key={index}>
                <td style={tdStyle}>{route["prefix"]}</td>
                <td style={tdStyle}>{route["protocol"]}</td>
                <td style={tdStyle}>{route["color"]}</td>
                <td style={tdStyle}>{route["from-peer"]}</td>
                <td style={tdStyle}>
                  {route["lastupdated"] ? new Date(route["lastupdated"]).toLocaleString() : "N/A"}
                </td>
                <td style={tdStyle}>{route["overlay-id"]}</td>
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

export default AdvertisedRoutes;
