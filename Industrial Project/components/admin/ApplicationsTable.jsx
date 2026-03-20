import Link from "next/link";

export default function ApplicationsTable({
  applications = [],
  onStatusChange,
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
              <td colSpan="6" className="px-4 py-6 text-center text-sm text-gray-500">
                No applications found.
              </td>
            </tr>
          ) : (
            applications.map((app) => (
              <tr key={app.id || app.applicationId} className="border-b">
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
                  {app.applicationStatus || "N/A"}
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
                    
                    {/* STATUS DROPDOWN */}
                    <select
                      value={app.applicationStatus || "Submitted"}
                      onChange={(e) =>
                        onStatusChange?.(app.id, e.target.value)
                      }
                      className="rounded-md border px-2 py-1"
                    >
                      <option value="Submitted">Submitted</option>
                      <option value="Under Review">Under Review</option>
                      <option value="Approved">Approved</option>
                      <option value="Rejected">Rejected</option>
                    </select>

                    {/* VIEW BUTTON (FIXED) */}
                    <Link
                      href={`/admin/applications/${app.id}`}
                      className="rounded-lg bg-blue-600 px-3 py-1.5 text-white hover:bg-blue-700"
                    >
                      View
                    </Link>

                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}