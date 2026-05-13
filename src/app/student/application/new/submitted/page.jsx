"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase";

const FORM_STORAGE_KEY = "uaams_new_application_form";
const SUBMISSION_STORAGE_KEY = "uaams_submitted_application_summary";

export default function ApplicationSubmittedPage() {
  const router = useRouter();

  const [summary, setSummary] = useState({
    applicationId: "",
    submittedOn: "",
    university: "",
    course: "",
  });

  useEffect(() => {
    const savedSummary = sessionStorage.getItem(SUBMISSION_STORAGE_KEY);

    if (savedSummary) {
      setSummary(JSON.parse(savedSummary));
      return;
    }

    const savedForm = sessionStorage.getItem(FORM_STORAGE_KEY);
    const formData = savedForm ? JSON.parse(savedForm) : {};

    const newSummary = {
      applicationId: generateApplicationId(),
      submittedOn: formatToday(),
      university:
        formData.selectedUniversity ||
        formData.university ||
        "Not provided",
      course:
        formData.courseName ||
        formData.course ||
        "Not provided",
    };

    sessionStorage.setItem(SUBMISSION_STORAGE_KEY, JSON.stringify(newSummary));
    setSummary(newSummary);
  }, []);

  const handleLogout = async () => {
    const auth = getFirebaseAuth();
    await signOut(auth);
    router.replace("/");
  };

  const handleStartNewApplication = () => {
    sessionStorage.removeItem(FORM_STORAGE_KEY);
    sessionStorage.removeItem("uaams_new_application_documents");
    sessionStorage.removeItem(SUBMISSION_STORAGE_KEY);

    router.push("/student/application/new");
  };

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

          <button type="button" style={logoutButtonStyle} onClick={handleLogout}>
            LOGOUT
          </button>
        </header>

        <section style={quickActionsStyle}>
          <h2 style={quickActionsTitleStyle}>QUICK ACTIONS</h2>

          <div style={quickButtonRowStyle}>
            <button
              type="button"
              style={quickButtonStyle}
              onClick={handleStartNewApplication}
            >
              START NEW APPLICATION
            </button>

            <button
              type="button"
              style={quickButtonStyle}
              onClick={() => router.push("/student")}
            >
              VIEW ALL APPLICATIONS
            </button>

            <button
              type="button"
              style={quickButtonStyle}
              onClick={() => router.push("/student")}
            >
              PROFILE
            </button>

            <button
              type="button"
              style={quickButtonStyle}
              onClick={() => router.push("/student/application/new/documents")}
            >
              UPLOAD DOCUMENTS
            </button>
          </div>
        </section>

        <section style={successCardStyle}>
          <div style={checkCircleStyle}>✓</div>

          <h2 style={successTitleStyle}>APPLICATION SUBMITTED SUCCESSFULLY</h2>

          <p style={successSubtitleStyle}>
            YOUR APPLICATION HAS BEEN RECEIVED AND IS NOW MARKED AS SUBMITTED
          </p>

          <div style={summaryBoxStyle}>
            <SummaryRow label="APPLICATION ID" value={summary.applicationId} />
            <SummaryRow label="SUBMITTED ON" value={summary.submittedOn} />
            <SummaryRow label="UNIVERSITY" value={summary.university} />
            <SummaryRow label="COURSE" value={summary.course} />
          </div>
        </section>

        <section style={nextBoxStyle}>
          <h3 style={nextTitleStyle}>WHAT HAPPENS NEXT</h3>

          <ul style={nextListStyle}>
            <li>YOUR APPLICATION WILL BE REVIEWED BY THE UNIVERSITY</li>
            <li>YOU WILL RECEIVE STATUS UPDATES IN YOUR DASHBOARD</li>
            <li>
              YOU MAY ALSO RECEIVE EMAIL NOTIFICATIONS ABOUT IMPORTANT CHANGES
            </li>
          </ul>

          <div style={noteBoxStyle}>
            <strong>NOTE:</strong> AVERAGE REVIEW TIME IS 2–4 WEEKS. YOU CAN
            TRACK YOUR APPLICATION PROGRESS AT ANY TIME FROM THE DASHBOARD OR
            APPLICATION DETAILS PAGE.
          </div>
        </section>

        <div style={bottomButtonWrapperStyle}>
          <button
            type="button"
            style={dashboardButtonStyle}
            onClick={() => router.push("/student")}
          >
            BACK TO DASHBOARD
          </button>
        </div>
      </div>
    </main>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div style={summaryRowStyle}>
      <span style={summaryLabelStyle}>{label}</span>
      <span style={summaryValueStyle}>{value || "Not provided"}</span>
    </div>
  );
}

