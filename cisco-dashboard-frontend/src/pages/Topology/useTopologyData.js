/**
 * Custom hook for fetching topology data
 * Optimized for large fabrics with batching and limiting
 */

import { useState, useCallback, useEffect, useRef } from "react";

// API endpoints
const API = {
  connections: (ip) => `/api/connections/${ip}`,
  logicalTopology: (ip, showAll) => showAll ? `/api/topology/logical/${ip}?showAll=true` : `/api/topology/logical/${ip}`,
  ompTopology: (ip) => `/api/topology/omp/${ip}`,
};

// Configuration for large fabric optimization
const CONFIG = {
  // Max controllers to fetch in parallel (prevents browser freeze)
  maxParallelFetches: 3,
  // Max controllers to fetch total for control plane view
  maxControllersToFetch: 10,
  // Timeout for individual fetch (ms)
  fetchTimeout: 15000,
};

/**
 * Fetch with timeout wrapper
 */
async function fetchWithTimeout(url, timeoutMs = CONFIG.fetchTimeout) {
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
 * Process array in chunks with concurrency limit
 */
async function processInChunks(items, processor, concurrency = CONFIG.maxParallelFetches) {
  const results = [];
  for (let i = 0; i < items.length; i += concurrency) {
    const chunk = items.slice(i, i + concurrency);
    const chunkResults = await Promise.allSettled(chunk.map(processor));
    results.push(...chunkResults);
  }
  return results;
}

/**
 * Hook for managing topology data fetching
 */
export function useTopologyData(view, activeIp, controllers, showAllPeers) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [controlData, setControlData] = useState({});
  const [logicalData, setLogicalData] = useState(null);
  const [ompData, setOmpData] = useState(null);
  
  // Track if component is mounted to prevent state updates after unmount
  const mountedRef = useRef(true);
  
  // Abort controller for canceling in-flight requests
  const abortControllerRef = useRef(null);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Fetch control connections for controllers (with batching)
  const fetchControlPlane = useCallback(async () => {
    if (!controllers.length) return;
    
    // Cancel any in-flight requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    
    setLoading(true);
    setError("");
    setControlData({});
    
    // Limit controllers to prevent overwhelming the browser
    const controllersToFetch = controllers.slice(0, CONFIG.maxControllersToFetch);
    const skippedCount = controllers.length - controllersToFetch.length;
    
    if (skippedCount > 0) {
      console.warn(`Control plane: fetching ${controllersToFetch.length} of ${controllers.length} controllers (${skippedCount} skipped for performance)`);
    }
    
    const results = {};
    
    // Process in chunks to prevent browser freeze
    await processInChunks(controllersToFetch, async (ctrl) => {
      const ip = ctrl["system-ip"];
      try {
        const res = await fetchWithTimeout(API.connections(ip));
        if (!res.ok) return;
        const json = await res.json();
        
        // Only update if still mounted
        if (mountedRef.current) {
          results[ip] = Array.isArray(json) ? json : json.data || [];
        }
      } catch (e) {
        if (e.name !== 'AbortError') {
          console.warn(`Control connections fetch failed for ${ip}:`, e.message);
        }
      }
    });
    
    if (mountedRef.current) {
      setControlData(results);
      setLoading(false);
      
      if (skippedCount > 0) {
        setError(`Showing ${controllersToFetch.length} of ${controllers.length} controllers for performance. Use Data Plane view for detailed topology.`);
      }
    }
  }, [controllers]);

  // Fetch logical topology (aggregated relationships) for selected device
  const fetchDataPlane = useCallback(async (ip, showAll = false) => {
    if (!ip) return;
    
    setLoading(true);
    setError("");
    setLogicalData(null);
    
    try {
      const res = await fetchWithTimeout(API.logicalTopology(ip, showAll));
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      
      if (mountedRef.current) {
        setLogicalData(json);
      }
    } catch (e) {
      if (mountedRef.current) {
        console.error("Data plane fetch error:", e);
        setError("Failed to fetch data plane topology");
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
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      
      if (mountedRef.current) {
        setOmpData(json);
      }
    } catch (e) {
      if (mountedRef.current) {
        console.error("OMP topology fetch error:", e);
        setError("Failed to fetch OMP routing topology");
      }
    }
    
    if (mountedRef.current) {
      setLoading(false);
    }
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
