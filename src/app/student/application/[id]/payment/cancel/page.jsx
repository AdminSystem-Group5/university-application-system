// payment cancelled page
"use client";

import { useRouter, useParams } from "next/navigation";
import { useLanguage } from "@/lib/context/language-context";

export default function PaymentCancelPage() {
  const router = useRouter();
  const params = useParams();
  const applicationId = params?.id;
  const { t } = useLanguage();

  return (
    <main style={pageStyle}>
      <div style={frameStyle}>
        <header style={headerStyle}>
          <div>
            <h1 style={logoStyle}>UAAMS</h1>
            <p style={subtitleStyle}>University Administration & Application Management System</p>
          </div>
        </header>

        <div style={centreCardStyle}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>✕</div>

          <h1 style={{ margin: "0 0 8px", fontSize: "24px", fontWeight: "900" }}>{t("student.paymentCancel.title")}</h1>

          <p style={{ margin: "0 0 8px", color: "#555", fontSize: "15px" }}>
            {t("student.paymentCancel.desc")}
          </p>

          <p style={{ margin: "0 0 32px", color: "#555", fontSize: "14px" }}>
            {t("student.paymentCancel.savedAsDraft")}
          </p>

          <button
            type="button"
            style={primaryBtnStyle}
            onClick={() => router.push(`/student/application/${applicationId}/payment`)}
          >
            {t("student.paymentCancel.tryAgain")}
          </button>

          <button
            type="button"
            style={{ ...secondaryBtnStyle, marginTop: "12px" }}
            onClick={() => router.push("/student")}
          >
            {t("student.payment.backToDashboard")}
          </button>
        </div>
      </div>
    </main>
  );
}

const pageStyle = { minHeight: "100vh", background: "#F7F1E8", fontFamily: "Arial, Helvetica, sans-serif", color: "#071126" };
const frameStyle = { width: "100%", padding: "0 40px 60px", boxSizing: "border-box" };
const headerStyle = { height: "95px", width: "100vw", position: "relative", left: "50%", transform: "translateX(-50%)", background: "#fff", display: "flex", alignItems: "center", padding: "0 45px", margin: "0 0 40px", borderBottom: "2px solid #000" };
const logoStyle = { margin: 0, fontSize: "48px", fontWeight: "900", lineHeight: "50px" };
const subtitleStyle = { margin: "8px 0 0", fontSize: "16px" };
const centreCardStyle = { maxWidth: "480px", margin: "0 auto", background: "#fff", border: "2px solid #000", padding: "48px", boxSizing: "border-box", textAlign: "center" };
const primaryBtnStyle = { width: "100%", height: "54px", background: "#3B2E5A", color: "#fff", border: "none", fontSize: "14px", fontWeight: "900", cursor: "pointer" };
const secondaryBtnStyle = { width: "100%", height: "46px", background: "#fff", border: "2px solid #000", fontSize: "13px", fontWeight: "800", cursor: "pointer" };