function generateApplicationId() {
  const randomNumber = Math.floor(1000 + Math.random() * 9000);
  return `APP-${randomNumber}`;
}

function formatToday() {
  const today = new Date();

  return today.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

const pageStyle = {
  minHeight: "100vh",
  background: "#F7F1E8",
  padding: "6px",
  fontFamily: "Arial, Helvetica, sans-serif",
};

const frameStyle = {
  minHeight: "calc(100vh - 12px)",
  border: "1.5px solid #000",
  background: "#F7F1E8",
  padding: "0 110px 60px",
};

const headerStyle = {
  height: "72px",
  background: "#fff",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "0 28px",
  margin: "0 -110px 26px",
  borderBottom: "1px solid rgba(0,0,0,0.15)",
};

const logoStyle = {
  margin: 0,
  fontSize: "24px",
  fontWeight: "800",
  lineHeight: "24px",
};

const subtitleStyle = {
  margin: "2px 0 0",
  fontSize: "10px",
  lineHeight: "12px",
};

const logoutButtonStyle = {
  background: "#fff",
  border: "1.5px solid #3B2E5A",
  color: "#3B2E5A",
  padding: "8px 24px",
  fontSize: "11px",
  fontWeight: "700",
  cursor: "pointer",
};

const quickActionsStyle = {
  maxWidth: "900px",
  margin: "0 auto 24px",
  border: "1.5px solid #000",
  background: "#F7F1E8",
  padding: "14px 28px 22px",
  textAlign: "center",
};

const quickActionsTitleStyle = {
  margin: "0 0 10px",
  fontSize: "11px",
  fontWeight: "900",
};

const quickButtonRowStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(4, 1fr)",
  gap: "36px",
};

const quickButtonStyle = {
  height: "28px",
  background: "#fff",
  border: "1.5px solid #000",
  fontSize: "8px",
  fontWeight: "800",
  cursor: "pointer",
};

const successCardStyle = {
  width: "520px",
  margin: "0 auto 22px",
  border: "1.5px solid #000",
  background: "#fff",
  padding: "18px 36px 16px",
  textAlign: "center",
};

const checkCircleStyle = {
  width: "42px",
  height: "42px",
  margin: "0 auto 8px",
  border: "2px solid #000",
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "28px",
  fontWeight: "800",
};

const successTitleStyle = {
  margin: "0 0 3px",
  fontSize: "15px",
  fontWeight: "900",
};

const successSubtitleStyle = {
  margin: "0 0 12px",
  fontSize: "8px",
  fontWeight: "700",
};

const summaryBoxStyle = {
  width: "330px",
  margin: "0 auto",
  border: "1.5px solid #000",
  background: "#F7F1E8",
  padding: "8px 14px",
  textAlign: "left",
};

const summaryRowStyle = {
  display: "grid",
  gridTemplateColumns: "120px 1fr",
  gap: "20px",
  marginBottom: "7px",
  fontSize: "8px",
};

const summaryLabelStyle = {
  fontWeight: "900",
};

const summaryValueStyle = {
  fontWeight: "700",
};

const nextBoxStyle = {
  width: "520px",
  margin: "0 auto 18px",
  border: "1.5px solid #000",
  background: "#fff",
  padding: "18px 36px",
};

const nextTitleStyle = {
  margin: "0 auto 12px",
  paddingBottom: "5px",
  width: "260px",
  textAlign: "center",
  borderBottom: "1.5px solid #000",
  fontSize: "9px",
  fontWeight: "900",
};

const nextListStyle = {
  margin: "0 0 14px",
  paddingLeft: "16px",
  fontSize: "8px",
  fontWeight: "700",
  lineHeight: "14px",
};

const noteBoxStyle = {
  background: "#F7F1E8",
  padding: "10px 12px",
  fontSize: "8px",
  fontWeight: "700",
  lineHeight: "13px",
};

const bottomButtonWrapperStyle = {
  textAlign: "center",
};

const dashboardButtonStyle = {
  width: "160px",
  height: "28px",
  background: "#3B2E5A",
  color: "#fff",
  border: "1.5px solid #3B2E5A",
  fontSize: "8px",
  fontWeight: "800",
  cursor: "pointer",
};