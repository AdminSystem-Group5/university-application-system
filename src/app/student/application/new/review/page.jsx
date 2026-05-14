"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

import { getFirebaseAuth, getFirestoreDb } from "@/lib/firebase";

const FORM_STORAGE_KEY = "uaams_new_application_form";
const DOCUMENTS_STORAGE_KEY = "uaams_new_application_documents";

export default function ReviewApplicationPage() {
  const router = useRouter();

  const [firebaseUser, setFirebaseUser] = useState(null);
  const [formData, setFormData] = useState({});
  const [documents, setDocuments] = useState({});
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const auth = getFirebaseAuth();

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.replace("/");
        return;
      }

      setFirebaseUser(user);
    });

    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    const savedForm =
      sessionStorage.getItem(FORM_STORAGE_KEY) ||
      localStorage.getItem(FORM_STORAGE_KEY) ||
      localStorage.getItem("studentApplicationDraft");

    const savedDocuments =
      sessionStorage.getItem(DOCUMENTS_STORAGE_KEY) ||
      localStorage.getItem(DOCUMENTS_STORAGE_KEY);

    if (savedForm) {
      try {
        setFormData(JSON.parse(savedForm));
      } catch (error) {
        console.error("Form storage parse error:", error);
        setFormData({});
      }
    }

    if (savedDocuments) {
      try {
        setDocuments(JSON.parse(savedDocuments));
      } catch (error) {
        console.error("Documents storage parse error:", error);
        setDocuments({});
      }
    }
  }, []);

  const handleLogout = async () => {
    const auth = getFirebaseAuth();
    await signOut(auth);
    router.replace("/");
  };

  const handleBack = () => {
    router.push("/student/application/new/documents");
  };

  const handleSaveDraft = () => {
    sessionStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(formData));
    sessionStorage.setItem(DOCUMENTS_STORAGE_KEY, JSON.stringify(documents));
    alert("Draft saved successfully.");
  };

  const handleSubmitApplication = async () => {
    if (!confirmed) {
      alert("Please confirm that the information is accurate and complete.");
      return;
    }

    if (!firebaseUser) {
      alert("You must be logged in to submit an application.");
      router.replace("/");
      return;
    }

    setSubmitting(true);

    try {
      const db = getFirestoreDb();

      const applicationId = `APP-${Math.floor(1000 + Math.random() * 9000)}`;

      const submittedApplication = {
        applicationId,

        studentId: firebaseUser.uid,
        studentUid: firebaseUser.uid,
        userId: firebaseUser.uid,

        studentName: formData.fullName || "",
        studentEmail: firebaseUser.email || "",

        fullName: formData.fullName || "",
        dateOfBirth: formData.dateOfBirth || "",
        nationality: formData.nationality || "",
        passportNumber: formData.passportNumber || "",

        highestQualification: formData.highestQualification || "",
        institutionName: formData.institutionName || "",
        graduationYear: formData.graduationYear || "",
        gpaGrade: formData.gpaGrade || "",

        selectedUniversityId: formData.selectedUniversityId || "",
        selectedUniversity: formData.selectedUniversity || "",
        university: formData.selectedUniversity || "",
        universityName: formData.selectedUniversity || "",

        selectedCourseId: formData.selectedCourseId || "",
        courseName: formData.courseName || "",
        course: formData.courseName || "",

        intendedIntake: formData.intendedIntake || "",
        intake: formData.intendedIntake || "",

        documents: {
          passport: cleanDocumentForFirestore(documents.passport),
          transcript: cleanDocumentForFirestore(documents.transcript),
          certificates: cleanDocumentForFirestore(documents.certificates),
          englishTest: cleanDocumentForFirestore(documents.englishTest),
        },

        applicationStatus: "Submitted",
        status: "Submitted",

        createdAt: serverTimestamp(),
        submittedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await addDoc(collection(db, "applications"), submittedApplication);

      const submittedSummary = {
        applicationId,
        submittedOn: new Date().toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        }),
        university: formData.selectedUniversity || "Not provided",
        course: formData.courseName || "Not provided",
      };

      sessionStorage.setItem(
        "uaams_submitted_application_summary",
        JSON.stringify(submittedSummary)
      );

      sessionStorage.removeItem(FORM_STORAGE_KEY);
      sessionStorage.removeItem(DOCUMENTS_STORAGE_KEY);

      router.push("/student/application/new/submitted");
    } catch (error) {
      console.error("Submit application error:", error);
      alert("Unable to submit application. Please try again.");
    } finally {
      setSubmitting(false);
    }
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

        <section style={titleBarStyle}>
          <button
            type="button"
            style={backDashboardButtonStyle}
            onClick={() => router.push("/student")}
          >
            BACK TO DASHBOARD
          </button>

          <div style={titleTextWrapperStyle}>
            <h2 style={pageTitleStyle}>NEW APPLICATION</h2>
            <p style={pageSubtitleStyle}>
              COMPLETE THE FORM BELOW TO SUBMIT YOUR UNIVERSITY APPLICATION.
            </p>
          </div>
        </section>

        <section style={stepWrapperStyle}>
          <div style={stepItemStyle}>
            <span>STEP 1 : APPLICATION FORM</span>
            <div style={stepLineStyle}></div>
          </div>

          <div style={stepItemStyle}>
            <span>STEP 2 : UPLOAD DOCUMENTS</span>
            <div style={stepLineStyle}></div>
          </div>

          <div style={activeStepItemStyle}>
            <span>STEP 3 : REVIEW & SUBMIT</span>
          </div>
        </section>

        <section style={reviewBoxStyle}>
          <ReviewSection title="A. PERSONAL INFORMATION">
            <ReviewGrid>
              <ReviewCard label="FULL NAME" value={formData.fullName} />
              <ReviewCard label="DATE OF BIRTH" value={formData.dateOfBirth} />
              <ReviewCard label="NATIONALITY" value={formData.nationality} />
              <ReviewCard label="PASSPORT NUMBER" value={formData.passportNumber} />
            </ReviewGrid>
          </ReviewSection>

          <ReviewSection title="B. ACADEMIC INFORMATION">
            <ReviewGrid>
              <ReviewCard
                label="HIGHEST QUALIFICATION"
                value={formData.highestQualification}
              />
              <ReviewCard
                label="INSTITUTION NAME"
                value={formData.institutionName}
              />
              <ReviewCard
                label="GRADUATION YEAR"
                value={formData.graduationYear}
              />
              <ReviewCard label="GPA/GRADE" value={formData.gpaGrade} />
            </ReviewGrid>
          </ReviewSection>

          <ReviewSection title="C. COURSE INFORMATION">
            <ReviewGrid>
              <ReviewCard
                label="SELECTED UNIVERSITY"
                value={formData.selectedUniversity}
              />
              <ReviewCard label="COURSE NAME" value={formData.courseName} />
              <ReviewCard
                label="INTENDED INTAKE"
                value={formData.intendedIntake}
              />
            </ReviewGrid>
          </ReviewSection>

          <ReviewSection title="D. UPLOADED DOCUMENTS">
            <DocumentRow label="A. PASSPORT COPY" document={documents.passport} />
            <DocumentRow
              label="B. ACADEMIC TRANSCRIPTS"
              document={documents.transcript}
            />
            <DocumentRow label="C. CERTIFICATES" document={documents.certificates} />
            <DocumentRow
              label="D. ENGLISH LANGUAGE TEST"
              document={documents.englishTest}
            />
          </ReviewSection>

          <div style={confirmRowStyle}>
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(event) => setConfirmed(event.target.checked)}
            />

            <span>
              I confirm that the information provided is accurate and complete.
            </span>
          </div>

          <div style={buttonRowStyle}>
            <button type="button" style={secondaryButtonStyle} onClick={handleBack}>
              BACK
            </button>

            <div style={rightButtonGroupStyle}>
              <button
                type="button"
                style={draftButtonStyle}
                onClick={handleSaveDraft}
                disabled={submitting}
              >
                SAVE AS DRAFT
              </button>

              <button
                type="button"
                style={{
                  ...primaryButtonStyle,
                  opacity: submitting ? 0.7 : 1,
                  cursor: submitting ? "not-allowed" : "pointer",
                }}
                onClick={handleSubmitApplication}
                disabled={submitting}
              >
                {submitting ? "SUBMITTING..." : "SUBMIT APPLICATION"}
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function cleanDocumentForFirestore(document) {
  if (!document) return null;

  return {
    name: document.name || "",
    size: document.size || 0,
    type: document.type || "",
    uploaded: Boolean(document.name),
  };
}

