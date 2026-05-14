"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/context/auth-context";
import {
  getApplicationById,
  updateApplicationStatus,
} from "@/lib/services/applicationService";

const DECISION_STATUSES = ["Under Review", "Offered", "Rejected"];

const OLD_DEFAULT_MESSAGE =
  "Your application has been reviewed. Please check your application status for the latest update.";

const STATUS_COLOURS = {
  "Under Review": "#ffd500",
  Offered: "#48A111",
  Rejected: "#EF5350",
};

function normaliseDecision(status) {
  const cleanStatus = String(status || "").trim().toLowerCase();

  const matchedStatus = DECISION_STATUSES.find(
    (decisionStatus) => decisionStatus.toLowerCase() === cleanStatus
  );

  return matchedStatus || "Under Review";
}

function cleanMessage(value) {
  const message = String(value || "").trim();

  if (!message) {
    return "";
  }

  if (message === OLD_DEFAULT_MESSAGE) {
    return "";
  }

  return message;
}

export default function DecisionPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const { firebaseUser, userData, isUniversityAdmin, isLoading, signOut } =
    useAuth();

  const applicationDocumentId = params?.id;

  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [messageToStudent, setMessageToStudent] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const selectedDecision = normaliseDecision(
    searchParams.get("status") ||
      application?.pendingDecision ||
      application?.applicationStatus ||
      application?.status ||
      "Under Review"
  );

  useEffect(() => {
    async function loadApplication() {
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

      if (!applicationDocumentId) {
        setErrorMessage("Application ID not found.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setErrorMessage("");

        const data = await getApplicationById(applicationDocumentId);

        if (!data) {
          setApplication(null);
          setErrorMessage("Application not found.");
          return;
        }

        setApplication(data);

        const messageFromUrl = cleanMessage(searchParams.get("message"));

        const savedMessage = cleanMessage(
          data?.messageToStudent ||
            data?.decisionMessage ||
            data?.internalNotes ||
            data?.internalNote ||
            ""
        );

        setMessageToStudent(messageFromUrl || savedMessage || "");
      } catch (error) {
        console.error("Decision page error:", error);
        setErrorMessage("Unable to load application decision page.");
      } finally {
        setLoading(false);
      }
    }

    loadApplication();
  }, [
    isLoading,
    firebaseUser,
    isUniversityAdmin,
    applicationDocumentId,
    router,
    searchParams,
  ]);

  const handleLogout = async () => {
    if (signOut) {
      await signOut();
    }

    router.push("/login");
  };

  const handleOpenConfirmModal = () => {
    const finalMessage = cleanMessage(messageToStudent);

    if (!finalMessage) {
      setErrorMessage("Please write a message to the student before confirming.");
      return;
    }

    setErrorMessage("");
    setShowConfirmModal(true);
  };

  const handleCancelConfirm = () => {
    if (confirming) return;
    setShowConfirmModal(false);
  };

  const handleConfirmDecision = async () => {
    if (!application || !firebaseUser) return;

    const finalMessage = cleanMessage(messageToStudent);

    if (!finalMessage) {
      setErrorMessage("Please write a message to the student before confirming.");
      setShowConfirmModal(false);
      return;
    }

    try {
      setConfirming(true);
      setErrorMessage("");

      await updateApplicationStatus(
        application.id,
        selectedDecision,
        {
          uid: firebaseUser.uid,
          name:
            userData?.displayName ||
            userData?.fullName ||
            firebaseUser.displayName ||
            firebaseUser.email ||
            "Admin",
        },
        finalMessage
      );

      router.push("/admin");
    } catch (error) {
      console.error("Confirm decision error:", error);
      setErrorMessage(error.message || "Unable to confirm decision.");
      setShowConfirmModal(false);
    } finally {
      setConfirming(false);
    }
  };

  if (isLoading || loading) {
    return (
      <main style={pageStyle}>
        <div style={loadingStyle}>Loading decision page...</div>
      </main>
    );
  }

  if (errorMessage && !application) {
    return (
      <main style={pageStyle}>
        <div style={errorBoxStyle}>
          <p style={errorTextStyle}>{errorMessage}</p>

          <button
            type="button"
            style={darkButtonStyle}
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
          <p style={errorTextStyle}>Application not found.</p>

          <button
            type="button"
            style={darkButtonStyle}
            onClick={() => router.push("/admin")}
          >
            BACK TO APPLICATIONS
          </button>
        </div>
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

        <section style={topBarStyle}>
          <div>
            <h2 style={topBarTitleStyle}>APPLICATION REVIEW</h2>
            <p style={topBarSubtitleStyle}>
              REVIEW THE STUDENT DETAILS, DOCUMENTS, AND UPDATE THE APPLICATION
              STATUS
            </p>
          </div>

          <div style={topBarIdBoxStyle}>
            <p style={smallLabelStyle}>APPLICATION ID</p>
            <strong>
              {application.applicationId || application.id || "APP ID"}
            </strong>
          </div>
        </section>

        <div style={contentWrapperStyle}>
          <section style={mainPanelStyle}>
            {errorMessage && (
              <div style={inlineErrorStyle}>{errorMessage}</div>
            )}

            <SectionBox title="DECISION SUMMARY">
              <InfoRow
                label="APPLICATION ID:"
                value={application.applicationId || application.id || "N/A"}
              />

              <InfoRow
                label="STUDENT NAME:"
                value={
                  application.studentName ||
                  application.fullName ||
                  application.displayName ||
                  "N/A"
                }
              />

              <InfoRow
                label="COURSE:"
                value={
                  application.courseName ||
                  application.course ||
                  application.selectedCourse ||
                  "N/A"
                }
              />

              <InfoRow
                label="SELECTED DECISION:"
                value={
                  <span style={decisionBadgeStyle(selectedDecision)}>
                    {String(selectedDecision).toUpperCase()}
                  </span>
                }
              />
            </SectionBox>

            <SectionBox title="MESSAGE TO STUDENT">
              <label style={textareaLabelStyle}>MESSAGE</label>

              <textarea
                value={messageToStudent}
                onChange={(event) => setMessageToStudent(event.target.value)}
                style={textareaStyle}
                placeholder="Write a message to the student..."
              />
            </SectionBox>

            <SectionBox title="SYSTEM ACTIONS">
              <CheckItem text="UPDATE APPLICATION STATUS AUTOMATICALLY" />
              <CheckItem text="CREATE DECISION HISTORY RECORD" />
              <CheckItem text="NOTIFY STUDENT ON DASHBOARD" />
              <CheckItem text="SEND DECISION EMAIL TO STUDENT" />
            </SectionBox>

            <SectionBox title="IMPORTANT">
              <p style={importantTextStyle}>
                PLEASE REVIEW ALL INFORMATION CAREFULLY BEFORE PROCEEDING. THE
                ACTION MAY UPDATE THE APPLICATION STATUS, STUDENT DASHBOARD, AND
                EMAIL NOTIFICATION.
              </p>
            </SectionBox>

            <div style={buttonRowStyle}>
              <button
                type="button"
                style={backButtonStyle}
                onClick={() =>
                  router.push(`/admin/applications/${application.id}`)
                }
              >
                BACK TO APPLICATION
              </button>

              <button
                type="button"
                style={proceedButtonStyle}
                onClick={handleOpenConfirmModal}
              >
                PROCEED
              </button>
            </div>
          </section>
        </div>

        {showConfirmModal && (
          <div style={modalOverlayStyle}>
            <div style={blurBackgroundStyle}></div>

            <div style={modalBoxStyle}>
              <div style={modalHeaderStyle}>CONFIRM DECISION</div>

              <div style={modalBodyStyle}>
                <p style={modalQuestionStyle}>
                  ARE YOU SURE YOU WANT TO PROCEED?
                </p>

                <div style={summaryBoxStyle}>
                  <p style={summaryTitleStyle}>DECISION SUMMARY</p>

                  <div style={modalInfoRowStyle}>
                    <span>APPLICATION ID:</span>
                    <strong>
                      {application.applicationId || application.id || "N/A"}
                    </strong>
                  </div>

                  <div style={modalInfoRowStyle}>
                    <span>DECISION:</span>
                    <strong style={modalDecisionBadgeStyle(selectedDecision)}>
                      {String(selectedDecision).toUpperCase()}
                    </strong>
                  </div>
                </div>

                <div style={messagePreviewStyle}>
                  <p style={summaryTitleStyle}>MESSAGE TO STUDENT</p>
                  <p style={messagePreviewTextStyle}>
                    {cleanMessage(messageToStudent)}
                  </p>
                </div>

                <div style={warningBoxStyle(selectedDecision)}>
                  THIS ACTION CANNOT BE UNDONE
                </div>

                <div style={modalButtonRowStyle}>
                  <button
                    type="button"
                    style={cancelModalButtonStyle}
                    onClick={handleCancelConfirm}
                    disabled={confirming}
                  >
                    CANCEL
                  </button>

                  <button
                    type="button"
                    style={confirmButtonStyle}
                    onClick={handleConfirmDecision}
                    disabled={confirming}
                  >
                    {confirming ? "CONFIRMING..." : "CONFIRM"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function SectionBox({ title, children }) {
  return (
    <section style={sectionBoxStyle}>
      <h3 style={sectionTitleStyle}>{title}</h3>
      <div>{children}</div>
    </section>
  );
}

function InfoRow({ label, value }) {
  return (
    <div style={infoRowStyle}>
      <span style={infoLabelStyle}>{label}</span>
      <span style={infoValueStyle}>{value}</span>
    </div>
  );
}

function CheckItem({ text }) {
  return (
    <div style={checkItemStyle}>
      <span style={checkIconStyle}>✓</span>
      <span>{text}</span>
    </div>
  );
}

function getStatusTextColour(status) {
  return status === "Under Review" ? "#071126" : "#fff";
}

function decisionBadgeStyle(status) {
  return {
    display: "inline-block",
    minWidth: "118px",
    background: STATUS_COLOURS[status] || "#EFEFEF",
    color: getStatusTextColour(status),
    padding: "8px 14px",
    fontSize: "8px",
    fontWeight: "900",
    textAlign: "center",
    textTransform: "uppercase",
  };
}

function modalDecisionBadgeStyle(status) {
  return {
    display: "inline-block",
    minWidth: "88px",
    background: STATUS_COLOURS[status] || "#EFEFEF",
    color: getStatusTextColour(status),
    padding: "8px 12px",
    fontSize: "7px",
    fontWeight: "900",
    textAlign: "center",
    textTransform: "uppercase",
  };
}

function warningBoxStyle(status) {
  return {
    background: "#F7F1E8",
    borderLeft: `3px solid ${STATUS_COLOURS[status] || "#EF5350"}`,
    padding: "12px",
    marginBottom: "14px",
    fontSize: "8px",
    fontWeight: "800",
  };
}

const pageStyle = {
  minHeight: "100vh",
  background: "#F7F1E8",
  padding: "10px",
  fontFamily: "Arial, Helvetica, sans-serif",
  color: "#071126",
};

const frameStyle = {
  minHeight: "calc(100vh - 20px)",
  border: "2px solid #000",
  background: "#F7F1E8",
  position: "relative",
  width: "100%",
};

const headerStyle = {
  width: "100%",
  maxWidth: "1700px",
  margin: "0 auto",
  minHeight: "110px",
  background: "#fff",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "0 50px",
  boxSizing: "border-box",
};

const logoStyle = {
  margin: 0,
  fontSize: "52px",
  fontWeight: "900",
  lineHeight: "50px",
};

const subtitleStyle = {
  margin: "6px 0 0",
  fontSize: "16px",
  lineHeight: "20px",
};

const navStyle = {
  display: "flex",
  alignItems: "center",
  gap: "40px",
};

const navButtonStyle = {
  background: "#fff",
  border: "2px solid #3B2E5A",
  color: "#000",
  minWidth: "160px",
  height: "52px",
  fontSize: "15px",
  fontWeight: "700",
  cursor: "pointer",
};

const topBarStyle = {
  width: "100%",
  maxWidth: "1700px",
  minHeight: "90px",
  margin: "24px auto 30px",
  border: "2px solid #000",
  background: "#fff",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "20px 40px",
  boxSizing: "border-box",
};

const topBarTitleStyle = {
  margin: 0,
  fontSize: "22px",
  fontWeight: "900",
};

const topBarSubtitleStyle = {
  margin: "6px 0 0",
  fontSize: "13px",
  fontWeight: "700",
  lineHeight: "18px",
};

const topBarIdBoxStyle = {
  fontSize: "14px",
  lineHeight: "20px",
};

const smallLabelStyle = {
  margin: 0,
  fontSize: "12px",
  fontWeight: "800",
};

const contentWrapperStyle = {
  width: "100%",
  maxWidth: "1700px",
  margin: "0 auto",
  padding: "0 20px",
  boxSizing: "border-box",
};

const mainPanelStyle = {
  width: "100%",
};

const sectionBoxStyle = {
  background: "#fff",
  border: "2px solid #000",
  padding: "28px 34px",
  marginBottom: "26px",
};

const sectionTitleStyle = {
  margin: "0 0 18px",
  paddingBottom: "12px",
  borderBottom: "2px solid #000",
  fontSize: "18px",
  fontWeight: "900",
};

const infoRowStyle = {
  display: "grid",
  gridTemplateColumns: "320px 1fr",
  alignItems: "center",
  marginBottom: "16px",
  fontSize: "15px",
};

const infoLabelStyle = {
  fontWeight: "900",
};

const infoValueStyle = {
  fontWeight: "700",
};

const textareaLabelStyle = {
  display: "block",
  marginBottom: "10px",
  fontSize: "13px",
  fontWeight: "900",
};

const textareaStyle = {
  width: "100%",
  minHeight: "180px",
  border: "2px solid #000",
  padding: "16px",
  fontSize: "14px",
  resize: "vertical",
  outline: "none",
  boxSizing: "border-box",
};

const checkItemStyle = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  marginBottom: "14px",
  fontSize: "14px",
  fontWeight: "700",
};

const checkIconStyle = {
  fontWeight: "900",
  fontSize: "16px",
};

const importantTextStyle = {
  margin: 0,
  fontSize: "13px",
  lineHeight: "24px",
  fontWeight: "700",
};

const buttonRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  marginTop: "20px",
};

const backButtonStyle = {
  width: "260px",
  height: "56px",
  background: "#3B2E5A",
  color: "#fff",
  border: "none",
  fontSize: "14px",
  fontWeight: "800",
  cursor: "pointer",
};

const proceedButtonStyle = {
  width: "260px",
  height: "56px",
  background: "#3B2E5A",
  color: "#fff",
  border: "none",
  fontSize: "14px",
  fontWeight: "800",
  cursor: "pointer",
};

const modalOverlayStyle = {
  position: "fixed",
  inset: 0,
  zIndex: 1000,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const blurBackgroundStyle = {
  position: "absolute",
  inset: 0,
  backdropFilter: "blur(5px)",
  background: "rgba(247, 241, 232, 0.55)",
};

const modalBoxStyle = {
  position: "relative",
  width: "600px",
  background: "#fff",
  border: "2px solid #000",
  zIndex: 1001,
};

const modalHeaderStyle = {
  background: "#3B2E5A",
  color: "#fff",
  padding: "24px 32px",
  fontSize: "18px",
  fontWeight: "900",
};

const modalBodyStyle = {
  padding: "30px 40px",
};

const modalQuestionStyle = {
  margin: "0 0 18px",
  fontSize: "15px",
  fontWeight: "900",
};

const summaryBoxStyle = {
  border: "2px solid #000",
  padding: "18px",
  marginBottom: "20px",
};

const summaryTitleStyle = {
  margin: "0 0 14px",
  paddingBottom: "8px",
  borderBottom: "1px solid #000",
  fontSize: "13px",
  fontWeight: "900",
};

const modalInfoRowStyle = {
  display: "grid",
  gridTemplateColumns: "180px 1fr",
  alignItems: "center",
  marginBottom: "14px",
  fontSize: "13px",
};

const modalButtonRowStyle = {
  display: "flex",
  justifyContent: "space-between",
};

const cancelModalButtonStyle = {
  width: "140px",
  height: "46px",
  background: "#fff",
  border: "2px solid #000",
  fontSize: "13px",
  fontWeight: "700",
  cursor: "pointer",
};

const confirmButtonStyle = {
  width: "180px",
  height: "46px",
  background: "#3B2E5A",
  color: "#fff",
  border: "none",
  fontSize: "13px",
  fontWeight: "800",
  cursor: "pointer",
};

const loadingStyle = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "24px",
  fontWeight: "800",
};

const errorBoxStyle = {
  maxWidth: "700px",
  margin: "120px auto",
  border: "2px solid #000",
  background: "#fff",
  padding: "40px",
};

const errorTextStyle = {
  color: "red",
  fontSize: "18px",
  fontWeight: "800",
};

const darkButtonStyle = {
  marginTop: "24px",
  background: "#3B2E5A",
  color: "#fff",
  border: "none",
  padding: "14px 24px",
  fontSize: "14px",
  fontWeight: "800",
  cursor: "pointer",
};

const inlineErrorStyle = {
  background: "#fff",
  border: "2px solid #EF5350",
  color: "#EF5350",
  padding: "14px 18px",
  marginBottom: "24px",
  fontSize: "14px",
  fontWeight: "800",
};

const messagePreviewStyle = {
  border: "2px solid #000",
  padding: "16px",
  marginBottom: "20px",
};

const messagePreviewTextStyle = {
  margin: 0,
  fontSize: "13px",
  lineHeight: "22px",
  fontWeight: "700",
};