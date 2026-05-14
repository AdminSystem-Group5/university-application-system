"use client";

import Link from "next/link";

const STATUSES = [
  "Under Review",
  "Offered",
  "Rejected",
];

function getStatusBadgeClass(status) {
  switch (status) {
    case "Submitted":
      return "bg-slate-100 text-slate-700";
    case "Under Review":
      return "bg-blue-100 text-blue-700";
    case "Offered":
      return "bg-green-100 text-green-700";
    case "Rejected":
      return "bg-red-100 text-red-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

function formatDate(value) {
  if (!value) return "N/A";

  try {
    const date =
      typeof value?.toDate === "function" ? value.toDate() : new Date(value);

    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return "N/A";
  }
}

export default function ApplicationsTable({
  applications = [],
  onStatusChange,
  updatingId,
}) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse">
        <thead>
          <tr className="border-b bg-gray-100">
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
              Application ID
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
              Student Name
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
              Course
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
              Status
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
              Submitted At
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
              Action
            </th>
          </tr>
        </thead>

        <tbody>
          {applications.length === 0 ? (
            <tr>
              <td
                colSpan="6"
                className="px-4 py-6 text-center text-sm text-gray-500"
              >
                No applications found.
              </td>
            </tr>
          ) : (
            applications.map((app) => {
              const appId = app.id || app.applicationId;
              const isUpdating = updatingId === appId;

              return (
                <tr key={appId} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {app.applicationId || app.id || "N/A"}
                  </td>

                  <td className="px-4 py-3 text-sm text-gray-900">
                    {app.studentName || "N/A"}
                  </td>

                  <td className="px-4 py-3 text-sm text-gray-900">
                    {app.courseName || "N/A"}
                  </td>

                  <td className="px-4 py-3 text-sm">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadgeClass(
                        app.applicationStatus
                      )}`}
                    >
                      {app.applicationStatus || "N/A"}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-sm text-gray-900">
                    {formatDate(app.submittedAt)}
                  </td>

                  <td className="px-4 py-3 text-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        value={app.applicationStatus || "Submitted"}
                        onChange={(e) =>
                          onStatusChange?.(appId, e.target.value)
                        }
                        disabled={isUpdating}
                        className="rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>

                      <Link
                        href={`/admin/applications/${appId}`}
                        className="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700"
                      >
                        View
                      </Link>

                      {isUpdating && (
                        <span className="text-xs text-gray-500">
                          Updating...
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}