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

      <nav style={navStyle}>
        <button type="button" style={navButtonStyle}>
          PARTNERS
        </button>

        <button type="button" style={navButtonStyle}>
          ABOUT US
        </button>

        <button type="button" style={navButtonStyle} onClick={onLogout}>
          LOGOUT
        </button>
      </nav>
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
  background: "#F7F1E8",
  padding: "6px",
  fontFamily: "Arial, Helvetica, sans-serif",
};

const frameStyle = {
  minHeight: "calc(100vh - 12px)",
  border: "1.5px solid #000",
  background: "#F7F1E8",
};

const headerStyle = {
  height: "72px",
  background: "#fff",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "0 120px",
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

const navStyle = {
  display: "flex",
  alignItems: "center",
  gap: "70px",
};

const navButtonStyle = {
  background: "#fff",
  border: "1.5px solid #3B2E5A",
  color: "#3B2E5A",
  width: "80px",
  height: "30px",
  fontSize: "10px",
  fontWeight: "700",
  cursor: "pointer",
};

const titleBarStyle = {
  maxWidth: "800px",
  height: "38px",
  margin: "16px auto 22px",
  border: "1.5px solid #000",
  display: "grid",
  gridTemplateColumns: "190px 1fr 190px",
  alignItems: "center",
  background: "#F7F1E8",
};

const backDashboardButtonStyle = {
  marginLeft: "48px",
  width: "145px",
  height: "24px",
  background: "#3B2E5A",
  color: "#fff",
  border: "none",
  fontSize: "9px",
  fontWeight: "700",
  cursor: "pointer",
};

const pageTitleStyle = {
  margin: 0,
  fontSize: "16px",
  fontWeight: "900",
  textAlign: "center",
};

const summaryRowStyle = {
  maxWidth: "800px",
  margin: "0 auto 14px",
  border: "1.5px solid #000",
  background: "#fff",
  padding: "8px 16px",
  display: "grid",
  gridTemplateColumns: "0.8fr 1.3fr 1.4fr 1fr 1fr 0.9fr",
  columnGap: "12px",
};

const summaryItemStyle = {
  minWidth: 0,
};

const summaryLabelStyle = {
  margin: "0 0 4px",
  fontSize: "8px",
  fontWeight: "900",
};

const summaryValueStyle = {
  margin: 0,
  fontSize: "8px",
  fontWeight: "700",
  textTransform: "uppercase",
};

const progressBoxStyle = {
  maxWidth: "800px",
  margin: "0 auto 14px",
  border: "1.5px solid #000",
  background: "#fff",
  padding: "14px 26px 22px",
};

const progressTitleStyle = {
  margin: "0 0 8px",
  fontSize: "9px",
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
  width: "14px",
  height: "14px",
  background: completed ? "#3B2E5A" : "#fff",
  color: "#fff",
  border: "1px solid #3B2E5A",
  fontSize: "10px",
  fontWeight: "900",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
});

const progressLineStyle = {
  width: "145px",
  borderTop: "1.5px solid #000",
};

const progressLabelStyle = {
  position: "absolute",
  top: "18px",
  left: "-28px",
  width: "80px",
  fontSize: "7px",
  fontWeight: "800",
  textAlign: "center",
};

const detailsBoxStyle = {
  maxWidth: "800px",
  margin: "0 auto 14px",
  border: "1.5px solid #000",
  background: "#fff",
  padding: "14px 26px",
};

const detailsTitleStyle = {
  margin: "0 0 8px",
  fontSize: "10px",
  fontWeight: "900",
};

const detailsContentStyle = {
  borderTop: "1px solid #000",
  paddingTop: "8px",
};

const detailsLineStyle = {
  display: "grid",
  gridTemplateColumns: "280px 1fr",
  marginBottom: "7px",
};

const detailsLabelStyle = {
  fontSize: "8px",
  fontWeight: "900",
};

const detailsValueStyle = {
  fontSize: "8px",
  fontWeight: "700",
  textTransform: "uppercase",
};

const documentItemStyle = {
  width: "670px",
  height: "34px",
  border: "1.5px solid #000",
  background: "#F7F1E8",
  display: "grid",
  gridTemplateColumns: "28px 1fr 28px 90px",
  alignItems: "center",
  padding: "0 12px",
  marginBottom: "8px",
};

const documentIconStyle = {
  fontSize: "13px",
};

const documentTextStyle = {
  minWidth: 0,
};

const documentTitleStyle = {
  margin: 0,
  fontSize: "8px",
  fontWeight: "900",
};

const documentNameStyle = {
  margin: "1px 0 0",
  fontSize: "8px",
  fontWeight: "700",
  textTransform: "uppercase",
};

const documentCheckStyle = {
  fontSize: "12px",
  fontWeight: "900",
};

const uploadedTextStyle = {
  fontSize: "8px",
  fontWeight: "800",
};

const notUploadedTextStyle = {
  fontSize: "8px",
  fontWeight: "800",
  color: "red",
};

const noteBoxStyle = {
  maxWidth: "800px",
  margin: "16px auto 32px",
  border: "1.5px solid #000",
  background: "#fff",
  padding: "18px 26px",
  fontSize: "8px",
  fontWeight: "700",
};


const loadingTextStyle = {
  padding: "40px",
};

const errorBoxStyle = {
  maxWidth: "800px",
  margin: "20px auto",
  border: "1.5px solid #000",
  background: "#fff",
  padding: "20px",
};

const errorTextStyle = {
  color: "red",
  fontSize: "12px",
  fontWeight: "800",
};