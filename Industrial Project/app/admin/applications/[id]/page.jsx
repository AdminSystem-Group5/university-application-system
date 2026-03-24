"use client";

import { useEffect, useState } from "react";
import AdminStatsCards from "@/components/admin/AdminStatsCards";
import AdminFilters from "@/components/admin/AdminFilters";
import ApplicationsTable from "@/components/admin/ApplicationsTable";
import {
  getApplications,
  updateApplicationStatus,
} from "@/lib/applicationService";
import { useAuth } from "@/lib/auth-context";

export default function AdminPage() {
  const [applications, setApplications] = useState([]);
  const [filteredApplications, setFilteredApplications] = useState([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [courseFilter, setCourseFilter] = useState("");

  const { firebaseUser, userData, isUniversityAdmin } = useAuth();

  const fetchData = async () => {
    const data = await getApplications();
    setApplications(data);
    setFilteredApplications(data);
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    let filtered = [...applications];

    if (search) {
      filtered = filtered.filter((app) =>
        app.studentNameLower?.includes(search.toLowerCase())
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

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-3xl font-bold text-gray-900">
          University Admin Dashboard
        </h1>

        <p className="mt-2 text-gray-600">
          Manage student applications, review statuses, and track decisions.
        </p>

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
          <ApplicationsTable
            applications={filteredApplications}
            onStatusChange={handleStatusChange}
          />
        </section>
      </div>
    </main>
  );
}