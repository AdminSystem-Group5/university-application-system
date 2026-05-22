// admin application detail with AI screening panel
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/auth-context";
import { getApplicationById } from "@/lib/services/applicationService";
import { useLanguage } from "@/lib/context/language-context";
import LanguageSwitcher from "@/components/LanguageSwitcher";

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

  const { t } = useLanguage();
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
      setErrorMessage(t("admin.applicationDetail.failedToLoad"));
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
      setStatusMessage(t("admin.applicationDetail.selectStatusFirst"));
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
        <div style={loadingBoxStyle}>{t("admin.applicationDetail.loading")}</div>
      </main>
    );
  }

  if (errorMessage) {
    return (
      <main style={pageStyle}>
        <div style={errorBoxStyle}>
          <h1 style={errorTitleStyle}>{t("admin.applicationDetail.loading")}</h1>
          <p style={errorTextStyle}>{errorMessage}</p>

          <button
            type="button"
            style={primaryButtonStyle}
            onClick={() => router.push("/admin")}
          >
            {t("admin.applicationDetail.backToApplications")}
          </button>
        </div>
      </main>
    );
  }

  if (!application) {
    return (
      <main style={pageStyle}>
        <div style={errorBoxStyle}>
          <h1 style={errorTitleStyle}>{t("admin.applicationDetail.notFound")}</h1>
          <p style={errorTextStyle}>
            {t("admin.applicationDetail.notFoundDesc")}
          </p>

          <button
            type="button"
            style={primaryButtonStyle}
            onClick={() => router.push("/admin")}
          >
            {t("admin.applicationDetail.backToApplications")}
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
            <LanguageSwitcher />
            <button
              type="button"
              style={navButtonStyle}
              onClick={() => router.push("/admin")}
            >
              {t("nav.dashboard")}
            </button>

            <button
              type="button"
              style={navButtonStyle}
              onClick={() => router.push("/admin/applications")}
            >
              {t("nav.applications")}
            </button>

            <button type="button" style={navButtonStyle} onClick={handleLogout}>
              {t("nav.logout")}
            </button>
          </nav>
        </header>

        <section style={referenceBarStyle}>
          <div>
            <strong>{t("admin.applicationDetail.appReference")}</strong>{" "}
            {application.applicationId || application.id || "N/A"}
          </div>

          <div>
            <strong>{t("admin.applicationDetail.applicant")}</strong>{" "}
            {application.studentName || application.fullName || "N/A"}
          </div>

          <div>
            <strong>{t("admin.applicationDetail.status")}</strong> {application.applicationStatus || "N/A"}
          </div>
        </section>

        <section style={contentGridStyle}>
          <div style={leftColumnStyle}>
            <InfoPanel title={t("admin.applicationDetail.personalInfo")}>
              <InfoRow
                label={t("admin.applicationDetail.fullName")}
                value={application.studentName || application.fullName}
              />
              <InfoRow label={t("admin.applicationDetail.dateOfBirth")} value={application.dateOfBirth} />
              <InfoRow
                label={t("admin.applicationDetail.emailAddress")}
                value={application.studentEmail || application.email}
              />
              <InfoRow label={t("admin.applicationDetail.nationality")} value={application.nationality} />
              <InfoRow
                label={t("admin.applicationDetail.passportNumber")}
                value={application.passportNumber}
              />
            </InfoPanel>

            <InfoPanel title={t("admin.applicationDetail.academicInfo")}>
              <InfoRow
                label={t("admin.applicationDetail.highestQualification")}
                value={application.highestQualification}
              />
              <InfoRow
                label={t("admin.applicationDetail.institutionName")}
                value={application.institutionName}
              />
              <InfoRow
                label={t("admin.applicationDetail.graduationYear")}
                value={application.graduationYear}
              />
              <InfoRow label={t("admin.applicationDetail.gpaGrade")} value={application.gpaGrade} />
            </InfoPanel>

            <InfoPanel title={t("admin.applicationDetail.courseInfo")}>
              <InfoRow
                label={t("admin.applicationDetail.selectedUniversity")}
                value={
                  application.selectedUniversity ||
                  application.universityName ||
                  application.university
                }
              />
              <InfoRow label={t("admin.applicationDetail.courseName")} value={application.courseName} />
              <InfoRow
                label={t("admin.applicationDetail.intendedIntake")}
                value={application.intendedIntake}
              />
            </InfoPanel>

            <InfoPanel title={t("admin.applicationDetail.uploadedDocs")}>
              <DocumentsList documents={documents} t={t} />
            </InfoPanel>

            <button
              type="button"
              style={bottomBackButtonStyle}
              onClick={() => router.push("/admin")}
            >
              {t("admin.applicationDetail.backToApplications")}
            </button>
          </div>

          <aside style={rightColumnStyle}>
            {application.submittedByAgent && (
              <div style={{ marginBottom: "16px", padding: "14px 18px", background: "#EDE7FF", border: "2px solid #3B2E5A", boxSizing: "border-box" }}>
                <p style={{ margin: "0 0 4px", fontSize: "11px", fontWeight: "900", color: "#3B2E5A" }}>{t("admin.applicationDetail.submittedViaAgent")}</p>
                <p style={{ margin: 0, fontSize: "14px", fontWeight: "700" }}>{application.agencyName || "Agency"}</p>
                <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#555" }}>{application.agentName || ""}</p>
              </div>
            )}

            <SidePanel title={t("admin.applicationDetail.currentStatus")}>
              <div style={statusBadgeStyle(application.applicationStatus)}>
                {application.applicationStatus || "N/A"}
              </div>

              <p style={smallTextStyle}>
                {t("admin.applicationDetail.submitted")} {formatDate(application.submittedAt)}
              </p>
            </SidePanel>

            <SidePanel title={t("admin.applicationDetail.paymentStatus")}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                <div style={{
                  display: "inline-block",
                  padding: "4px 14px",
                  fontWeight: "900",
                  fontSize: "13px",
                  background: application.paymentStatus === "paid" ? "#48A111" : application.paymentStatus === "waived" ? "#3B2E5A" : "#EF5350",
                  color: "#fff",
                }}>
                  {application.paymentStatus === "paid" ? t("admin.applicationDetail.paid") : application.paymentStatus === "waived" ? t("admin.applicationDetail.waived") : t("admin.applicationDetail.unpaid")}
                </div>
              </div>
              {application.paymentStatus === "paid" && (
                <p style={{ ...smallTextStyle, color: "#1e5c0f" }}>{t("admin.applicationDetail.feeReceived")}</p>
              )}
              {(!application.paymentStatus || application.paymentStatus === "unpaid") && (
                <p style={{ ...smallTextStyle, color: "#EF5350" }}>{t("admin.applicationDetail.feeNotPaid")}</p>
              )}
            </SidePanel>

            <SidePanel title={t("admin.applicationDetail.aiScreening")}>
              <AiScreeningPanel
                screening={application.aiScreening}
                applicationId={applicationId}
                application={application}
                onScreeningDone={(result) => setApplication((prev) => ({ ...prev, aiScreening: result }))}
                t={t}
              />
            </SidePanel>

            <SidePanel title={t("admin.applicationDetail.internalNotes")}>
              <textarea
                value={internalNote}
                onChange={(event) => setInternalNote(event.target.value)}
                placeholder={t("admin.applicationDetail.notesPlaceholder")}
                style={notesTextareaStyle}
              />
            </SidePanel>

            <SidePanel title={t("admin.applicationDetail.decisionHistory")}>
              <ul style={historyListStyle}>
                <li>
                  {t("admin.applicationDetail.appSubmittedOn")} {formatDate(application.submittedAt)}.
                </li>
                <li>
                  {t("admin.applicationDetail.currentStatusLabel")} {application.applicationStatus || "N/A"}.
                </li>
                {application.updatedAt && (
                  <li>{t("admin.applicationDetail.lastUpdatedOn")} {formatDate(application.updatedAt)}.</li>
                )}
              </ul>
            </SidePanel>

            <SidePanel title={t("admin.applicationDetail.statusUpdate")}>
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
              {t("admin.applicationDetail.process")}
            </button>
          </aside>
        </section>
      </div>
    </main>
  );
}

