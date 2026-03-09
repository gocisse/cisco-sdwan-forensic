import { useState, useEffect, useCallback } from "react";

/**
 * useApiFetch — reusable hook for fetching JSON from the backend API.
 *
 * @param {string|null} url  — API URL to fetch. Pass null to skip fetching.
 * @param {object} options
 * @param {boolean} options.immediate — fetch on mount (default: true when url is truthy)
 * @returns {{ data, isLoading, error, refetch }}
 */
function useApiFetch(url, options = {}) {
  const { immediate = true } = options;

  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    if (!url) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(url);

      if (!response.ok) {
        // Try to parse structured JSON error from backend
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errBody = await response.json();
          if (errBody.error) {
            errorMessage = errBody.error;
          }
        } catch {
          // Response wasn't JSON, use status text
          errorMessage = `${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const json = await response.json();
      setData(json);
    } catch (err) {
      console.error(`useApiFetch error [${url}]:`, err);
      setError(err.message || "An unknown error occurred");
    } finally {
      setIsLoading(false);
    }
  }, [url]);

  useEffect(() => {
    if (immediate && url) {
      fetchData();
    }
  }, [fetchData, immediate, url]);

  return { data, isLoading, error, refetch: fetchData };
}

export default useApiFetch;
