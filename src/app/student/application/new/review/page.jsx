/*"use client";

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
              REVIEW YOUR APPLICATION BEFORE SUBMITTING.
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
  margin: "0 0 26px",
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

const titleTextWrapperStyle = {
  textAlign: "center",
};

const pageTitleStyle = {
  margin: 0,
  fontSize: "27px",
  fontWeight: "900",
};

const pageSubtitleStyle = {
  margin: "6px 0 0",
  fontSize: "12px",
  fontWeight: "800",
};

const stepWrapperStyle = {
  width: "100%",
  maxWidth: "1600px",
  margin: "0 auto 26px",
  display: "grid",
  gridTemplateColumns: "1fr 1fr 1fr",
  gap: "30px",
  fontSize: "14px",
  fontWeight: "800",
};

const stepItemStyle = {
  display: "flex",
  alignItems: "center",
  gap: "18px",
};

const activeStepItemStyle = {
  display: "flex",
  alignItems: "center",
  gap: "18px",
  fontWeight: "900",
};

const stepLineStyle = {
  flex: 1,
  borderTop: "2px dashed #999",
};

const reviewBoxStyle = {
  width: "100%",
  maxWidth: "1600px",
  margin: "0 auto",
  border: "2px solid #000",
  background: "#fff",
  padding: "32px 46px 30px",
  boxSizing: "border-box",
};

const reviewSectionStyle = {
  borderBottom: "2px solid #000",
  paddingBottom: "28px",
  marginBottom: "28px",
};

const reviewSectionTitleStyle = {
  margin: "0 0 20px",
  fontSize: "18px",
  fontWeight: "900",
};

const reviewGridStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "20px 28px",
};

const reviewCardStyle = {
  border: "2px solid #000",
  background: "#F7F1E8",
  padding: "17px 20px",
  minHeight: "82px",
  boxSizing: "border-box",
};

const reviewLabelStyle = {
  margin: "0 0 8px",
  fontSize: "13px",
  fontWeight: "900",
};

const reviewValueStyle = {
  margin: 0,
  fontSize: "15px",
  fontWeight: "700",
};

const documentRowStyle = {
  border: "2px solid #000",
  background: "#F7F1E8",
  minHeight: "72px",
  padding: "16px 20px",
  marginBottom: "14px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  boxSizing: "border-box",
};

const documentLabelStyle = {
  margin: 0,
  fontSize: "13px",
  fontWeight: "900",
};

const documentNameStyle = {
  margin: "7px 0 0",
  fontSize: "14px",
  fontWeight: "800",
};

const documentSizeStyle = {
  margin: "4px 0 0",
  fontSize: "12px",
  fontWeight: "700",
};

const uploadedStatusStyle = {
  color: "green",
  fontSize: "13px",
  fontWeight: "900",
};

const notUploadedStatusStyle = {
  color: "red",
  fontSize: "13px",
  fontWeight: "900",
};

const confirmRowStyle = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  fontSize: "14px",
  fontWeight: "700",
  margin: "6px 0 26px",
};

const buttonRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const rightButtonGroupStyle = {
  display: "flex",
  gap: "24px",
};

const secondaryButtonStyle = {
  width: "140px",
  height: "46px",
  background: "#fff",
  border: "2px solid #000",
  fontSize: "13px",
  fontWeight: "800",
  cursor: "pointer",
};

const draftButtonStyle = {
  width: "158px",
  height: "46px",
  background: "#fff",
  border: "2px solid #3B2E5A",
  color: "#3B2E5A",
  fontSize: "12px",
  fontWeight: "800",
  cursor: "pointer",
};

const primaryButtonStyle = {
  width: "210px",
  height: "46px",
  background: "#3B2E5A",
  border: "2px solid #3B2E5A",
  color: "#fff",
  fontSize: "12px",
  fontWeight: "800",
  cursor: "pointer",
};*/

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

  const [popup, setPopup] = useState({
    isOpen: false,
    title: "",
    message: "",
    redirectTo: "",
  });

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

  const openPopup = (title, message, redirectTo = "") => {
    setPopup({
      isOpen: true,
      title,
      message,
      redirectTo,
    });
  };

  const closePopup = () => {
    const redirectTo = popup.redirectTo;

    setPopup({
      isOpen: false,
      title: "",
      message: "",
      redirectTo: "",
    });

    if (redirectTo) {
      router.replace(redirectTo);
    }
  };

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

    openPopup("DRAFT SAVED", "Draft saved successfully.");
  };

  const handleSubmitApplication = async () => {
    if (!confirmed) {
      openPopup(
        "CONFIRM REQUIRED",
        "Please confirm that the information is accurate and complete."
      );
      return;
    }

    if (!firebaseUser) {
      openPopup(
        "LOGIN REQUIRED",
        "You must be logged in to submit an application.",
        "/"
      );
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

      openPopup(
        "SUBMISSION ERROR",
        "Unable to submit application. Please try again."
      );
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
              REVIEW YOUR APPLICATION BEFORE SUBMITTING.
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
              <ReviewCard
                label="PASSPORT NUMBER"
                value={formData.passportNumber}
              />
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
            <DocumentRow
              label="A. PASSPORT COPY"
              document={documents.passport}
            />
            <DocumentRow
              label="B. ACADEMIC TRANSCRIPTS"
              document={documents.transcript}
            />
            <DocumentRow
              label="C. CERTIFICATES"
              document={documents.certificates}
            />
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
            <button
              type="button"
              style={secondaryButtonStyle}
              onClick={handleBack}
            >
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

      {popup.isOpen && (
        <div style={popupOverlayStyle}>
          <div style={popupBoxStyle}>
            <h2 style={popupTitleStyle}>{popup.title}</h2>

            <p style={popupMessageStyle}>{popup.message}</p>

            <button type="button" style={popupButtonStyle} onClick={closePopup}>
              OK
            </button>
          </div>
        </div>
      )}
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

        {uploaded && (
          <p style={documentSizeStyle}>{formatFileSize(document.size)}</p>
        )}
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
  margin: "0 0 26px",
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

const titleTextWrapperStyle = {
  textAlign: "center",
};

const pageTitleStyle = {
  margin: 0,
  fontSize: "27px",
  fontWeight: "900",
};

const pageSubtitleStyle = {
  margin: "6px 0 0",
  fontSize: "12px",
  fontWeight: "800",
};

const stepWrapperStyle = {
  width: "100%",
  maxWidth: "1600px",
  margin: "0 auto 26px",
  display: "grid",
  gridTemplateColumns: "1fr 1fr 1fr",
  gap: "30px",
  fontSize: "14px",
  fontWeight: "800",
};

const stepItemStyle = {
  display: "flex",
  alignItems: "center",
  gap: "18px",
};

const activeStepItemStyle = {
  display: "flex",
  alignItems: "center",
  gap: "18px",
  fontWeight: "900",
};

const stepLineStyle = {
  flex: 1,
  borderTop: "2px dashed #999",
};

const reviewBoxStyle = {
  width: "100%",
  maxWidth: "1600px",
  margin: "0 auto",
  border: "2px solid #000",
  background: "#fff",
  padding: "32px 46px 30px",
  boxSizing: "border-box",
};

const reviewSectionStyle = {
  borderBottom: "2px solid #000",
  paddingBottom: "28px",
  marginBottom: "28px",
};

const reviewSectionTitleStyle = {
  margin: "0 0 20px",
  fontSize: "18px",
  fontWeight: "900",
};

const reviewGridStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "20px 28px",
};

const reviewCardStyle = {
  border: "2px solid #000",
  background: "#F7F1E8",
  padding: "17px 20px",
  minHeight: "82px",
  boxSizing: "border-box",
};

const reviewLabelStyle = {
  margin: "0 0 8px",
  fontSize: "13px",
  fontWeight: "900",
};

const reviewValueStyle = {
  margin: 0,
  fontSize: "15px",
  fontWeight: "700",
};

const documentRowStyle = {
  border: "2px solid #000",
  background: "#F7F1E8",
  minHeight: "72px",
  padding: "16px 20px",
  marginBottom: "14px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  boxSizing: "border-box",
};

const documentLabelStyle = {
  margin: 0,
  fontSize: "13px",
  fontWeight: "900",
};

const documentNameStyle = {
  margin: "7px 0 0",
  fontSize: "14px",
  fontWeight: "800",
};

const documentSizeStyle = {
  margin: "4px 0 0",
  fontSize: "12px",
  fontWeight: "700",
};

const uploadedStatusStyle = {
  color: "green",
  fontSize: "13px",
  fontWeight: "900",
};

const notUploadedStatusStyle = {
  color: "red",
  fontSize: "13px",
  fontWeight: "900",
};

const confirmRowStyle = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  fontSize: "14px",
  fontWeight: "700",
  margin: "6px 0 26px",
};

const buttonRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const rightButtonGroupStyle = {
  display: "flex",
  gap: "24px",
};

const secondaryButtonStyle = {
  width: "140px",
  height: "46px",
  background: "#fff",
  border: "2px solid #000",
  fontSize: "13px",
  fontWeight: "800",
  cursor: "pointer",
};

const draftButtonStyle = {
  width: "158px",
  height: "46px",
  background: "#fff",
  border: "2px solid #3B2E5A",
  color: "#3B2E5A",
  fontSize: "12px",
  fontWeight: "800",
  cursor: "pointer",
};

const primaryButtonStyle = {
  width: "210px",
  height: "46px",
  background: "#3B2E5A",
  border: "2px solid #3B2E5A",
  color: "#fff",
  fontSize: "12px",
  fontWeight: "800",
  cursor: "pointer",
};

const popupOverlayStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(0, 0, 0, 0.55)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 9999,
};

const popupBoxStyle = {
  width: "470px",
  background: "#fff",
  border: "2px solid #000",
  padding: "32px",
  boxSizing: "border-box",
  textAlign: "left",
};

const popupTitleStyle = {
  margin: "0 0 18px",
  fontSize: "22px",
  fontWeight: "900",
  color: "#000",
};

const popupMessageStyle = {
  margin: "0 0 28px",
  fontSize: "15px",
  fontWeight: "700",
  color: "#000",
  lineHeight: "1.5",
};

const popupButtonStyle = {
  background: "#5B35D5",
  color: "#fff",
  border: "none",
  padding: "14px 34px",
  fontSize: "14px",
  fontWeight: "900",
  cursor: "pointer",
  boxShadow: "0 12px 24px rgba(91, 53, 213, 0.25)",
};