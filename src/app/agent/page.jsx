// agent dashboard
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { getFirebaseAuth, getFirestoreDb } from "@/lib/firebase";
import {
  getActiveLinksForAgent,
  getApplicationsForAgent,
} from "@/lib/firebase-utils";
import { useLanguage } from "@/lib/context/language-context";
import LanguageSwitcher from "@/components/LanguageSwitcher";

const STATUS_COLOURS = {
  Draft: "#ccc",
  Submitted: "#3B2E5A",
  "Under Review": "#ffd500",
  Offered: "#48A111",
  Rejected: "#EF5350",
  Withdrawn: "#888",
  "Offer Accepted": "#48A111",
  "Offer Declined": "#EF5350",
};

export default function AgentDashboardPage() {
  const router = useRouter();
  const { t } = useLanguage();

  const [agent, setAgent] = useState(null);
  const [links, setLinks] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const auth = getFirebaseAuth();
    const db = getFirestoreDb();

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        router.replace("/login");
        return;
      }

      try {
        const userSnap = await getDoc(doc(db, "users", firebaseUser.uid));

        if (!userSnap.exists()) {
          router.replace("/login");
          return;
        }

        const userData = userSnap.data();

        if (userData.role !== "agent") {
          router.replace("/login");
          return;
        }

        setAgent(userData);

        const activeLinks = await getActiveLinksForAgent(firebaseUser.uid);
        setLinks(activeLinks);

        const apps = await getApplicationsForAgent(firebaseUser.uid);
        setApplications(apps);
      } catch (err) {
        console.error("Agent dashboard error:", err);
        const msg = err.message || err.code || "Unable to load dashboard";
        setErrorMessage(`Error: ${msg}`);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    const auth = getFirebaseAuth();
    await signOut(auth);
    router.replace("/");
  };

  const getStatusCount = (status) =>
    applications.filter((a) => a.status === status).length;

  const stats = [
    { label: t("agent.dashboard.linkedStudents"), value: links.length },
    { label: t("agent.dashboard.totalApplications"), value: applications.length },
    { label: t("agent.dashboard.submitted"), value: getStatusCount("Submitted") },
    { label: t("agent.dashboard.underReview"), value: getStatusCount("Under Review") },
    { label: t("agent.dashboard.offered"), value: getStatusCount("Offered") },
  ];

  if (loading) {
    return (
      <main style={pageStyle}>
        <div style={frameStyle}>
          <p style={loadingStyle}>{t("agent.dashboard.loading")}</p>
        </div>
      </main>
    );
  }

  if (errorMessage) {
    return (
      <main style={pageStyle}>
        <div style={frameStyle}>
          <p style={{ color: "red", padding: "60px", fontSize: "18px" }}>{errorMessage}</p>
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

          <nav style={{ display: "flex", gap: "16px", alignItems: "center" }}>
            <LanguageSwitcher />
            <button type="button" style={navBtnStyle} onClick={() => router.push("/agent/students")}>
              {t("agent.dashboard.myStudents")}
            </button>
            <button type="button" style={navBtnStyle} onClick={() => router.push("/agent/invite")}>
              {t("agent.dashboard.inviteStudent")}
            </button>
            <button type="button" style={{ ...navBtnStyle, borderColor: "#3B2E5A", color: "#3B2E5A" }} onClick={handleLogout}>
              {t("nav.logout")}
            </button>
          </nav>
        </header>

        <section style={welcomeBarStyle}>
          <div>
            <h2 style={{ margin: 0, fontSize: "30px", fontWeight: "900" }}>
              WELCOME, {(agent?.displayName || "AGENT").toUpperCase()}
            </h2>
            <p style={{ margin: "6px 0 0", fontSize: "16px", fontWeight: "700" }}>
              {agent?.agencyName?.toUpperCase() || ""} — AGENT DASHBOARD
            </p>
          </div>
        </section>

        <section style={statsRowStyle}>
          {stats.map((s) => (
            <div key={s.label} style={statCardStyle}>
              <p style={statLabelStyle}>{s.label}</p>
              <p style={statValueStyle}>{s.value}</p>
            </div>
          ))}
        </section>

        <section style={quickActionsStyle}>
          <h3 style={sectionTitleStyle}>{t("agent.dashboard.quickActions")}</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "24px" }}>
            <button type="button" style={actionBtnStyle} onClick={() => router.push("/agent/invite")}>
              {t("agent.dashboard.inviteNewStudent")}
            </button>
            <button type="button" style={actionBtnStyle} onClick={() => router.push("/agent/students")}>
              {t("agent.dashboard.viewAllStudents")}
            </button>
            <button
              type="button"
              style={actionBtnStyle}
              onClick={() => {
                if (links.length > 0) {
                  router.push(`/agent/students/${links[0].studentId}`);
                } else {
                  router.push("/agent/students");
                }
              }}
            >
              {t("agent.dashboard.createApplication")}
            </button>
          </div>
        </section>

        <section style={tableWrapperStyle}>
          <div style={tableTitleBarStyle}>{t("agent.dashboard.recentApplications")}</div>

          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>{t("agent.dashboard.colAppId")}</th>
                <th style={thStyle}>{t("agent.dashboard.colStudent")}</th>
                <th style={thStyle}>{t("agent.dashboard.colUniversity")}</th>
                <th style={thStyle}>{t("agent.dashboard.colCourse")}</th>
                <th style={thStyle}>{t("agent.dashboard.colStatus")}</th>
                <th style={thStyle}>{t("agent.dashboard.colSubmittedBy")}</th>
                <th style={thStyle}>{t("agent.dashboard.colDate")}</th>
              </tr>
            </thead>
            <tbody>
              {applications.length === 0 ? (
                <tr>
                  <td colSpan={7} style={emptyRowStyle}>
                    {t("agent.dashboard.noApplications")}
                  </td>
                </tr>
              ) : (
                applications.slice(0, 20).map((app) => (
                  <tr key={app.id}>
                    <td style={tdStyle}>{app.id?.slice(0, 8)}...</td>
                    <td style={tdStyle}>
                      {app.personalInfo?.firstName
                        ? `${app.personalInfo.firstName} ${app.personalInfo.lastName || ""}`
                        : app.fullName || app.studentId?.slice(0, 8) || "—"}
                    </td>
                    <td style={tdStyle}>{app.selectedUniversity || app.universityName || "—"}</td>
                    <td style={tdStyle}>{app.courseName || app.courseInfo?.courseName || "—"}</td>
                    <td style={tdStyle}>
                      <span style={statusBadge(app.status)}>{app.status || "Draft"}</span>
                    </td>
                    <td style={tdStyle}>
                      {app.submittedByAgent ? (
                        <span style={{ background: "#EDE7FF", color: "#3B2E5A", padding: "3px 8px", fontSize: "11px", fontWeight: "800" }}>
                          AGENT
                        </span>
                      ) : (
                        <span style={{ color: "#888", fontSize: "12px" }}>Student</span>
                      )}
                    </td>
                    <td style={tdStyle}>{formatDate(app.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>
      </div>
    </main>
  );
}

function formatDate(val) {
  if (!val) return "—";
  try {
    const d = val?.toDate ? val.toDate() : new Date(val);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-GB");
  } catch {
    return "—";
  }
}

function statusBadge(status) {
  const bg = STATUS_COLOURS[status] || "#ccc";
  const light = ["Draft", "Withdrawn"].includes(status);
  return {
    display: "inline-block",
    padding: "3px 10px",
    fontSize: "11px",
    fontWeight: "900",
    background: bg,
    color: light ? "#333" : "#fff",
    border: "1px solid #000",
  };
}

const pageStyle = { minHeight: "100vh", background: "#F7F1E8", fontFamily: "Arial, Helvetica, sans-serif", color: "#071126" };
const frameStyle = { width: "100%", background: "#F7F1E8", padding: "0 40px 60px", boxSizing: "border-box" };
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
const logoStyle = { margin: 0, fontSize: "48px", fontWeight: "900", lineHeight: "50px" };
const subtitleStyle = { margin: "8px 0 0", fontSize: "16px", lineHeight: "22px" };
const navBtnStyle = { background: "#fff", border: "2px solid #000", color: "#071126", height: "50px", padding: "0 22px", fontSize: "14px", fontWeight: "800", cursor: "pointer" };
const welcomeBarStyle = { width: "100%", maxWidth: "1700px", margin: "0 auto 28px", border: "2px solid #000", background: "#fff", padding: "28px 40px", boxSizing: "border-box" };
const statsRowStyle = { width: "100%", maxWidth: "1700px", margin: "0 auto 28px", display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "22px" };
const statCardStyle = { minHeight: "140px", border: "2px solid #000", background: "#fff", padding: "24px", boxSizing: "border-box", display: "flex", flexDirection: "column", justifyContent: "center" };
const statLabelStyle = { margin: 0, fontSize: "15px", fontWeight: "900" };
const statValueStyle = { margin: "16px 0 0", fontSize: "40px", fontWeight: "900" };
const quickActionsStyle = { width: "100%", maxWidth: "1700px", margin: "0 auto 28px", border: "2px solid #000", background: "#fff", padding: "28px 34px", boxSizing: "border-box" };
const sectionTitleStyle = { margin: "0 0 20px", fontSize: "18px", fontWeight: "900" };
const actionBtnStyle = { height: "58px", background: "#fff", border: "2px solid #000", fontSize: "14px", fontWeight: "800", cursor: "pointer" };
const tableWrapperStyle = { width: "100%", maxWidth: "1700px", margin: "0 auto", border: "2px solid #000", background: "#fff", overflowX: "auto" };
const tableTitleBarStyle = { height: "72px", background: "#3B2E5A", color: "#fff", display: "flex", alignItems: "center", paddingLeft: "30px", fontSize: "22px", fontWeight: "900" };
const tableStyle = { width: "100%", borderCollapse: "collapse" };
const thStyle = { borderTop: "2px solid #000", borderBottom: "2px solid #000", padding: "18px 16px", textAlign: "left", fontSize: "14px", fontWeight: "900" };
const tdStyle = { borderBottom: "1px solid #ddd", padding: "16px", fontSize: "14px" };
const emptyRowStyle = { padding: "40px", textAlign: "center", fontSize: "18px", fontWeight: "800" };
const loadingStyle = { textAlign: "center", marginTop: "120px", fontSize: "28px", fontWeight: "800" };
