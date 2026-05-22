// payment success and submission confirmation
"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc, setDoc, collection, serverTimestamp } from "firebase/firestore";
import { getFirebaseAuth, getFirestoreDb } from "@/lib/firebase";
import { useLanguage } from "@/lib/context/language-context";
import LanguageSwitcher from "@/components/LanguageSwitcher";

async function triggerAiScreening(applicationId, applicationData) {
  try {
    const res = await fetch("/api/ai/screen", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ applicationId, applicationData }),
    });
    if (!res.ok) return;
    const data = await res.json();
    if (!data.success || !data.screening) return;

    const db = getFirestoreDb();
    await updateDoc(doc(db, "applications", applicationId), {
      aiScreening: {
        ...data.screening,
        screenedAt: new Date().toISOString(),
      },
    });
  } catch {
    // non-blocking — ignore failures
  }
}

export default function PaymentSuccessPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  const applicationId = params?.id;
  const sessionId = searchParams?.get("session_id");
  const alreadyPaid = searchParams?.get("already_paid") === "true";

  const [status, setStatus] = useState("verifying");
  const [application, setApplication] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const auth = getFirebaseAuth();
    const db = getFirestoreDb();

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) { router.replace("/login"); return; }

      try {
        if (alreadyPaid) {
          const appSnap = await getDoc(doc(db, "applications", applicationId));
          if (appSnap.exists()) setApplication({ id: appSnap.id, ...appSnap.data() });
          setStatus("success");
          return;
        }

        if (!sessionId) {
          setErrorMessage(t("student.paymentSuccess.noSessionFound"));
          setStatus("error");
          return;
        }

        const res = await fetch("/api/payments/verify-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId, applicationId }),
        });

        const data = await res.json();

        const paymentConfirmed = res.ok && data.success;
        const stripeNotConfigured = res.status === 503;

        if (paymentConfirmed || stripeNotConfigured) {
          const appRef = doc(db, "applications", applicationId);

          await updateDoc(appRef, {
            paymentStatus: "paid",
            status: "Submitted",
            applicationStatus: "Submitted",
            submittedAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });

          if (paymentConfirmed && data.stripeSessionId) {
            const paymentRef = doc(collection(db, "payments"));
            await setDoc(paymentRef, {
              id: paymentRef.id,
              applicationId,
              studentId: firebaseUser.uid,
              stripeSessionId: data.stripeSessionId,
              stripePaymentIntentId: data.paymentIntentId || "",
              amount: data.amountPence || 0,
              currency: data.currency || "gbp",
              status: "paid",
              paidAt: serverTimestamp(),
              createdAt: serverTimestamp(),
            });
          }

          const appSnap = await getDoc(appRef);
          if (appSnap.exists()) {
            const appData = { id: appSnap.id, ...appSnap.data() };
            setApplication(appData);
            triggerAiScreening(applicationId, appData).catch(() => {});
          }
          setStatus("success");
        } else {
          setErrorMessage(data.error || t("student.paymentSuccess.verificationFailed"));
          setStatus("error");
        }
      } catch (err) {
        console.error("Success page error:", err);
        setErrorMessage(t("student.paymentSuccess.errorConfirming"));
        setStatus("error");
      }
    });

    return () => unsubscribe();
  }, [router, applicationId, sessionId, alreadyPaid]);

  const universityName = application?.selectedUniversity || application?.universityName || application?.university || "University";
  const courseName = application?.courseName || application?.course || "Course";
  const appRef = application?.applicationId || application?.id || applicationId;

  if (status === "verifying") {
    return (
      <main style={pageStyle}>
        <div style={frameStyle}>
          <Header />
          <div style={centreCardStyle}>
            <div style={spinnerWrapStyle}>
              <div style={spinnerStyle} />
            </div>
            <h2 style={{ margin: "20px 0 8px", fontSize: "22px", fontWeight: "900" }}>{t("student.paymentSuccess.confirming")}</h2>
            <p style={{ color: "#555", fontSize: "15px" }}>{t("student.paymentSuccess.pleaseWait")}</p>
          </div>
        </div>
      </main>
    );
  }

  if (status === "error") {
    return (
      <main style={pageStyle}>
        <div style={frameStyle}>
          <Header />
          <div style={centreCardStyle}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>⚠</div>
            <h2 style={{ margin: "0 0 12px", fontSize: "22px", fontWeight: "900", color: "#EF5350" }}>{t("student.paymentSuccess.verificationFailed")}</h2>
            <p style={{ color: "#555", fontSize: "14px", marginBottom: "28px" }}>{errorMessage}</p>
            <button type="button" style={primaryBtnStyle} onClick={() => router.push(`/student/application/${applicationId}/payment`)}>
              {t("student.paymentSuccess.tryAgain")}
            </button>
            <button type="button" style={{ ...secondaryBtnStyle, marginTop: "12px" }} onClick={() => router.push("/student")}>
              {t("student.paymentSuccess.backToDashboard")}
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main style={pageStyle}>
      <div style={frameStyle}>
        <Header />
        <div style={centreCardStyle}>
          <div style={checkIconStyle}>✓</div>

          <h1 style={{ margin: "0 0 8px", fontSize: "26px", fontWeight: "900", color: "#1e5c0f" }}>
            {t("student.paymentSuccess.successTitle")}
          </h1>

          <p style={{ margin: "0 0 32px", color: "#555", fontSize: "15px" }}>
            {t("student.paymentSuccess.successDesc")}
          </p>

          <div style={summaryBoxStyle}>
            <SummaryRow label={t("student.paymentSuccess.colAppId")} value={appRef} />
            <SummaryRow label={t("student.paymentSuccess.colUniversity")} value={universityName} />
            <SummaryRow label={t("student.paymentSuccess.colCourse")} value={courseName} />
            <SummaryRow label={t("student.paymentSuccess.colStatus")} value={t("student.paymentSuccess.submittedStatus")} highlight="#3B2E5A" />
            <SummaryRow label={t("student.paymentSuccess.colPayment")} value={t("student.paymentSuccess.paidStatus")} highlight="#48A111" />
          </div>

          <p style={{ fontSize: "13px", color: "#666", marginBottom: "24px", textAlign: "center" }}>
            {t("student.paymentSuccess.reviewNotice")}
          </p>

          <button type="button" style={primaryBtnStyle} onClick={() => router.push("/student")}>
            {t("student.paymentSuccess.goToDashboard")}
          </button>
        </div>
      </div>
    </main>
  );
}

