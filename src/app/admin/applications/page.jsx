"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AdminStatsCards from "@/components/admin/AdminStatsCards";
import AdminFilters from "@/components/admin/AdminFilters";
import ApplicationsTable from "@/components/admin/ApplicationsTable";
import {
  subscribeToApplications,
  updateApplicationStatus,
} from "@/lib/services/applicationService";
import { useAuth } from "@/lib/context/auth-context";

export default function AdminApplicationsPage() {
  const router = useRouter();

  const {
    firebaseUser,
    userData,
    isUniversityAdmin,
    isLoading,
    signOut,
  } = useAuth();

  const [applications, setApplications] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [courseFilter, setCourseFilter] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    if (!message) return;

    const timer = setTimeout(() => {
      setMessage("");
    }, 3000);

    return () => clearTimeout(timer);
  }, [message]);

  useEffect(() => {
    if (isLoading) return;

    if (!firebaseUser) {
      router.replace("/login");
      return;
    }

    if (!isUniversityAdmin) {
      alert("Access denied. Admins only.");
      router.replace("/login");
      return;
    }

    setPageLoading(true);

    const unsubscribe = subscribeToApplications(
      (data) => {
        setApplications(Array.isArray(data) ? data : []);
        setPageLoading(false);
      },
      (error) => {
        console.error("Error loading applications:", error);
        setMessage("Failed to load applications.");
        setMessageType("error");
        setPageLoading(false);
      }
    );

    return () => {
      if (typeof unsubscribe === "function") {
        unsubscribe();
      }
    };
  }, [isLoading, firebaseUser, isUniversityAdmin, router]);

  const filteredApplications = useMemo(() => {
    let filtered = [...applications];

    if (search.trim()) {
      const searchLower = search.toLowerCase();

      filtered = filtered.filter((app) => {
        const studentName = String(
          app.studentName || app.fullName || app.applicantName || ""
        ).toLowerCase();

        const studentEmail = String(
          app.studentEmail || app.email || app.applicantEmail || ""
        ).toLowerCase();

        const courseName = String(
          app.courseName || app.course || ""
        ).toLowerCase();

        const applicationId = String(
          app.applicationId || app.id || ""
        ).toLowerCase();

        return (
          studentName.includes(searchLower) ||
          studentEmail.includes(searchLower) ||
          courseName.includes(searchLower) ||
          applicationId.includes(searchLower)
        );
      });
    }

    if (statusFilter) {
      filtered = filtered.filter((app) => {
        const currentStatus =
          app.applicationStatus ||
          app.status ||
          app.pendingDecision ||
          "Submitted";

        return currentStatus === statusFilter;
      });
    }

    if (courseFilter) {
      filtered = filtered.filter((app) => {
        const courseName = app.courseName || app.course || "";
        return courseName === courseFilter;
      });
    }

    return filtered;
  }, [applications, search, statusFilter, courseFilter]);

  const handleStatusChange = async (id, newStatus, messageToStudent = "") => {
    try {
      if (!firebaseUser) {
        setMessage("You must be signed in.");
        setMessageType("error");
        return;
      }

      setUpdatingId(id);
      setMessage("");

      await updateApplicationStatus(
        id,
        newStatus,
        {
          uid: firebaseUser.uid,
          name:
            userData?.displayName ||
            firebaseUser.displayName ||
            firebaseUser.email ||
            "Admin",
        },
        messageToStudent
      );

      setMessage("Status updated successfully.");
      setMessageType("success");
    } catch (error) {
      console.error("Status update error:", error);
      setMessage(error.message || "Error updating status.");
      setMessageType("error");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      router.replace("/login");
    } catch (error) {
      console.error("Logout error:", error);
      setMessage("Failed to log out. Please try again.");
      setMessageType("error");
    }
  };

  if (isLoading || pageLoading) {
    return (
      <main className="min-h-screen w-full bg-[#F7F1E8] px-8 py-10 2xl:px-16">
        <div className="w-full animate-pulse">
          <div className="mb-10 flex flex-col gap-6 2xl:flex-row 2xl:items-center 2xl:justify-between">
            <div className="w-full">
              <div className="h-20 w-full max-w-[900px] rounded-3xl bg-gray-300" />
              <div className="mt-6 h-8 w-full max-w-[1200px] rounded-3xl bg-gray-200" />
            </div>

            <div className="h-24 w-full max-w-[260px] rounded-3xl bg-gray-300" />
          </div>

          <div className="rounded-[40px] border-4 border-black bg-white p-10 shadow-2xl 2xl:p-16">
            <div className="mb-10 h-10 w-72 rounded-2xl bg-gray-300" />

            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="h-56 rounded-[30px] bg-gray-100"
                />
              ))}
            </div>
          </div>

          <div className="mt-12 rounded-[40px] border-4 border-black bg-white p-10 shadow-2xl 2xl:p-16">
            <div className="mb-10 h-10 w-56 rounded-2xl bg-gray-300" />

            <div className="flex flex-col gap-8 2xl:flex-row">
              <div className="h-24 w-full rounded-2xl bg-gray-100" />
              <div className="h-24 w-full rounded-2xl bg-gray-100" />
              <div className="h-24 w-full rounded-2xl bg-gray-100" />
            </div>
          </div>

          <div className="mt-12 rounded-[40px] border-4 border-black bg-white p-10 shadow-2xl 2xl:p-16">
            <div className="mb-10 h-10 w-80 rounded-2xl bg-gray-300" />
            <div className="h-[700px] rounded-[30px] bg-gray-100" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen w-full bg-[#F7F1E8] px-8 py-10 2xl:px-16">
      <div className="w-full">
        <div className="rounded-[40px] border-4 border-black bg-white p-10 shadow-2xl 2xl:p-16">
          <div className="flex flex-col gap-10 2xl:flex-row 2xl:items-center 2xl:justify-between">
            <div className="w-full">
              <h1 className="text-5xl font-black leading-none tracking-tight text-gray-900 md:text-6xl xl:text-7xl 2xl:text-8xl">
                University Admin Dashboard
              </h1>

              <p className="mt-8 w-full text-xl leading-relaxed text-gray-600 md:text-2xl xl:text-3xl">
                Manage student applications, monitor admissions, review
                statuses, approve decisions, and oversee the entire university
                application system from one place.
              </p>
            </div>

            <button
              onClick={handleLogout}
              className="h-20 w-full rounded-3xl bg-red-600 px-12 text-2xl font-black text-white transition hover:bg-red-700 md:h-24 md:max-w-[260px] md:text-3xl"
            >
              Logout
            </button>
          </div>
        </div>

        {message && (
          <div
            className={`mt-10 rounded-3xl border-4 px-10 py-8 text-xl font-bold shadow-lg md:text-2xl ${
              messageType === "success"
                ? "border-green-300 bg-green-50 text-green-800"
                : "border-red-300 bg-red-50 text-red-800"
            }`}
          >
            {message}
          </div>
        )}

        <section className="mt-12 rounded-[40px] border-4 border-black bg-white p-10 shadow-2xl 2xl:p-16">
          <h2 className="mb-10 text-4xl font-black text-gray-900 md:text-5xl xl:text-6xl">
            Summary
          </h2>

          <div className="w-full">
            <AdminStatsCards applications={filteredApplications} />
          </div>
        </section>

        <section className="mt-12 rounded-[40px] border-4 border-black bg-white p-10 shadow-2xl 2xl:p-16">
          <h2 className="mb-10 text-4xl font-black text-gray-900 md:text-5xl xl:text-6xl">
            Filters
          </h2>

          <div className="w-full">
            <AdminFilters
              search={search}
              setSearch={setSearch}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              courseFilter={courseFilter}
              setCourseFilter={setCourseFilter}
            />
          </div>
        </section>

        <section className="mt-12 rounded-[40px] border-4 border-black bg-white p-10 shadow-2xl 2xl:p-16">
          <div className="mb-10 flex flex-col gap-6 2xl:flex-row 2xl:items-center 2xl:justify-between">
            <h2 className="text-4xl font-black text-gray-900 md:text-5xl xl:text-6xl">
              Applications
            </h2>

            <div className="rounded-2xl bg-[#3B2E5A] px-10 py-5 text-2xl font-black text-white md:text-3xl">
              {filteredApplications.length} Applications Found
            </div>
          </div>

          {filteredApplications.length === 0 ? (
            <div className="rounded-3xl border-4 border-dashed border-gray-300 bg-gray-50 px-16 py-28 text-center text-3xl font-bold text-gray-500 md:text-4xl">
              No applications match the current filters.
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <div className="min-w-[1600px]">
                <ApplicationsTable
                  applications={filteredApplications}
                  onStatusChange={handleStatusChange}
                  updatingId={updatingId}
                />
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}