// src/pages/policy/PolicerListPage.js

import React, { useEffect, useState } from "react";

function PolicerListPage() {
  const [policers, setPolicers] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPolicers = async () => {
      try {
        const response = await fetch("/api/policy/list/policer");
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }
        const data = await response.json();
        setPolicers(data);
      } catch (err) {
        console.error("Error fetching Policer lists:", err);
        setError("Failed to fetch Policer lists");
      }
    };

    fetchPolicers();
  }, []);

  return (
    <div style={{ padding: "1rem" }}>
      <h1>Policer Lists</h1>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {policers.length === 0 ? (
        <p>No Policer lists found.</p>
      ) : (
        <table
          style={{
            borderCollapse: "collapse",
            width: "100%",
            marginTop: "1rem",
          }}
        >
          <thead>
            <tr style={{ backgroundColor: "#f2f2f2" }}>
              <th style={{ border: "1px solid #ccc", padding: "8px" }}>Name</th>
              <th style={{ border: "1px solid #ccc", padding: "8px" }}>List ID</th>
              <th style={{ border: "1px solid #ccc", padding: "8px" }}>Type</th>
              <th style={{ border: "1px solid #ccc", padding: "8px" }}>Description</th>
              <th style={{ border: "1px solid #ccc", padding: "8px" }}>Last Updated</th>
              <th style={{ border: "1px solid #ccc", padding: "8px" }}>AS Path Entries</th>
            </tr>
          </thead>
          <tbody>
            {policers.map((item, index) => {
              const updatedDate = item.lastUpdated
                ? new Date(item.lastUpdated).toLocaleString()
                : "N/A";

              // Build a comma-separated list of AS paths
              const asPaths = item.entries
                ? item.entries.map((e) => e.asPath).join(", ")
                : "N/A";

              return (
                <tr key={index}>
                  <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                    {item.name || "N/A"}
                  </td>
                  <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                    {item.listId || "N/A"}
                  </td>
                  <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                    {item.type || "N/A"}
                  </td>
                  <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                    {item.description || "N/A"}
                  </td>
                  <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                    {updatedDate}
                  </td>
                  <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                    {asPaths}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default PolicerListPage;
