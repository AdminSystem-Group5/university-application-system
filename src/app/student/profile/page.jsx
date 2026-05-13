"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

import { getFirebaseAuth, getFirestoreDb } from "@/lib/firebase";

export default function StudentProfilePage() {
  const router = useRouter();

  const [student, setStudent] = useState(null);
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

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
        const role = String(userData?.role || "").toLowerCase();

        if (role !== "student") {
          router.replace("/admin");
          return;
        }

        setStudent(userData);
        setLoading(false);
      } catch (error) {
        console.error("Profile page error:", error);
        setErrorMessage("Unable to load student profile.");
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

  const fullName =
    student?.displayName ||
    student?.fullName ||
    student?.name ||
    firebaseUser?.displayName ||
    "Not provided";

  const emailAddress =
    student?.email ||
    firebaseUser?.email ||
    "Not provided";

  const nationality =
    student?.nationality ||
    "Not provided";

  const intendedLevelOfStudy =
    student?.levelOfStudy ||
    student?.intendedLevelOfStudy ||
    student?.highestQualification ||
    "Not provided";

  const role =
    student?.role ||
    "Student";

  const emailVerificationStatus =
    firebaseUser?.emailVerified || student?.emailVerified
      ? "Verified"
      : "Not verified";

  const accountCreatedDate = formatDate(
    student?.createdAt || firebaseUser?.metadata?.creationTime
  );

  if (loading) {
    return (
      <main style={pageStyle}>
        <div style={loadingBoxStyle}>Loading profile...</div>
      </main>
    );
  }

  if (errorMessage) {
    return (
      <main style={pageStyle}>
        <div style={loadingBoxStyle}>
          <p style={errorTextStyle}>{errorMessage}</p>
          <button style={purpleButtonStyle} onClick={() => router.push("/student")}>
            BACK TO DASHBOARD
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

          <nav style={topNavStyle}>


            <button style={navButtonStyle} onClick={handleLogout}>
              LOGOUT
            </button>
          </nav>
        </header>

        <section style={contentWrapperStyle}>
          <section style={mainPanelStyle}>
            <section style={quickActionsStyle}>
              <p style={quickActionsTitleStyle}>QUICK ACTIONS</p>

              <div style={quickActionsButtonsStyle}>
                <button
                  style={actionButtonStyle}
                  onClick={() => router.push("/student/application/new")}
                >
                  START NEW APPLICATION
                </button>

                <button
                  style={actionButtonStyle}
                  onClick={() => router.push("/student")}
                >
                  VIEW ALL APPLICATIONS
                </button>

                <button
                  style={actionButtonStyle}
                  onClick={() => router.push("/student/documents")}
                >
                  UPLOAD DOCUMENTS
                </button>
              </div>
            </section>

            <section style={profileBoxStyle}>
              <ProfileSection title="A. PERSONAL INFORMATION">
                <ProfileRow label="FULL NAME:" value={fullName} />
                <ProfileRow label="EMAIL ADDRESS:" value={emailAddress} />
                <ProfileRow label="NATIONALITY:" value={nationality} />
                <ProfileRow
                  label="INTENDED LEVEL OF STUDY:"
                  value={intendedLevelOfStudy}
                />
              </ProfileSection>

              <ProfileSection title="B. ACCOUNT INFORMATION">
                <ProfileRow label="ROLE:" value={role} />
                <ProfileRow
                  label="EMAIL VERIFICATION STATUS:"
                  value={emailVerificationStatus}
                />
                <ProfileRow
                  label="ACCOUNT CREATED DATE:"
                  value={accountCreatedDate}
                />
              </ProfileSection>
            </section>

            <button
              type="button"
              style={backDashboardButtonStyle}
              onClick={() => router.push("/student")}
            >
              BACK TO DASHBOARD
            </button>
          </section>
        </section>
      </div>
    </main>
  );
}

function ProfileSection({ title, children }) {
  return (
    <section style={profileSectionStyle}>
      <h2 style={profileSectionTitleStyle}>{title}</h2>
      <div style={profileRowsStyle}>{children}</div>
    </section>
  );
}

function ProfileRow({ label, value }) {
  return (
    <div style={profileRowStyle}>
      <p style={profileLabelStyle}>{label}</p>
      <p style={profileValueStyle}>{String(value || "Not provided").toUpperCase()}</p>
    </div>
  );
}

function formatDate(value) {
  if (!value) return "Not provided";

  let date;

  if (value?.toDate) {
    date = value.toDate();
  } else {
    date = new Date(value);
  }

  if (Number.isNaN(date.getTime())) {
    return "Not provided";
  }

  return date
    .toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    })
    .toUpperCase();
}

