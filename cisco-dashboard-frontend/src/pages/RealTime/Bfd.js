// src/pages/RealTime/Bfd.js
import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import useApiFetch from '../../hooks/useApiFetch';
import LoadingSpinner from '../../components/LoadingSpinner';

function Bfd() {
  const { systemIp: urlSystemIp } = useParams();
  const [inputIp, setInputIp] = useState(urlSystemIp || '');
  const [activeIp, setActiveIp] = useState(urlSystemIp || '');

  const apiUrl = activeIp ? `/api/bfd/${activeIp}` : null;
  const { data: bfdSessions, isLoading, error, refetch } = useApiFetch(apiUrl);

  const handleFetch = () => {
    if (!inputIp.trim()) return;
    setActiveIp(inputIp.trim());
  };

  return (
    <div style={{ padding: '1rem' }}>
      {urlSystemIp && (
        <p style={{ marginBottom: '0.5rem', color: '#666' }}>
          <Link to={`/device/${urlSystemIp}`} style={{ color: '#1A73E8', textDecoration: 'none' }}>
            &larr; Back to {urlSystemIp}
          </Link>
        </p>
      )}
      <h1>BFD Sessions {activeIp && <span style={{ fontSize: '1rem', color: '#666' }}>({activeIp})</span>}</h1>
      <div style={{ marginBottom: '1rem' }}>
        <input
          type="text"
          placeholder="Enter system IP"
          value={inputIp}
          onChange={(e) => setInputIp(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleFetch()}
          style={{ marginRight: '0.5rem', padding: '6px 10px' }}
        />
        <button onClick={handleFetch} style={{ padding: '6px 16px', marginRight: '0.5rem' }}>Fetch Data</button>
        {activeIp && <button onClick={refetch} style={{ padding: '6px 16px' }}>Refresh</button>}
      </div>

      {isLoading && <LoadingSpinner message="Fetching BFD sessions..." />}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {!isLoading && bfdSessions && bfdSessions.length > 0 && (
        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
              <th style={thStyle}>Source IP</th>
              <th style={thStyle}>Dest IP</th>
              <th style={thStyle}>Source Port</th>
              <th style={thStyle}>Dest Port</th>
              <th style={thStyle}>Tunnel Protocol</th>
              <th style={thStyle}>Last Updated</th>
            </tr>
          </thead>
          <tbody>
            {bfdSessions.map((session, index) => (
              <tr key={index}>
                <td style={tdStyle}>{session["source-ip"]}</td>
                <td style={tdStyle}>{session["dest-ip"]}</td>
                <td style={tdStyle}>{session["source-port"]}</td>
                <td style={tdStyle}>{session["dest-port"]}</td>
                <td style={tdStyle}>{session["tunnel-protocol"]}</td>
                <td style={tdStyle}>
                  {session["lastupdated"]
                    ? new Date(session["lastupdated"]).toLocaleString()
                    : "N/A"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {!isLoading && bfdSessions && bfdSessions.length === 0 && (
        <p style={{ color: '#888' }}>No BFD sessions found for {activeIp}.</p>
      )}
    </div>
  );
}

const thStyle = {
  border: '1px solid #ccc',
  padding: '8px',
  backgroundColor: '#f2f2f2',
};

const tdStyle = {
  border: '1px solid #ccc',
  padding: '8px',
};

export default Bfd;
