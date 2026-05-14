"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/auth-context";
import { getApplicationById } from "@/lib/services/applicationService";

const DECISION_STATUSES = ["Under Review", "Offered", "Rejected"];

const STATUS_COLOURS = {
  "Under Review": "#ffd500",
  Offered: "#48A111",
  Rejected: "#EF5350",
};

const PENDING_DECISION_STORAGE_KEY = "uaams_admin_pending_decision";

export default function ApplicationDetailsPage() {
  const params = useParams();
  const router = useRouter();

  const { firebaseUser, userData, isUniversityAdmin, isLoading, signOut } =
    useAuth();

  const [application, setApplication] = useState(null);
  const [loadingApp, setLoadingApp] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [newStatus, setNewStatus] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [statusMessageType, setStatusMessageType] = useState("success");
  const [internalNote, setInternalNote] = useState("");

  const applicationId = params?.id;

  const loadApplication = async () => {
    try {
      setLoadingApp(true);
      setErrorMessage("");

      const data = await getApplicationById(applicationId);

      setApplication(data);

      const currentStatus = data?.applicationStatus || "";
      const allowedStatus = DECISION_STATUSES.includes(currentStatus)
        ? currentStatus
        : "Under Review";

      setNewStatus(allowedStatus);
    } catch (error) {
      console.error("Error loading application:", error);
      setErrorMessage("Failed to load application details.");
    } finally {
      setLoadingApp(false);
    }
  };

  useEffect(() => {
    if (!statusMessage) return;

    const timer = setTimeout(() => {
      setStatusMessage("");
    }, 3000);

    return () => clearTimeout(timer);
  }, [statusMessage]);

  useEffect(() => {
    if (isLoading) return;

    if (!firebaseUser) {
      router.push("/login");
      return;
    }

    if (!isUniversityAdmin) {
      alert("Access denied. Admins only.");
      router.push("/login");
      return;
    }

    if (applicationId) {
      loadApplication();
    }
  }, [isLoading, firebaseUser, isUniversityAdmin, applicationId, router]);

  const handleLogout = async () => {
    if (signOut) {
      await signOut();
    }

    router.push("/login");
  };

  const handleProcessDecision = () => {
    if (!application || !newStatus) {
      setStatusMessage("Please select a status before proceeding.");
      setStatusMessageType("error");
      return;
    }

    const selectedApplicationId = application.id || applicationId;

    if (typeof window !== "undefined") {
      sessionStorage.setItem(
        PENDING_DECISION_STORAGE_KEY,
        JSON.stringify({
          applicationId: selectedApplicationId,
          selectedStatus: newStatus,
          internalNote,
          admin: {
            uid: firebaseUser?.uid || "",
            name:
              userData?.displayName ||
              userData?.fullName ||
              firebaseUser?.displayName ||
              firebaseUser?.email ||
              "Admin",
          },
        })
      );
    }

    router.push(
      `/admin/applications/${selectedApplicationId}/decision?status=${encodeURIComponent(
        newStatus
      )}`
    );
  };

  if (isLoading || loadingApp) {
    return (
      <main style={pageStyle}>
        <div style={loadingBoxStyle}>Loading application details...</div>
      </main>
    );
  }

  if (errorMessage) {
    return (
      <main style={pageStyle}>
        <div style={errorBoxStyle}>
          <h1 style={errorTitleStyle}>Application Details</h1>
          <p style={errorTextStyle}>{errorMessage}</p>

          <button
            type="button"
            style={primaryButtonStyle}
            onClick={() => router.push("/admin")}
          >
            BACK TO APPLICATIONS
          </button>
        </div>
      </main>
    );
  }

  if (!application) {
    return (
      <main style={pageStyle}>
        <div style={errorBoxStyle}>
          <h1 style={errorTitleStyle}>Application not found</h1>
          <p style={errorTextStyle}>
            The application may have been deleted or the link may be invalid.
          </p>

          <button
            type="button"
            style={primaryButtonStyle}
            onClick={() => router.push("/admin")}
          >
            BACK TO APPLICATIONS
          </button>
        </div>
      </main>
    );
  }

  const documents = getDocuments(application);

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

          <nav style={navStyle}>
            <button
              type="button"
              style={navButtonStyle}
              onClick={() => router.push("/admin")}
            >
              DASHBOARD
            </button>

            <button
              type="button"
              style={navButtonStyle}
              onClick={() => router.push("/admin/applications")}
            >
              APPLICATIONS
            </button>

            <button type="button" style={navButtonStyle} onClick={handleLogout}>
              LOGOUT
            </button>
          </nav>
        </header>

        <section style={referenceBarStyle}>
          <div>
            <strong>APPLICATION REFERENCE:</strong>{" "}
            {application.applicationId || application.id || "N/A"}
          </div>

          <div>
            <strong>APPLICANT:</strong>{" "}
            {application.studentName || application.fullName || "N/A"}
          </div>

          <div>
            <strong>STATUS:</strong> {application.applicationStatus || "N/A"}
          </div>
        </section>

        <section style={contentGridStyle}>
          <div style={leftColumnStyle}>
            <InfoPanel title="A. PERSONAL INFORMATION">
              <InfoRow
                label="FULL NAME"
                value={application.studentName || application.fullName}
              />
              <InfoRow label="DATE OF BIRTH" value={application.dateOfBirth} />
              <InfoRow
                label="EMAIL ADDRESS"
                value={application.studentEmail || application.email}
              />
              <InfoRow label="NATIONALITY" value={application.nationality} />
              <InfoRow
                label="PASSPORT NUMBER"
                value={application.passportNumber}
              />
            </InfoPanel>

            <InfoPanel title="B. ACADEMIC INFORMATION">
              <InfoRow
                label="HIGHEST QUALIFICATION"
                value={application.highestQualification}
              />
              <InfoRow
                label="INSTITUTION NAME"
                value={application.institutionName}
              />
              <InfoRow
                label="GRADUATION YEAR"
                value={application.graduationYear}
              />
              <InfoRow label="GPA/GRADE" value={application.gpaGrade} />
            </InfoPanel>

            <InfoPanel title="C. COURSE INFORMATION">
              <InfoRow
                label="SELECTED UNIVERSITY"
                value={
                  application.selectedUniversity ||
                  application.universityName ||
                  application.university
                }
              />
              <InfoRow label="COURSE NAME" value={application.courseName} />
              <InfoRow
                label="INTENDED INTAKE"
                value={application.intendedIntake}
              />
            </InfoPanel>

            <InfoPanel title="D. UPLOADED DOCUMENTS">
              <DocumentsList documents={documents} />
            </InfoPanel>

            <button
              type="button"
              style={bottomBackButtonStyle}
              onClick={() => router.push("/admin")}
            >
              BACK TO APPLICATIONS
            </button>
          </div>

          <aside style={rightColumnStyle}>
            <SidePanel title="CURRENT STATUS">
              <div style={statusBadgeStyle(application.applicationStatus)}>
                {application.applicationStatus || "N/A"}
              </div>

              <p style={smallTextStyle}>
                SUBMITTED: {formatDate(application.submittedAt)}
              </p>
            </SidePanel>

            <SidePanel title="INTERNAL NOTES">
              <textarea
                value={internalNote}
                onChange={(event) => setInternalNote(event.target.value)}
                placeholder="Write admin notes here..."
                style={notesTextareaStyle}
              />
            </SidePanel>

            <SidePanel title="DECISION HISTORY">
              <ul style={historyListStyle}>
                <li>
                  Application submitted on {formatDate(application.submittedAt)}
                  .
                </li>
                <li>
                  Current status: {application.applicationStatus || "N/A"}.
                </li>
                {application.updatedAt && (
                  <li>Last updated on {formatDate(application.updatedAt)}.</li>
                )}
              </ul>
            </SidePanel>

            <SidePanel title="STATUS UPDATE">
              <div style={radioGroupStyle}>
                {DECISION_STATUSES.map((status) => {
                  const selected = newStatus === status;

                  return (
                    <label
                      key={status}
                      style={decisionRadioLabelStyle(status, selected)}
                    >
                      <input
                        type="radio"
                        name="applicationStatus"
                        value={status}
                        checked={selected}
                        onChange={(event) => {
                          setNewStatus(event.target.value);
                          setStatusMessage("");
                        }}
                        style={{
                          accentColor: STATUS_COLOURS[status],
                          cursor: "pointer",
                          transform: "scale(1.4)",
                        }}
                      />
                      <span>{status.toUpperCase()}</span>
                    </label>
                  );
                })}
              </div>
            </SidePanel>

            {statusMessage && (
              <p
                style={
                  statusMessageType === "success"
                    ? successMessageStyle
                    : errorMessageStyle
                }
              >
                {statusMessage}
              </p>
            )}

            <button
              type="button"
              style={processButtonStyle}
              onClick={handleProcessDecision}
            >
              PROCESS
            </button>
          </aside>
        </section>
      </div>
    </main>
  );
}

