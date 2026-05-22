// agent students list and pending invites
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { getFirebaseAuth, getFirestoreDb } from "@/lib/firebase";
import { getLinksForAgent, revokeAgentLink, getApplicationsForAgent, ensureAgentLookupDocuments } from "@/lib/firebase-utils";
import { useLanguage } from "@/lib/context/language-context";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export default function AgentStudentsPage() {
  const router = useRouter();
  const { t } = useLanguage();

  const [agent, setAgent] = useState(null);
  const [links, setLinks] = useState([]);
  const [appCountByStudent, setAppCountByStudent] = useState({});
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const auth = getFirebaseAuth();
    const db = getFirestoreDb();

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) { router.replace("/login"); return; }

      try {
        const userSnap = await getDoc(doc(db, "users", firebaseUser.uid));
        if (!userSnap.exists() || userSnap.data().role !== "agent") {
          router.replace("/login");
          return;
        }

        setAgent(userSnap.data());

        const allLinks = await getLinksForAgent(firebaseUser.uid);
        setLinks(allLinks);

        // Create missing lookup documents for existing links (best-effort, non-blocking).
        ensureAgentLookupDocuments(firebaseUser.uid).catch(() => {});

        const apps = await getApplicationsForAgent(firebaseUser.uid);
        const counts = {};
        for (const app of apps) {
          if (app.studentId) {
            counts[app.studentId] = (counts[app.studentId] || 0) + 1;
          }
        }
        setAppCountByStudent(counts);
      } catch (err) {
        console.error("Students page error:", err);
        setErrorMessage(t("agent.students.unableToLoad"));
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleRevoke = async (linkId) => {
    if (!confirm("Remove this link? The student will no longer be associated with your account.")) return;
    setRevoking(linkId);
    try {
      await revokeAgentLink(linkId);
      setLinks((prev) => prev.filter((l) => l.id !== linkId));
    } catch (err) {
      console.error("Revoke error:", err);
      alert("Failed to remove link.");
    } finally {
      setRevoking(null);
    }
  };

  const handleLogout = async () => {
    await signOut(getFirebaseAuth());
    router.replace("/");
  };

  if (loading) {
    return (
      <main style={pageStyle}>
        <div style={frameStyle}>
          <p style={loadingStyle}>{t("agent.students.loading")}</p>
        </div>
      </main>
    );
  }

  const activeLinks = links.filter((l) => l.status === "active");
  const pendingLinks = links.filter((l) => l.status === "pending");

  return (
    <main style={pageStyle}>
      <div style={frameStyle}>
        <header style={headerStyle}>
          <div>
            <h1 style={logoStyle}>UAAMS</h1>
            <p style={subtitleStyle}>University Administration & Application Management System</p>
          </div>
          <nav style={{ display: "flex", gap: "14px", alignItems: "center" }}>
            <LanguageSwitcher />
            <button type="button" style={navBtnStyle} onClick={() => router.push("/agent")}>
              {t("nav.dashboard")}
            </button>
            <button type="button" style={navBtnStyle} onClick={() => router.push("/agent/invite")}>
              {t("agent.dashboard.inviteStudent")}
            </button>
            <button type="button" style={{ ...navBtnStyle, borderColor: "#3B2E5A", color: "#3B2E5A" }} onClick={handleLogout}>
              {t("nav.logout")}
            </button>
          </nav>
        </header>

        {errorMessage && <p style={{ color: "red", fontWeight: "800", marginBottom: "20px" }}>{errorMessage}</p>}

        <section style={sectionBoxStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h2 style={sectionTitleStyle}>{t("agent.students.linkedStudents")} ({activeLinks.length})</h2>
            <button type="button" style={primaryBtnStyle} onClick={() => router.push("/agent/invite")}>
              {t("agent.students.inviteNewStudent")}
            </button>
          </div>

          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>{t("agent.students.colStudentName")}</th>
                <th style={thStyle}>{t("agent.students.colEmail")}</th>
                <th style={thStyle}>{t("agent.students.colApplications")}</th>
                <th style={thStyle}>{t("agent.students.colLinkedDate")}</th>
                <th style={thStyle}>{t("agent.students.colActions")}</th>
              </tr>
            </thead>
            <tbody>
              {activeLinks.length === 0 ? (
                <tr>
                  <td colSpan={5} style={emptyRowStyle}>
                    {t("agent.students.noLinkedStudents")}
                  </td>
                </tr>
              ) : (
                activeLinks.map((link) => (
                  <tr key={link.id}>
                    <td style={tdStyle}>{link.studentName || "—"}</td>
                    <td style={tdStyle}>{link.studentEmail || "—"}</td>
                    <td style={tdStyle}>{appCountByStudent[link.studentId] || 0}</td>
                    <td style={tdStyle}>{formatDate(link.linkedAt)}</td>
                    <td style={tdStyle}>
                      <button
                        type="button"
                        style={viewBtnStyle}
                        onClick={() => router.push(`/agent/students/${link.studentId}`)}
                      >
                        {t("agent.students.view")}
                      </button>
                      <button
                        type="button"
                        style={revokeBtnStyle}
                        disabled={revoking === link.id}
                        onClick={() => handleRevoke(link.id)}
                      >
                        {revoking === link.id ? t("agent.students.removing") : t("agent.students.remove")}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>

        {pendingLinks.length > 0 && (
          <section style={{ ...sectionBoxStyle, marginTop: "28px" }}>
            <h2 style={sectionTitleStyle}>{t("agent.students.pendingInvites")} ({pendingLinks.length})</h2>

            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>{t("agent.students.colInviteCode")}</th>
                  <th style={thStyle}>{t("agent.students.colCreatedDate")}</th>
                  <th style={thStyle}>{t("agent.students.colStatus")}</th>
                  <th style={thStyle}>{t("agent.students.colAction")}</th>
                </tr>
              </thead>
              <tbody>
                {pendingLinks.map((link) => (
                  <tr key={link.id}>
                    <td style={tdStyle}>
                      <span style={inviteCodeStyle}>{link.inviteCode}</span>
                    </td>
                    <td style={tdStyle}>{formatDate(link.createdAt)}</td>
                    <td style={tdStyle}>
                      <span style={{ color: "#f59e0b", fontWeight: "800", fontSize: "13px" }}>{t("agent.students.pending")}</span>
                    </td>
                    <td style={tdStyle}>
                      <button
                        type="button"
                        style={revokeBtnStyle}
                        disabled={revoking === link.id}
                        onClick={() => handleRevoke(link.id)}
                      >
                        {revoking === link.id ? t("agent.students.cancelling") : t("agent.students.cancel")}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}
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
  } catch { return "—"; }
}

const pageStyle = { minHeight: "100vh", background: "#F7F1E8", fontFamily: "Arial, Helvetica, sans-serif", color: "#071126" };
const frameStyle = { width: "100%", padding: "0 40px 60px", boxSizing: "border-box" };
const headerStyle = { height: "95px", width: "100vw", position: "relative", left: "50%", transform: "translateX(-50%)", background: "#fff", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 45px", margin: "0 0 28px", borderBottom: "2px solid #000" };
const logoStyle = { margin: 0, fontSize: "48px", fontWeight: "900", lineHeight: "50px" };
const subtitleStyle = { margin: "8px 0 0", fontSize: "16px" };
const navBtnStyle = { background: "#fff", border: "2px solid #000", color: "#071126", height: "50px", padding: "0 20px", fontSize: "13px", fontWeight: "800", cursor: "pointer" };
const sectionBoxStyle = { width: "100%", maxWidth: "1600px", margin: "0 auto", background: "#fff", border: "2px solid #000", padding: "30px", boxSizing: "border-box" };
const sectionTitleStyle = { margin: 0, fontSize: "20px", fontWeight: "900" };
const primaryBtnStyle = { background: "#3B2E5A", color: "#fff", border: "none", height: "48px", padding: "0 24px", fontSize: "14px", fontWeight: "800", cursor: "pointer" };
const tableStyle = { width: "100%", borderCollapse: "collapse", marginTop: "12px" };
const thStyle = { borderTop: "2px solid #000", borderBottom: "2px solid #000", padding: "16px 14px", textAlign: "left", fontSize: "14px", fontWeight: "900" };
const tdStyle = { borderBottom: "1px solid #ddd", padding: "16px 14px", fontSize: "14px" };
const emptyRowStyle = { padding: "40px", textAlign: "center", fontSize: "16px", fontWeight: "800", color: "#666" };
const viewBtnStyle = { background: "#3B2E5A", color: "#fff", border: "none", padding: "8px 16px", fontSize: "12px", fontWeight: "800", cursor: "pointer", marginRight: "8px" };
const revokeBtnStyle = { background: "#fff", color: "#EF5350", border: "1.5px solid #EF5350", padding: "8px 14px", fontSize: "12px", fontWeight: "800", cursor: "pointer" };
const inviteCodeStyle = { fontFamily: "monospace", fontSize: "18px", fontWeight: "900", letterSpacing: "3px", color: "#3B2E5A" };
const loadingStyle = { textAlign: "center", marginTop: "120px", fontSize: "28px", fontWeight: "800" };
