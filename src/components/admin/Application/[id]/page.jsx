import { getApplicationById } from "@/lib/applicationService";
import ApplicationNotes from "@/components/admin/ApplicationNotes";

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

export default async function ApplicationDetailsPage({ params }) {
  const { id } = await params;
  const application = await getApplicationById(id);

  if (!application) {
    return (
      <main className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-4xl rounded-xl border bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-red-600">
            Application not found
          </h1>
          <p className="mt-2 text-gray-600">
            The application may have been deleted or the link may be invalid.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-bold text-gray-900">
            Application Details
          </h1>
          <p className="mt-2 text-gray-600">
            Review full application information.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div>
              <h2 className="text-sm font-semibold text-gray-500">
                Application ID
              </h2>
              <p className="mt-1 text-gray-900">
                {application.applicationId || application.id || "N/A"}
              </p>
            </div>

            <div>
              <h2 className="text-sm font-semibold text-gray-500">
                Current Status
              </h2>
              <p className="mt-1 text-gray-900">
                {application.applicationStatus || "N/A"}
              </p>
            </div>

            <div>
              <h2 className="text-sm font-semibold text-gray-500">
                Student Name
              </h2>
              <p className="mt-1 text-gray-900">
                {application.studentName || "N/A"}
              </p>
            </div>

            <div>
              <h2 className="text-sm font-semibold text-gray-500">
                Student Email
              </h2>
              <p className="mt-1 break-all text-gray-900">
                {application.studentEmail || "N/A"}
              </p>
            </div>

            <div>
              <h2 className="text-sm font-semibold text-gray-500">Course</h2>
              <p className="mt-1 text-gray-900">
                {application.courseName || "N/A"}
              </p>
            </div>

            <div>
              <h2 className="text-sm font-semibold text-gray-500">
                Submitted At
              </h2>
              <p className="mt-1 text-gray-900">
                {formatDate(application.submittedAt)}
              </p>
            </div>
          </div>

          <div className="mt-8">
            <h2 className="text-lg font-semibold text-gray-900">
              Personal Statement
            </h2>
            <div className="mt-3 rounded-lg border bg-gray-50 p-4">
              <p className="whitespace-pre-line text-gray-800">
                {application.personalStatement ||
                  "No personal statement provided."}
              </p>
            </div>
          </div>
        </div>

        <ApplicationNotes applicationId={application.id} />
      </div>
    </main>
  );
}