function ReviewSection({ title, children }) {
  return (
    <div style={reviewSectionStyle}>
      <h3 style={reviewSectionTitleStyle}>{title}</h3>
      {children}
    </div>
  );
}

function ReviewGrid({ children }) {
  return <div style={reviewGridStyle}>{children}</div>;
}

function ReviewCard({ label, value }) {
  return (
    <div style={reviewCardStyle}>
      <p style={reviewLabelStyle}>{label}</p>
      <p style={reviewValueStyle}>{value || "Not provided"}</p>
    </div>
  );
}

function DocumentRow({ label, document }) {
  const uploaded = Boolean(document?.name);

  return (
    <div style={documentRowStyle}>
      <div>
        <p style={documentLabelStyle}>{label}</p>

        <p style={documentNameStyle}>
          {uploaded ? document.name : "No file selected"}
        </p>

        {uploaded && <p style={documentSizeStyle}>{formatFileSize(document.size)}</p>}
      </div>

      <strong style={uploaded ? uploadedStatusStyle : notUploadedStatusStyle}>
        {uploaded ? "UPLOADED" : "NOT UPLOADED"}
      </strong>
    </div>
  );
}

function formatFileSize(size) {
  if (!size) return "";

  const sizeInKb = size / 1024;

  if (sizeInKb < 1024) {
    return `${sizeInKb.toFixed(1)} KB`;
  }

  return `${(sizeInKb / 1024).toFixed(1)} MB`;
}