function InfoPanel({ title, children }) {
  return (
    <section style={panelStyle}>
      <h2 style={panelTitleStyle}>{title}</h2>
      <div style={panelContentStyle}>{children}</div>
    </section>
  );
}

function SidePanel({ title, children }) {
  return (
    <section style={sidePanelStyle}>
      <h2 style={sidePanelTitleStyle}>{title}</h2>
      {children}
    </section>
  );
}

function InfoRow({ label, value }) {
  return (
    <div style={infoRowStyle}>
      <span style={infoLabelStyle}>{label}</span>
      <span style={infoValueStyle}>{value || "N/A"}</span>
    </div>
  );
}

function DocumentsList({ documents }) {
  if (!documents || documents.length === 0) {
    return <p style={smallTextStyle}>No documents uploaded.</p>;
  }

  return (
    <div style={documentsListStyle}>
      {documents.map((documentItem) => (
        <div key={documentItem.key} style={documentItemStyle}>
          <span style={documentIconStyle}>☁</span>
          <span style={documentNameStyle}>{documentItem.label}</span>
          <span style={documentFileStyle}>{documentItem.name}</span>
          <strong style={documentStatusStyle}>UPLOADED</strong>
        </div>
      ))}
    </div>
  );
}

function getDocuments(application) {
  const source =
    application.documents ||
    application.uploadedDocuments ||
    application.studentDocuments ||
    {};

  const documentLabels = {
    passport: "PASSPORT COPY",
    transcript: "ACADEMIC TRANSCRIPT",
    certificates: "CERTIFICATES",
    englishTest: "ENGLISH LANGUAGE TEST",
  };

  if (Array.isArray(source)) {
    return source.map((item, index) => ({
      key: item.key || index,
      label: item.label || item.documentType || `DOCUMENT ${index + 1}`,
      name: item.name || item.fileName || "Uploaded file",
    }));
  }

  return Object.entries(source)
    .filter(([, value]) => value)
    .map(([key, value]) => ({
      key,
      label: documentLabels[key] || key,
      name:
        typeof value === "string"
          ? value
          : value.name || value.fileName || "Uploaded file",
    }));
}

