
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { getFirebaseAuth, getFirestoreDb } from "@/lib/firebase";

export default function PartnersPage() {
  const router = useRouter();

  const [showLogin, setShowLogin] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const openLoginModal = () => {
    setErrorMessage("");
    setEmail("");
    setPassword("");
    setShowLogin(true);
  };

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
    <main className="home-page">
      <div style={{ filter: showLogin ? "blur(4px)" : "none" }}>
        {/* HEADER */}
        <header className="topbar">
          <div className="container topbar-content">
            <div className="brand-block">
              <h1 className="logo">UAAMS</h1>
              <p className="subtitle">
                University Administration & Application Management System
              </p>
            </div>

            <div className="nav-center">
              <button
                type="button"
                onClick={() => router.push("/")}
                className="btn btn-outline nav-btn"
              >
                DASHBOARD
              </button>

              <button
                type="button"
                onClick={() => router.push("/about")}
                className="btn btn-outline nav-btn"
              >
                ABOUT US
              </button>
            </div>

            <div className="topbar-actions">
              <button
                type="button"
                onClick={openLoginModal}
                className="btn btn-outline"
              >
                LOGIN
              </button>

              <button
                type="button"
                onClick={() => router.push("/register")}
                className="btn btn-primary"
              >
                REGISTER
              </button>
            </div>
          </div>
        </header>

        {/* MAIN CONTENT */}
        <section style={{ padding: "40px 0" }}>
          <div className="container">
            {/* TITLE */}
            <div
              style={{
                border: "1px solid #000",
                background: "rgba(255,255,255,0.35)",
                padding: "28px",
                textAlign: "center",
                marginBottom: "48px",
              }}
            >
              <h1 style={{ color: "#3B2E5A", marginBottom: "12px" }}>
                OUR PARTNERS
              </h1>

              <p style={{ maxWidth: "720px", margin: "0 auto" }}>
                Discover the institutions connected to the UAAMS platform.
                We partner with leading universities across the UK to streamline
                your application process.
              </p>
            </div>

            {/* FIRST ROW */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: "60px",
                justifyItems: "center",
                marginBottom: "60px",
              }}
            >
              <PartnerCard
                title="SOUTHAMPTON SOLENT UNIVERSITY"
                name="Southampton Solent University"
              />

              <PartnerCard title="LONDON UNIVERSITY" name="London University" />
            </div>

            {/* SECOND ROW */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
              }}
            >
              <PartnerCard
                title="LIVERPOOL UNIVERSITY"
                name="Liverpool University"
              />
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer
          style={{
            marginTop: "16px",
            borderTop: "1px solid rgba(0,0,0,0.18)",
            background: "rgba(255,255,255,0.35)",
            backdropFilter: "blur(6px)",
          }}
        >
          <div
            className="container"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1.2fr 1fr",
              gap: "32px",
              paddingTop: "28px",
              paddingBottom: "20px",
              alignItems: "start",
            }}
          >
            <div>
              <h4 style={{ marginBottom: "14px", fontWeight: 700 }}>
                NAVIGATION
              </h4>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                  color: "var(--text-soft)",
                }}
              >
                <span
                  onClick={() => router.push("/partners")}
                  style={{ cursor: "pointer" }}
                >
                  Partners
                </span>

                <span
                  onClick={() => router.push("/about")}
                  style={{ cursor: "pointer" }}
                >
                  About Us
                </span>
              </div>
            </div>

            <div style={{ textAlign: "center" }}>
              <h4 style={{ marginBottom: "10px", fontWeight: 700 }}>UAAMS</h4>

              <p style={{ color: "var(--text-soft)", lineHeight: "1.7" }}>
                University Administration & Application Management System
              </p>

              <p style={{ color: "var(--text-light)", lineHeight: "1.8" }}>
                Full Address
                <br />
                Email Address
                <br />
                Full Phone Number
              </p>
            </div>

            <div style={{ textAlign: "right" }}>
              <h4 style={{ marginBottom: "14px", fontWeight: 700 }}>
                SUPPORT
              </h4>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                  alignItems: "flex-end",
                  color: "var(--text-soft)",
                }}
              >
                <span>Privacy Policy</span>
                <span>Terms & Conditions</span>
              </div>
            </div>
          </div>

          <div
            style={{
              borderTop: "1px solid rgba(0,0,0,0.12)",
              textAlign: "center",
              padding: "14px",
              color: "var(--text-light)",
            }}
          >
            2026 UAAMS. All rights reserved.
          </div>
        </footer>
      </div>

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
              BACK
            </button>

            <h3 style={{ marginBottom: "20px" }}>LOGIN</h3>

            <form onSubmit={handleLogin}>
              <input
                placeholder="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={inputStyle}
                required
                disabled={loading}
              />

              <input
                placeholder="Password"
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
                {loading ? "LOGGING IN..." : "LOGIN"}
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

/* PARTNER CARD */

function PartnerCard({ title, name }) {
  return (
    <div
      style={{
        width: "340px",
        border: "2px solid #000",
        background: "#fff",
      }}
    >
      <div
        style={{
          background: "#3B2E5A",
          color: "#fff",
          padding: "12px",
          textAlign: "center",
          fontWeight: "700",
          fontSize: "0.9rem",
        }}
      >
        {title}
      </div>

      <div
        style={{
          padding: "22px",
          fontSize: "14px",
          lineHeight: "1.8",
        }}
      >
        <p>{name}</p>
        <p>University Address</p>
        <p>University Description</p>
      </div>
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