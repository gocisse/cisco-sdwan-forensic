// src/pages/RealTime/Ipsec.js
import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import useApiFetch from '../../hooks/useApiFetch';
import LoadingSpinner from '../../components/LoadingSpinner';

function Ipsec() {
  const { systemIp: urlSystemIp } = useParams();
  const [inputIp, setInputIp] = useState(urlSystemIp || '');
  const [activeIp, setActiveIp] = useState(urlSystemIp || '');

  const apiUrl = activeIp ? `/api/ipsec/${activeIp}` : null;
  const { data: ipsecData, isLoading, error, refetch } = useApiFetch(apiUrl);

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
      <h1>IPSEC Statistics {activeIp && <span style={{ fontSize: '1rem', color: '#666' }}>({activeIp})</span>}</h1>
      <div style={{ marginBottom: '1rem' }}>
        <input type="text" placeholder="Enter system IP" value={inputIp}
          onChange={(e) => setInputIp(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleFetch()}
          style={{ marginRight: '0.5rem', padding: '6px 10px' }} />
        <button onClick={handleFetch} style={{ padding: '6px 16px', marginRight: '0.5rem' }}>Fetch Data</button>
        {activeIp && <button onClick={refetch} style={{ padding: '6px 16px' }}>Refresh</button>}
      </div>

      {isLoading && <LoadingSpinner message="Fetching IPSEC statistics..." />}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {!isLoading && ipsecData && ipsecData.length > 0 && (
        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
              <th style={thStyle}>source-ip</th>
              <th style={thStyle}>dest-ip</th>
              <th style={thStyle}>source-port</th>
              <th style={thStyle}>dest-port</th>
              <th style={thStyle}>tunnel-protocol</th>
              <th style={thStyle}>ipsec-rx-failures</th>
              <th style={thStyle}>ipsec-tx-failures</th>
              <th style={thStyle}>lastupdated</th>
            </tr>
          </thead>
          <tbody>
            {ipsecData.map((item, index) => (
              <tr key={index}>
                <td style={tdStyle}>{item["source-ip"]}</td>
                <td style={tdStyle}>{item["dest-ip"]}</td>
                <td style={tdStyle}>{item["source-port"]}</td>
                <td style={tdStyle}>{item["dest-port"]}</td>
                <td style={tdStyle}>{item["tunnel-protocol"]}</td>
                <td style={tdStyle}>{item["ipsec-rx-failures"]}</td>
                <td style={tdStyle}>{item["ipsec-tx-failures"]}</td>
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

export default Ipsec;
