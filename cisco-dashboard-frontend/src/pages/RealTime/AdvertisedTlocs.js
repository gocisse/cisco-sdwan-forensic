// src/pages/RealTime/AdvertisedTlocs.js
import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import useApiFetch from '../../hooks/useApiFetch';
import LoadingSpinner from '../../components/LoadingSpinner';

function AdvertisedTlocs() {
  const { systemIp: urlSystemIp } = useParams();
  const [inputIp, setInputIp] = useState(urlSystemIp || '');
  const [activeIp, setActiveIp] = useState(urlSystemIp || '');

  const apiUrl = activeIp ? `/api/tlocs/advertised/${activeIp}` : null;
  const { data: tlocs, isLoading, error, refetch } = useApiFetch(apiUrl);

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
      <h1>Advertised TLOCs {activeIp && <span style={{ fontSize: '1rem', color: '#666' }}>({activeIp})</span>}</h1>
      <div style={{ marginBottom: '1rem' }}>
        <input type="text" placeholder="Enter system IP" value={inputIp}
          onChange={(e) => setInputIp(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleFetch()}
          style={{ marginRight: '0.5rem', padding: '6px 10px' }} />
        <button onClick={handleFetch} style={{ padding: '6px 16px', marginRight: '0.5rem' }}>Fetch Data</button>
        {activeIp && <button onClick={refetch} style={{ padding: '6px 16px' }}>Refresh</button>}
      </div>

      {isLoading && <LoadingSpinner message="Fetching advertised TLOCs..." />}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {!isLoading && tlocs && tlocs.length > 0 && (
        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
              <th style={thStyle}>vdevice-name</th>
              <th style={thStyle}>color</th>
              <th style={thStyle}>ip</th>
              <th style={thStyle}>tloc-auth-type</th>
              <th style={thStyle}>encap</th>
              <th style={thStyle}>from-peer</th>
              <th style={thStyle}>lastupdated</th>
            </tr>
          </thead>
          <tbody>
            {tlocs.map((tloc, index) => (
              <tr key={index}>
                <td style={tdStyle}>{tloc["vdevice-name"]}</td>
                <td style={tdStyle}>{tloc["color"]}</td>
                <td style={tdStyle}>{tloc["ip"]}</td>
                <td style={tdStyle}>{tloc["tloc-auth-type"]}</td>
                <td style={tdStyle}>{tloc["encap"]}</td>
                <td style={tdStyle}>{tloc["from-peer"]}</td>
                <td style={tdStyle}>
                  {tloc["lastupdated"] ? new Date(tloc["lastupdated"]).toLocaleString() : "N/A"}
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

export default AdvertisedTlocs;