function formatDate(value) {
  if (!value) return "N/A";

  try {
    const date =
      typeof value?.toDate === "function" ? value.toDate() : new Date(value);

    if (Number.isNaN(date.getTime())) return "N/A";

    return date.toLocaleDateString("en-GB");
  } catch {
    return "N/A";
  }
}

function normaliseDisplayStatus(status) {
  if (status === "Approved") return "Offered";
  if (status === "More Info Required") return "Under Review";
  return status;
}

function statusBadgeStyle(status) {
  const displayStatus = normaliseDisplayStatus(status);
  const background = STATUS_COLOURS[displayStatus] || "#EFEFEF";

  return {
    display: "inline-block",
    minWidth: "100%",
    padding: "18px 20px",
    border: "2px solid #000",
    background,
    color: displayStatus === "Under Review" ? "#000" : "#fff",
    fontSize: "20px",
    fontWeight: "900",
    textTransform: "uppercase",
    textAlign: "center",
    boxSizing: "border-box",
  };
}

function decisionRadioLabelStyle(status, selected) {
  return {
    border: "2px solid #3B2E5A",
    minHeight: "70px",
    display: "flex",
    alignItems: "center",
    gap: "16px",
    padding: "0 20px",
    fontSize: "18px",
    fontWeight: "900",
    cursor: "pointer",
    background: selected ? STATUS_COLOURS[status] : "#fff",
    color:
      selected && (status === "Offered" || status === "Rejected")
        ? "#fff"
        : "#071126",
  };
}

const pageStyle = {
  minHeight: "100vh",
  width: "100vw",
  maxWidth: "100vw",
  overflowX: "hidden",
  background: "#F7F1E8",
  padding: "20px",
  fontFamily: "Arial, Helvetica, sans-serif",
  color: "#071126",
};

const frameStyle = {
  width: "100%",
  minHeight: "calc(100vh - 40px)",
  border: "2px solid #000",
  background: "#F7F1E8",
};

const headerStyle = {
  minHeight: "120px",
  background: "#fff",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "0 60px",
  borderBottom: "2px solid rgba(0,0,0,0.15)",
  flexWrap: "wrap",
  gap: "20px",
};

const logoStyle = {
  margin: 0,
  fontSize: "48px",
  fontWeight: "900",
  lineHeight: "48px",
};

const subtitleStyle = {
  margin: "10px 0 0",
  fontSize: "16px",
  lineHeight: "24px",
  fontWeight: "500",
};

const navStyle = {
  display: "flex",
  alignItems: "center",
  gap: "20px",
  flexWrap: "wrap",
};

