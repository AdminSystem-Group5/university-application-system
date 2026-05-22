// student documents checklist
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import { getFirebaseAuth, getFirestoreDb } from "@/lib/firebase";
import { useLanguage } from "@/lib/context/language-context";
import LanguageSwitcher from "@/components/LanguageSwitcher";

const DOCUMENT_TYPES = [
  { key: "passport",        label: "Passport / ID Document" },
  { key: "transcript",      label: "Academic Transcript" },
  { key: "certificates",    label: "Qualifications / Certificates" },
  { key: "englishTest",     label: "English Language Test Result (IELTS / TOEFL)" },
];

export default function StudentDocumentsPage() {
  const router = useRouter();
  const { t } = useLanguage();

  const [firebaseUser, setFirebaseUser]           = useState(null);
  const [student, setStudent]                     = useState(null);
  const [checked, setChecked]                     = useState({});
  const [applicationDocumentId, setApplicationDocumentId] = useState("");

  const [loading, setSLoading]   = useState(true);
  const [saving, setSaving]      = useState(false);
  const [errorMessage, setError] = useState("");
  const [successMessage, setOk]  = useState("");

  useEffect(() => {
    const auth = getFirebaseAuth();
    const db   = getFirestoreDb();

    const unsub = onAuthStateChanged(auth, async (cu) => {
      if (!cu) { router.replace("/"); return; }

      try {
        setFirebaseUser(cu);

        const snap = await getDoc(doc(db, "users", cu.uid));
        if (!snap.exists()) { setSLoading(false); return; }

        const data = snap.data();
        if (String(data?.role || "").trim().toLowerCase() !== "student") {
          router.replace("/admin");
          return;
        }
        setStudent(data);

        // Load previously saved document status
        const saved = await getDoc(doc(db, "studentDocuments", cu.uid));
        if (saved.exists()) {
          const docs = saved.data()?.documents || {};
          // Convert stored format → simple checked map
          const initial = {};
          DOCUMENT_TYPES.forEach(({ key }) => {
            initial[key] = !!(docs[key]?.provided || docs[key]?.name);
          });
          setChecked(initial);
        }

        // Find latest application for redirect after save
        const appsSnap = await getDocs(
          query(collection(db, "applications"), where("studentId", "==", cu.uid))
        );
        if (!appsSnap.empty) {
          const sorted = appsSnap.docs
            .map((d) => ({ id: d.id, t: d.data()?.createdAt?.toMillis?.() || 0 }))
            .sort((a, b) => b.t - a.t);
          setApplicationDocumentId(sorted[0].id);
        }
      } catch (err) {
        console.error(err);
        setError("Unable to load your document records.");
      } finally {
        setSLoading(false);
      }
    });

    return () => unsub();
  }, [router]);

  const toggle = (key) =>
    setChecked((prev) => ({ ...prev, [key]: !prev[key] }));

  const handleSave = async () => {
    if (!firebaseUser) return;
    setSaving(true);
    setError("");
    setOk("");

    try {
      const db = getFirestoreDb();

      // Build documents map — each key gets a simple {provided, markedAt} record
      const documents = {};
      DOCUMENT_TYPES.forEach(({ key }) => {
        documents[key] = {
          provided:  !!checked[key],
          markedAt:  checked[key] ? new Date().toISOString() : null,
        };
      });

      await setDoc(
        doc(db, "studentDocuments", firebaseUser.uid),
        {
          studentId:    firebaseUser.uid,
          studentEmail: firebaseUser.email || student?.email || "",
          documents,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      setOk(t("student.documents.savedSuccess") || "Documents saved successfully.");

      if (applicationDocumentId) {
        router.push(`/student/application/${encodeURIComponent(applicationDocumentId)}`);
      } else {
        router.push("/student");
      }
    } catch (err) {
      console.error(err);
      setError(t("student.documents.errorUnableToSave") || "Unable to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await signOut(getFirebaseAuth());
    router.replace("/");
  };

  if (loading) {
    return (
      <main style={pageStyle}>
        <p style={{ textAlign: "center", marginTop: "120px", fontSize: "26px", fontWeight: 900 }}>
          {t("student.documents.loading") || "Loading…"}
        </p>
      </main>
    );
  }

  const allChecked = DOCUMENT_TYPES.every(({ key }) => checked[key]);

  return (
    <main style={pageStyle}>
      <div style={frameStyle}>
        {/* ── Header ── */}
        <header style={headerStyle}>
          <div>
            <h1 style={logoStyle}>UAAMS</h1>
            <p style={subtitleStyle}>University Administration &amp; Application Management System</p>
          </div>
          <nav style={{ display: "flex", gap: "14px", alignItems: "center" }}>
            <LanguageSwitcher />
            <button type="button" style={navBtnStyle} onClick={handleLogout}>
              {t("nav.logout")}
            </button>
          </nav>
        </header>

        {/* ── Title bar ── */}
        <div style={titleBarStyle}>
          <button type="button" style={backBtnStyle} onClick={() => router.push("/student")}>
            {t("student.application.backToDashboard") || "Back to Dashboard"}
          </button>
          <div style={{ textAlign: "center" }}>
            <h2 style={{ margin: 0, fontSize: "28px", fontWeight: 900 }}>
              {t("student.documents.title") || "Supporting Documents"}
            </h2>
            <p style={{ margin: "6px 0 0", fontSize: "13px", fontWeight: 800 }}>
              {t("student.documents.docsSubtitle") || "Confirm which documents you have ready for your application"}
            </p>
          </div>
          <div />
        </div>

        {/* ── Main card ── */}
        <section style={cardStyle}>
          {/* Info box */}
          <div style={infoBoxStyle}>
            <p style={{ margin: 0, fontSize: "14px", fontWeight: 800 }}>
              Please tick each document you have ready to submit with your application.
              You will need to bring physical or digital copies when requested by the university.
            </p>
          </div>

          {/* Checklist */}
          <div style={{ marginTop: "28px" }}>
            {DOCUMENT_TYPES.map(({ key, label }) => (
              <div
                key={key}
                style={{
                  ...rowStyle,
                  background: checked[key] ? "#e6f4ea" : "#fff",
                  borderColor: checked[key] ? "#48A111" : "#000",
                }}
                onClick={() => toggle(key)}
              >
                <div style={checkboxStyle(checked[key])}>
                  {checked[key] && <span style={{ color: "#fff", fontSize: "16px", lineHeight: 1 }}>✓</span>}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: "16px", fontWeight: 900 }}>{label}</p>
                  {checked[key] && (
                    <p style={{ margin: "4px 0 0", fontSize: "12px", fontWeight: 800, color: "#48A111" }}>
                      Marked as ready
                    </p>
                  )}
                </div>
                <span style={{ fontSize: "13px", fontWeight: 800, color: checked[key] ? "#48A111" : "#888" }}>
                  {checked[key] ? "READY" : "NOT MARKED"}
                </span>
              </div>
            ))}
          </div>

          {/* Progress note */}
          <p style={{ marginTop: "20px", fontSize: "13px", fontWeight: 800, color: "#555" }}>
            {DOCUMENT_TYPES.filter(({ key }) => checked[key]).length} of {DOCUMENT_TYPES.length} documents marked ready
            {allChecked && " — all documents confirmed ✓"}
          </p>

          {errorMessage   && <p style={{ color: "red",   fontWeight: 800, marginTop: "16px" }}>{errorMessage}</p>}
          {successMessage && <p style={{ color: "green", fontWeight: 800, marginTop: "16px" }}>{successMessage}</p>}

          {/* Buttons */}
          <div style={{ marginTop: "32px", display: "flex", justifyContent: "space-between" }}>
            <button type="button" style={secondaryBtnStyle} onClick={() => router.push("/student")}>
              {t("student.documents.back") || "Back"}
            </button>
            <button
              type="button"
              style={{ ...primaryBtnStyle, opacity: saving ? 0.7 : 1, cursor: saving ? "not-allowed" : "pointer" }}
              onClick={handleSave}
              disabled={saving}
            >
              {saving
                ? (t("student.documents.saving") || "Saving…")
                : (t("student.documents.saveDocuments") || "Save & Continue")}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}

const pageStyle       = { minHeight: "100vh", background: "#F7F1E8", fontFamily: "Arial, Helvetica, sans-serif", color: "#071126" };
const frameStyle      = { width: "100%", padding: "0 40px 60px", boxSizing: "border-box" };
const headerStyle     = { height: "95px", width: "100vw", position: "relative", left: "50%", transform: "translateX(-50%)", background: "#fff", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 45px", margin: "0 0 28px", borderBottom: "2px solid #000" };
const logoStyle       = { margin: 0, fontSize: "48px", fontWeight: 900, lineHeight: "50px" };
const subtitleStyle   = { margin: "8px 0 0", fontSize: "16px" };
const navBtnStyle     = { background: "#fff", border: "2px solid #3B2E5A", color: "#3B2E5A", height: "50px", padding: "0 20px", fontSize: "13px", fontWeight: 800, cursor: "pointer" };
const titleBarStyle   = { width: "100%", maxWidth: "900px", margin: "0 auto 28px", display: "grid", gridTemplateColumns: "200px 1fr 200px", alignItems: "center", background: "#fff", border: "2px solid #000", padding: "16px 24px", boxSizing: "border-box" };
const backBtnStyle    = { height: "44px", background: "#3B2E5A", color: "#fff", border: "none", fontSize: "13px", fontWeight: 800, cursor: "pointer", padding: "0 16px" };
const cardStyle       = { width: "100%", maxWidth: "900px", margin: "0 auto", background: "#fff", border: "2px solid #000", padding: "36px", boxSizing: "border-box" };
const infoBoxStyle    = { background: "#F7F1E8", border: "2px solid #000", padding: "18px 24px" };
const rowStyle        = { display: "flex", alignItems: "center", gap: "18px", padding: "18px 20px", border: "2px solid #000", marginBottom: "12px", cursor: "pointer", transition: "background 0.15s, border-color 0.15s", userSelect: "none" };
const checkboxStyle   = (on) => ({ width: "28px", height: "28px", border: `2px solid ${on ? "#48A111" : "#000"}`, background: on ? "#48A111" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "background 0.15s" });
const secondaryBtnStyle = { width: "140px", height: "50px", background: "#fff", border: "2px solid #000", fontSize: "14px", fontWeight: 800, cursor: "pointer" };
const primaryBtnStyle   = { width: "220px", height: "50px", background: "#3B2E5A", border: "2px solid #3B2E5A", color: "#fff", fontSize: "14px", fontWeight: 800 };
