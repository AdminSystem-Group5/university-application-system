"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  subscribeToApplications,
} from "@/lib/services/applicationService";
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
    if (!firebaseUser || !isUniversityAdmin) return;

    setLoadingData(true);
    setErrorMessage("");

    const unsubscribe = subscribeToApplications(
      (data) => {
        const safeData = Array.isArray(data) ? data : [];
        setApplications(safeData);
        setFilteredApplications(safeData);
        setLoadingData(false);
      },
      (error) => {
        console.error("Error loading applications:", error);
        setApplications([]);
        setFilteredApplications([]);
        setErrorMessage("Unable to load applications.");
        setLoadingData(false);
      }
    );

    return () => {
      if (typeof unsubscribe === "function") {
        unsubscribe();
      }
    };
  }, [firebaseUser, isUniversityAdmin]);

  useEffect(() => {
    let filtered = [...applications];

    if (search.trim()) {
      const searchValue = search.toLowerCase();

      filtered = filtered.filter((app) => {
        const studentName = String(
          app.studentName || app.fullName || app.applicantName || ""
        ).toLowerCase();

        const studentEmail = String(
          app.studentEmail || app.email || app.applicantEmail || ""
        ).toLowerCase();

        const applicationId = String(
          app.applicationId || app.id || ""
        ).toLowerCase();

        const courseName = String(
          app.courseName || app.course || ""
        ).toLowerCase();

        return (
          studentName.includes(searchValue) ||
          studentEmail.includes(searchValue) ||
          applicationId.includes(searchValue) ||
          courseName.includes(searchValue)
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

    setFilteredApplications(filtered);
  }, [search, statusFilter, applications]);

  const stats = useMemo(() => {
    const getCurrentStatus = (app) =>
      app.applicationStatus ||
      app.status ||
      app.pendingDecision ||
      "Submitted";

    return {
      total: applications.length,
      submitted: applications.filter(
        (app) => getCurrentStatus(app) === "Submitted"
      ).length,
      underReview: applications.filter(
        (app) => getCurrentStatus(app) === "Under Review"
      ).length,
      offered: applications.filter(
        (app) => getCurrentStatus(app) === "Offered"
      ).length,
      rejected: applications.filter(
        (app) => getCurrentStatus(app) === "Rejected"
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
                placeholder="SEARCH BY STUDENT NAME OR APPLICATION ID"
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
              <option value="Rejected">REJECTED</option>
            </select>
          </div>

          <p style={resultsTextStyle}>
            SHOWING {filteredApplications.length} RESULTS
          </p>
        </section>

        {errorMessage && (
          <p style={errorTextStyle}>{errorMessage}</p>
        )}

        <section style={tableWrapperStyle}>
          <div style={tableTitleBarStyle}>
            APPLICATIONS OVERVIEW
          </div>

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
                  const applicationId =
                    app.id || app.applicationId;

                  const currentStatus =
                    app.applicationStatus ||
                    app.status ||
                    app.pendingDecision ||
                    "Submitted";

                  return (
                    <tr key={applicationId || index}>
                      <td style={tableCellStyle}>
                        {app.applicationId || `APP ${index + 1}`}
                      </td>

                      <td style={tableCellStyle}>
                        {app.studentName ||
                          app.fullName ||
                          app.applicantName ||
                          "Student Name"}
                      </td>

                      <td style={tableCellStyle}>
                        {app.courseName || app.course || "Course Name"}
                      </td>

                      <td style={tableCellStyle}>
                        {app.intendedIntake ||
                          app.intake ||
                          "Date"}
                      </td>

                      <td style={tableCellStyle}>
                        {currentStatus}
                      </td>

                      <td style={tableCellStyle}>
                        {formatDate(
                          app.createdAt || app.submittedAt
                        )}
                      </td>

                      <td style={tableCellStyle}>
                        <button
                          type="button"
                          style={reviewButtonStyle}
                          onClick={() =>
                            handleReviewApplication(
                              applicationId
                            )
                          }
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
  width: "100%",
  background: "#F7F1E8",
  fontFamily: "Arial, Helvetica, sans-serif",
  color: "#071126",
};

const frameStyle = {
  minHeight: "calc(100vh - 20px)",
  width: "100%",

  background: "#F7F1E8",
  padding: "0 40px 50px",
  boxSizing: "border-box",
};

const headerStyle = {
  height: "95px",
  width: "100vw",
  position: "relative",
  left: "50%",
  transform: "translateX(-50%)",
  background: "#fff",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "0 45px",
  margin: "0 0 24px",
  borderBottom: "2px solid #000",
};

const logoStyle = {
  margin: 0,
  fontSize: "48px",
  fontWeight: "900",
  lineHeight: "50px",
};

const subtitleStyle = {
  margin: "8px 0 0",
  fontSize: "16px",
  lineHeight: "22px",
};

const navStyle = {
  display: "flex",
  alignItems: "center",
  gap: "30px",
};

const navButtonStyle = {
  background: "#fff",
  border: "2px solid #3B2E5A",
  color: "#071126",
  height: "55px",
  minWidth: "170px",
  padding: "0 25px",
  fontSize: "16px",
  fontWeight: "700",
  cursor: "pointer",
};

const welcomeBoxStyle = {
  width: "100%",
  maxWidth: "1700px",
  minHeight: "90px",
  margin: "0 auto 30px",
  border: "2px solid #000",
  background: "#fff",
  display: "flex",
  alignItems: "center",
  paddingLeft: "50px",
  boxSizing: "border-box",
};

const welcomeTitleStyle = {
  margin: 0,
  fontSize: "34px",
  fontWeight: "900",
};

const statsRowStyle = {
  width: "100%",
  maxWidth: "1700px",
  margin: "0 auto 30px",
  display: "grid",
  gridTemplateColumns: "repeat(5, 1fr)",
  gap: "25px",
};

const statCardStyle = {
  minHeight: "150px",
  border: "2px solid #000",
  background: "#fff",
  padding: "28px",
  boxSizing: "border-box",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
};

const statLabelStyle = {
  margin: 0,
  fontSize: "18px",
  fontWeight: "900",
};

const statValueStyle = {
  margin: "20px 0 0",
  fontSize: "42px",
  fontWeight: "900",
};

const filtersBoxStyle = {
  width: "100%",
  maxWidth: "1700px",
  margin: "0 auto 30px",
  border: "2px solid #000",
  background: "#fff",
  padding: "30px",
  boxSizing: "border-box",
};

const filterTopRowStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 280px",
  gap: "25px",
  alignItems: "center",
};

const searchWrapperStyle = {
  height: "65px",
  border: "2px solid #000",
  display: "flex",
  alignItems: "center",
  background: "#fff",
};

const searchIconStyle = {
  width: "70px",
  textAlign: "center",
  fontSize: "24px",
  fontWeight: "900",
};

const searchInputStyle = {
  flex: 1,
  border: "none",
  outline: "none",
  height: "100%",
  fontSize: "18px",
  fontWeight: "700",
  paddingRight: "20px",
};

const statusSelectStyle = {
  height: "65px",
  background: "#3B2E5A",
  color: "#fff",
  border: "2px solid #3B2E5A",
  fontSize: "16px",
  fontWeight: "800",
  padding: "0 15px",
  cursor: "pointer",
};

const resultsTextStyle = {
  margin: "18px 0 0",
  fontSize: "16px",
  fontWeight: "900",
};

const tableWrapperStyle = {
  width: "100%",
  maxWidth: "1700px",
  margin: "0 auto",
  border: "2px solid #000",
  background: "#fff",
  overflowX: "auto",
};

const tableTitleBarStyle = {
  height: "76px",
  background: "#3B2E5A",
  color: "#fff",
  display: "flex",
  alignItems: "center",
  paddingLeft: "34px",
  fontSize: "26px",
  fontWeight: "900",
};

const tableStyle = {
  width: "100%",
  minWidth: "1200px",
  borderCollapse: "collapse",
  background: "#fff",
};

const tableHeadStyle = {
  borderTop: "2px solid #000",
  borderBottom: "2px solid #000",
  padding: "24px 18px",
  textAlign: "left",
  fontSize: "16px",
  fontWeight: "900",
};

const tableCellStyle = {
  borderBottom: "1px solid #ccc",
  padding: "24px 18px",
  fontSize: "16px",
  fontWeight: "500",
};

const reviewButtonStyle = {
  background: "#3B2E5A",
  color: "#fff",
  border: "none",
  padding: "12px 22px",
  fontSize: "15px",
  fontWeight: "800",
  cursor: "pointer",
};

const emptyCellStyle = {
  padding: "40px",
  textAlign: "center",
  fontSize: "20px",
  fontWeight: "800",
};

const loadingTextStyle = {
  textAlign: "center",
  marginTop: "120px",
  fontSize: "32px",
  fontWeight: "800",
};

const errorTextStyle = {
  width: "100%",
  maxWidth: "1700px",
  margin: "0 auto 20px",
  color: "red",
  fontSize: "18px",
  fontWeight: "800",
};