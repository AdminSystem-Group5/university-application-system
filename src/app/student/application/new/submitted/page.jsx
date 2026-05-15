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
  width: "100%",
  background: "#F7F1E8",
  padding: "0",
  fontFamily: "Arial, Helvetica, sans-serif",
  boxSizing: "border-box",
};

const frameStyle = {
  minHeight: "calc(100vh - 20px)",
  width: "100%",

  background: "#F7F1E8",
  display: "flex",
  flexDirection: "column",
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
  fontSize: "42px",
  fontWeight: "900",
  lineHeight: "42px",
};

const subtitleStyle = {
  margin: "6px 0 0",
  fontSize: "16px",
  lineHeight: "20px",
};

const logoutButtonStyle = {
  background: "#fff",
  border: "2px solid #3B2E5A",
  color: "#3B2E5A",
  padding: "14px 36px",
  fontSize: "16px",
  fontWeight: "800",
  cursor: "pointer",
};

const quickActionsStyle = {
  width: "100%",
  maxWidth: "1700px",
  margin: "0 auto 40px",
  border: "2px solid #000",
  background: "#F7F1E8",
  padding: "34px 40px 40px",
  textAlign: "center",
  boxSizing: "border-box",
};

const quickActionsTitleStyle = {
  margin: "0 0 24px",
  fontSize: "24px",
  fontWeight: "900",
};

const quickButtonRowStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(4, 1fr)",
  gap: "32px",
  width: "100%",
};

const quickButtonStyle = {
  height: "68px",
  background: "#fff",
  border: "2px solid #000",
  fontSize: "16px",
  fontWeight: "900",
  cursor: "pointer",
};

const successCardStyle = {
  width: "100%",
  maxWidth: "1700px",
  margin: "0 auto 40px",
  border: "2px solid #000",
  background: "#fff",
  padding: "40px 50px",
  textAlign: "center",
  boxSizing: "border-box",
};

const checkCircleStyle = {
  width: "90px",
  height: "90px",
  margin: "0 auto 20px",
  border: "3px solid #000",
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "50px",
  fontWeight: "900",
};

const successTitleStyle = {
  margin: "0 0 12px",
  fontSize: "34px",
  fontWeight: "900",
};

const successSubtitleStyle = {
  margin: "0 0 30px",
  fontSize: "18px",
  fontWeight: "700",
};

const summaryBoxStyle = {
  width: "100%",
  maxWidth: "1000px",
  margin: "0 auto",
  border: "2px solid #000",
  background: "#F7F1E8",
  padding: "24px 30px",
  textAlign: "left",
  boxSizing: "border-box",
};

const summaryRowStyle = {
  display: "grid",
  gridTemplateColumns: "240px 1fr",
  gap: "30px",
  marginBottom: "18px",
  fontSize: "16px",
};

const summaryLabelStyle = {
  fontWeight: "900",
};

const summaryValueStyle = {
  fontWeight: "700",
};

const nextBoxStyle = {
  width: "100%",
  maxWidth: "1700px",
  margin: "0 auto 34px",
  border: "2px solid #000",
  background: "#fff",
  padding: "40px 50px",
  boxSizing: "border-box",
};

const nextTitleStyle = {
  margin: "0 auto 26px",
  paddingBottom: "10px",
  width: "420px",
  textAlign: "center",
  borderBottom: "2px solid #000",
  fontSize: "20px",
  fontWeight: "900",
};

const nextListStyle = {
  margin: "0 0 28px",
  paddingLeft: "28px",
  fontSize: "16px",
  fontWeight: "700",
  lineHeight: "32px",
};

const noteBoxStyle = {
  background: "#F7F1E8",
  padding: "22px 24px",
  fontSize: "15px",
  fontWeight: "700",
  lineHeight: "28px",
};

const bottomButtonWrapperStyle = {
  textAlign: "center",
  marginBottom: "40px",
};

const dashboardButtonStyle = {
  width: "320px",
  height: "70px",
  background: "#3B2E5A",
  color: "#fff",
  border: "2px solid #3B2E5A",
  fontSize: "18px",
  fontWeight: "900",
  cursor: "pointer",
};