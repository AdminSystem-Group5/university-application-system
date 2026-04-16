"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  getApplicationById,
  updateApplicationStatus,
} from "@/lib/services/applicationService";
import ApplicationNotes from "@/components/admin/ApplicationNotes";
import DecisionHistory from "@/components/admin/DecisionHistory";

function getStatusBadgeClass(status) {
  switch (status) {
    case "Submitted":
      return "bg-slate-100 text-slate-700";
    case "Under Review":
      return "bg-blue-100 text-blue-700";
    case "More Info Required":
      return "bg-amber-100 text-amber-800";
    case "Approved":
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

const STATUSES = [
  "Submitted",
  "Under Review",
  "More Info Required",
  "Approved",
  "Rejected",
];

export default function ApplicationDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { firebaseUser, userData, isUniversityAdmin, isLoading } = useAuth();

  const [application, setApplication] = useState(null);
  const [loadingApp, setLoadingApp] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [newStatus, setNewStatus] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [statusMessageType, setStatusMessageType] = useState("success");

  const loadApplication = async () => {
    try {
      setLoadingApp(true);
      setErrorMessage("");

      const data = await getApplicationById(params.id);
      setApplication(data);
      setNewStatus(data?.applicationStatus || "");
    } catch (error) {
      console.error("Error loading application:", error);
      setErrorMessage("Failed to load application details.");
    } finally {
      setLoadingApp(false);
    }
  };

  useEffect(() => {
    if (!statusMessage) return;

    const timer = setTimeout(() => {
      setStatusMessage("");
    }, 3000);

    return () => clearTimeout(timer);
  }, [statusMessage]);

  useEffect(() => {
    if (isLoading) return;

    if (!firebaseUser) {
      router.push("/login");
      return;
    }

    if (!isUniversityAdmin) {
      alert("Access denied. Admins only.");
      router.push("/login");
      return;
    }

    if (params?.id) {
      loadApplication();
    }
  }, [isLoading, firebaseUser, isUniversityAdmin, params, router]);

  const handleStatusUpdate = async () => {
    if (!application || !newStatus) return;

    if (newStatus === application.applicationStatus) {
      setStatusMessage("This application already has that status.");
      setStatusMessageType("error");
      return;
    }

    if (
      ["Approved", "Rejected"].includes(newStatus) &&
      !window.confirm(
        `Are you sure you want to mark this application as ${newStatus}?`
      )
    ) {
      return;
    }

    try {
      setUpdatingStatus(true);
      setStatusMessage("");

      await updateApplicationStatus(application.id, newStatus, {
        uid: firebaseUser.uid,
        name:
          userData?.displayName ||
          firebaseUser.displayName ||
          firebaseUser.email ||
          "Admin",
      });

      await loadApplication();
      setStatusMessage("Status updated successfully.");
      setStatusMessageType("success");
    } catch (error) {
      console.error(error);
      setStatusMessage(error.message || "Error updating status.");
      setStatusMessageType("error");
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (isLoading || loadingApp) {
    return (
      <main className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-5xl animate-pulse">
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <div className="h-8 w-64 rounded bg-gray-200" />
            <div className="mt-3 h-4 w-80 rounded bg-gray-200" />

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index}>
                  <div className="h-4 w-24 rounded bg-gray-200" />
                  <div className="mt-2 h-5 w-40 rounded bg-gray-100" />
                </div>
              ))}
            </div>

            <div className="mt-8">
              <div className="h-6 w-40 rounded bg-gray-200" />
              <div className="mt-3 h-32 rounded-lg bg-gray-100" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (errorMessage) {
    return (
      <main className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-4xl rounded-xl border bg-white p-6 shadow-sm">
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {errorMessage}
          </div>

          <button
            onClick={() => router.push("/admin")}
            className="mt-6 rounded-lg bg-gray-900 px-4 py-2 text-white hover:bg-gray-800"
          >
            Back to Dashboard
          </button>
        </div>
      </main>
    );
  }

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

          <button
            onClick={() => router.push("/admin")}
            className="mt-6 rounded-lg bg-gray-900 px-4 py-2 text-white hover:bg-gray-800"
          >
            Back to Dashboard
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Application Details
            </h1>
            <p className="mt-2 text-gray-600">
              Review full application information, update status, and track
              admin activity.
            </p>
          </div>

          <button
            onClick={() => router.push("/admin")}
            className="rounded-lg bg-gray-900 px-4 py-2 text-white hover:bg-gray-800"
          >
            Back to Dashboard
          </button>
        </div>

        <section className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 border-b pb-6 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Applicant Summary
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Application reference and student information.
              </p>
            </div>

            <span
              className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadgeClass(
                application.applicationStatus
              )}`}
            >
              {application.applicationStatus || "N/A"}
            </span>
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="text-sm font-semibold text-gray-500">
                Application ID
              </h3>
              <p className="mt-1 text-gray-900">
                {application.applicationId || application.id || "N/A"}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-500">
                Submitted At
              </h3>
              <p className="mt-1 text-gray-900">
                {formatDate(application.submittedAt)}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-500">
                Student Name
              </h3>
              <p className="mt-1 text-gray-900">
                {application.studentName || "N/A"}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-500">
                Student Email
              </h3>
              <p className="mt-1 break-all text-gray-900">
                {application.studentEmail || "N/A"}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-500">Course</h3>
              <p className="mt-1 text-gray-900">
                {application.courseName || "N/A"}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="border-b pb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Update Application Status
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Change the application stage as part of the admin review workflow.
            </p>
          </div>

          {statusMessage && (
            <div
              className={`mt-4 rounded-lg border px-4 py-3 text-sm ${
                statusMessageType === "success"
                  ? "border-green-200 bg-green-50 text-green-800"
                  : "border-red-200 bg-red-50 text-red-800"
              }`}
            >
              {statusMessage}
            </div>
          )}

          <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center">
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="rounded-lg border px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
            >
              {STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>

            <button
              onClick={handleStatusUpdate}
              disabled={updatingStatus}
              className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {updatingStatus ? "Updating..." : "Update Status"}
            </button>
          </div>
        </section>

        <section className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900">
            Personal Statement
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Submitted statement from the student.
          </p>

          <div className="mt-4 rounded-lg border bg-gray-50 p-4">
            <p className="whitespace-pre-line leading-7 text-gray-800">
              {application.personalStatement ||
                "No personal statement provided."}
            </p>
          </div>
        </section>

        <ApplicationNotes applicationId={application.id} />
        <DecisionHistory applicationId={application.id} />
      </div>
    </main>
  );
}