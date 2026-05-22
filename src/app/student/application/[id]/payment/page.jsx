// payment page for application fee
"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { getFirebaseAuth, getFirestoreDb } from "@/lib/firebase";
import { useLanguage } from "@/lib/context/language-context";
import LanguageSwitcher from "@/components/LanguageSwitcher";

const FEE_DISPLAY = "£50.00";

export default function PaymentPage() {
  const router = useRouter();
  const params = useParams();
  const { t } = useLanguage();
  const applicationId = params?.id;

  const [student, setStudent] = useState(null);
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const auth = getFirebaseAuth();
    const db = getFirestoreDb();

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) { router.replace("/login"); return; }

      try {
        const userSnap = await getDoc(doc(db, "users", firebaseUser.uid));
        if (!userSnap.exists()) { router.replace("/login"); return; }
        setStudent({ uid: firebaseUser.uid, email: firebaseUser.email, ...userSnap.data() });

        if (!applicationId) { router.replace("/student"); return; }

        const appSnap = await getDoc(doc(db, "applications", applicationId));
        if (!appSnap.exists()) {
          setErrorMessage("Application not found.");
          setLoading(false);
          return;
        }

        const appData = appSnap.data();

        if (appData.paymentStatus === "paid") {
          router.replace(`/student/application/${applicationId}/payment/success?already_paid=true`);
          return;
        }

        setApplication({ id: appSnap.id, ...appData });
      } catch (err) {
        console.error("Payment page error:", err);
        setErrorMessage("Unable to load payment details.");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router, applicationId]);

  const handlePay = async () => {
    if (!student || !application) return;

    setPaying(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/payments/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId: application.id,
          studentId: student.uid,
          studentEmail: student.email || "",
          universityName: application.selectedUniversity || application.universityName || application.university || "",
          courseName: application.courseName || application.course || "",
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.url) {
        setErrorMessage(data.error || t("student.payment.failedToStart"));
        setPaying(false);
        return;
      }

      window.location.href = data.url;
    } catch (err) {
      console.error("Payment initiation error:", err);
      setErrorMessage(t("student.payment.networkError"));
      setPaying(false);
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
          <p style={loadingStyle}>{t("student.payment.loading")}</p>
        </div>
      </main>
    );
  }

  if (errorMessage && !application) {
    return (
      <main style={pageStyle}>
        <div style={frameStyle}>
          <Header onLogout={handleLogout} t={t} />
          <div style={centreCardStyle}>
            <p style={{ color: "red", fontWeight: "800", marginBottom: "20px" }}>{errorMessage}</p>
            <button type="button" style={secondaryBtnStyle} onClick={() => router.push("/student")}>{t("student.payment.backToDashboard")}</button>
          </div>
        </div>
      </main>
    );
  }

  const universityName = application?.selectedUniversity || application?.universityName || application?.university || "University";
  const courseName = application?.courseName || application?.course || "Course";

  return (
    <main style={pageStyle}>
      <div style={frameStyle}>
        <Header onLogout={handleLogout} t={t} />

        <div style={centreCardStyle}>
          <div style={lockIconStyle}>🔒</div>

          <h1 style={{ margin: "0 0 8px", fontSize: "26px", fontWeight: "900" }}>{t("student.payment.title")}</h1>
          <p style={{ margin: "0 0 32px", color: "#555", fontSize: "15px" }}>
            {t("student.payment.subtitle")}
          </p>

          <div style={summaryBoxStyle}>
            <div style={summaryRowStyle}>
              <span style={summaryLabelStyle}>{t("student.payment.colUniversity")}</span>
              <span style={summaryValueStyle}>{universityName}</span>
            </div>
            <div style={summaryRowStyle}>
              <span style={summaryLabelStyle}>{t("student.payment.colCourse")}</span>
              <span style={summaryValueStyle}>{courseName}</span>
            </div>
            <div style={summaryRowStyle}>
              <span style={summaryLabelStyle}>{t("student.payment.colAppId")}</span>
              <span style={{ ...summaryValueStyle, fontSize: "12px", color: "#555" }}>{application?.id}</span>
            </div>
            <div style={dividerStyle} />
            <div style={summaryRowStyle}>
              <span style={{ ...summaryLabelStyle, fontSize: "16px" }}>{t("student.payment.applicationFee")}</span>
              <span style={feePriceStyle}>{FEE_DISPLAY}</span>
            </div>
          </div>

          {errorMessage && (
            <div style={{ padding: "12px 18px", background: "#fde8e8", border: "1.5px solid #EF5350", color: "#7f1d1d", fontWeight: "800", fontSize: "14px", marginBottom: "20px" }}>
              {errorMessage}
            </div>
          )}

          <button
            type="button"
            onClick={handlePay}
            disabled={paying}
            style={{ ...primaryBtnStyle, opacity: paying ? 0.7 : 1, cursor: paying ? "not-allowed" : "pointer" }}
          >
            {paying ? t("student.payment.redirecting") : t("student.payment.payBtn")}
          </button>

          <p style={{ marginTop: "14px", fontSize: "12px", color: "#888", textAlign: "center" }}>
            {t("student.payment.securedByStripe")}
          </p>

          <button
            type="button"
            onClick={() => router.push("/student")}
            style={{ ...secondaryBtnStyle, marginTop: "12px" }}
            disabled={paying}
          >
            {t("student.payment.cancelDraft")}
          </button>
        </div>
      </div>
    </main>
  );
}

