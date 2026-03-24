import Link from "next/link";

function getStatusBadgeClass(status) {
  switch (status) {
    case "Submitted":
      return "bg-blue-100 text-blue-700";
    case "Under Review":
      return "bg-yellow-100 text-yellow-800";
    case "More Info Required":
      return "bg-orange-100 text-orange-700";
    case "Approved":
      return "bg-green-100 text-green-700";
    case "Rejected":
      return "bg-red-100 text-red-700";
    default:
      return "bg-gray-100 text-gray-700";
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
                <tr key={appId} className="border-b">
                  <td className="px-4 py-3 text-sm">
                    {app.applicationId || app.id}
                  </td>

                  <td className="px-4 py-3 text-sm">
                    {app.studentName || "N/A"}
                  </td>

                  <td className="px-4 py-3 text-sm">
                    {app.courseName || "N/A"}
                  </td>

                  <td className="px-4 py-3 text-sm">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadgeClass(
                        app.applicationStatus
                      )}`}
                    >
                      {app.applicationStatus || "N/A"}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-sm">
                    {app.submittedAt?.toDate
                      ? app.submittedAt.toDate().toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                        })
                      : "N/A"}
                  </td>

                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center gap-2">
                      <select
                        value={app.applicationStatus || "Submitted"}
                        onChange={(e) =>
                          onStatusChange?.(appId, e.target.value)
                        }
                        disabled={isUpdating}
                        className="rounded-md border px-2 py-1 disabled:opacity-50"
                      >
                        <option value="Submitted">Submitted</option>
                        <option value="Under Review">Under Review</option>
                        <option value="More Info Required">
                          More Info Required
                        </option>
                        <option value="Approved">Approved</option>
                        <option value="Rejected">Rejected</option>
                      </select>

                      <Link
                        href={`/admin/applications/${appId}`}
                        className="rounded-lg bg-blue-600 px-3 py-1.5 text-white hover:bg-blue-700"
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