"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";

import { getFirebaseAuth, getFirestoreDb } from "@/lib/firebase";

const STUDENT_DOCUMENTS_STORAGE_KEY = "uaams_student_uploaded_documents";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ACCEPTED_FILE_TYPES = ["application/pdf", "image/jpeg", "image/png"];

const DOCUMENT_TYPES = [
  {
    key: "passport",
    label: "A. PASSPORT COPY*",
  },
  {
    key: "transcript",
    label: "B. ACADEMIC TRANSCRIPTS*",
  },
  {
    key: "certificates",
    label: "C. CERTIFICATES*",
  },
  {
    key: "englishTest",
    label: "D. ENGLISH LANGUAGE TEST*",
  },
];

export default function StudentDocumentsPage() {
  const router = useRouter();

  const [student, setStudent] = useState(null);
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [documents, setDocuments] = useState({});
  const [uploadErrors, setUploadErrors] = useState({});
  const [applicationDocumentId, setApplicationDocumentId] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const auth = getFirebaseAuth();
    const db = getFirestoreDb();

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.replace("/");
        return;
      }

      try {
        setFirebaseUser(currentUser);

        const userRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          setErrorMessage("Student profile not found.");
          setLoading(false);
          return;
        }

        const userData = userSnap.data();
        const role = String(userData?.role || "").trim().toLowerCase();

        if (role !== "student") {
          router.replace("/admin");
          return;
        }

        setStudent(userData);

        const savedDocuments = await loadSavedDocuments(db, currentUser.uid);
        setDocuments(savedDocuments);

        const latestApplicationId = await getLatestApplicationDocumentId(
          db,
          currentUser
        );

        setApplicationDocumentId(latestApplicationId);

        setLoading(false);
      } catch (error) {
        console.error("Documents page error:", error);
        setErrorMessage("Unable to load documents page.");
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    const auth = getFirebaseAuth();
    await signOut(auth);
    router.replace("/");
  };

  const handleFileSelected = (documentKey, file) => {
    if (!file) return;

    const validationError = validateFile(file);

    if (validationError) {
      setUploadErrors((previousErrors) => ({
        ...previousErrors,
        [documentKey]: validationError,
      }));

      return;
    }

    const documentData = {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified,
      uploadedAt: new Date().toISOString(),
    };

    setDocuments((previousDocuments) => ({
      ...previousDocuments,
      [documentKey]: documentData,
    }));

    setUploadErrors((previousErrors) => ({
      ...previousErrors,
      [documentKey]: "",
    }));

    setErrorMessage("");
    setSuccessMessage("");
  };

  const handleSaveDocuments = async () => {
    if (!firebaseUser) return;

    try {
      setSaving(true);
      setErrorMessage("");
      setSuccessMessage("");

      localStorage.setItem(
        STUDENT_DOCUMENTS_STORAGE_KEY,
        JSON.stringify(documents)
      );

      const db = getFirestoreDb();

      await setDoc(
        doc(db, "studentDocuments", firebaseUser.uid),
        {
          studentId: firebaseUser.uid,
          studentEmail: firebaseUser.email || student?.email || "",
          documents,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      setSuccessMessage("Documents saved successfully.");

      const redirectApplicationId =
        applicationDocumentId ||
        (await getLatestApplicationDocumentId(db, firebaseUser));

      if (redirectApplicationId) {
        router.push(
          `/student/application/${encodeURIComponent(redirectApplicationId)}`
        );
      } else {
        router.push("/student");
      }
    } catch (error) {
      console.error("Save documents error:", error);
      setErrorMessage("Unable to save documents.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main style={pageStyle}>
        <div style={loadingBoxStyle}>Loading documents...</div>
      </main>
    );
  }

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

          <nav style={topNavStyle}>
            <button
              type="button"
              style={navButtonStyle}
              onClick={() => router.push("/partners")}
            >
              PARTNERS
            </button>

            <button
              type="button"
              style={navButtonStyle}
              onClick={() => router.push("/about")}
            >
              ABOUT US
            </button>

            <button type="button" style={navButtonStyle} onClick={handleLogout}>
              LOGOUT
            </button>
          </nav>
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
            <h2 style={pageTitleStyle}>UPLOAD DOCUMENTS</h2>
            <p style={pageSubtitleStyle}>
              UPLOAD AND MANAGE YOUR APPLICATION DOCUMENTS.
            </p>
          </div>
        </section>

        <section style={documentsBoxStyle}>
          <div style={requirementsBoxStyle}>
            <h3 style={requirementsTitleStyle}>FILE REQUIREMENTS</h3>
            <p style={requirementsTextStyle}>ACCEPTED FORMATS</p>
            <p style={requirementsTextStyle}>PDF, JPG, PNG</p>
            <p style={requirementsTextStyle}>MAX FILE SIZE</p>
            <p style={requirementsTextStyle}>
              ALL DOCUMENTS MUST BE CLEAR AND READABLE
            </p>
          </div>

          {DOCUMENT_TYPES.map((documentType) => (
            <DocumentUploadRow
              key={documentType.key}
              label={documentType.label}
              documentData={documents[documentType.key]}
              errorMessage={uploadErrors[documentType.key]}
              onFileSelected={(file) =>
                handleFileSelected(documentType.key, file)
              }
            />
          ))}

          {errorMessage && <p style={errorTextStyle}>{errorMessage}</p>}
          {successMessage && <p style={successTextStyle}>{successMessage}</p>}

          <div style={buttonRowStyle}>
            <button
              type="button"
              style={secondaryButtonStyle}
              onClick={() => router.push("/student")}
            >
              BACK
            </button>

            <button
              type="button"
              style={{
                ...primaryButtonStyle,
                opacity: saving ? 0.7 : 1,
                cursor: saving ? "not-allowed" : "pointer",
              }}
              onClick={handleSaveDocuments}
              disabled={saving}
            >
              {saving ? "SAVING..." : "SAVE DOCUMENTS"}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}

function DocumentUploadRow({
  label,
  documentData,
  errorMessage,
  onFileSelected,
}) {
  const fileInputRef = useRef(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleChange = (event) => {
    const file = event.target.files?.[0];
    onFileSelected(file);
  };

  const handleDrop = (event) => {
    event.preventDefault();

    const file = event.dataTransfer.files?.[0];
    onFileSelected(file);
  };

  return (
    <section style={documentGroupStyle}>
      <h3 style={documentLabelStyle}>{label}</h3>

      <div
        style={dropZoneStyle}
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={(event) => event.preventDefault()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={handleChange}
          style={{ display: "none" }}
        />

        <div style={uploadIconStyle}>☁</div>

        <p style={dropTextStyle}>
          {documentData?.name
            ? "CLICK TO REPLACE DOCUMENT OR DRAG & DROP"
            : "CLICK TO UPLOAD OR DRAG & DROP"}
        </p>

        <p style={dropHelpTextStyle}>
          ACCEPTED FORMATS : PDF, JPG, PNG | MAX SIZE: 5MB
        </p>

        {documentData?.name && (
          <div style={uploadedFileStyle}>
            <span>{documentData.name}</span>
            <span>{formatFileSize(documentData.size)}</span>
            <strong style={uploadedStatusStyle}>UPLOADED</strong>
          </div>
        )}
      </div>

      {errorMessage && <p style={uploadErrorStyle}>{errorMessage}</p>}
    </section>
  );
}

async function getLatestApplicationDocumentId(db, firebaseUser) {
  const applicationsRef = collection(db, "applications");

  const applicationsQuery = query(
    applicationsRef,
    where("studentId", "==", firebaseUser.uid)
  );

  const querySnapshot = await getDocs(applicationsQuery);

  if (querySnapshot.empty) {
    return "";
  }

  const applications = querySnapshot.docs.map((applicationDoc) => {
    const data = applicationDoc.data();

    return {
      documentId: applicationDoc.id,
      rawCreatedAt:
        data?.createdAt ||
        data?.submittedAt ||
        data?.updatedAt ||
        null,
    };
  });

  applications.sort((a, b) => {
    return getFirestoreDateTime(b.rawCreatedAt) - getFirestoreDateTime(a.rawCreatedAt);
  });

  return applications[0]?.documentId || "";
}

async function loadSavedDocuments(db, studentId) {
  const documentsRef = doc(db, "studentDocuments", studentId);
  const documentsSnap = await getDoc(documentsRef);

  if (documentsSnap.exists()) {
    return documentsSnap.data()?.documents || {};
  }

  const savedLocalDocuments = localStorage.getItem(
    STUDENT_DOCUMENTS_STORAGE_KEY
  );

  if (savedLocalDocuments) {
    try {
      return JSON.parse(savedLocalDocuments);
    } catch {
      return {};
    }
  }

  return {};
}

function validateFile(file) {
  if (!file) return "Please select a file.";

  if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
    return "Invalid file type. Please upload PDF, JPG or PNG.";
  }

  if (file.size > MAX_FILE_SIZE) {
    return "File is too large. Maximum size is 5MB.";
  }

  return "";
}

function formatFileSize(size) {
  if (!size) return "";

  const sizeInKb = size / 1024;

  if (sizeInKb < 1024) {
    return `${sizeInKb.toFixed(1)} KB`;
  }

  return `${(sizeInKb / 1024).toFixed(1)} MB`;
}

function getFirestoreDateTime(value) {
  if (!value) return 0;

  if (value?.toDate) {
    return value.toDate().getTime();
  }

  const dateValue = new Date(value).getTime();

  return Number.isNaN(dateValue) ? 0 : dateValue;
}

const pageStyle = {
  minHeight: "100vh",
  width: "100%",
  background: "#F7F1E8",
  padding: "10px",
  fontFamily: "Arial, Helvetica, sans-serif",
  color: "#071126",
  boxSizing: "border-box",
};

const frameStyle = {
  minHeight: "calc(100vh - 20px)",
  width: "100%",
  border: "2px solid #000",
  background: "#F7F1E8",
  display: "flex",
  flexDirection: "column",
};

const headerStyle = {
  minHeight: "110px",
  background: "#fff",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "0 60px",
  borderBottom: "2px solid #000",
  boxSizing: "border-box",
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

const topNavStyle = {
  display: "flex",
  alignItems: "center",
  gap: "30px",
};

const navButtonStyle = {
  background: "#fff",
  border: "2px solid #3B2E5A",
  color: "#3B2E5A",
  minWidth: "150px",
  height: "54px",
  padding: "0 24px",
  fontSize: "15px",
  fontWeight: "800",
  cursor: "pointer",
};

const titleBarStyle = {
  width: "100%",
  maxWidth: "1700px",
  minHeight: "80px",
  margin: "30px auto 30px",
  border: "2px solid #000",
  display: "grid",
  gridTemplateColumns: "260px 1fr 260px",
  alignItems: "center",
  background: "#fff",
  boxSizing: "border-box",
};

const backDashboardButtonStyle = {
  marginLeft: "30px",
  width: "200px",
  height: "46px",
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
  fontSize: "28px",
  fontWeight: "900",
};

const pageSubtitleStyle = {
  margin: "6px 0 0",
  fontSize: "13px",
  fontWeight: "800",
};

const documentsBoxStyle = {
  width: "100%",
  maxWidth: "1700px",
  margin: "0 auto 50px",
  border: "2px solid #000",
  background: "#fff",
  padding: "34px 60px 32px",
  boxSizing: "border-box",
};

const requirementsBoxStyle = {
  background: "#F7F1E8",
  border: "2px solid #000",
  padding: "24px 30px",
  marginBottom: "28px",
};

const requirementsTitleStyle = {
  margin: "0 0 10px",
  fontSize: "18px",
  fontWeight: "900",
};

const requirementsTextStyle = {
  margin: "0 0 6px",
  fontSize: "14px",
  fontWeight: "800",
};

const documentGroupStyle = {
  marginBottom: "24px",
};

const documentLabelStyle = {
  margin: "0 0 10px",
  fontSize: "16px",
  fontWeight: "900",
};

const dropZoneStyle = {
  minHeight: "135px",
  border: "2px dashed #000",
  background: "#F7F1E8",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  padding: "18px",
};

const uploadIconStyle = {
  fontSize: "34px",
  fontWeight: "900",
  marginBottom: "8px",
};

const dropTextStyle = {
  margin: 0,
  fontSize: "15px",
  fontWeight: "900",
};

const dropHelpTextStyle = {
  margin: "8px 0 0",
  fontSize: "13px",
  fontWeight: "800",
};

const uploadedFileStyle = {
  marginTop: "14px",
  width: "100%",
  maxWidth: "900px",
  display: "grid",
  gridTemplateColumns: "1fr 120px 120px",
  alignItems: "center",
  gap: "14px",
  fontSize: "13px",
  fontWeight: "800",
};

const uploadedStatusStyle = {
  color: "green",
  textAlign: "right",
};

const uploadErrorStyle = {
  margin: "8px 0 0",
  color: "red",
  fontSize: "13px",
  fontWeight: "800",
};

const errorTextStyle = {
  color: "red",
  fontSize: "15px",
  fontWeight: "800",
};

const successTextStyle = {
  color: "green",
  fontSize: "15px",
  fontWeight: "800",
};

const buttonRowStyle = {
  marginTop: "28px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
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

const primaryButtonStyle = {
  width: "230px",
  height: "50px",
  background: "#3B2E5A",
  border: "2px solid #3B2E5A",
  color: "#fff",
  fontSize: "14px",
  fontWeight: "800",
};

const loadingBoxStyle = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "24px",
  fontWeight: "900",
};