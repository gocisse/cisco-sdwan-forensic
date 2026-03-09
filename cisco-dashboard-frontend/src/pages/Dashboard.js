// src/pages/Dashboard.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import useApiFetch from '../hooks/useApiFetch';
import LoadingSpinner from '../components/LoadingSpinner';

function Dashboard() {
  const { data: devices, isLoading, error } = useApiFetch('/api/devices');
  const navigate = useNavigate();

  if (isLoading) return <LoadingSpinner message="Loading devices..." />;

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '1.5rem', fontSize: '2rem', color: '#333' }}>
        Device Dashboard
      </h1>

      {error && (
        <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '1.5rem',
      }}>
        {(devices || []).map((device, index) => {
          const isReachable = (device['reachability'] || '').toLowerCase() === 'reachable';
          const sysIp = device['system-ip'];

          return (
            <div
              key={index}
              onClick={() => sysIp && navigate(`/device/${sysIp}`)}
              style={{
                backgroundColor: isReachable ? '#E6FFEB' : '#FFEDED',
                border: '1px solid #ccc',
                borderRadius: '8px',
                padding: '1rem 1.5rem',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                cursor: 'pointer',
                transition: 'transform 0.15s, box-shadow 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
              }}
            >
              <h2 style={{ fontSize: '1.25rem', margin: '0 0 0.5rem 0', color: '#333' }}>
                {device['host-name'] || 'Unnamed Device'}
              </h2>
              <p style={{ margin: '0.25rem 0' }}>
                <strong>System IP:</strong> {sysIp || 'N/A'}
              </p>
              <p style={{ margin: '0.25rem 0' }}>
                <strong>Status:</strong> {device['status'] || 'N/A'}
              </p>
              <p style={{ margin: '0.25rem 0' }}>
                <strong>Reachability:</strong>{' '}
                {isReachable ? 'Reachable' : 'Unreachable'}
              </p>
              <p style={{ margin: '0.25rem 0' }}>
                <strong>Model:</strong> {device['device-model'] || 'N/A'}
              </p>
              <p style={{ margin: '0.25rem 0' }}>
                <strong>Site ID:</strong> {device['site-id'] || 'N/A'}
              </p>
              <p style={{ margin: '0.25rem 0' }}>
                <strong>Connections:</strong> {device['controlConnections'] || 'N/A'}
              </p>
              <p style={{ margin: '0.15rem 0', fontSize: '0.8rem', color: '#888', marginTop: '0.5rem' }}>
                Click to view details &rarr;
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Dashboard;
