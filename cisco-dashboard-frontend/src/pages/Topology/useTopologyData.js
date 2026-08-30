/**
 * Custom hook for fetching topology data
 * Only Data Plane and OMP views (device-specific, no control plane)
 */

import { useState, useCallback, useEffect, useRef } from "react";

// API endpoints
const API = {
  logicalTopology: (ip, showAll) => showAll ? `/api/topology/logical/${ip}?showAll=true` : `/api/topology/logical/${ip}`,
  ompTopology: (ip) => `/api/topology/omp/${ip}`,
};

// Fetch timeout (ms)
const FETCH_TIMEOUT = 30000;

/**
 * Fetch with timeout wrapper
 */
async function fetchWithTimeout(url, timeoutMs = FETCH_TIMEOUT) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Hook for managing topology data fetching
 * Only fetches data for the selected device (Data Plane or OMP)
 */
export function useTopologyData(view, activeIp, showAllPeers) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [logicalData, setLogicalData] = useState(null);
  const [ompData, setOmpData] = useState(null);
  
  // Track if component is mounted
  const mountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Fetch logical topology (Data Plane - BFD relationships) for selected device
  const fetchDataPlane = useCallback(async (ip, showAll = false) => {
    if (!ip) return;
    
    setLoading(true);
    setError("");
    setLogicalData(null);
    
    try {
      const res = await fetchWithTimeout(API.logicalTopology(ip, showAll));
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${res.status}`);
      }
      const json = await res.json();
      
      if (mountedRef.current) {
        setLogicalData(json);
      }
    } catch (e) {
      if (mountedRef.current) {
        console.error("Data plane fetch error:", e);
        if (e.name === 'AbortError') {
          setError("Request timed out. The device may be slow to respond.");
        } else {
          setError(`Failed to fetch data plane topology: ${e.message}`);
        }
      }
    }
    
    if (mountedRef.current) {
      setLoading(false);
    }
  }, []);

  // Fetch OMP routing topology for selected device
  const fetchOmpTopology = useCallback(async (ip) => {
    if (!ip) return;
    
    setLoading(true);
    setError("");
    setOmpData(null);
    
    try {
      const res = await fetchWithTimeout(API.ompTopology(ip));
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${res.status}`);
      }
      const json = await res.json();
      
      if (mountedRef.current) {
        setOmpData(json);
      }
    } catch (e) {
      if (mountedRef.current) {
        console.error("OMP topology fetch error:", e);
        if (e.name === 'AbortError') {
          setError("Request timed out. The device may be slow to respond.");
        } else {
          setError(`Failed to fetch OMP routing topology: ${e.message}`);
        }
      }
    }
    
    if (mountedRef.current) {
      setLoading(false);
    }
  }, []);

  // Auto-fetch based on view and selected device
  useEffect(() => {
    if (view === "dataplane" && activeIp) {
      fetchDataPlane(activeIp, showAllPeers);
    }
  }, [view, activeIp, showAllPeers, fetchDataPlane]);

  useEffect(() => {
    if (view === "omp" && activeIp) {
      fetchOmpTopology(activeIp);
    }
  }, [view, activeIp, fetchOmpTopology]);

  return {
    loading,
    error,
    logicalData,
    ompData,
    fetchDataPlane,
    fetchOmpTopology,
  };
}

export default useTopologyData;
