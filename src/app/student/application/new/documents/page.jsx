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
  background: "#F7F1E8",
  padding: "6px",
  fontFamily: "Arial, Helvetica, sans-serif",
};

const frameStyle = {
  minHeight: "calc(100vh - 12px)",
  border: "1.5px solid #000",
  background: "#F7F1E8",
  padding: "0 110px 40px",
};

const headerStyle = {
  height: "72px",
  background: "#fff",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "0 28px",
  margin: "0 -110px 8px",
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

const titleBarStyle = {
  maxWidth: "900px",
  height: "36px",
  margin: "0 auto 18px",
  border: "1.5px solid #000",
  display: "grid",
  gridTemplateColumns: "180px 1fr 180px",
  alignItems: "center",
  background: "#F7F1E8",
};

const backDashboardButtonStyle = {
  marginLeft: "20px",
  width: "130px",
  height: "24px",
  background: "#3B2E5A",
  color: "#fff",
  border: "none",
  fontSize: "9px",
  fontWeight: "700",
  cursor: "pointer",
};

const titleTextWrapperStyle = {
  textAlign: "center",
};

const pageTitleStyle = {
  margin: 0,
  fontSize: "16px",
  fontWeight: "800",
};

const pageSubtitleStyle = {
  margin: 0,
  fontSize: "8px",
  fontWeight: "700",
};

const stepWrapperStyle = {
  maxWidth: "900px",
  margin: "0 auto 12px",
  display: "grid",
  gridTemplateColumns: "1fr 1fr 1fr",
  gap: "30px",
  fontSize: "8px",
  fontWeight: "700",
};

const stepItemStyle = {
  display: "flex",
  alignItems: "center",
  gap: "16px",
};

const activeStepItemStyle = {
  display: "flex",
  alignItems: "center",
  gap: "16px",
  fontWeight: "900",
};

const stepLineStyle = {
  flex: 1,
  borderTop: "1px dashed #999",
};

const activeStepLineStyle = {
  flex: 1,
  borderTop: "1px dashed #333",
};

const formBoxStyle = {
  maxWidth: "900px",
  margin: "0 auto",
  border: "1.5px solid #000",
  background: "#fff",
  padding: "22px 66px 14px",
};

const requirementsBoxStyle = {
  background: "#F7F1E8",
  padding: "10px 18px",
  marginBottom: "10px",
};

const requirementsTitleStyle = {
  margin: 0,
  fontSize: "9px",
  fontWeight: "900",
};

const requirementsListStyle = {
  margin: "4px 0 0",
  paddingLeft: "16px",
  fontSize: "8px",
  fontWeight: "700",
};

const errorStyle = {
  color: "red",
  fontSize: "10px",
  fontWeight: "700",
  margin: "0 0 8px",
};

const uploadGroupStyle = {
  marginBottom: "8px",
};

const uploadLabelStyle = {
  display: "block",
  fontSize: "9px",
  fontWeight: "900",
  marginBottom: "2px",
};

const uploadBoxStyle = {
  height: "66px",
  border: "1px dashed #000",
  background: "#F7F1E8",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
};

const uploadIconStyle = {
  fontSize: "18px",
  lineHeight: "16px",
};

const uploadTextStyle = {
  margin: "2px 0 0",
  fontSize: "8px",
  fontWeight: "900",
};

const uploadSubTextStyle = {
  margin: 0,
  fontSize: "8px",
  fontWeight: "900",
};

const uploadedFileBoxStyle = {
  minHeight: "54px",
  border: "1.5px solid #000",
  background: "#F7F1E8",
  padding: "8px 10px 7px",
};

const fileTopRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
};

const fileInfoStyle = {
  display: "flex",
  alignItems: "flex-start",
  gap: "8px",
};

const fileIconStyle = {
  fontSize: "13px",
  lineHeight: "13px",
  marginTop: "2px",
};

const fileNameStyle = {
  margin: 0,
  fontSize: "8px",
  fontWeight: "900",
};

const fileSizeStyle = {
  margin: "1px 0 0",
  fontSize: "7px",
  fontWeight: "700",
};

const deleteButtonStyle = {
  border: "none",
  background: "transparent",
  fontSize: "12px",
  cursor: "pointer",
  padding: 0,
};

const replaceButtonStyle = {
  marginTop: "4px",
  border: "none",
  background: "transparent",
  fontSize: "8px",
  fontWeight: "900",
  cursor: "pointer",
  padding: 0,
};

const buttonRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginTop: "18px",
};

const rightButtonGroupStyle = {
  display: "flex",
  gap: "12px",
};

const secondaryButtonStyle = {
  width: "80px",
  height: "30px",
  background: "#fff",
  border: "1.5px solid #000",
  fontSize: "9px",
  fontWeight: "700",
  cursor: "pointer",
};

const draftButtonStyle = {
  width: "84px",
  height: "30px",
  background: "#fff",
  border: "1.5px solid #3B2E5A",
  color: "#3B2E5A",
  fontSize: "8px",
  fontWeight: "700",
  cursor: "pointer",
};

const primaryButtonStyle = {
  width: "140px",
  height: "30px",
  background: "#3B2E5A",
  border: "1.5px solid #3B2E5A",
  color: "#fff",
  fontSize: "8px",
  fontWeight: "700",
  cursor: "pointer",
};