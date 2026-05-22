// student page to link with an agent using invite code
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { getFirebaseAuth, getFirestoreDb } from "@/lib/firebase";
import { acceptAgentInvite, getLinksForStudent, revokeAgentLink } from "@/lib/firebase-utils";
import { useLanguage } from "@/lib/context/language-context";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export default function StudentAgentPage() {
  const router = useRouter();
  const { t } = useLanguage();

  const [student, setStudent] = useState(null);
  const [links, setLinks] = useState([]);
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [revoking, setRevoking] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const auth = getFirebaseAuth();
    const db = getFirestoreDb();

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) { router.replace("/login"); return; }

      try {
        const userSnap = await getDoc(doc(db, "users", firebaseUser.uid));
        if (!userSnap.exists() || userSnap.data().role !== "student") {
          router.replace("/login");
          return;
        }
        setStudent({ uid: firebaseUser.uid, ...userSnap.data() });

        const activeLinks = await getLinksForStudent(firebaseUser.uid);
        setLinks(activeLinks);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleAcceptInvite = async (e) => {
    e.preventDefault();

    if (!inviteCode.trim()) {
      setErrorMessage(t("student.agentLink.errorEnterCode"));
      return;
    }

    setAccepting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await acceptAgentInvite(
        student.uid,
        student.displayName || student.fullName || "",
        student.email || ""
      , inviteCode.trim());

      setSuccessMessage(t("student.agentLink.successLinked"));
      setInviteCode("");

      const updatedLinks = await getLinksForStudent(student.uid);
      setLinks(updatedLinks);
    } catch (err) {
      console.error("Accept invite error:", err);
      setErrorMessage(err.message || t("student.agentLink.errorInvalidCode"));
    } finally {
      setAccepting(false);
    }
  };

  const handleRevoke = async (linkId) => {
    if (!confirm("Unlink from this agent? They will no longer be able to manage your applications.")) return;
    setRevoking(linkId);
    try {
      await revokeAgentLink(linkId);
      setLinks((prev) => prev.filter((l) => l.id !== linkId));
    } catch (err) {
      console.error(err);
      alert(t("student.agentLink.errorFailedToUnlink"));
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
          <p style={loadingStyle}>{t("student.agentLink.loading")}</p>
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
            <p style={subtitleStyle}>University Administration & Application Management System</p>
          </div>
          <nav style={{ display: "flex", gap: "14px", alignItems: "center" }}>
            <LanguageSwitcher />
            <button type="button" style={navBtnStyle} onClick={() => router.push("/student")}>{t("nav.dashboard")}</button>
            <button type="button" style={{ ...navBtnStyle, borderColor: "#3B2E5A", color: "#3B2E5A" }} onClick={handleLogout}>{t("nav.logout")}</button>
          </nav>
        </header>

        <section style={cardStyle}>
          <h2 style={{ margin: "0 0 10px", fontSize: "24px", fontWeight: "900" }}>{t("student.agentLink.title")}</h2>
          <p style={{ margin: "0 0 28px", color: "#555", fontSize: "15px" }}>
            {t("student.agentLink.subtitle")}
          </p>

          {successMessage && (
            <div style={{ padding: "14px 20px", background: "#e6f4ea", border: "2px solid #48A111", fontWeight: "800", color: "#1e5c0f", marginBottom: "20px" }}>
              {successMessage}
            </div>
          )}

          {errorMessage && (
            <div style={{ padding: "14px 20px", background: "#fde8e8", border: "2px solid #EF5350", fontWeight: "800", color: "#7f1d1d", marginBottom: "20px" }}>
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleAcceptInvite} style={{ display: "flex", gap: "14px", alignItems: "flex-start", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: "200px" }}>
              <label style={labelStyle}>{t("student.agentLink.inviteCodeLabel")}</label>
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder={t("student.agentLink.inviteCodePlaceholder")}
                style={{ ...inputStyle, fontFamily: "monospace", fontSize: "20px", letterSpacing: "3px", textTransform: "uppercase" }}
                maxLength={8}
                disabled={accepting}
              />
            </div>
            <div style={{ paddingTop: "22px" }}>
              <button type="submit" disabled={accepting} style={primaryBtnStyle}>
                {accepting ? t("student.agentLink.linking") : t("student.agentLink.linkAgent")}
              </button>
            </div>
          </form>
        </section>

        <section style={{ ...cardStyle, marginTop: "24px" }}>
          <h3 style={{ margin: "0 0 20px", fontSize: "20px", fontWeight: "900" }}>
            {t("student.agentLink.linkedAgents")} ({links.length})
          </h3>

          {links.length === 0 ? (
            <p style={{ color: "#666", fontSize: "15px" }}>{t("student.agentLink.noLinkedAgents")}</p>
          ) : (
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>{t("student.agentLink.colAgencyName")}</th>
                  <th style={thStyle}>{t("student.agentLink.colAgentName")}</th>
                  <th style={thStyle}>{t("student.agentLink.colLinkedDate")}</th>
                  <th style={thStyle}>{t("student.agentLink.colAction")}</th>
                </tr>
              </thead>
              <tbody>
                {links.map((link) => (
                  <tr key={link.id}>
                    <td style={tdStyle}>{link.agencyName || "—"}</td>
                    <td style={tdStyle}>{link.agentName || "—"}</td>
                    <td style={tdStyle}>{formatDate(link.linkedAt)}</td>
                    <td style={tdStyle}>
                      <button
                        type="button"
                        style={revokeBtnStyle}
                        disabled={revoking === link.id}
                        onClick={() => handleRevoke(link.id)}
                      >
                        {revoking === link.id ? t("student.agentLink.unlinking") : t("student.agentLink.unlink")}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
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
  } catch { return "—"; }
}

const pageStyle = { minHeight: "100vh", background: "#F7F1E8", fontFamily: "Arial, Helvetica, sans-serif", color: "#071126" };
const frameStyle = { width: "100%", padding: "0 40px 60px", boxSizing: "border-box" };
const headerStyle = { height: "95px", width: "100vw", position: "relative", left: "50%", transform: "translateX(-50%)", background: "#fff", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 45px", margin: "0 0 28px", borderBottom: "2px solid #000" };
const logoStyle = { margin: 0, fontSize: "48px", fontWeight: "900", lineHeight: "50px" };
const subtitleStyle = { margin: "8px 0 0", fontSize: "16px" };
const navBtnStyle = { background: "#fff", border: "2px solid #000", color: "#071126", height: "50px", padding: "0 20px", fontSize: "13px", fontWeight: "800", cursor: "pointer" };
const cardStyle = { width: "100%", maxWidth: "900px", margin: "0 auto", background: "#fff", border: "2px solid #000", padding: "36px", boxSizing: "border-box" };
const labelStyle = { display: "block", fontSize: "12px", fontWeight: "900", marginBottom: "6px" };
const inputStyle = { width: "100%", height: "52px", border: "1.5px solid #2f2146", padding: "0 16px", background: "#fff", boxSizing: "border-box" };
const primaryBtnStyle = { height: "52px", background: "#3B2E5A", color: "#fff", border: "none", padding: "0 28px", fontSize: "14px", fontWeight: "800", cursor: "pointer" };
const revokeBtnStyle = { background: "#fff", color: "#EF5350", border: "1.5px solid #EF5350", padding: "8px 16px", fontSize: "12px", fontWeight: "800", cursor: "pointer" };
const tableStyle = { width: "100%", borderCollapse: "collapse" };
const thStyle = { borderTop: "2px solid #000", borderBottom: "2px solid #000", padding: "14px 12px", textAlign: "left", fontSize: "13px", fontWeight: "900" };
const tdStyle = { borderBottom: "1px solid #ddd", padding: "14px 12px", fontSize: "14px" };
const loadingStyle = { textAlign: "center", marginTop: "120px", fontSize: "28px", fontWeight: "800" };