const pageStyle = {
  minHeight: "100vh",
  width: "100%",
  background: "#F7F1E8",
  padding: "10px",
  fontFamily: "Arial, Helvetica, sans-serif",
  boxSizing: "border-box",
};

const frameStyle = {
  minHeight: "calc(100vh - 20px)",
  width: "100%",
  border: "2px solid #000",
  background: "#F7F1E8",
  padding: "0 40px 60px",
  boxSizing: "border-box",
};

const headerStyle = {
  minHeight: "110px",
  background: "#fff",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "0 60px",
  margin: "0 -40px 30px",
  borderBottom: "2px solid #000",
};

const logoStyle = {
  margin: 0,
  fontSize: "48px",
  fontWeight: "900",
  lineHeight: "48px",
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
  fontWeight: "700",
  cursor: "pointer",
};

const titleBarStyle = {
  width: "100%",
  maxWidth: "1700px",
  minHeight: "90px",
  margin: "0 auto 30px",
  border: "2px solid #000",
  display: "grid",
  gridTemplateColumns: "300px 1fr 300px",
  alignItems: "center",
  background: "#fff",
  boxSizing: "border-box",
};

const backDashboardButtonStyle = {
  marginLeft: "30px",
  width: "220px",
  height: "48px",
  background: "#3B2E5A",
  color: "#fff",
  border: "none",
  fontSize: "14px",
  fontWeight: "800",
  cursor: "pointer",
};

const titleTextWrapperStyle = {
  textAlign: "center",
};

const pageTitleStyle = {
  margin: 0,
  fontSize: "30px",
  fontWeight: "900",
};

const pageSubtitleStyle = {
  margin: "8px 0 0",
  fontSize: "13px",
  fontWeight: "800",
};

const stepWrapperStyle = {
  width: "100%",
  maxWidth: "1700px",
  margin: "0 auto 30px",
  display: "grid",
  gridTemplateColumns: "1fr 1fr 1fr",
  gap: "34px",
  fontSize: "15px",
  fontWeight: "800",
};

const stepItemStyle = {
  display: "flex",
  alignItems: "center",
  gap: "20px",
};

const activeStepItemStyle = {
  display: "flex",
  alignItems: "center",
  gap: "20px",
  fontWeight: "900",
};

const stepLineStyle = {
  flex: 1,
  borderTop: "2px dashed #999",
};

const reviewBoxStyle = {
  width: "100%",
  maxWidth: "1700px",
  margin: "0 auto",
  border: "2px solid #000",
  background: "#fff",
  padding: "38px 60px 34px",
  boxSizing: "border-box",
};

const reviewSectionStyle = {
  borderBottom: "2px solid #000",
  paddingBottom: "32px",
  marginBottom: "32px",
};

const reviewSectionTitleStyle = {
  margin: "0 0 24px",
  fontSize: "20px",
  fontWeight: "900",
};

const reviewGridStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "24px 34px",
};

const reviewCardStyle = {
  border: "2px solid #000",
  background: "#F7F1E8",
  padding: "20px 22px",
  minHeight: "90px",
  boxSizing: "border-box",
};

const reviewLabelStyle = {
  margin: "0 0 10px",
  fontSize: "14px",
  fontWeight: "900",
};

const reviewValueStyle = {
  margin: 0,
  fontSize: "16px",
  fontWeight: "700",
};

const documentRowStyle = {
  border: "2px solid #000",
  background: "#F7F1E8",
  minHeight: "80px",
  padding: "18px 22px",
  marginBottom: "16px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  boxSizing: "border-box",
};

const documentLabelStyle = {
  margin: 0,
  fontSize: "14px",
  fontWeight: "900",
};

const documentNameStyle = {
  margin: "8px 0 0",
  fontSize: "15px",
  fontWeight: "800",
};

const documentSizeStyle = {
  margin: "4px 0 0",
  fontSize: "13px",
  fontWeight: "700",
};

const uploadedStatusStyle = {
  color: "green",
  fontSize: "14px",
  fontWeight: "900",
};

const notUploadedStatusStyle = {
  color: "red",
  fontSize: "14px",
  fontWeight: "900",
};

const confirmRowStyle = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  fontSize: "15px",
  fontWeight: "700",
  margin: "8px 0 30px",
};

const buttonRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const rightButtonGroupStyle = {
  display: "flex",
  gap: "28px",
};

const secondaryButtonStyle = {
  width: "150px",
  height: "50px",
  background: "#fff",
  border: "2px solid #000",
  fontSize: "14px",
  fontWeight: "800",
  cursor: "pointer",
};

const draftButtonStyle = {
  width: "170px",
  height: "50px",
  background: "#fff",
  border: "2px solid #3B2E5A",
  color: "#3B2E5A",
  fontSize: "13px",
  fontWeight: "800",
  cursor: "pointer",
};

const primaryButtonStyle = {
  width: "230px",
  height: "50px",
  background: "#3B2E5A",
  border: "2px solid #3B2E5A",
  color: "#fff",
  fontSize: "13px",
  fontWeight: "800",
  cursor: "pointer",
};