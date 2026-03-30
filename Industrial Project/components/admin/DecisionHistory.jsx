"use client";

import { useEffect, useState } from "react";
import { getDecisionHistory } from "@/lib/applicationService";

function formatDateTime(value) {
  if (!value) return "No date";

  try {
    const date =
      typeof value?.toDate === "function" ? value.toDate() : new Date(value);

    return date.toLocaleString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "No date";
  }
}

function getEventLabel(item) {
  if (item.eventType === "status_change") return "Status Change";
  if (item.eventType === "admin_note") return "Admin Note";
  return "History Entry";
}

function getHistoryMessage(item) {
  if (item.note) return item.note;
  if (item.message) return item.message;

  if (item.eventType === "status_change") {
    const fromStatus = item.fromStatus || item.previousStatus;
    const toStatus = item.toStatus || item.newStatus || item.applicationStatus;

    if (fromStatus && toStatus) {
      return `Status changed from ${fromStatus} to ${toStatus}.`;
    }

    if (toStatus) {
      return `Status changed to ${toStatus}.`;
    }
  }

  return "No message";
}

export default function DecisionHistory({ applicationId }) {
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadHistory() {
      try {
        setLoadingHistory(true);
        setErrorMessage("");

        const data = await getDecisionHistory(applicationId);

        if (isMounted) {
          setHistory(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error("Error loading decision history:", error);

        if (isMounted) {
          setErrorMessage("Failed to load decision history.");
          setHistory([]);
        }
      } finally {
        if (isMounted) {
          setLoadingHistory(false);
        }
      }
    }

    if (!applicationId) {
      setHistory([]);
      setLoadingHistory(false);
      return;
    }

    loadHistory();

    return () => {
      isMounted = false;
    };
  }, [applicationId]);

  return (
    <section className="rounded-xl border bg-white p-6 shadow-sm">
      <div className="border-b pb-4">
        <h2 className="text-xl font-semibold text-gray-900">Decision History</h2>
        <p className="mt-1 text-sm text-gray-500">
          Timeline of status changes and related admin actions.
        </p>
      </div>

      {errorMessage && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {errorMessage}
        </div>
      )}

      {loadingHistory ? (
        <div className="mt-4 space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="animate-pulse rounded-lg border bg-gray-50 p-4"
            >
              <div className="h-4 w-2/3 rounded bg-gray-200" />
              <div className="mt-3 h-3 w-1/2 rounded bg-gray-200" />
            </div>
          ))}
        </div>
      ) : history.length === 0 ? (
        <div className="mt-4 rounded-lg border border-dashed bg-gray-50 px-4 py-6 text-sm text-gray-500">
          No history yet.
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {history.map((item) => (
            <div key={item.id} className="rounded-lg border bg-gray-50 p-4">
              <p className="whitespace-pre-line text-gray-800">
                {getHistoryMessage(item)}
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                <span className="rounded-full border bg-white px-2 py-1 font-medium text-gray-700">
                  {getEventLabel(item)}
                </span>

                <span>
                  by{" "}
                  <span className="font-medium">
                    {item.changedBy || item.adminName || "Admin"}
                  </span>
                </span>

                <span>•</span>

                <span>{formatDateTime(item.changedAt || item.createdAt)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}