function AiScreeningPanel({ screening, applicationId, application, onScreeningDone, t }) {
  const [running, setRunning] = useState(false);
  const [runError, setRunError] = useState("");

  const handleRunScreening = async () => {
    setRunning(true);
    setRunError("");
    try {
      const res = await fetch("/api/ai/screen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId, applicationData: application }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) { setRunError(data.error || "Screening failed."); return; }

      const { doc: firestoreDoc, updateDoc: firestoreUpdate, serverTimestamp: ts } = await import("firebase/firestore");
      const { getFirestoreDb } = await import("@/lib/firebase");
      const db = getFirestoreDb();
      const result = { ...data.screening, screenedAt: new Date().toISOString() };
      await firestoreUpdate(firestoreDoc(db, "applications", applicationId), { aiScreening: result, updatedAt: ts() });
      onScreeningDone(result);
    } catch (err) {
      setRunError(err.message || "Failed to run screening.");
    } finally {
      setRunning(false);
    }
  };

  if (!screening) {
    return (
      <div>
        <p style={{ margin: "0 0 14px", fontSize: "14px", color: "#888", fontStyle: "italic" }}>
          {t("admin.applicationDetail.awaitingScreening")}
        </p>
        <button
          type="button"
          onClick={handleRunScreening}
          disabled={running}
          style={{ width: "100%", height: "40px", background: running ? "#ccc" : "#3B2E5A", color: "#fff", border: "none", fontSize: "13px", fontWeight: "900", cursor: running ? "not-allowed" : "pointer" }}
        >
          {running ? "Running…" : "Run AI Screening"}
        </button>
        {runError && <p style={{ color: "#EF5350", fontSize: "12px", marginTop: "8px" }}>{runError}</p>}
      </div>
    );
  }

  const score = screening.score ?? 0;
  const scoreColour = score >= 70 ? "#48A111" : score >= 40 ? "#f59e0b" : "#EF5350";

  const recColour =
    screening.recommendation === "Strong Candidate"
      ? "#48A111"
      : screening.recommendation === "Weak Candidate"
      ? "#EF5350"
      : "#f59e0b";

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "14px" }}>
        <div style={{
          width: "56px", height: "56px", borderRadius: "50%",
          background: scoreColour, color: "#fff",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "18px", fontWeight: "900", flexShrink: 0,
        }}>
          {score}
        </div>
        <div>
          <div style={{ fontSize: "11px", fontWeight: "900", color: "#555", marginBottom: "2px" }}>{t("admin.applicationDetail.scoreLabel")}</div>
          <div style={{ fontSize: "13px", fontWeight: "900", color: recColour }}>
            {screening.recommendation}
          </div>
        </div>
      </div>

      {screening.summary && (
        <p style={{ margin: "0 0 12px", fontSize: "13px", color: "#333", lineHeight: "1.5" }}>
          {screening.summary}
        </p>
      )}

      {screening.flags && screening.flags.length > 0 && (
        <div>
          <p style={{ margin: "0 0 6px", fontSize: "11px", fontWeight: "900", color: "#555" }}>{t("admin.applicationDetail.flags")}</p>
          <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "12px", color: "#444", lineHeight: "1.8" }}>
            {screening.flags.map((flag, i) => (
              <li key={i}>{flag}</li>
            ))}
          </ul>
        </div>
      )}

      {screening.screenedAt && (
        <p style={{ margin: "12px 0 0", fontSize: "11px", color: "#999" }}>
          Screened: {new Date(screening.screenedAt).toLocaleDateString("en-GB")}
          {" · "}Model: {screening.modelUsed || "gpt-3.5-turbo"}
        </p>
      )}

      <button
        type="button"
        onClick={handleRunScreening}
        disabled={running}
        style={{ marginTop: "14px", width: "100%", height: "36px", background: running ? "#ccc" : "#F7F1E8", color: "#3B2E5A", border: "2px solid #3B2E5A", fontSize: "12px", fontWeight: "900", cursor: running ? "not-allowed" : "pointer" }}
      >
        {running ? "Running…" : "Re-run AI Screening"}
      </button>
      {runError && <p style={{ color: "#EF5350", fontSize: "12px", marginTop: "8px" }}>{runError}</p>}
    </div>
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

