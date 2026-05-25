"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import { getFirebaseAuth, getFirestoreDb } from "@/lib/firebase";

const STATUS_COLOURS = {
  Submitted: "#fff",
  Draft: "#fff",
  "Under Review": "#ffd500",
  Offered: "#48A111",
  Rejected: "#EF5350",
  "More Info Required": "#ffd500",
};

export default function StudentPage() {
  const router = useRouter();

  const [student, setStudent] = useState(null);
  const [applications, setApplications] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const [loading, setLoading] = useState(true);
  const [applicationsLoading, setApplicationsLoading] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [applicationError, setApplicationError] = useState("");
  const [notificationError, setNotificationError] = useState("");

  useEffect(() => {
    const auth = getFirebaseAuth();
    const db = getFirestoreDb();

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        router.replace("/");
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

        const userData = userSnap.data();

        const userRole = String(userData?.role || "")
          .trim()
          .toLowerCase();

        if (userRole !== "student") {
          router.replace("/admin");
          return;
        }

        setStudent(userData);

        setApplicationsLoading(true);
        setNotificationsLoading(true);
        setApplicationError("");
        setNotificationError("");

        try {
          const fetchedApplications = await fetchStudentApplications(
            db,
            firebaseUser
          );

          setApplications(fetchedApplications);
        } catch (error) {
          console.error("Applications fetch error:", error);
          setApplicationError("Unable to load applications.");
          setApplications([]);
        } finally {
          setApplicationsLoading(false);
        }

        try {
          const fetchedNotifications = await fetchStudentNotifications(
            db,
            firebaseUser
          );

          setNotifications(fetchedNotifications);
        } catch (error) {
          console.error("Notifications fetch error:", error);
          setNotificationError("Unable to load notifications.");
          setNotifications([]);
        } finally {
          setNotificationsLoading(false);
        }

        setLoading(false);
      } catch (error) {
        console.error("Student page error:", error);
        setErrorMessage("Unable to load student dashboard.");
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

  const handleStartNewApplication = () => {
    router.push("/student/application/new?reset=true");
  };

  const handleViewAllApplications = () => {
    const overviewSection = document.getElementById("applications-overview");

    if (overviewSection) {
      overviewSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleProfile = () => {
    router.push("/student/profile");
  };

  const handleUploadDocuments = () => {
    router.push("/student/documents");
  };

  const handleViewDetails = (applicationDocumentId) => {
    router.push(
      `/student/application/${encodeURIComponent(applicationDocumentId)}`
    );
  };

  const getStatusCount = (statusName) => {
    return applications.filter(
      (app) => normaliseStatus(app.status) === normaliseStatus(statusName)
    ).length;
  };

  const studentDisplayName =
    student?.displayName || student?.fullName || student?.name || "USER";

  const trackingItems = [
    { label: "SUBMITTED", count: getStatusCount("Submitted") },
    { label: "DRAFT", count: getStatusCount("Draft") },
    { label: "OFFERED", count: getStatusCount("Offered") },
    { label: "UNDER REVIEW", count: getStatusCount("Under Review") },
    { label: "REJECTED", count: getStatusCount("Rejected") },
  ];

  if (loading) {
    return (
      <main style={pageStyle}>
        <div style={dashboardFrame}>
          <h1 style={loadingText}>Loading student dashboard...</h1>
        </div>
      </main>
    );
  }

  if (errorMessage) {
    return (
      <main style={pageStyle}>
        <div style={dashboardFrame}>
          <h1>Student Dashboard</h1>
          <p style={{ color: "red" }}>{errorMessage}</p>

          <button type="button" onClick={() => router.replace("/")}>
            BACK TO HOME
          </button>
        </div>
      </main>
    );
  }

  return (
    <main style={pageStyle}>
      <div style={dashboardFrame}>
        <header style={topHeaderStyle}>
          <div>
            <h1 style={logoStyle}>UAAMS</h1>
            <p style={subtitleStyle}>
              University Administration & Application
              <br />
              Management System
            </p>
          </div>

          <button type="button" onClick={handleLogout} style={logoutButton}>
            LOGOUT
          </button>
        </header>

        <section style={welcomeBarStyle}>
          <h2 style={welcomeTitleStyle}>
            WELCOME {studentDisplayName.toUpperCase()}!
          </h2>

          <p style={welcomeTextStyle}>
            MANAGE AND TRACK YOUR APPLICATIONS HERE
          </p>
        </section>

        <section style={quickActionsStyle}>
          <h3 style={sectionTitleStyle}>QUICK ACTIONS</h3>

          <div style={quickButtonRow}>
            <button
              type="button"
              style={actionButton}
              onClick={handleStartNewApplication}
            >
              START NEW APPLICATION
            </button>

          

            <button type="button" style={actionButton} onClick={handleProfile}>
              PROFILE
            </button>

            <button
              type="button"
              style={actionButton}
              onClick={handleUploadDocuments}
            >
              UPLOAD DOCUMENTS
            </button>
          </div>
        </section>

        <section style={trackingSectionStyle}>
          <h3 style={sectionTitleStyle}>APPLICATIONS TRACKING</h3>

          <div style={trackingGridStyle}>
            {trackingItems.map((item) => (
              <div key={item.label} style={trackingBoxStyle}>
                <span>{item.label}</span>
                <strong style={trackingCountStyle}>{item.count}</strong>
              </div>
            ))}
          </div>
        </section>

        <section style={bottomGridStyle}>
          <div id="applications-overview" style={overviewBoxStyle}>
            <h3 style={sectionTitleStyle}>APPLICATIONS OVERVIEW</h3>

            {applicationError && (
              <p style={applicationErrorStyle}>{applicationError}</p>
            )}

            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>APPLICATION ID</th>
                  <th style={thStyle}>UNIVERSITY</th>
                  <th style={thStyle}>COURSE</th>
                  <th style={thStyle}>INTAKE</th>
                  <th style={thStyle}>STATUS</th>
                  <th style={thStyle}>ACTION</th>
                </tr>
              </thead>

              <tbody>
                {applicationsLoading && (
                  <tr>
                    <td colSpan={6} style={emptyRowStyle}>
                      Loading applications...
                    </td>
                  </tr>
                )}

                {!applicationsLoading && applications.length === 0 && (
                  <tr>
                    <td colSpan={6} style={emptyRowStyle}>
                      No applications found.
                    </td>
                  </tr>
                )}

                {!applicationsLoading &&
                  applications.map((app) => (
                    <tr key={app.documentId}>
                      <td style={tdStyle}>{app.id}</td>
                      <td style={tdStyle}>{app.university}</td>
                      <td style={tdStyle}>{app.course}</td>
                      <td style={tdStyle}>{app.intake}</td>
                      <td style={tdStyle}>
                        <span style={statusBadgeStyle(app.status)}>
                          {app.status}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <button
                          type="button"
                          style={detailsButton}
                          onClick={() => handleViewDetails(app.documentId)}
                        >
                          VIEW DETAILS
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          <aside style={notificationsBoxStyle}>
            <h3 style={notificationTitleStyle}>NOTIFICATIONS</h3>

            <div style={notificationListStyle}>
              {notificationsLoading && (
                <p style={notificationItemStyle}>Loading notifications...</p>
              )}

              {notificationError && (
                <p style={notificationErrorStyle}>{notificationError}</p>
              )}

              {!notificationsLoading &&
                !notificationError &&
                notifications.length === 0 && (
                  <p style={notificationItemStyle}>No notifications found.</p>
                )}

              {!notificationsLoading &&
                !notificationError &&
                notifications.map((notification) => (
                  <p key={notification.documentId} style={notificationItemStyle}>
                    {notification.message}
                  </p>
                ))}
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}

async function fetchStudentApplications(db, firebaseUser) {
  const applicationsRef = collection(db, "applications");

  const applicationsQuery = query(
    applicationsRef,
    where("studentId", "==", firebaseUser.uid)
  );

  const querySnapshot = await getDocs(applicationsQuery);

  return querySnapshot.docs
    .map((applicationDoc) => {
      const data = applicationDoc.data();
      return normaliseApplication(applicationDoc.id, data);
    })
    .sort((a, b) => {
      return getApplicationTime(b) - getApplicationTime(a);
    });
}

async function fetchStudentNotifications(db, firebaseUser) {
  const notificationsRef = collection(db, "notifications");

  const notificationsQuery = query(
    notificationsRef,
    where("studentId", "==", firebaseUser.uid)
  );

  const querySnapshot = await getDocs(notificationsQuery);

  return querySnapshot.docs
    .map((notificationDoc) => {
      const data = notificationDoc.data();

      return {
        documentId: notificationDoc.id,
        message:
          data?.message ||
          data?.title ||
          data?.notificationText ||
          data?.body ||
          "Notification",
        rawCreatedAt: data?.createdAt || data?.updatedAt || null,
      };
    })
    .sort((a, b) => {
      return getNotificationTime(b) - getNotificationTime(a);
    });
}

function normaliseApplication(documentId, data) {
  const rawStatus =
    data?.applicationStatus ||
    data?.status ||
    data?.pendingDecision ||
    "Draft";

  return {
    documentId,

    id:
      data?.applicationId ||
      data?.appId ||
      data?.referenceNumber ||
      documentId,

    university: formatDisplayValue(
      data?.university ||
        data?.selectedUniversity ||
        data?.universityName ||
        data?.institutionName
    ),

    course: formatDisplayValue(
      data?.course ||
        data?.courseName ||
        data?.selectedCourse ||
        data?.programmeName
    ),

    intake: formatDisplayValue(
      data?.intake ||
        data?.intendedIntake ||
        data?.startDate ||
        data?.intakeDate
    ),

    status: formatStudentStatus(rawStatus),

    rawCreatedAt: data?.createdAt || data?.submittedAt || data?.updatedAt || null,
  };
}

function formatStudentStatus(value) {
  const status = normaliseStatus(value);

  if (status === "offered" || status === "approved" || status === "accepted") {
    return "Offered";
  }

  if (status === "under review") {
    return "Under Review";
  }

  if (status === "rejected") {
    return "Rejected";
  }

  if (status === "submitted") {
    return "Submitted";
  }

  if (status === "draft") {
    return "Draft";
  }

  if (status === "more info required") {
    return "More Info Required";
  }

  return formatDisplayValue(value);
}

function formatDisplayValue(value) {
  if (!value) return "Not provided";

  if (typeof value === "string") {
    return value;
  }

  if (value?.toDate) {
    return value.toDate().toLocaleDateString("en-GB");
  }

  return String(value);
}

function normaliseStatus(status) {
  return String(status || "")
    .trim()
    .toLowerCase()
    .replaceAll("_", " ")
    .replaceAll("-", " ");
}

function getApplicationTime(application) {
  return getFirestoreDateTime(application?.rawCreatedAt);
}

function getNotificationTime(notification) {
  return getFirestoreDateTime(notification?.rawCreatedAt);
}

function getFirestoreDateTime(value) {
  if (!value) return 0;

  if (value?.toDate) {
    return value.toDate().getTime();
  }

  const dateValue = new Date(value).getTime();

  return Number.isNaN(dateValue) ? 0 : dateValue;
}

function statusBadgeStyle(status) {
  const background = STATUS_COLOURS[status] || "#fff";
  const isDark = status === "Offered" || status === "Rejected";

  return {
    display: "inline-block",
    minWidth: "68px",
    textAlign: "center",
    background,
    color: isDark ? "#fff" : "#071126",
    border: "1px solid #000",
    padding: "4px 8px",
    fontSize: "8px",
    fontWeight: "900",
    textTransform: "uppercase",
  };
}

const pageStyle = {
  minHeight: "100vh",
  width: "100%",
  background: "#F7F1E8",
  padding: "0",
  fontFamily: "Arial, Helvetica, sans-serif",
  boxSizing: "border-box",
};

const dashboardFrame = {
  minHeight: "calc(100vh - 20px)",
  width: "100%",

  background: "#F7F1E8",
  padding: "0 40px 50px",
  boxSizing: "border-box",
};

const topHeaderStyle = {
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

const logoutButton = {
  background: "#fff",
  border: "2px solid #3B2E5A",
  color: "#3B2E5A",
  padding: "14px 36px",
  fontSize: "16px",
  fontWeight: "700",
  cursor: "pointer",
};

const welcomeBarStyle = {
  border: "2px solid #000",
  background: "#fff",
  textAlign: "center",
  padding: "22px",
  width: "100%",
  maxWidth: "1700px",
  margin: "0 auto 30px",
  boxSizing: "border-box",
};

const welcomeTitleStyle = {
  margin: 0,
  fontSize: "34px",
  fontWeight: "900",
};

const welcomeTextStyle = {
  margin: "8px 0 0",
  fontSize: "18px",
  fontWeight: "700",
};

const quickActionsStyle = {
  width: "100%",
  maxWidth: "1700px",
  margin: "0 auto 30px",
  border: "2px solid #000",
  background: "#fff",
  padding: "28px 34px",
  boxSizing: "border-box",
};

const sectionTitleStyle = {
  margin: "0 0 20px",
  fontSize: "18px",
  fontWeight: "900",
};

const quickButtonRow = {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: "30px",
};

const actionButton = {
  height: "58px",
  background: "#fff",
  border: "2px solid #000",
  fontSize: "15px",
  fontWeight: "800",
  cursor: "pointer",
};

const trackingSectionStyle = {
  width: "100%",
  maxWidth: "1700px",
  margin: "0 auto 30px",
  border: "2px solid #000",
  background: "#fff",
  padding: "28px 34px",
  boxSizing: "border-box",
};

const trackingGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(5, 1fr)",
  gap: "26px",
};

const trackingBoxStyle = {
  height: "150px",
  background: "#fff",
  border: "2px solid #000",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "15px",
  fontWeight: "800",
  color: "#1d1535",
};

const trackingCountStyle = {
  marginTop: "18px",
  fontSize: "42px",
  fontWeight: "900",
};

const bottomGridStyle = {
  width: "100%",
  maxWidth: "1700px",
  margin: "0 auto",
  display: "grid",
  gridTemplateColumns: "1fr 380px",
  gap: "40px",
  alignItems: "start",
};

const overviewBoxStyle = {
  border: "2px solid #000",
  background: "#fff",
  padding: "24px",
  boxSizing: "border-box",
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: "15px",
};

const thStyle = {
  textAlign: "left",
  fontWeight: "900",
  padding: "16px 10px",
  borderTop: "2px solid #000",
  borderBottom: "2px solid #000",
};

const tdStyle = {
  padding: "16px 10px",
  borderBottom: "1px solid #ccc",
};

const emptyRowStyle = {
  padding: "24px 10px",
  textAlign: "center",
  fontWeight: "700",
};

const detailsButton = {
  background: "#3B2E5A",
  color: "#fff",
  border: "none",
  padding: "10px 14px",
  fontSize: "13px",
  fontWeight: "800",
  cursor: "pointer",
};

const applicationErrorStyle = {
  color: "red",
  fontSize: "14px",
  fontWeight: "800",
  margin: "0 0 12px",
};

const notificationsBoxStyle = {
  border: "2px solid #000",
  background: "#fff",
};

const notificationTitleStyle = {
  margin: 0,
  padding: "20px 24px",
  fontSize: "18px",
  fontWeight: "900",
  borderBottom: "2px solid #000",
};

const notificationListStyle = {
  padding: "22px 28px 28px",
};

const notificationItemStyle = {
  fontSize: "15px",
  lineHeight: "1.5",
  margin: "0 0 20px",
};

const notificationErrorStyle = {
  color: "red",
  fontSize: "14px",
  fontWeight: "800",
  margin: "0 0 18px",
};

const loadingText = {
  padding: "60px",
  fontSize: "30px",
  fontWeight: "900",
};