function Header({ onLogout, t }) {
  return (
    <header style={headerStyle}>
      <div>
        <h1 style={logoStyle}>UAAMS</h1>
        <p style={subtitleStyle}>University Administration & Application Management System</p>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
        <LanguageSwitcher />
        <button type="button" style={logoutBtnStyle} onClick={onLogout}>{t("nav.logout")}</button>
      </div>
    </header>
  );
}

const pageStyle = { minHeight: "100vh", background: "#F7F1E8", fontFamily: "Arial, Helvetica, sans-serif", color: "#071126" };
const frameStyle = { width: "100%", padding: "0 40px 60px", boxSizing: "border-box" };
const headerStyle = { height: "95px", width: "100vw", position: "relative", left: "50%", transform: "translateX(-50%)", background: "#fff", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 45px", margin: "0 0 40px", borderBottom: "2px solid #000" };
const logoStyle = { margin: 0, fontSize: "48px", fontWeight: "900", lineHeight: "50px" };
const subtitleStyle = { margin: "8px 0 0", fontSize: "16px" };
const logoutBtnStyle = { background: "#fff", border: "2px solid #3B2E5A", color: "#3B2E5A", height: "50px", padding: "0 24px", fontSize: "14px", fontWeight: "800", cursor: "pointer" };
const centreCardStyle = { maxWidth: "560px", margin: "0 auto", background: "#fff", border: "2px solid #000", padding: "48px", boxSizing: "border-box", textAlign: "center" };
const lockIconStyle = { fontSize: "40px", marginBottom: "16px" };
const summaryBoxStyle = { background: "#F7F1E8", border: "2px solid #000", padding: "24px", marginBottom: "28px", textAlign: "left" };
const summaryRowStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" };
const summaryLabelStyle = { fontSize: "12px", fontWeight: "900", color: "#555" };
const summaryValueStyle = { fontSize: "14px", fontWeight: "700", maxWidth: "280px", textAlign: "right" };
const feePriceStyle = { fontSize: "28px", fontWeight: "900", color: "#3B2E5A" };
const dividerStyle = { borderTop: "2px solid #000", margin: "14px 0" };
const primaryBtnStyle = { width: "100%", height: "58px", background: "#3B2E5A", color: "#fff", border: "none", fontSize: "15px", fontWeight: "900", cursor: "pointer" };
const secondaryBtnStyle = { width: "100%", height: "46px", background: "#fff", border: "2px solid #000", fontSize: "13px", fontWeight: "800", cursor: "pointer" };
const loadingStyle = { textAlign: "center", marginTop: "120px", fontSize: "28px", fontWeight: "800" };
