"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

import { getFirebaseAuth, getFirestoreDb } from "@/lib/firebase";

export default function ApplicationDetailsPage() {
  const router = useRouter();
  const params = useParams();

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
          <h1 style={loadingTextStyle}>Loading application details...</h1>
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
              BACK TO DASHBOARD
            </button>

            <h2 style={pageTitleStyle}>APPLICATIONS DETAILS</h2>
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
            BACK TO DASHBOARD
          </button>

          <h2 style={pageTitleStyle}>APPLICATIONS DETAILS</h2>
        </section>

        <section style={summaryRowStyle}>
          <SummaryItem label="APP ID" value={application.applicationId} />
          <SummaryItem label="UNIVERSITY" value={application.university} />
          <SummaryItem label="COURSE" value={application.course} />
          <SummaryItem label="INTAKE" value={application.intake} />
          <SummaryItem label="SUBMITTED" value={application.submittedOn} />
          <SummaryItem label="STATUS" value={application.status} />
        </section>

        <section style={progressBoxStyle}>
          <p style={progressTitleStyle}>APPLICATION PROGRESS</p>

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

        <DetailsSection title="A. PERSONAL INFORMATION">
          <DetailsLine label="FULL NAME:" value={application.fullName} />
          <DetailsLine label="DATE OF BIRTH:" value={application.dateOfBirth} />
          <DetailsLine label="NATIONALITY:" value={application.nationality} />
          <DetailsLine
            label="PASSPORT NUMBER:"
            value={application.passportNumber}
          />
        </DetailsSection>

        <DetailsSection title="B. ACADEMIC INFORMATION">
          <DetailsLine
            label="HIGHEST QUALIFICATION:"
            value={application.highestQualification}
          />
          <DetailsLine
            label="INSTITUTION NAME:"
            value={application.institutionName}
          />
          <DetailsLine
            label="GRADUATION YEAR:"
            value={application.graduationYear}
          />
          <DetailsLine label="GPA/GRADE:" value={application.gpaGrade} />
        </DetailsSection>

        <DetailsSection title="C. COURSE INFORMATION">
          <DetailsLine
            label="SELECTED UNIVERSITY:"
            value={application.university}
          />
          <DetailsLine label="COURSE NAME:" value={application.course} />
          <DetailsLine label="INTENDED INTAKE:" value={application.intake} />
        </DetailsSection>

        <DetailsSection title="D. UPLOADED DOCUMENTS">
          <DocumentItem
            title="PASSPORT COPY"
            documentData={application.documents.passport}
          />

          <DocumentItem
            title="ACADEMIC TRANSCRIPT"
            documentData={application.documents.transcript}
          />

          <DocumentItem
            title="CERTIFICATES"
            documentData={application.documents.certificates}
          />

          <DocumentItem
            title="ENGLISH LANGUAGE TEST"
            documentData={application.documents.englishTest}
          />
        </DetailsSection>

        <section style={noteBoxStyle}>
          <strong>NOTE :</strong> AVERAGE REVIEW TIME IS 2-4 WEEKS. YOU CAN
          TRACK YOUR APPLICATION PROGRESS AT ANY TIME FROM THE DASHBOARD OR
          APPLICATION DETAILS PAGE.
        </section>


      </div>
    </main>
  );
}

function Header({ onLogout }) {
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

      <button
        type="button"
        style={logoutButtonStyle}
        onClick={onLogout}
      >
        LOGOUT
      </button>
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

function DocumentItem({ title, documentData }) {
  const uploaded = Boolean(documentData?.name);

  return (
    <div style={documentItemStyle}>
      <div style={documentIconStyle}>▣</div>

      <div style={documentTextStyle}>
        <p style={documentTitleStyle}>{title}</p>
        <p style={documentNameStyle}>
          {uploaded ? documentData.name : "No file selected"}
        </p>
      </div>

      <span style={documentCheckStyle}>{uploaded ? "✓" : ""}</span>

      <strong style={uploaded ? uploadedTextStyle : notUploadedTextStyle}>
        {uploaded ? "UPLOADED" : "NOT UPLOADED"}
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
      data?.courseName ||
        data?.course ||
        data?.selectedCourse ||
        data?.programmeName
    ),

    intake: formatDisplayValue(
      data?.intendedIntake ||
        data?.intake ||
        data?.startDate ||
        data?.intakeDate
    ),

    submittedOn: formatDate(
      data?.submittedAt ||
        data?.submittedOn ||
        data?.createdAt ||
        data?.updatedAt
    ),

    status: formatDisplayValue(status),

    fullName: formatDisplayValue(
      data?.fullName || data?.studentName || data?.displayName
    ),

    dateOfBirth: formatDisplayValue(data?.dateOfBirth || data?.dob),

    nationality: formatDisplayValue(data?.nationality),

    passportNumber: formatDisplayValue(data?.passportNumber),

    highestQualification: formatDisplayValue(data?.highestQualification),

    institutionName: formatDisplayValue(data?.institutionName),

    graduationYear: formatDisplayValue(data?.graduationYear),

    gpaGrade: formatDisplayValue(data?.gpaGrade || data?.grade || data?.gpa),

    documents: normaliseDocuments(data),

    progressSteps: getProgressSteps(status),
  };
}

function normaliseDocuments(data) {
  const documents = data?.documents || {};

  return {
    passport:
      documents?.passport ||
      data?.passport ||
      data?.passportCopy ||
      data?.passportDocument ||
      null,

    transcript:
      documents?.transcript ||
      documents?.academicTranscripts ||
      data?.transcript ||
      data?.academicTranscripts ||
      null,

    certificates:
      documents?.certificates ||
      data?.certificates ||
      data?.certificate ||
      null,

    englishTest:
      documents?.englishTest ||
      documents?.englishLanguageTest ||
      data?.englishTest ||
      data?.englishLanguageTest ||
      null,
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