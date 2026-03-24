"use client";

import { useEffect, useState } from "react";
import { getDecisionHistory } from "@/lib/applicationService";

export default function DecisionHistory({ applicationId }) {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    async function loadHistory() {
      const data = await getDecisionHistory(applicationId);
      setHistory(data);
    }

    loadHistory();
  }, [applicationId]);

  return (
    <div className="mt-6 rounded-xl border bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900">Decision History</h2>

      {history.length === 0 ? (
        <p className="mt-3 text-sm text-gray-500">No history yet.</p>
      ) : (
        <div className="mt-4 space-y-3">
          {history.map((item) => (
            <div key={item.id} className="rounded-lg border bg-gray-50 p-4">
              <p className="text-gray-800">{item.note || "No message"}</p>
              <div className="mt-2 text-xs text-gray-500">
                <span>{item.changedBy || "Admin"}</span>
                {" • "}
                <span>
                  {item.changedAt?.toDate
                    ? item.changedAt.toDate().toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })
                    : "No date"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}