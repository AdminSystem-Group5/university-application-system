"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminStatsCards from "@/components/admin/AdminStatsCards";
import AdminFilters from "@/components/admin/AdminFilters";
import ApplicationsTable from "@/components/admin/ApplicationsTable";
import {
  getApplications,
  updateApplicationStatus,
} from "@/lib/applicationService";
import { useAuth } from "@/lib/auth-context";

export default function AdminPage() {
  const router = useRouter();

  const {
    firebaseUser,
    userData,
    isUniversityAdmin,
    isLoading,
    signOut,
  } = useAuth();

  const [applications, setApplications] = useState([]);
  const [filteredApplications, setFilteredApplications] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [courseFilter, setCourseFilter] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  const [pageLoading, setPageLoading] = useState(true);

  const fetchData = async () => {
    try {
      setPageLoading(true);
      setMessage("");

      const data = await getApplications();
      setApplications(data);
      setFilteredApplications(data);
    } catch (error) {
      console.error("Error loading applications:", error);
      setMessage("Failed to load applications.");
      setMessageType("error");
    } finally {
      setPageLoading(false);
    }
  };

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
      router.push("/login");
      return;
    }

    if (!isUniversityAdmin) {
      alert("Access denied. Admins only.");
      router.push("/login");
      return;
    }

    fetchData();
  }, [isLoading, firebaseUser, isUniversityAdmin, router]);

  useEffect(() => {
    let filtered = [...applications];

    if (search) {
      const searchLower = search.toLowerCase();

      filtered = filtered.filter(
        (app) =>
          app.studentName?.toLowerCase().includes(searchLower) ||
          app.studentEmail?.toLowerCase().includes(searchLower)
      );
    }

    if (statusFilter) {
      filtered = filtered.filter(
        (app) => app.applicationStatus === statusFilter
      );
    }

    if (courseFilter) {
      filtered = filtered.filter((app) => app.courseName === courseFilter);
    }

    setFilteredApplications(filtered);
  }, [search, statusFilter, courseFilter, applications]);

  const handleStatusChange = async (id, newStatus) => {
    try {
      if (!firebaseUser) {
        setMessage("You must be signed in.");
        setMessageType("error");
        return;
      }

      setUpdatingId(id);
      setMessage("");

      await updateApplicationStatus(id, newStatus, {
        uid: firebaseUser.uid,
        name:
          userData?.displayName ||
          firebaseUser.displayName ||
          firebaseUser.email ||
          "Admin",
      });

      await fetchData();
      setMessage("Status updated successfully.");
      setMessageType("success");
    } catch (error) {
      console.error(error);
      setMessage(error.message || "Error updating status");
      setMessageType("error");
    } finally {
      setUpdatingId(null);
    }
  };

  if (isLoading || pageLoading) {
    return (
      <main className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-7xl animate-pulse">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <div className="h-8 w-80 rounded bg-gray-200" />
              <div className="mt-3 h-4 w-96 rounded bg-gray-200" />
            </div>
            <div className="h-10 w-24 rounded bg-gray-200" />
          </div>

          <div className="mt-6 rounded-xl border bg-white p-6 shadow-sm">
            <div className="mb-4 h-6 w-32 rounded bg-gray-200" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="h-24 rounded-xl bg-gray-100"
                />
              ))}
            </div>
          </div>

          <div className="mt-6 rounded-xl border bg-white p-6 shadow-sm">
            <div className="mb-4 h-6 w-24 rounded bg-gray-200" />
            <div className="flex flex-col gap-4 md:flex-row">
              <div className="h-10 w-full rounded bg-gray-100 md:w-80" />
              <div className="h-10 w-full rounded bg-gray-100 md:w-48" />
              <div className="h-10 w-full rounded bg-gray-100 md:w-48" />
            </div>
          </div>

          <div className="mt-6 rounded-xl border bg-white p-6 shadow-sm">
            <div className="mb-4 h-6 w-36 rounded bg-gray-200" />
            <div className="h-72 rounded bg-gray-100" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              University Admin Dashboard
            </h1>
            <p className="mt-2 text-gray-600">
              Manage student applications, review statuses, and track decisions.
            </p>
          </div>

          <button
            onClick={async () => {
              await signOut();
              router.push("/login");
            }}
            className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
          >
            Logout
          </button>
        </div>

        {message && (
          <div
            className={`mt-6 rounded-lg border px-4 py-3 text-sm ${
              messageType === "success"
                ? "border-green-200 bg-green-50 text-green-800"
                : "border-red-200 bg-red-50 text-red-800"
            }`}
          >
            {message}
          </div>
        )}

        <section className="mt-6 rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold">Summary</h2>
          <AdminStatsCards applications={filteredApplications} />
        </section>

        <section className="mt-6 rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold">Filters</h2>
          <AdminFilters
            search={search}
            setSearch={setSearch}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            courseFilter={courseFilter}
            setCourseFilter={setCourseFilter}
          />
        </section>

        <section className="mt-6 rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold">Applications</h2>

          {filteredApplications.length === 0 ? (
            <div className="rounded-lg border border-dashed bg-gray-50 px-6 py-10 text-center text-gray-500">
              No applications match the current filters.
            </div>
          ) : (
            <ApplicationsTable
              applications={filteredApplications}
              onStatusChange={handleStatusChange}
              updatingId={updatingId}
            />
          )}
        </section>
      </div>
    </main>
  );
}