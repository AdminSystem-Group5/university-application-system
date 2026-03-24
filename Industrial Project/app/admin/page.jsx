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
    signOut,
  } = useAuth();

  const [applications, setApplications] = useState([]);
  const [filteredApplications, setFilteredApplications] = useState([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [courseFilter, setCourseFilter] = useState("");

  // =========================
  // AUTH PROTECTION
  // =========================

  useEffect(() => {
    if (!firebaseUser) {
      router.push("/login");
    }
  }, [firebaseUser, router]);

  useEffect(() => {
    if (firebaseUser && !isUniversityAdmin) {
      alert("Access denied. Admins only.");
      router.push("/login");
    }
  }, [firebaseUser, isUniversityAdmin, router]);

  // =========================
  // LOAD DATA
  // =========================

  const fetchData = async () => {
    try {
      const data = await getApplications();
      setApplications(data);
      setFilteredApplications(data);
    } catch (error) {
      console.error("Error loading applications:", error);
    }
  };

  useEffect(() => {
    if (firebaseUser) {
      fetchData();
    }
  }, [firebaseUser]);

  // =========================
  // FILTER LOGIC
  // =========================

  useEffect(() => {
    let filtered = [...applications];

    if (search) {
      filtered = filtered.filter((app) =>
        app.studentName?.toLowerCase().includes(search.toLowerCase())
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

  // =========================
  // STATUS UPDATE
  // =========================

  const handleStatusChange = async (id, newStatus) => {
    try {
      if (!firebaseUser) {
        alert("You must be signed in.");
        return;
      }

      await updateApplicationStatus(id, newStatus, {
        uid: firebaseUser.uid,
        name:
          userData?.displayName ||
          firebaseUser.displayName ||
          firebaseUser.email ||
          "Admin",
      });

      await fetchData();
      alert("Status updated");
    } catch (error) {
      console.error(error);
      alert("Error updating status");
    }
  };

  // =========================
  // RENDER
  // =========================

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">

        {/* HEADER + LOGOUT */}
        <div className="flex items-center justify-between">
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

        {/* SUMMARY */}
        <section className="mt-6 rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold">Summary</h2>
          <AdminStatsCards applications={filteredApplications} />
          <ApplicationsTable applications={filteredApplications} onStatusChange={handleStatusChange} />
        </section>

        {/* FILTERS */}
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

        {/* APPLICATION TABLE */}
        <section className="mt-6 rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold">Applications</h2>
          <ApplicationsTable
            applications={filteredApplications}
            onStatusChange={handleStatusChange}
          />
        </section>

      </div>
    </main>
  );
}