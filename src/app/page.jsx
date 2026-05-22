"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { getFirebaseAuth, getFirestoreDb } from "@/lib/firebase";
import { useLanguage } from "@/lib/context/language-context";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export default function HomePage() {
  const router = useRouter();
  const { t } = useLanguage();

  const [showLogin, setShowLogin] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const closeLoginModal = () => {
    setShowLogin(false);
    setErrorMessage("");
    setEmail("");
    setPassword("");
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    setErrorMessage("");
    setLoading(true);

    try {
      const auth = getFirebaseAuth();
      const db = getFirestoreDb();

      const userCredential = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      const firebaseUser = userCredential.user;

      const userRef = doc(db, "users", firebaseUser.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        setErrorMessage("User profile not found.");
        setLoading(false);
        return;
      }

      const userData = userSnap.data();

      const userRole = String(userData?.role || "")
        .trim()
        .toLowerCase();

      if (userRole === "student") {
        router.replace("/student");
        return;
      }

      if (userRole === "admin" || userRole === "university_admin") {
        router.replace("/admin");
        return;
      }

      if (userRole === "agent") {
        router.replace("/agent");
        return;
      }

      setErrorMessage("User role not recognised.");
      setLoading(false);
    } catch (error) {
      console.error("Login error:", error);

      if (error.code === "auth/invalid-credential") {
        setErrorMessage("Invalid email or password.");
      } else if (error.code === "auth/user-not-found") {
        setErrorMessage("No account found with this email.");
      } else if (error.code === "auth/wrong-password") {
        setErrorMessage("Incorrect password.");
      } else if (error.code === "permission-denied") {
        setErrorMessage("Firestore permission denied.");
      } else {
        setErrorMessage("Login failed. Please try again.");
      }

      setLoading(false);
    }
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "#F7F1E8",
      }}
    >
      <header className="topbar">
        <div className="container topbar-content">
          <div className="brand-block">
            <h1 className="logo">UAAMS</h1>
          </div>

          <div className="nav-center">
            <button
              type="button"
              onClick={() => router.push("/partners")}
              className="btn btn-outline nav-btn"
            >
              {t("nav.partners")}
            </button>

            <button
              type="button"
              onClick={() => router.push("/about")}
              className="btn btn-outline nav-btn"
            >
              {t("nav.aboutUs")}
            </button>
          </div>

          <div className="topbar-actions">
            <LanguageSwitcher />
            <button
              type="button"
              onClick={() => {
                setErrorMessage("");
                setShowLogin(true);
              }}
              className="btn btn-outline"
            >
              {t("nav.login")}
            </button>

            <button
              type="button"
              onClick={() => router.push("/register")}
              className="btn btn-primary"
            >
              {t("nav.register")}
            </button>
          </div>
        </div>
      </header>

      <section
        style={{
          flex: 1,
          padding: "40px 40px",
        }}
      >
        <div style={{ filter: showLogin ? "blur(4px)" : "none" }}>
          <div
            style={{
              width: "100%",
              maxWidth: "1440px",
              margin: "0 auto",
              border: "2px solid #000",
              background: "#fff",
              padding: "80px 60px",
              textAlign: "center",
            }}
          >
            <span
              style={{
                display: "inline-block",
                padding: "8px 18px",
                background: "#3B2E5A",
                color: "#fff",
                fontSize: "0.85rem",
                fontWeight: 700,
                marginBottom: "22px",
              }}
            >
              {t("home.smartPlatform")}
            </span>

            <h2
              style={{
                fontSize: "2.4rem",
                fontWeight: 800,
                marginBottom: "20px",
              }}
            >
              {t("home.heroTitle")}
            </h2>

            <p
              style={{
                maxWidth: "700px",
                margin: "0 auto",
                marginBottom: "36px",
              }}
            >
              {t("home.heroDesc")}
            </p>

            <button
              type="button"
              onClick={() => router.push("/register")}
              className="btn btn-outline"
              style={{
                border: "2px solid #3B2E5A",
                fontWeight: 700,
                padding: "14px 28px",
              }}
            >
              {t("home.registerNow")}
            </button>
          </div>

          <div
            style={{
              maxWidth: "1440px",
              margin: "30px auto 0",
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "30px",
            }}
          >
            <HomeFeature
              title={t("home.feature1Title")}
              text={t("home.feature1Text")}
            />

            <HomeFeature
              title={t("home.feature2Title")}
              text={t("home.feature2Text")}
            />

            <HomeFeature
              title={t("home.feature3Title")}
              text={t("home.feature3Text")}
            />
          </div>
        </div>
      </section>

      <footer
        style={{
          borderTop: "1px solid rgba(0,0,0,0.18)",
          background: "rgba(255,255,255,0.35)",
        }}
      >
        <div
          className="container"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1.2fr 1fr",
            gap: "32px",
            padding: "28px 0",
          }}
        >
          <div>
            <h4>{t("home.navNavigation")}</h4>

            <p
              onClick={() => router.push("/partners")}
              style={{ cursor: "pointer" }}
            >
              {t("home.navPartners")}
            </p>

            <p
              onClick={() => router.push("/about")}
              style={{ cursor: "pointer" }}
            >
              {t("home.navAboutUs")}
            </p>
          </div>

          <div style={{ textAlign: "center" }}>
            <h4>UAAMS</h4>

            <p>{t("home.footerDesc")}</p>
          </div>

          <div style={{ textAlign: "right" }}>
            <h4>{t("home.footerSupport")}</h4>

            <p>{t("home.footerPrivacy")}</p>
            <p>{t("home.footerTerms")}</p>
          </div>
        </div>

        <div
          style={{
            borderTop: "1px solid rgba(0,0,0,0.12)",
            textAlign: "center",
            padding: "12px 0",
            fontSize: "0.85rem",
          }}
        >
          {t("home.footerCopyright")}
        </div>
      </footer>

      {showLogin && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            background: "rgba(0,0,0,0.2)",
            zIndex: 100,
          }}
        >
          <div
            style={{
              background: "#fff",
              padding: "30px",
              border: "2px solid #000",
              width: "320px",
            }}
          >
            <button
              type="button"
              onClick={closeLoginModal}
              style={{
                marginBottom: "10px",
                fontWeight: 700,
              }}
            >
              {t("login.back")}
            </button>

            <h3 style={{ marginBottom: "20px" }}>{t("login.title")}</h3>

            <form onSubmit={handleLogin}>
              <input
                placeholder={t("login.email")}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={inputStyle}
                required
                disabled={loading}
              />

              <input
                placeholder={t("login.password")}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={inputStyle}
                required
                disabled={loading}
              />

              {errorMessage && (
                <p
                  style={{
                    color: "red",
                    fontSize: "0.85rem",
                    marginBottom: "10px",
                  }}
                >
                  {errorMessage}
                </p>
              )}

              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? t("login.submitting") : t("login.submit")}
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

function HomeFeature({ title, text }) {
  return (
    <div
      style={{
        border: "2px solid #000",
        background: "#fff",
        padding: "50px 30px",
        textAlign: "center",
        minHeight: "260px",
      }}
    >
      <h3
        style={{
          fontWeight: 700,
          marginBottom: "18px",
          fontSize: "1.3rem",
        }}
      >
        {title}
      </h3>

      <p>{text}</p>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  height: "42px",
  border: "2px solid #3B2E5A",
  padding: "0 12px",
  marginBottom: "14px",
};