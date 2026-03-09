// src/pages/policy/SlaClassListPage.js

import React, { useEffect, useState } from "react";

function SlaClassListPage() {
  const [slaClasses, setSlaClasses] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchSlaClasses = async () => {
      try {
        const response = await fetch("/api/policy/list/class");
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }
        const data = await response.json();
        setSlaClasses(data);
      } catch (err) {
        console.error("Error fetching SLA Class Lists:", err);
        setError("Failed to fetch SLA Class lists");
      }
    };

    fetchSlaClasses();
  }, []);

  return (
    <div style={{ padding: "1rem" }}>
      <h1>SLA Class Lists</h1>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {slaClasses.length === 0 ? (
        <p>No SLA Class lists found.</p>
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
              <th style={{ border: "1px solid #ccc", padding: "8px" }}>Queue Entries</th>
            </tr>
          </thead>
          <tbody>
            {slaClasses.map((item, index) => {
              const updatedDate = item.lastUpdated
                ? new Date(item.lastUpdated).toLocaleString()
                : "N/A";

              // Build a comma-separated list of Queue entries
              const queues = item.entries
                ? item.entries.map((e) => e.queue).join(", ")
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
                    {queues}
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

export default SlaClassListPage;
