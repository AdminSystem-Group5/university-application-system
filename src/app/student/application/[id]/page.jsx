// student application detail view
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

import { getFirebaseAuth, getFirestoreDb } from "@/lib/firebase";
import { useLanguage } from "@/lib/context/language-context";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export default function ApplicationDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { t } = useLanguage();

  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const applicationDocumentId = params?.id;

  useEffect(() => {
    const auth = getFirebaseAuth();
    const db = getFirestoreDb();

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        router.replace("/");
        return;
      }

      if (!applicationDocumentId) {
        setErrorMessage("Application ID not found.");
        setLoading(false);
        return;
      }

      try {
        const userRef = doc(db, "users", firebaseUser.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          setErrorMessage("Student profile not found.");
          setLoading(false);
          return;
        }

        const applicationRef = doc(db, "applications", applicationDocumentId);
        const applicationSnap = await getDoc(applicationRef);

        if (!applicationSnap.exists()) {
          setErrorMessage("Application not found.");
          setLoading(false);
          return;
        }

        const applicationData = applicationSnap.data();

        // Load document status from studentDocuments collection (saved by documents page)
        const studentDocsSnap = await getDoc(doc(db, "studentDocuments", firebaseUser.uid));
        if (studentDocsSnap.exists()) {
          const savedDocs = studentDocsSnap.data()?.documents || {};
          applicationData._studentDocuments = savedDocs;
        }

        const belongsToStudent =
          applicationData?.studentId === firebaseUser.uid ||
          applicationData?.studentUid === firebaseUser.uid ||
          applicationData?.userId === firebaseUser.uid ||
          applicationData?.createdBy === firebaseUser.uid ||
          applicationData?.studentEmail === firebaseUser.email ||
          applicationData?.email === firebaseUser.email;

        if (!belongsToStudent) {
          setErrorMessage("You do not have permission to view this application.");
          setLoading(false);
          return;
        }

        setApplication(normaliseApplication(applicationSnap.id, applicationData));
        setLoading(false);
      } catch (error) {
        console.error("Application details error:", error);
        setErrorMessage("Unable to load application details.");
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [applicationDocumentId, router]);

  const handleLogout = async () => {
    const auth = getFirebaseAuth();
    await signOut(auth);
    router.replace("/");
  };

  if (loading) {
    return (
      <main style={pageStyle}>
        <div style={frameStyle}>
          <h1 style={loadingTextStyle}>{t("student.application.loading")}</h1>
        </div>
      </main>
    );
  }

  if (errorMessage) {
    return (
      <main style={pageStyle}>
        <div style={frameStyle}>
          <Header onLogout={handleLogout} />

          <section style={titleBarStyle}>
            <button
              type="button"
              style={backDashboardButtonStyle}
              onClick={() => router.push("/student")}
            >
              {t("student.application.backToDashboard")}
            </button>

            <h2 style={pageTitleStyle}>{t("student.application.applicationDetails")}</h2>
          </section>

          <div style={errorBoxStyle}>
            <p style={errorTextStyle}>{errorMessage}</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main style={pageStyle}>
      <div style={frameStyle}>
        <Header onLogout={handleLogout} />

        <section style={titleBarStyle}>
          <button
            type="button"
            style={backDashboardButtonStyle}
            onClick={() => router.push("/student")}
          >
            {t("student.application.backToDashboard")}
          </button>

          <h2 style={pageTitleStyle}>{t("student.application.applicationDetails")}</h2>
        </section>

        <section style={summaryRowStyle}>
          <SummaryItem label={t("student.application.colAppId")} value={application.applicationId} />
          <SummaryItem label={t("student.application.colUniversity")} value={application.university} />
          <SummaryItem label={t("student.application.colCourse")} value={application.course} />
          <SummaryItem label={t("student.application.colIntake")} value={application.intake} />
          <SummaryItem label={t("student.application.colSubmitted")} value={application.submittedOn} />
          <SummaryItem label={t("student.application.colStatus")} value={application.status} />
        </section>

        {/* Show submit/pay banner for any Draft application that hasn't been paid yet.
            Agent-created drafts have no paymentStatus field, so we check status === "Draft". */}
        {application.paymentStatus !== "paid" && application.status?.toLowerCase() === "draft" && (
          <section style={{ maxWidth: "1400px", margin: "0 auto 24px", padding: "16px 24px", background: "#fff", border: "2px solid #EF5350", display: "flex", alignItems: "center", justifyContent: "space-between", boxSizing: "border-box" }}>
            <div>
              <strong style={{ fontSize: "15px", color: "#EF5350" }}>{t("student.application.feeRequired")}</strong>
              <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#555" }}>{t("student.application.feeDesc")}</p>
            </div>
            <button
              type="button"
              onClick={() => router.push(`/student/application/${applicationDocumentId}/payment`)}
              style={{ background: "#3B2E5A", color: "#fff", border: "none", padding: "12px 24px", fontSize: "13px", fontWeight: "900", cursor: "pointer", whiteSpace: "nowrap" }}
            >
              {t("student.application.payNow")}
            </button>
          </section>
        )}

        <section style={progressBoxStyle}>
          <p style={progressTitleStyle}>{t("student.application.progressTitle")}</p>

          <div style={progressLineWrapperStyle}>
            {application.progressSteps.map((step, index) => (
              <div key={step.label} style={progressStepStyle}>
                <div style={checkboxStyle(step.completed)}>
                  {step.completed ? "✓" : ""}
                </div>

                {index < application.progressSteps.length - 1 && (
                  <div style={progressLineStyle}></div>
                )}

                <span style={progressLabelStyle}>{step.label}</span>
              </div>
            ))}
          </div>
        </section>

        <DetailsSection title={t("student.application.personalInfo")}>
          <DetailsLine label={t("student.application.fullName")} value={application.fullName} />
          <DetailsLine label={t("student.application.dateOfBirth")} value={application.dateOfBirth} />
          <DetailsLine label={t("student.application.nationality")} value={application.nationality} />
          <DetailsLine
            label={t("student.application.passportNumber")}
            value={application.passportNumber}
          />
        </DetailsSection>

        <DetailsSection title={t("student.application.academicInfo")}>
          <DetailsLine
            label={t("student.application.highestQualification")}
            value={application.highestQualification}
          />
          <DetailsLine
            label={t("student.application.institutionName")}
            value={application.institutionName}
          />
          <DetailsLine
            label={t("student.application.graduationYear")}
            value={application.graduationYear}
          />
          <DetailsLine label={t("student.application.gpaGrade")} value={application.gpaGrade} />
        </DetailsSection>

        <DetailsSection title={t("student.application.courseInfo")}>
          <DetailsLine
            label={t("student.application.selectedUniversity")}
            value={application.university}
          />
          <DetailsLine label={t("student.application.courseName")} value={application.course} />
          <DetailsLine label={t("student.application.intendedIntake")} value={application.intake} />
        </DetailsSection>

        <DetailsSection title={t("student.application.uploadedDocs")}>
          <DocumentItem
            title={t("student.application.passportCopy")}
            documentData={application.documents.passport}
            t={t}
          />

          <DocumentItem
            title={t("student.application.academicTranscript")}
            documentData={application.documents.transcript}
            t={t}
          />

          <DocumentItem
            title={t("student.application.certificates")}
            documentData={application.documents.certificates}
            t={t}
          />

          <DocumentItem
            title={t("student.application.englishTest")}
            documentData={application.documents.englishTest}
            t={t}
          />
        </DetailsSection>

        <section style={noteBoxStyle}>
          <strong>{t("student.application.note")}</strong> {t("student.application.noteText")}
        </section>


      </div>
    </main>
  );
}

function Header({ onLogout }) {
  const { t } = useLanguage();
  return (
    <header style={headerStyle}>
      <div>
        <h1 style={logoStyle}>UAAMS</h1>

        <p style={subtitleStyle}>
          University Administration & Application
          <br />
          Management System
        </p>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <LanguageSwitcher />
        <button
          type="button"
          style={logoutButtonStyle}
          onClick={onLogout}
        >
          {t("nav.logout")}
        </button>
      </div>
    </header>
  );
}

function SummaryItem({ label, value }) {
  return (
    <div style={summaryItemStyle}>
      <p style={summaryLabelStyle}>{label}</p>
      <p style={summaryValueStyle}>{value || "Not provided"}</p>
    </div>
  );
}

function DetailsSection({ title, children }) {
  return (
    <section style={detailsBoxStyle}>
      <h3 style={detailsTitleStyle}>{title}</h3>
      <div style={detailsContentStyle}>{children}</div>
    </section>
  );
}

function DetailsLine({ label, value }) {
  return (
    <div style={detailsLineStyle}>
      <strong style={detailsLabelStyle}>{label}</strong>
      <span style={detailsValueStyle}>{value || "Not provided"}</span>
    </div>
  );
}

function DocumentItem({ title, documentData, t }) {
  // Support both old {name} format and new {provided} checklist format
  const ready = Boolean(documentData?.provided || documentData?.name || documentData?.url);
  const label = documentData?.name || (documentData?.provided ? "Marked as ready" : null);

  return (
    <div style={documentItemStyle}>
      <div style={documentIconStyle}>▣</div>

      <div style={documentTextStyle}>
        <p style={documentTitleStyle}>{title}</p>
        <p style={documentNameStyle}>
          {label || t("student.application.noFile")}
        </p>
      </div>

      <span style={documentCheckStyle}>{ready ? "✓" : ""}</span>

      <strong style={ready ? uploadedTextStyle : notUploadedTextStyle}>
        {ready ? t("student.application.uploaded") : t("student.application.notUploaded")}
      </strong>
    </div>
  );
}



function normaliseApplication(documentId, data) {
  const status =
    data?.applicationStatus ||
    data?.status ||
    data?.pendingDecision ||
    "Submitted";

  return {
    documentId,

    applicationId:
      data?.applicationId ||
      data?.appId ||
      data?.referenceNumber ||
      documentId,

    university: formatDisplayValue(
      data?.selectedUniversity ||
        data?.university ||
        data?.universityName ||
        data?.institutionName
    ),

    course: formatDisplayValue(
      data?.courseName || data?.courseInfo?.courseName ||
        data?.course || data?.selectedCourse || data?.programmeName
    ),

    intake: formatDisplayValue(
      data?.intendedIntake || data?.courseInfo?.intendedStartDate ||
        data?.intake || data?.startDate || data?.intakeDate
    ),

    submittedOn: formatDate(
      data?.submittedAt ||
        data?.submittedOn ||
        data?.createdAt ||
        data?.updatedAt
    ),

    status: formatDisplayValue(status),

    fullName: formatDisplayValue(
      data?.fullName || data?.studentName || data?.displayName ||
      ((data?.personalInfo?.firstName || data?.personalInfo?.lastName)
        ? `${data.personalInfo.firstName || ""} ${data.personalInfo.lastName || ""}`.trim()
        : null)
    ),

    dateOfBirth: formatDisplayValue(
      data?.dateOfBirth || data?.dob || data?.personalInfo?.dateOfBirth
    ),

    nationality: formatDisplayValue(
      data?.nationality || data?.personalInfo?.nationality
    ),

    passportNumber: formatDisplayValue(
      data?.passportNumber || data?.personalInfo?.passportNumber
    ),

    highestQualification: formatDisplayValue(
      data?.highestQualification || data?.academicInfo?.highestQualification
    ),

    institutionName: formatDisplayValue(
      data?.institutionName || data?.academicInfo?.institutionName
    ),

    graduationYear: formatDisplayValue(
      data?.graduationYear || data?.academicInfo?.graduationYear
    ),

    gpaGrade: formatDisplayValue(
      data?.gpaGrade || data?.grade || data?.gpa || data?.academicInfo?.gpaGrade
    ),

    documents: normaliseDocuments(data),

    progressSteps: getProgressSteps(status),

    paymentStatus: data?.paymentStatus || null,

    id: documentId,
  };
}

function normaliseDocuments(data) {
  const documents = data?.documents || {};
  const saved = data?._studentDocuments || {};

  function resolve(key, ...fallbacks) {
    // Check studentDocuments collection first (new checklist format)
    if (saved[key]) return saved[key];
    // Then check application document fields
    for (const f of fallbacks) {
      if (f) return f;
    }
    return null;
  }

  return {
    passport:     resolve("passport",     documents?.passport, data?.passport, data?.passportCopy),
    transcript:   resolve("transcript",   documents?.transcript, documents?.academicTranscripts, data?.transcript),
    certificates: resolve("certificates", documents?.certificates, data?.certificates),
    englishTest:  resolve("englishTest",  documents?.englishTest, documents?.englishLanguageTest, data?.englishTest),
  };
}

function getProgressSteps(status) {
  const normalisedStatus = normaliseStatus(status);

  const submittedStatuses = [
    "submitted",
    "under review",
    "more info required",
    "offered",
    "approved",
    "accepted",
    "rejected",
  ];

  const underReviewStatuses = [
    "under review",
    "more info required",
    "offered",
    "approved",
    "accepted",
    "rejected",
  ];

  const acceptanceStatuses = ["offered", "approved", "accepted"];

  return [
    {
      label: "DRAFT",
      completed: true,
    },
    {
      label: "SUBMITTED",
      completed: submittedStatuses.includes(normalisedStatus),
    },
    {
      label: "UNDER REVIEW",
      completed: underReviewStatuses.includes(normalisedStatus),
    },
    {
      label: "ACCEPTANCE",
      completed: acceptanceStatuses.includes(normalisedStatus),
    },
  ];
}

function normaliseStatus(status) {
  return String(status || "")
    .trim()
    .toLowerCase()
    .replaceAll("_", " ")
    .replaceAll("-", " ");
}

function formatDisplayValue(value) {
  if (!value) return "Not provided";

  if (value?.toDate) {
    return value.toDate().toLocaleDateString("en-GB");
  }

  return String(value);
}

function formatDate(value) {
  if (!value) return "Not provided";

  if (typeof value === "string") {
    return value;
  }

  if (value?.toDate) {
    return value.toDate().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  const dateValue = new Date(value);

  if (Number.isNaN(dateValue.getTime())) {
    return "Not provided";
  }

  return dateValue.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
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
  minHeight: "100vh",
  width: "100%",
  background: "#F7F1E8",
  padding: "0 36px 50px",
  boxSizing: "border-box",
};

const headerStyle = {
  minHeight: "96px",
  width: "100vw",
  position: "relative",
  left: "50%",
  transform: "translateX(-50%)",
  background: "#fff",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "0 54px",
  margin: "0 0 28px",
  borderBottom: "2px solid #000",
  boxSizing: "border-box",
};

const logoStyle = {
  margin: 0,
  fontSize: "42px",
  fontWeight: "900",
  lineHeight: "42px",
};

const subtitleStyle = {
  margin: "5px 0 0",
  fontSize: "14px",
  lineHeight: "18px",
};

const logoutButtonStyle = {
  background: "#fff",
  border: "2px solid #3B2E5A",
  color: "#3B2E5A",
  padding: "12px 32px",
  fontSize: "14px",
  fontWeight: "800",
  cursor: "pointer",
};

const titleBarStyle = {
  width: "100%",
  maxWidth: "1600px",
  minHeight: "78px",
  margin: "0 auto 26px",
  border: "2px solid #000",
  display: "grid",
  gridTemplateColumns: "280px 1fr 280px",
  alignItems: "center",
  background: "#fff",
  boxSizing: "border-box",
};

const backDashboardButtonStyle = {
  marginLeft: "26px",
  width: "205px",
  height: "44px",
  background: "#3B2E5A",
  color: "#fff",
  border: "none",
  fontSize: "13px",
  fontWeight: "800",
  cursor: "pointer",
};

const pageTitleStyle = {
  margin: 0,
  fontSize: "26px",
  fontWeight: "900",
  textAlign: "center",
};

const summaryRowStyle = {
  width: "100%",
  maxWidth: "1600px",
  margin: "0 auto 22px",
  border: "2px solid #000",
  background: "#fff",
  padding: "18px 24px",
  display: "grid",
  gridTemplateColumns: "repeat(6, 1fr)",
  gap: "18px",
  boxSizing: "border-box",
};

const summaryItemStyle = {
  minWidth: 0,
};

const summaryLabelStyle = {
  margin: "0 0 8px",
  fontSize: "12px",
  fontWeight: "900",
};

const summaryValueStyle = {
  margin: 0,
  fontSize: "14px",
  fontWeight: "700",
  textTransform: "uppercase",
};

const progressBoxStyle = {
  width: "100%",
  maxWidth: "1600px",
  margin: "0 auto 22px",
  border: "2px solid #000",
  background: "#fff",
  padding: "26px 34px 34px",
  boxSizing: "border-box",
};

const progressTitleStyle = {
  margin: "0 0 16px",
  fontSize: "14px",
  fontWeight: "900",
};

const progressLineWrapperStyle = {
  display: "flex",
  alignItems: "center",
  width: "100%",
};

const progressStepStyle = {
  display: "flex",
  alignItems: "center",
  position: "relative",
};

const checkboxStyle = (completed) => ({
  width: "24px",
  height: "24px",
  background: completed ? "#3B2E5A" : "#fff",
  color: "#fff",
  border: "2px solid #3B2E5A",
  fontSize: "14px",
  fontWeight: "900",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
});

const progressLineStyle = {
  width: "260px",
  borderTop: "2px solid #000",
};

const progressLabelStyle = {
  position: "absolute",
  top: "32px",
  left: "-30px",
  width: "120px",
  fontSize: "11px",
  fontWeight: "800",
  textAlign: "center",
};

const detailsBoxStyle = {
  width: "100%",
  maxWidth: "1600px",
  margin: "0 auto 22px",
  border: "2px solid #000",
  background: "#fff",
  padding: "26px 34px",
  boxSizing: "border-box",
};

const detailsTitleStyle = {
  margin: "0 0 14px",
  fontSize: "16px",
  fontWeight: "900",
};

const detailsContentStyle = {
  borderTop: "2px solid #000",
  paddingTop: "18px",
};

const detailsLineStyle = {
  display: "grid",
  gridTemplateColumns: "340px 1fr",
  marginBottom: "14px",
};

const detailsLabelStyle = {
  fontSize: "13px",
  fontWeight: "900",
};

const detailsValueStyle = {
  fontSize: "13px",
  fontWeight: "700",
  textTransform: "uppercase",
};

const documentItemStyle = {
  width: "100%",
  minHeight: "72px",
  border: "2px solid #000",
  background: "#F7F1E8",
  display: "grid",
  gridTemplateColumns: "50px 1fr 40px 140px",
  alignItems: "center",
  padding: "0 20px",
  marginBottom: "16px",
  boxSizing: "border-box",
};

const documentIconStyle = {
  fontSize: "22px",
};

const documentTextStyle = {
  minWidth: 0,
};

const documentTitleStyle = {
  margin: 0,
  fontSize: "13px",
  fontWeight: "900",
};

const documentNameStyle = {
  margin: "4px 0 0",
  fontSize: "13px",
  fontWeight: "700",
  textTransform: "uppercase",
};

const documentCheckStyle = {
  fontSize: "18px",
  fontWeight: "900",
};

const uploadedTextStyle = {
  fontSize: "12px",
  fontWeight: "800",
};

const notUploadedTextStyle = {
  fontSize: "12px",
  fontWeight: "800",
  color: "red",
};

const noteBoxStyle = {
  width: "100%",
  maxWidth: "1600px",
  margin: "22px auto 0",
  border: "2px solid #000",
  background: "#fff",
  padding: "22px 30px",
  fontSize: "13px",
  fontWeight: "700",
  boxSizing: "border-box",
};

const loadingTextStyle = {
  padding: "80px",
  fontSize: "30px",
  fontWeight: "900",
};

const errorBoxStyle = {
  width: "100%",
  maxWidth: "1600px",
  margin: "20px auto",
  border: "2px solid #000",
  background: "#fff",
  padding: "30px",
  boxSizing: "border-box",
};

const errorTextStyle = {
  color: "red",
  fontSize: "16px",
  fontWeight: "800",
};