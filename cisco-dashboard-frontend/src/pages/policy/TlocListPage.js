// src/pages/policy/TlocListPage.js

import React, { useEffect, useState } from "react";

function TlocListPage() {
  const [tlocs, setTlocs] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchTlocs = async () => {
      try {
        const response = await fetch("/api/policy/list/tloc");
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }
        const data = await response.json();
        setTlocs(data);
      } catch (err) {
        console.error("Error fetching TLOC lists:", err);
        setError("Failed to fetch TLOC lists");
      }
    };

    fetchTlocs();
  }, []);

  return (
    <div style={{ padding: "1rem" }}>
      <h1>TLOC Lists</h1>
      {error && <p style={{ color: "red" }}>{error}</p>}

      {tlocs.length === 0 ? (
        <p>No TLOC lists found.</p>
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
              <th style={{ border: "1px solid #ccc", padding: "8px" }}>Entries</th>
            </tr>
          </thead>
          <tbody>
            {tlocs.map((item, index) => {
              const updatedDate = item.lastUpdated
                ? new Date(item.lastUpdated).toLocaleString()
                : "N/A";

              // Build a string that describes each entry (tloc, color, encap, preference)
              const entryDescriptions = item.entries
                ? item.entries.map((e) => {
                    return `TLOC: ${e.tloc}, Color: ${e.color}, Encap: ${e.encap}, Pref: ${e.preference}`;
                  }).join(" | ")
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
                    {entryDescriptions}
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

export default TlocListPage;