function DocumentsList({ documents, t }) {
  if (!documents || documents.length === 0) {
    return <p style={smallTextStyle}>{t("admin.applicationDetail.noDocuments")}</p>;
  }

  return (
    <div style={documentsListStyle}>
      {documents.map((documentItem) => (
        <div key={documentItem.key} style={documentItemStyle}>
          <span style={documentIconStyle}>☁</span>
          <span style={documentNameStyle}>{documentItem.label}</span>
          <span style={documentFileStyle}>{documentItem.name}</span>
          <strong style={documentStatusStyle}>{t("admin.applicationDetail.uploaded")}</strong>
        </div>
      ))}
    </div>
  );
}

function getDocuments(application) {
  // Prefer studentDocuments collection data (checklist format) over application-embedded docs
  const source =
    application._studentDocuments ||
    application.documents ||
    application.uploadedDocuments ||
    application.studentDocuments ||
    {};

  const documentLabels = {
    passport:     "PASSPORT COPY",
    transcript:   "ACADEMIC TRANSCRIPT",
    certificates: "CERTIFICATES",
    englishTest:  "ENGLISH LANGUAGE TEST",
  };

  if (Array.isArray(source)) {
    return source.map((item, index) => ({
      key:   item.key || index,
      label: item.label || item.documentType || `DOCUMENT ${index + 1}`,
      name:  item.name || item.fileName || "Provided",
    }));
  }

  return Object.entries(source)
    .filter(([, value]) => {
      if (!value) return false;
      // {provided: false} means student un-ticked it — exclude
      if (typeof value === "object" && value.provided === false) return false;
      return true;
    })
    .map(([key, value]) => ({
      key,
      label: documentLabels[key] || key.toUpperCase(),
      name:
        typeof value === "string"
          ? value
          : value.name || value.fileName || (value.provided ? "Confirmed ready" : "Provided"),
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
  width: "100%",
  background: "#F7F1E8",
  fontFamily: "Arial, Helvetica, sans-serif",
  color: "#071126",
};

const frameStyle = {
  minHeight: "calc(100vh - 20px)",
  width: "100%",

  background: "#F7F1E8",
  padding: "0 40px 50px",
  boxSizing: "border-box",
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