/**
 * Custom hook for fetching topology data
 */

import { useState, useCallback, useEffect } from "react";
// API endpoints - using direct paths for now
const API = {
  connections: (ip) => `/api/connections/${ip}`,
  logicalTopology: (ip, showAll) => showAll ? `/api/topology/logical/${ip}?showAll=true` : `/api/topology/logical/${ip}`,
  ompTopology: (ip) => `/api/topology/omp/${ip}`,
};

/**
 * Hook for managing topology data fetching
 */
export function useTopologyData(view, activeIp, controllers, showAllPeers) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [controlData, setControlData] = useState({});
  const [logicalData, setLogicalData] = useState(null);
  const [ompData, setOmpData] = useState(null);

  // Fetch control connections for all controllers
  const fetchControlPlane = useCallback(async () => {
    if (!controllers.length) return;
    setLoading(true);
    setError("");
    setControlData({});
    const results = {};

    const fetches = controllers.map(async (ctrl) => {
      const ip = ctrl["system-ip"];
      try {
        const res = await fetch(API.connections(ip));
        if (!res.ok) return;
        const json = await res.json();
        results[ip] = Array.isArray(json) ? json : json.data || [];
      } catch (e) {
        console.warn(`Control connections fetch failed for ${ip}:`, e);
      }
    });

    await Promise.all(fetches);
    setControlData(results);
    setLoading(false);
  }, [controllers]);

  // Fetch logical topology (aggregated relationships) for selected device
  const fetchDataPlane = useCallback(async (ip, showAll = false) => {
    if (!ip) return;
    setLoading(true);
    setError("");
    setLogicalData(null);
    try {
      const res = await fetch(API.logicalTopology(ip, showAll));
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setLogicalData(json);
    } catch (e) {
      console.error("Data plane fetch error:", e);
      setError("Failed to fetch data plane topology");
    }
    setLoading(false);
  }, []);

  // Fetch OMP routing topology for selected device
  const fetchOmpTopology = useCallback(async (ip) => {
    if (!ip) return;
    setLoading(true);
    setError("");
    setOmpData(null);
    try {
      const res = await fetch(API.ompTopology(ip));
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setOmpData(json);
    } catch (e) {
      console.error("OMP topology fetch error:", e);
      setError("Failed to fetch OMP routing topology");
    }
    setLoading(false);
  }, []);

  // Auto-fetch based on view
  useEffect(() => {
    if (view === "control" && controllers.length > 0) {
      fetchControlPlane();
    }
  }, [view, controllers, fetchControlPlane]);

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
    controlData,
    logicalData,
    ompData,
    fetchControlPlane,
    fetchDataPlane,
    fetchOmpTopology,
  };
}

export default useTopologyData;