const navButtonStyle = {
  minWidth: "180px",
  height: "60px",
  background: "#fff",
  border: "2px solid #3B2E5A",
  color: "#3B2E5A",
  fontSize: "18px",
  fontWeight: "800",
  cursor: "pointer",
};

const referenceBarStyle = {
  width: "calc(100% - 80px)",
  margin: "30px auto",
  border: "2px solid #000",
  background: "#fff",
  minHeight: "90px",
  padding: "20px 30px",
  boxSizing: "border-box",
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  alignItems: "center",
  gap: "20px",
  fontSize: "18px",
  fontWeight: "700",
};

const contentGridStyle = {
  width: "calc(100% - 80px)",
  margin: "0 auto 40px",
  display: "grid",
  gridTemplateColumns: "2fr 1fr",
  gap: "30px",
  alignItems: "start",
};

const leftColumnStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "24px",
};

const rightColumnStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "24px",
};

const panelStyle = {
  border: "2px solid #000",
  background: "#fff",
  padding: "24px 30px",
};

const panelTitleStyle = {
  margin: "0 0 20px",
  fontSize: "24px",
  fontWeight: "900",
};

const panelContentStyle = {
  borderTop: "2px solid #000",
  paddingTop: "20px",
};

const infoRowStyle = {
  display: "grid",
  gridTemplateColumns: "280px 1fr",
  gap: "20px",
  marginBottom: "20px",
  fontSize: "18px",
};

const infoLabelStyle = {
  fontWeight: "900",
  textTransform: "uppercase",
};

const infoValueStyle = {
  fontWeight: "500",
  wordBreak: "break-word",
};

const sidePanelStyle = {
  border: "2px solid #000",
  background: "#fff",
  padding: "24px",
};

const sidePanelTitleStyle = {
  margin: "0 0 18px",
  paddingBottom: "14px",
  borderBottom: "2px solid #000",
  fontSize: "20px",
  fontWeight: "900",
};

const smallTextStyle = {
  margin: "16px 0 0",
  fontSize: "16px",
  fontWeight: "700",
};

const notesTextareaStyle = {
  width: "100%",
  minHeight: "180px",
  border: "2px solid #000",
  resize: "vertical",
  padding: "16px",
  boxSizing: "border-box",
  fontSize: "16px",
  outline: "none",
};

const historyListStyle = {
  margin: 0,
  paddingLeft: "24px",
  fontSize: "16px",
  lineHeight: "30px",
  fontWeight: "700",
};

const radioGroupStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "16px",
};

const processButtonStyle = {
  width: "100%",
  height: "80px",
  background: "#3B2E5A",
  color: "#fff",
  border: "2px solid #3B2E5A",
  fontSize: "22px",
  fontWeight: "900",
  cursor: "pointer",
};

const bottomBackButtonStyle = {
  width: "100%",
  height: "80px",
  background: "#3B2E5A",
  color: "#fff",
  border: "2px solid #3B2E5A",
  fontSize: "20px",
  fontWeight: "900",
  cursor: "pointer",
};

const documentsListStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "14px",
};

const documentItemStyle = {
  display: "grid",
  gridTemplateColumns: "50px 2fr 2fr 180px",
  alignItems: "center",
  gap: "16px",
  border: "2px solid #000",
  minHeight: "80px",
  padding: "12px 20px",
  fontSize: "16px",
  fontWeight: "800",
};

const documentIconStyle = {
  fontSize: "26px",
};

const documentNameStyle = {
  textTransform: "uppercase",
};

const documentFileStyle = {
  color: "#333",
  wordBreak: "break-word",
};

const documentStatusStyle = {
  color: "#48A111",
  textAlign: "right",
};

const successMessageStyle = {
  margin: 0,
  color: "#48A111",
  fontSize: "18px",
  fontWeight: "900",
};

const errorMessageStyle = {
  margin: 0,
  color: "#EF5350",
  fontSize: "18px",
  fontWeight: "900",
};

const loadingBoxStyle = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "32px",
  fontWeight: "800",
};

const errorBoxStyle = {
  width: "90%",
  maxWidth: "1000px",
  margin: "80px auto",
  border: "2px solid #000",
  background: "#fff",
  padding: "40px",
};

const errorTitleStyle = {
  margin: "0 0 20px",
  fontSize: "42px",
  fontWeight: "900",
};

const errorTextStyle = {
  color: "#EF5350",
  fontSize: "22px",
  fontWeight: "800",
};

const primaryButtonStyle = {
  marginTop: "30px",
  width: "280px",
  height: "70px",
  background: "#3B2E5A",
  color: "#fff",
  border: "2px solid #3B2E5A",
  fontSize: "18px",
  fontWeight: "900",
  cursor: "pointer",
};