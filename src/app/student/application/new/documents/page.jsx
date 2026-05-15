"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase";

export default function UploadDocumentsPage() {
  const router = useRouter();

  const [files, setFiles] = useState({
    passport: null,
    transcript: null,
    certificates: null,
    englishTest: null,
  });

  const [errorMessage, setErrorMessage] = useState("");

  const passportInputRef = useRef(null);
  const transcriptInputRef = useRef(null);
  const certificatesInputRef = useRef(null);
  const englishTestInputRef = useRef(null);

  const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];
  const maxFileSize = 5 * 1024 * 1024;

  const validateAndSaveFile = (fieldName, selectedFile) => {
    setErrorMessage("");

    if (!selectedFile) return;

    if (!allowedTypes.includes(selectedFile.type)) {
      setErrorMessage("Only PDF, JPG and PNG files are accepted.");
      return;
    }

    if (selectedFile.size > maxFileSize) {
      setErrorMessage("File size must be 5MB or less.");
      return;
    }

    setFiles((prevFiles) => ({
      ...prevFiles,
      [fieldName]: selectedFile,
    }));
  };

  const handleFileChange = (fieldName, event) => {
    const selectedFile = event.target.files?.[0];
    validateAndSaveFile(fieldName, selectedFile);
  };

  const handleDrop = (fieldName, event) => {
    event.preventDefault();

    const selectedFile = event.dataTransfer.files?.[0];
    validateAndSaveFile(fieldName, selectedFile);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const handleRemoveFile = (fieldName, inputRef) => {
    setFiles((prevFiles) => ({
      ...prevFiles,
      [fieldName]: null,
    }));

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleSaveDraft = () => {
    const uploadedFileSummary = {
      passport: files.passport?.name || "",
      transcript: files.transcript?.name || "",
      certificates: files.certificates?.name || "",
      englishTest: files.englishTest?.name || "",
    };

    localStorage.setItem(
      "studentApplicationDocumentDraft",
      JSON.stringify(uploadedFileSummary)
    );

    alert("Document draft saved successfully.");
  };

  const handleContinueToReview = () => {
    const documentData = {
        passport: files.passport
        ? {
            name: files.passport.name,
            size: files.passport.size,
            type: files.passport.type,
            }
        : null,

        transcript: files.transcript
        ? {
            name: files.transcript.name,
            size: files.transcript.size,
            type: files.transcript.type,
            }
        : null,

        certificates: files.certificates
        ? {
            name: files.certificates.name,
            size: files.certificates.size,
            type: files.certificates.type,
            }
        : null,

        englishTest: files.englishTest
        ? {
            name: files.englishTest.name,
            size: files.englishTest.size,
            type: files.englishTest.type,
            }
        : null,
    };

  sessionStorage.setItem(
    "uaams_new_application_documents",
    JSON.stringify(documentData)
  );

  router.push("/student/application/new/review");
    };

  const handleLogout = async () => {
    const auth = getFirebaseAuth();
    await signOut(auth);
    router.replace("/");
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

          <div style={activeStepItemStyle}>
            <span>STEP 2 : UPLOAD DOCUMENTS</span>
            <div style={activeStepLineStyle}></div>
          </div>

          <div style={stepItemStyle}>
            <span>STEP 3 : REVIEW & SUBMIT</span>
          </div>
        </section>

        <section style={formBoxStyle}>
          <div style={requirementsBoxStyle}>
            <h3 style={requirementsTitleStyle}>FILE REQUIREMENTS</h3>
            <ul style={requirementsListStyle}>
              <li>ACCEPTED FORMATS</li>
              <li>PDF, JPG, PNG</li>
              <li>MAX FILE SIZE</li>
              <li>ALL DOCUMENTS MUST BE CLEAR</li>
            </ul>
          </div>

          {errorMessage && <p style={errorStyle}>{errorMessage}</p>}

          <UploadField
            label="A. PASSPORT COPY*"
            fieldName="passport"
            file={files.passport}
            inputRef={passportInputRef}
            onFileChange={handleFileChange}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onRemoveFile={handleRemoveFile}
          />

          <UploadField
            label="B. ACADEMIC TRANSCRIPTS*"
            fieldName="transcript"
            file={files.transcript}
            inputRef={transcriptInputRef}
            onFileChange={handleFileChange}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onRemoveFile={handleRemoveFile}
          />

          <UploadField
            label="C. CERTIFICATES*"
            fieldName="certificates"
            file={files.certificates}
            inputRef={certificatesInputRef}
            onFileChange={handleFileChange}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onRemoveFile={handleRemoveFile}
          />

          <UploadField
            label="D. ENGLISH LANGUAGE TEST*"
            fieldName="englishTest"
            file={files.englishTest}
            inputRef={englishTestInputRef}
            onFileChange={handleFileChange}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onRemoveFile={handleRemoveFile}
          />

          <div style={buttonRowStyle}>
            <button
              type="button"
              style={secondaryButtonStyle}
              onClick={() => router.push("/student/application/new")}
            >
              BACK
            </button>

            <div style={rightButtonGroupStyle}>
              <button
                type="button"
                style={draftButtonStyle}
                onClick={handleSaveDraft}
              >
                SAVE AS DRAFT
              </button>

              <button
                type="button"
                style={primaryButtonStyle}
                onClick={handleContinueToReview}
              >
                CONTINUE TO REVIEW
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function UploadField({
  label,
  fieldName,
  file,
  inputRef,
  onFileChange,
  onDrop,
  onDragOver,
  onRemoveFile,
}) {
  return (
    <div style={uploadGroupStyle}>
      <label style={uploadLabelStyle}>{label}</label>

      {!file ? (
        <div
          style={uploadBoxStyle}
          onClick={() => inputRef.current?.click()}
          onDrop={(event) => onDrop(fieldName, event)}
          onDragOver={onDragOver}
        >
          <div style={uploadIconStyle}>☁</div>

          <p style={uploadTextStyle}>CLICK TO UPLOAD OR DRAG & DROP</p>

          <p style={uploadSubTextStyle}>
            ACCEPTED FORMATS : PDF, JPG, PNG | MAX SIZE: 5MB
          </p>

          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            style={{ display: "none" }}
            onChange={(event) => onFileChange(fieldName, event)}
          />
        </div>
      ) : (
        <div style={uploadedFileBoxStyle}>
          <div style={fileTopRowStyle}>
            <div style={fileInfoStyle}>
              <span style={fileIconStyle}>▣</span>

              <div>
                <p style={fileNameStyle}>{file.name.toUpperCase()}</p>
                <p style={fileSizeStyle}>{formatFileSize(file.size)}</p>
              </div>
            </div>

            <button
              type="button"
              style={deleteButtonStyle}
              onClick={() => onRemoveFile(fieldName, inputRef)}
              aria-label="Remove file"
            >
              🗑
            </button>
          </div>

          <button
            type="button"
            style={replaceButtonStyle}
            onClick={() => inputRef.current?.click()}
          >
            REPLACE FILE
          </button>

          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            style={{ display: "none" }}
            onChange={(event) => onFileChange(fieldName, event)}
          />
        </div>
      )}
    </div>
  );
}

function formatFileSize(bytes) {
  if (!bytes) return "0 KB";

  const sizeInKb = bytes / 1024;

  if (sizeInKb < 1024) {
    return `${sizeInKb.toFixed(2)} KB`;
  }

  return `${(sizeInKb / 1024).toFixed(2)} MB`;
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

const activeStepLineStyle = {
  flex: 1,
  borderTop: "2px dashed #000",
};

const formBoxStyle = {
  width: "100%",
  maxWidth: "1700px",
  margin: "0 auto",
  border: "2px solid #000",
  background: "#fff",
  padding: "34px 60px 32px",
  boxSizing: "border-box",
};

const requirementsBoxStyle = {
  background: "#F7F1E8",
  border: "2px solid #000",
  padding: "24px 30px",
  marginBottom: "30px",
};

const requirementsTitleStyle = {
  margin: "0 0 12px",
  fontSize: "18px",
  fontWeight: "900",
};

const requirementsListStyle = {
  margin: "0",
  paddingLeft: "22px",
  fontSize: "14px",
  fontWeight: "800",
  lineHeight: "1.8",
};

const errorStyle = {
  color: "red",
  fontSize: "15px",
  fontWeight: "800",
  margin: "0 0 18px",
};

const uploadGroupStyle = {
  marginBottom: "26px",
};

const uploadLabelStyle = {
  display: "block",
  fontSize: "16px",
  fontWeight: "900",
  marginBottom: "10px",
};

const uploadBoxStyle = {
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
  lineHeight: "34px",
  marginBottom: "8px",
};

const uploadTextStyle = {
  margin: "0",
  fontSize: "15px",
  fontWeight: "900",
};

const uploadSubTextStyle = {
  margin: "8px 0 0",
  fontSize: "13px",
  fontWeight: "800",
};

const uploadedFileBoxStyle = {
  minHeight: "95px",
  border: "2px solid #000",
  background: "#F7F1E8",
  padding: "18px 20px",
  boxSizing: "border-box",
};

const fileTopRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
};

const fileInfoStyle = {
  display: "flex",
  alignItems: "flex-start",
  gap: "14px",
};

const fileIconStyle = {
  fontSize: "22px",
  lineHeight: "22px",
  marginTop: "2px",
};

const fileNameStyle = {
  margin: 0,
  fontSize: "14px",
  fontWeight: "900",
};

const fileSizeStyle = {
  margin: "6px 0 0",
  fontSize: "12px",
  fontWeight: "700",
};

const deleteButtonStyle = {
  border: "none",
  background: "transparent",
  fontSize: "22px",
  cursor: "pointer",
  padding: 0,
};

const replaceButtonStyle = {
  marginTop: "14px",
  border: "none",
  background: "transparent",
  fontSize: "13px",
  fontWeight: "900",
  cursor: "pointer",
  padding: 0,
};

const buttonRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginTop: "30px",
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