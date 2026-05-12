"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getApplications } from "@/lib/services/applicationService";
import { useAuth } from "@/lib/context/auth-context";

export default function AdminPage() {
  const router = useRouter();

  const {
    firebaseUser,
    isUniversityAdmin,
    isLoading,
    signOut,
  } = useAuth();

  const [applications, setApplications] = useState([]);
  const [filteredApplications, setFilteredApplications] = useState([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [loadingData, setLoadingData] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (isLoading) return;

    if (!firebaseUser) {
      router.replace("/login");
      return;
    }

    if (!isUniversityAdmin) {
      router.replace("/login");
    }
  }, [firebaseUser, isUniversityAdmin, isLoading, router]);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoadingData(true);
        setErrorMessage("");

        const data = await getApplications();
        setApplications(data);
        setFilteredApplications(data);
      } catch (error) {
        console.error("Error loading applications:", error);
        setErrorMessage("Unable to load applications.");
      } finally {
        setLoadingData(false);
      }
    }

    if (firebaseUser && isUniversityAdmin) {
      fetchData();
    }
  }, [firebaseUser, isUniversityAdmin]);

  useEffect(() => {
    let filtered = [...applications];

    if (search.trim()) {
      const searchValue = search.toLowerCase();

      filtered = filtered.filter((app) => {
        const studentName = String(app.studentName || "").toLowerCase();
        const studentEmail = String(app.studentEmail || "").toLowerCase();
        const applicationId = String(app.applicationId || app.id || "").toLowerCase();

        return (
          studentName.includes(searchValue) ||
          studentEmail.includes(searchValue) ||
          applicationId.includes(searchValue)
        );
      });
    }

    if (statusFilter) {
      filtered = filtered.filter(
        (app) => app.applicationStatus === statusFilter
      );
    }

    setFilteredApplications(filtered);
  }, [search, statusFilter, applications]);

  const stats = useMemo(() => {
    return {
      total: applications.length,
      submitted: applications.filter(
        (app) => app.applicationStatus === "Submitted"
      ).length,
      underReview: applications.filter(
        (app) => app.applicationStatus === "Under Review"
      ).length,
      offered: applications.filter(
        (app) =>
          app.applicationStatus === "Offered" ||
          app.applicationStatus === "Approved"
      ).length,
      rejected: applications.filter(
        (app) => app.applicationStatus === "Rejected"
      ).length,
    };
  }, [applications]);

  const handleLogout = async () => {
    await signOut();
    router.replace("/login");
  };

  const handleReviewApplication = (applicationId) => {
    router.push(`/admin/applications/${applicationId}`);
  };

  if (isLoading || loadingData) {
    return (
      <main style={pageStyle}>
        <div style={frameStyle}>
          <p style={loadingTextStyle}>Loading admin dashboard...</p>
        </div>
      </main>
    );
  }

  return (
    <main style={pageStyle}>
      <div style={frameStyle}>
        <header style={headerStyle}>
          <div>
            <h1 style={logoStyle}>UAAMS</h1>
            <p style={subtitleStyle}>
              University Administration & Application
              <br />
              Management System
            </p>
          </div>

          <nav style={navStyle}>
            <button
              type="button"
              style={navButtonStyle}
              onClick={() => router.push("/admin")}
            >
              DASHBOARD
            </button>

            <button
              type="button"
              style={navButtonStyle}
              onClick={() => router.push("/admin/applications")}
            >
              APPLICATIONS
            </button>

            <button
              type="button"
              style={navButtonStyle}
              onClick={handleLogout}
            >
              LOGOUT
            </button>
          </nav>
        </header>

        <section style={welcomeBoxStyle}>
          <h2 style={welcomeTitleStyle}>WELCOME ADMIN</h2>
        </section>

        <section style={statsRowStyle}>
          <StatCard label="TOTAL APPLICATIONS" value={stats.total} />
          <StatCard label="SUBMITTED" value={stats.submitted} />
          <StatCard label="UNDER REVIEW" value={stats.underReview} />
          <StatCard label="OFFERED" value={stats.offered} />
          <StatCard label="REJECTED" value={stats.rejected} />
        </section>

        <section style={filtersBoxStyle}>
          <div style={filterTopRowStyle}>
            <div style={searchWrapperStyle}>
              <span style={searchIconStyle}>⌕</span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="SEARCH BY STUDENT ID OR APPLICATION ID"
                style={searchInputStyle}
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={statusSelectStyle}
            >
              <option value="">ALL STATUSES</option>
              <option value="Submitted">SUBMITTED</option>
              <option value="Under Review">UNDER REVIEW</option>
              <option value="Offered">OFFERED</option>
              <option value="Approved">APPROVED</option>
              <option value="Rejected">REJECTED</option>
              <option value="Draft">DRAFT</option>
            </select>
          </div>

          <p style={resultsTextStyle}>
            SHOWING {filteredApplications.length} RESULTS
          </p>
        </section>

        {errorMessage && <p style={errorTextStyle}>{errorMessage}</p>}

        <section style={tableWrapperStyle}>
          <div style={tableTitleBarStyle}>APPLICATIONS OVERVIEW</div>

          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={tableHeadStyle}>APPLICATION ID</th>
                <th style={tableHeadStyle}>STUDENT NAME</th>
                <th style={tableHeadStyle}>COURSE</th>
                <th style={tableHeadStyle}>INTAKE</th>
                <th style={tableHeadStyle}>STATUS</th>
                <th style={tableHeadStyle}>DATE SUBMITTED</th>
                <th style={tableHeadStyle}>ACTION</th>
              </tr>
            </thead>

            <tbody>
              {filteredApplications.length === 0 ? (
                <tr>
                  <td colSpan="7" style={emptyCellStyle}>
                    No applications found.
                  </td>
                </tr>
              ) : (
                filteredApplications.map((app, index) => {
                  const applicationId = app.id || app.applicationId;

                  return (
                    <tr key={applicationId || index}>
                      <td style={tableCellStyle}>
                        {app.applicationId || `APP ${index + 1}`}
                      </td>

                      <td style={tableCellStyle}>
                        {app.studentName || "Student Name"}
                      </td>

                      <td style={tableCellStyle}>
                        {app.courseName || "Course Name"}
                      </td>

                      <td style={tableCellStyle}>
                        {app.intendedIntake || app.intake || "Date"}
                      </td>

                      <td style={tableCellStyle}>
                        {app.applicationStatus || "Outcome"}
                      </td>

                      <td style={tableCellStyle}>
                        {formatDate(app.createdAt || app.submittedAt)}
                      </td>

                      <td style={tableCellStyle}>
                        <button
                          type="button"
                          style={reviewButtonStyle}
                          onClick={() => handleReviewApplication(applicationId)}
                        >
                          REVIEW
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </section>
      </div>
    </main>
  );
}

function StatCard({ label, value }) {
  return (
    <div style={statCardStyle}>
      <p style={statLabelStyle}>{label}</p>
      <p style={statValueStyle}>{value}</p>
    </div>
  );
}

function formatDate(dateValue) {
  if (!dateValue) return "DATE";

  try {
    const date =
      typeof dateValue?.toDate === "function"
        ? dateValue.toDate()
        : new Date(dateValue);

    if (Number.isNaN(date.getTime())) return "DATE";

    return date.toLocaleDateString("en-GB");
  } catch {
    return "DATE";
  }
}

const pageStyle = {
  minHeight: "100vh",
  background: "#F7F1E8",
  padding: "0",
  fontFamily: "Arial, Helvetica, sans-serif",
  color: "#071126",
};

const frameStyle = {
  minHeight: "100vh",
  border: "1.5px solid #000",
  background: "#F7F1E8",
};

const headerStyle = {
  height: "58px",
  background: "#fff",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "0 80px",
};

const logoStyle = {
  margin: 0,
  fontSize: "26px",
  fontWeight: "900",
  lineHeight: "24px",
};

const subtitleStyle = {
  margin: "2px 0 0",
  fontSize: "10px",
  lineHeight: "12px",
};

const navStyle = {
  display: "flex",
  alignItems: "center",
  gap: "75px",
};

const navButtonStyle = {
  background: "#fff",
  border: "1.5px solid #3B2E5A",
  color: "#071126",
  height: "32px",
  minWidth: "84px",
  padding: "0 18px",
  fontSize: "9px",
  fontWeight: "700",
  cursor: "pointer",
};

const welcomeBoxStyle = {
  width: "780px",
  height: "42px",
  margin: "14px auto 10px",
  border: "1.5px solid #000",
  background: "#fff",
  display: "flex",
  alignItems: "center",
  paddingLeft: "50px",
  boxSizing: "border-box",
};

const welcomeTitleStyle = {
  margin: 0,
  fontSize: "14px",
  fontWeight: "900",
};

const statsRowStyle = {
  width: "665px",
  margin: "0 auto 18px",
  display: "grid",
  gridTemplateColumns: "repeat(5, 1fr)",
  gap: "12px",
};

const statCardStyle = {
  height: "56px",
  border: "1.5px solid #000",
  background: "#fff",
  padding: "8px 10px",
  boxSizing: "border-box",
};

const statLabelStyle = {
  margin: 0,
  fontSize: "9px",
  fontWeight: "900",
};

const statValueStyle = {
  margin: "12px 0 0",
  fontSize: "15px",
  fontWeight: "900",
};

const filtersBoxStyle = {
  width: "665px",
  margin: "0 auto 16px",
  border: "1.5px solid #000",
  background: "#fff",
  padding: "10px 22px 9px",
  boxSizing: "border-box",
};

const filterTopRowStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 90px",
  gap: "22px",
  alignItems: "center",
};

const searchWrapperStyle = {
  height: "22px",
  border: "1.5px solid #000",
  display: "flex",
  alignItems: "center",
  background: "#fff",
};

const searchIconStyle = {
  width: "30px",
  textAlign: "center",
  fontSize: "12px",
  fontWeight: "900",
};

const searchInputStyle = {
  flex: 1,
  border: "none",
  outline: "none",
  height: "100%",
  fontSize: "8px",
  fontWeight: "800",
};

const statusSelectStyle = {
  height: "24px",
  background: "#3B2E5A",
  color: "#fff",
  border: "1.5px solid #3B2E5A",
  fontSize: "8px",
  fontWeight: "800",
  padding: "0 6px",
  cursor: "pointer",
};

const resultsTextStyle = {
  margin: "10px 0 0",
  fontSize: "8px",
  fontWeight: "900",
};

const tableWrapperStyle = {
  width: "665px",
  margin: "0 auto",
  border: "1.5px solid #000",
  background: "#fff",
};

const tableTitleBarStyle = {
  height: "38px",
  background: "#3B2E5A",
  color: "#fff",
  display: "flex",
  alignItems: "center",
  paddingLeft: "22px",
  fontSize: "13px",
  fontWeight: "900",
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  background: "#fff",
};

const tableHeadStyle = {
  borderTop: "1.5px solid #000",
  borderBottom: "1.5px solid #000",
  padding: "8px 6px",
  textAlign: "left",
  fontSize: "8px",
  fontWeight: "900",
};

const tableCellStyle = {
  borderBottom: "1.5px solid #000",
  padding: "9px 6px",
  fontSize: "8px",
  fontWeight: "500",
};

const reviewButtonStyle = {
  background: "transparent",
  border: "none",
  fontSize: "8px",
  fontWeight: "800",
  cursor: "pointer",
};

const emptyCellStyle = {
  padding: "18px",
  textAlign: "center",
  fontSize: "10px",
  fontWeight: "800",
};

const loadingTextStyle = {
  textAlign: "center",
  marginTop: "80px",
  fontSize: "16px",
  fontWeight: "800",
};

const errorTextStyle = {
  width: "665px",
  margin: "0 auto 12px",
  color: "red",
  fontSize: "11px",
  fontWeight: "800",
};