const pageStyle = {
  minHeight: "100vh",
  background: "#F7F1E8",
  padding: "6px",
  fontFamily: "Arial, Helvetica, sans-serif",
  color: "#071126",
};

const frameStyle = {
  minHeight: "calc(100vh - 12px)",
  border: "1.5px solid #000",
  background: "#F7F1E8",
};

const headerStyle = {
  height: "86px",
  background: "#fff",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "0 135px",
};

const logoStyle = {
  margin: 0,
  fontSize: "32px",
  fontWeight: "900",
  lineHeight: "32px",
};

const subtitleStyle = {
  margin: "4px 0 0",
  fontSize: "14px",
  lineHeight: "18px",
};

const topNavStyle = {
  display: "flex",
  alignItems: "center",
  gap: "76px",
};

const navButtonStyle = {
  background: "#fff",
  border: "1.5px solid #3B2E5A",
  color: "#3B2E5A",
  minWidth: "86px",
  height: "36px",
  padding: "0 18px",
  fontSize: "12px",
  fontWeight: "800",
  cursor: "pointer",
};

const contentWrapperStyle = {
  background: "#F7F1E8",
  padding: "16px 0 44px",
};

const mainPanelStyle = {
  maxWidth: "900px",
  minHeight: "585px",
  margin: "0 auto",
  border: "2px solid #000",
  background: "#fff",
  padding: "24px 26px",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
};

const quickActionsStyle = {
  width: "100%",
  border: "2px solid #000",
  background: "#F7F1E8",
  padding: "10px 30px 34px",
  boxSizing: "border-box",
};

const quickActionsTitleStyle = {
  margin: "0 0 16px",
  fontSize: "13px",
  fontWeight: "500",
};

const quickActionsButtonsStyle = {
  display: "flex",
  justifyContent: "center",
  gap: "34px",
};

const actionButtonStyle = {
  width: "170px",
  height: "28px",
  background: "#fff",
  border: "2px solid #000",
  color: "#3B2E5A",
  fontSize: "11px",
  fontWeight: "800",
  cursor: "pointer",
};

const profileBoxStyle = {
  width: "680px",
  minHeight: "330px",
  border: "2px solid #000",
  background: "#F7F1E8",
  marginTop: "16px",
  padding: "6px 26px 34px",
  boxSizing: "border-box",
};

const profileSectionStyle = {
  marginBottom: "22px",
};

const profileSectionTitleStyle = {
  margin: "0 0 8px",
  paddingBottom: "4px",
  borderBottom: "1.5px solid #000",
  fontSize: "14px",
  fontWeight: "900",
};

const profileRowsStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "14px",
};

const profileRowStyle = {
  display: "grid",
  gridTemplateColumns: "270px 1fr",
  alignItems: "center",
};

const profileLabelStyle = {
  margin: 0,
  fontSize: "11px",
  fontWeight: "500",
};

const profileValueStyle = {
  margin: 0,
  fontSize: "11px",
  fontWeight: "500",
};

const backDashboardButtonStyle = {
  marginTop: "36px",
  width: "170px",
  height: "30px",
  background: "#3B2E5A",
  color: "#fff",
  border: "none",
  fontSize: "11px",
  fontWeight: "800",
  cursor: "pointer",
};

const footerStyle = {
  minHeight: "120px",
  background: "#fff",
  borderTop: "1px solid rgba(0,0,0,0.2)",
  display: "grid",
  gridTemplateColumns: "1fr 1fr 1fr",
  padding: "12px 135px 8px",
  boxSizing: "border-box",
};

const footerColumnStyle = {
  textAlign: "left",
};

const footerCenterStyle = {
  textAlign: "center",
};

const footerColumnRightStyle = {
  textAlign: "right",
};

const footerTitleStyle = {
  margin: "0 0 10px",
  fontSize: "16px",
  fontWeight: "900",
};

const footerTextStyle = {
  margin: "0 0 7px",
  fontSize: "10px",
  lineHeight: "10px",
};

const copyrightStyle = {
  height: "30px",
  borderTop: "1px solid #000",
  background: "#fff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "10px",
};

const loadingBoxStyle = {
  minHeight: "100vh",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: "16px",
  fontSize: "16px",
  fontWeight: "700",
};

const errorTextStyle = {
  color: "red",
  fontSize: "14px",
  fontWeight: "700",
};

const purpleButtonStyle = {
  background: "#3B2E5A",
  color: "#fff",
  border: "none",
  padding: "10px 22px",
  fontSize: "11px",
  fontWeight: "800",
  cursor: "pointer",
};