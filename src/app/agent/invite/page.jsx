// agent invite code generator
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { getFirebaseAuth, getFirestoreDb } from "@/lib/firebase";
import { createAgentInvite } from "@/lib/firebase-utils";
import { useLanguage } from "@/lib/context/language-context";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export default function AgentInvitePage() {
  const router = useRouter();
  const { t } = useLanguage();

  const [agent, setAgent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [copied, setCopied] = useState(false);

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
        setAgent({ uid: firebaseUser.uid, ...userSnap.data() });
      } catch (err) {
        console.error(err);
        setErrorMessage(t("agent.invite.unableToLoad"));
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleGenerateInvite = async () => {
    if (!agent) return;

    setGenerating(true);
    setErrorMessage("");
    setInviteCode("");
    setCopied(false);

    try {
      const code = await createAgentInvite(
        agent.uid,
        agent.displayName,
        agent.agencyName
      );
      setInviteCode(code);
    } catch (err) {
      console.error("Invite generation error:", err);
      setErrorMessage(t("agent.invite.failedToGenerate"));
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!inviteCode) return;
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogout = async () => {
    await signOut(getFirebaseAuth());
    router.replace("/");
  };

  if (loading) {
    return (
      <main style={pageStyle}>
        <div style={frameStyle}>
          <p style={loadingStyle}>{t("agent.dashboard.loading")}</p>
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
            <button type="button" style={navBtnStyle} onClick={() => router.push("/agent")}>{t("nav.dashboard")}</button>
            <button type="button" style={navBtnStyle} onClick={() => router.push("/agent/students")}>{t("agent.dashboard.myStudents")}</button>
            <button type="button" style={{ ...navBtnStyle, borderColor: "#3B2E5A", color: "#3B2E5A" }} onClick={handleLogout}>{t("nav.logout")}</button>
          </nav>
        </header>

        <section style={cardStyle}>
          <h2 style={{ margin: "0 0 10px", fontSize: "26px", fontWeight: "900" }}>{t("agent.invite.title")}</h2>
          <p style={{ margin: "0 0 32px", color: "#555", fontSize: "15px" }}>
            {t("agent.invite.subtitle")}
          </p>

          {errorMessage && (
            <p style={{ color: "red", fontWeight: "800", marginBottom: "20px" }}>{errorMessage}</p>
          )}

          <button
            type="button"
            onClick={handleGenerateInvite}
            disabled={generating}
            style={generateBtnStyle}
          >
            {generating ? t("agent.invite.generating") : t("agent.invite.generateBtn")}
          </button>

          {inviteCode && (
            <div style={inviteBoxStyle}>
              <p style={{ margin: "0 0 14px", fontSize: "14px", fontWeight: "800", color: "#555" }}>
                {t("agent.invite.shareCode")}
              </p>

              <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
                <div style={codeDisplayStyle}>{inviteCode}</div>

                <button type="button" onClick={handleCopy} style={copyBtnStyle}>
                  {copied ? t("agent.invite.copied") : t("agent.invite.copyCode")}
                </button>
              </div>

              <div style={instructionsBoxStyle}>
                <p style={{ margin: "0 0 8px", fontWeight: "900", fontSize: "14px" }}>{t("agent.invite.howToAccept")}</p>
                <ol style={{ margin: 0, paddingLeft: "20px", fontSize: "14px", lineHeight: "1.8" }}>
                  <li>{t("agent.invite.step1")}</li>
                  <li>{t("agent.invite.step2")}</li>
                  <li>Enters the code: <strong>{inviteCode}</strong></li>
                  <li>{t("agent.invite.step4")}</li>
                </ol>
              </div>

              <button
                type="button"
                onClick={handleGenerateInvite}
                style={{ marginTop: "20px", background: "#fff", border: "2px solid #000", padding: "10px 22px", fontWeight: "800", fontSize: "13px", cursor: "pointer" }}
              >
                {t("agent.invite.generateAnother")}
              </button>
            </div>
          )}
        </section>

        <section style={{ ...cardStyle, marginTop: "28px" }}>
          <h3 style={{ margin: "0 0 14px", fontSize: "18px", fontWeight: "900" }}>{t("agent.invite.agencyDetails")}</h3>
          <p style={{ margin: "0", fontSize: "15px" }}>
            <strong>{t("agent.invite.agencyName")}</strong> {agent?.agencyName || t("agent.invite.notSet")}<br />
            <strong>{t("agent.invite.agentName")}</strong> {agent?.displayName || t("agent.invite.notSet")}<br />
            <strong>{t("agent.invite.email")}</strong> {agent?.email || t("agent.invite.notSet")}
          </p>
        </section>
      </div>
    </main>
  );
}

const pageStyle = { minHeight: "100vh", background: "#F7F1E8", fontFamily: "Arial, Helvetica, sans-serif", color: "#071126" };
const frameStyle = { width: "100%", padding: "0 40px 60px", boxSizing: "border-box" };
const headerStyle = { height: "95px", width: "100vw", position: "relative", left: "50%", transform: "translateX(-50%)", background: "#fff", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 45px", margin: "0 0 28px", borderBottom: "2px solid #000" };
const logoStyle = { margin: 0, fontSize: "48px", fontWeight: "900", lineHeight: "50px" };
const subtitleStyle = { margin: "8px 0 0", fontSize: "16px" };
const navBtnStyle = { background: "#fff", border: "2px solid #000", color: "#071126", height: "50px", padding: "0 20px", fontSize: "13px", fontWeight: "800", cursor: "pointer" };
const cardStyle = { width: "100%", maxWidth: "800px", margin: "0 auto", background: "#fff", border: "2px solid #000", padding: "40px", boxSizing: "border-box" };
const generateBtnStyle = { height: "56px", background: "#3B2E5A", color: "#fff", border: "none", padding: "0 36px", fontSize: "16px", fontWeight: "800", cursor: "pointer" };
const inviteBoxStyle = { marginTop: "32px", padding: "28px", background: "#F7F1E8", border: "2px solid #000" };
const codeDisplayStyle = { fontFamily: "monospace", fontSize: "36px", fontWeight: "900", letterSpacing: "6px", color: "#3B2E5A", background: "#EDE7FF", padding: "16px 28px", border: "2px solid #3B2E5A" };
const copyBtnStyle = { height: "52px", background: "#071126", color: "#fff", border: "none", padding: "0 24px", fontSize: "14px", fontWeight: "800", cursor: "pointer" };
const instructionsBoxStyle = { marginTop: "24px", padding: "20px", background: "#fff", border: "1px solid #ccc" };
const loadingStyle = { textAlign: "center", marginTop: "120px", fontSize: "28px", fontWeight: "800" };
