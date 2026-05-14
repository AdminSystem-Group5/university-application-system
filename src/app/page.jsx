/*"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { getFirebaseAuth, getFirestoreDb } from "@/lib/firebase";

export default function HomePage() {
  const router = useRouter();

  const [showLogin, setShowLogin] = useState(false);

  /* LOGIN STATES 

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  /* LOGIN FUNCTION 

  const handleLogin = async (e) => {
    e.preventDefault();

    alert("Login button clicked"); // test alert

    setErrorMessage("");
    setLoading(true);

    try {
      const auth = getFirebaseAuth();
      const db = getFirestoreDb();

      const userCredential =
        await signInWithEmailAndPassword(
          auth,
          email,
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

      if (
        userData.role !== "admin" &&
        userData.role !== "university_admin"
      ) {
        setErrorMessage("Access denied. Admins only.");
        setLoading(false);
        return;
      }

      router.push("/admin");

    } catch (error) {

      console.error("Login error:", error);

      if (error.code === "auth/invalid-credential") {
        setErrorMessage("Invalid email or password.");
      } else {
        setErrorMessage("Login failed.");
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

      {/* HEADER 

      <header className="topbar">
        <div className="container topbar-content">

          <div className="brand-block">
            <h1 className="logo">UAAMS</h1>
          </div>

          <div className="nav-center">
            <button
              onClick={() => router.push("/partners")}
              className="btn btn-outline nav-btn"
            >
              PARTNERS
            </button>

            <button
              onClick={() => router.push("/about")}
              className="btn btn-outline nav-btn"
            >
              ABOUT US
            </button>
          </div>

          <div className="topbar-actions">
            <button
              onClick={() => setShowLogin(true)}
              className="btn btn-outline"
            >
              LOGIN
            </button>

            <button
              onClick={() => router.push("/register")}
              className="btn btn-primary"
            >
              REGISTER
            </button>
          </div>

        </div>
      </header>

      {/* CONTENT 

      <section
        style={{
          flex: 1,
          padding: "40px 40px",
        }}
      >

        <div style={{ filter: showLogin ? "blur(4px)" : "none" }}>

          {/* HERO 

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
              SMART UNIVERSITY PLATFORM
            </span>

            <h2
              style={{
                fontSize: "2.4rem",
                fontWeight: 800,
                marginBottom: "20px",
              }}
            >
              Welcome to the University Administration Dashboard
            </h2>

            <p
              style={{
                maxWidth: "700px",
                margin: "0 auto",
                marginBottom: "36px",
              }}
            >
              Manage student applications, university processes,
              and admission workflows in one centralised platform
            </p>

            <button
              onClick={() => router.push("/register")}
              className="btn btn-outline"
              style={{
                border: "2px solid #3B2E5A",
                fontWeight: 700,
                padding: "14px 28px",
              }}
            >
              REGISTER NOW
            </button>

          </div>

          {/* FEATURES 

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
              title="Application Tracking"
              text="Track applications easily"
            />

            <HomeFeature
              title="Secure Access"
              text="Safe student access and staff login"
            />

            <HomeFeature
              title="Centralised Management"
              text="Everything in one place"
            />

          </div>

        </div>

      </section>

      {/* FOOTER 

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
            <h4>NAVIGATION</h4>

            <p
              onClick={() => router.push("/partners")}
              style={{ cursor: "pointer" }}
            >
              Partners
            </p>

            <p
              onClick={() => router.push("/about")}
              style={{ cursor: "pointer" }}
            >
              About Us
            </p>

          </div>

          <div style={{ textAlign: "center" }}>
            <h4>UAAMS</h4>

            <p>
              University Administration & Application Management System
            </p>
          </div>

          <div style={{ textAlign: "right" }}>
            <h4>SUPPORT</h4>

            <p>Privacy Policy</p>
            <p>Terms & Conditions</p>
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
          2026 UAAMS. All rights reserved.
        </div>

      </footer>

      {/* LOGIN MODAL — FIXED 

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
              onClick={() => setShowLogin(false)}
              style={{
                marginBottom: "10px",
                fontWeight: 700,
              }}
            >
              BACK
            </button>

            <h3 style={{ marginBottom: "20px" }}>
              LOGIN
            </h3>

            <form onSubmit={handleLogin}>

              <input
                placeholder="Email"
                type="email"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                style={inputStyle}
                required
              />

              <input
                placeholder="Password"
                type="password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                style={inputStyle}
                required
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
                {loading
                  ? "LOGGING IN..."
                  : "LOGIN"}
              </button>

            </form>

          </div>

        </div>
      )}

    </main>
  );
}

/* FEATURE 

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
};*/

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { getFirebaseAuth, getFirestoreDb } from "@/lib/firebase";

export default function HomePage() {
  const router = useRouter();

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
              PARTNERS
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
              onClick={() => {
                setErrorMessage("");
                setShowLogin(true);
              }}
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
              SMART UNIVERSITY PLATFORM
            </span>

            <h2
              style={{
                fontSize: "2.4rem",
                fontWeight: 800,
                marginBottom: "20px",
              }}
            >
              Welcome to the University Administration Dashboard
            </h2>

            <p
              style={{
                maxWidth: "700px",
                margin: "0 auto",
                marginBottom: "36px",
              }}
            >
              Manage student applications, university processes, and admission
              workflows in one centralised platform
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
              REGISTER NOW
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
              title="Application Tracking"
              text="Track applications easily"
            />

            <HomeFeature
              title="Secure Access"
              text="Safe student access and staff login"
            />

            <HomeFeature
              title="Centralised Management"
              text="Everything in one place"
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
            <h4>NAVIGATION</h4>

            <p
              onClick={() => router.push("/partners")}
              style={{ cursor: "pointer" }}
            >
              Partners
            </p>

            <p
              onClick={() => router.push("/about")}
              style={{ cursor: "pointer" }}
            >
              About Us
            </p>
          </div>

          <div style={{ textAlign: "center" }}>
            <h4>UAAMS</h4>

            <p>University Administration & Application Management System</p>
          </div>

          <div style={{ textAlign: "right" }}>
            <h4>SUPPORT</h4>

            <p>Privacy Policy</p>
            <p>Terms & Conditions</p>
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
          2026 UAAMS. All rights reserved.
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