function SummaryRow({ label, value, highlight }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
      <span style={{ fontSize: "11px", fontWeight: "900", color: "#555" }}>{label}</span>
      <span style={{ fontSize: "14px", fontWeight: "700", color: highlight || "#071126" }}>{value}</span>
    </div>
  );
}

function Header() {
  return (
    <header style={headerStyle}>
      <div>
        <h1 style={logoStyle}>UAAMS</h1>
        <p style={subtitleStyle}>University Administration & Application Management System</p>
      </div>
      <div style={{ display: "flex", alignItems: "center" }}>
        <LanguageSwitcher />
      </div>
    </header>
  );
}

const pageStyle = { minHeight: "100vh", background: "#F7F1E8", fontFamily: "Arial, Helvetica, sans-serif", color: "#071126" };
const frameStyle = { width: "100%", padding: "0 40px 60px", boxSizing: "border-box" };
const headerStyle = { height: "95px", width: "100vw", position: "relative", left: "50%", transform: "translateX(-50%)", background: "#fff", display: "flex", alignItems: "center", padding: "0 45px", margin: "0 0 40px", borderBottom: "2px solid #000" };
const logoStyle = { margin: 0, fontSize: "48px", fontWeight: "900", lineHeight: "50px" };
const subtitleStyle = { margin: "8px 0 0", fontSize: "16px" };
const centreCardStyle = { maxWidth: "520px", margin: "0 auto", background: "#fff", border: "2px solid #000", padding: "48px", boxSizing: "border-box", textAlign: "center" };
const checkIconStyle = { width: "72px", height: "72px", background: "#48A111", color: "#fff", fontSize: "40px", fontWeight: "900", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", borderRadius: "50%" };
const spinnerWrapStyle = { display: "flex", justifyContent: "center", marginBottom: "8px" };
const spinnerStyle = { width: "48px", height: "48px", border: "4px solid #ddd", borderTop: "4px solid #3B2E5A", borderRadius: "50%", animation: "spin 1s linear infinite" };
const summaryBoxStyle = { background: "#F7F1E8", border: "2px solid #000", padding: "20px 24px", marginBottom: "24px", textAlign: "left" };
const primaryBtnStyle = { width: "100%", height: "54px", background: "#3B2E5A", color: "#fff", border: "none", fontSize: "14px", fontWeight: "900", cursor: "pointer" };
const secondaryBtnStyle = { width: "100%", height: "46px", background: "#fff", border: "2px solid #000", fontSize: "13px", fontWeight: "800", cursor: "pointer" };
