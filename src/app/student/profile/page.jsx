// student profile page
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

import { getFirebaseAuth, getFirestoreDb } from "@/lib/firebase";
import { useLanguage } from "@/lib/context/language-context";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export default function StudentProfilePage() {
  const router = useRouter();
  const { t } = useLanguage();

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
        <div style={loadingBoxStyle}>{t("student.profile.loading")}</div>
      </main>
    );
  }

  if (errorMessage) {
    return (
      <main style={pageStyle}>
        <div style={loadingBoxStyle}>
          <p style={errorTextStyle}>{errorMessage}</p>
          <button style={purpleButtonStyle} onClick={() => router.push("/student")}>
            {t("student.profile.backToDashboard")}
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
            <LanguageSwitcher />
            <button style={navButtonStyle} onClick={handleLogout}>
              {t("nav.logout")}
            </button>
          </nav>
        </header>

        <section style={contentWrapperStyle}>
          <section style={mainPanelStyle}>
            <section style={quickActionsStyle}>
              <p style={quickActionsTitleStyle}>{t("student.profile.quickActions")}</p>

              <div style={quickActionsButtonsStyle}>
                <button
                  style={actionButtonStyle}
                  onClick={() => router.push("/student/application/new")}
                >
                  {t("student.profile.startNewApplication")}
                </button>

                <button
                  style={actionButtonStyle}
                  onClick={() => router.push("/student")}
                >
                  {t("student.profile.viewAllApplications")}
                </button>

                <button
                  style={actionButtonStyle}
                  onClick={() => router.push("/student/documents")}
                >
                  {t("student.profile.uploadDocuments")}
                </button>
              </div>
            </section>

            <section style={profileBoxStyle}>
              <ProfileSection title={t("student.profile.personalInfo")}>
                <ProfileRow label={t("student.profile.fullName")} value={fullName} />
                <ProfileRow label={t("student.profile.emailAddress")} value={emailAddress} />
                <ProfileRow label={t("student.profile.nationality")} value={nationality} />
                <ProfileRow
                  label={t("student.profile.levelOfStudy")}
                  value={intendedLevelOfStudy}
                />
              </ProfileSection>

              <ProfileSection title={t("student.profile.accountInfo")}>
                <ProfileRow label={t("student.profile.role")} value={role} />
                <ProfileRow
                  label={t("student.profile.emailVerification")}
                  value={firebaseUser?.emailVerified || student?.emailVerified ? t("student.profile.verified") : t("student.profile.notVerified")}
                />
                <ProfileRow
                  label={t("student.profile.accountCreated")}
                  value={accountCreatedDate}
                />
              </ProfileSection>
            </section>

            <button
              type="button"
              style={backDashboardButtonStyle}
              onClick={() => router.push("/student")}
            >
              {t("student.profile.backToDashboard")}
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

const contentWrapperStyle = {
  flex: 1,
  width: "100%",
  background: "#F7F1E8",
  padding: "30px 40px 50px",
  boxSizing: "border-box",
};

const mainPanelStyle = {
  width: "100%",
  maxWidth: "1700px",
  minHeight: "640px",
  margin: "0 auto",
  border: "2px solid #000",
  background: "#fff",
  padding: "34px 40px",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  boxSizing: "border-box",
};

const quickActionsStyle = {
  width: "100%",
  border: "2px solid #000",
  background: "#F7F1E8",
  padding: "24px 34px 36px",
  boxSizing: "border-box",
};

const quickActionsTitleStyle = {
  margin: "0 0 20px",
  fontSize: "18px",
  fontWeight: "900",
};

const quickActionsButtonsStyle = {
  width: "100%",
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: "30px",
};

const actionButtonStyle = {
  height: "58px",
  background: "#fff",
  border: "2px solid #000",
  color: "#3B2E5A",
  fontSize: "15px",
  fontWeight: "800",
  cursor: "pointer",
};

const profileBoxStyle = {
  width: "100%",
  minHeight: "390px",
  border: "2px solid #000",
  background: "#F7F1E8",
  marginTop: "26px",
  padding: "28px 40px 40px",
  boxSizing: "border-box",
};

const profileSectionStyle = {
  marginBottom: "34px",
};

const profileSectionTitleStyle = {
  margin: "0 0 18px",
  paddingBottom: "10px",
  borderBottom: "2px solid #000",
  fontSize: "18px",
  fontWeight: "900",
};

const profileRowsStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "20px",
};

const profileRowStyle = {
  display: "grid",
  gridTemplateColumns: "360px 1fr",
  alignItems: "center",
};

const profileLabelStyle = {
  margin: 0,
  fontSize: "15px",
  fontWeight: "800",
};

const profileValueStyle = {
  margin: 0,
  fontSize: "15px",
  fontWeight: "600",
};

const backDashboardButtonStyle = {
  marginTop: "36px",
  width: "240px",
  height: "52px",
  background: "#3B2E5A",
  color: "#fff",
  border: "none",
  fontSize: "15px",
  fontWeight: "800",
  cursor: "pointer",
};

const footerStyle = {
  minHeight: "160px",
  background: "#fff",
  borderTop: "2px solid #000",
  display: "grid",
  gridTemplateColumns: "1fr 1fr 1fr",
  padding: "28px 60px 22px",
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
  margin: "0 0 14px",
  fontSize: "18px",
  fontWeight: "900",
};

const footerTextStyle = {
  margin: "0 0 8px",
  fontSize: "13px",
  lineHeight: "18px",
};

const copyrightStyle = {
  height: "42px",
  borderTop: "1px solid #000",
  background: "#fff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "12px",
};

const loadingBoxStyle = {
  minHeight: "100vh",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: "16px",
  fontSize: "22px",
  fontWeight: "800",
};

const errorTextStyle = {
  color: "red",
  fontSize: "16px",
  fontWeight: "800",
};

const purpleButtonStyle = {
  background: "#3B2E5A",
  color: "#fff",
  border: "none",
  padding: "14px 28px",
  fontSize: "14px",
  fontWeight: "800",
  cursor: "pointer",
};