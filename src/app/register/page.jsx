/*"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function RegisterPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nationality, setNationality] = useState("");
  const [levelOfStudy, setLevelOfStudy] = useState("");

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "rgba(247, 241, 232, 1)",
      }}
    >
      {/* HEADER *

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
              onClick={() => router.push("/login")}
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

      {/* FORM SECTION 

      <section
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "60px 20px",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "820px", // MUCH BIGGER
            border: "2px solid #3B2E5A",
            background: "rgba(255,255,255,0.92)",
            padding: "56px 60px 48px 60px",
            boxShadow: "0 14px 36px rgba(0,0,0,0.08)",
          }}
        >
          <h1
            style={{
              textAlign: "center",
              marginBottom: "36px",
              fontSize: "32px",
              fontWeight: 700,
              color: "#3B2E5A",
            }}
          >
            CREATE YOUR ACCOUNT
          </h1>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              alert("Static register preview.");
            }}
          >
            {/* INPUTS *

            <div style={{ marginBottom: "18px" }}>
              <input
                type="text"
                placeholder="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: "18px" }}>
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: "18px" }}>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: "18px" }}>
              <input
                type="text"
                placeholder="Nationality"
                value={nationality}
                onChange={(e) => setNationality(e.target.value)}
                required
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: "32px" }}>
              <select
                value={levelOfStudy}
                onChange={(e) => setLevelOfStudy(e.target.value)}
                required
                style={inputStyle}
              >
                <option value="">Level Of Study</option>
                <option>Foundation</option>
                <option>Undergraduate</option>
                <option>Postgraduate</option>
                <option>PhD</option>
              </select>
            </div>

            {/* BUTTON *

            <div
              style={{
                display: "flex",
                justifyContent: "center",
              }}
            >
              <button
                type="submit"
                style={{
                  minWidth: "220px",
                  height: "50px",
                  border: "2px solid #3B2E5A",
                  background: "#3B2E5A",
                  color: "#fff",
                  fontSize: "16px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Register
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* FOOTER — NOW ALWAYS AT BOTTOM *

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
            <p>Partners</p>
            <p>About Us</p>
          </div>

          <div style={{ textAlign: "center" }}>
            <h4>UAAMS</h4>
            <p>
              University Administration & Application Management System
            </p>
            <p>
              Full Address
              <br />
              Email Address
              <br />
              Full Phone Number
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
    </main>
  );
}

/* SHARED INPUT STYLE 

const inputStyle = {
  width: "100%",
  height: "52px", // BIGGER INPUTS
  border: "2px solid #3B2E5A",
  padding: "0 16px",
  fontSize: "16px",
  outline: "none",
  background: "#fff",
};*/

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import {
  doc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

import { getFirebaseAuth, getFirestoreDb } from "@/lib/firebase";

export default function RegisterPage() {
  const router = useRouter();

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nationality, setNationality] = useState("");
  const [levelOfStudy, setLevelOfStudy] = useState("Undergraduate");

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();

    setErrorMessage("");
    setLoading(true);

    try {
      const auth = getFirebaseAuth();
      const db = getFirestoreDb();

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      const firebaseUser = userCredential.user;

      await updateProfile(firebaseUser, {
        displayName: displayName.trim(),
      });

      await setDoc(doc(db, "users", firebaseUser.uid), {
        uid: firebaseUser.uid,
        displayName: displayName.trim(),
        email: email.trim().toLowerCase(),
        nationality: nationality.trim(),
        levelOfStudy: levelOfStudy,
        role: "student",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      router.replace("/student");
    } catch (error) {
      console.error("Register error:", error);

      if (error.code === "auth/email-already-in-use") {
        setErrorMessage("This email is already registered.");
      } else if (error.code === "auth/invalid-email") {
        setErrorMessage("Please enter a valid email address.");
      } else if (error.code === "auth/weak-password") {
        setErrorMessage("Password should be at least 6 characters.");
      } else if (error.code === "permission-denied") {
        setErrorMessage("Firestore permission denied.");
      } else {
        setErrorMessage("Registration failed. Please try again.");
      }

      setLoading(false);
    }
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#F7F1E8",
        padding: "70px 40px",
      }}
    >
      <section
        style={{
          maxWidth: "620px",
          margin: "0 auto",
          background: "#fff",
          border: "2px solid #000",
          padding: "50px",
        }}
      >
        <h1
          style={{
            textAlign: "center",
            marginBottom: "32px",
            color: "#16162b",
          }}
        >
          CREATE YOUR ACCOUNT
        </h1>
        <button
  type="button"
  onClick={() => router.push("/")}
  style={{
    width: "180px",
    height: "44px",
    background: "#fff",
    border: "2px solid #21132f",
    color: "#21132f",
    fontWeight: "700",
    cursor: "pointer",
    marginBottom: "26px",
  }}
>
  ← BACK TO HOME
</button>

        <form onSubmit={handleRegister}>
          <input
            type="text"
            placeholder="Full name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            style={inputStyle}
            required
            disabled={loading}
          />

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
            required
            disabled={loading}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
            required
            disabled={loading}
          />

          <input
            type="text"
            placeholder="Nationality"
            value={nationality}
            onChange={(e) => setNationality(e.target.value)}
            style={inputStyle}
            required
            disabled={loading}
          />

          <select
            value={levelOfStudy}
            onChange={(e) => setLevelOfStudy(e.target.value)}
            style={inputStyle}
            required
            disabled={loading}
          >
            <option value="Undergraduate">Undergraduate</option>
            <option value="Postgraduate">Postgraduate</option>
            <option value="Foundation">Foundation</option>
            <option value="PhD">PhD</option>
          </select>

          {errorMessage && (
            <p
              style={{
                color: "red",
                fontSize: "0.9rem",
                marginBottom: "16px",
              }}
            >
              {errorMessage}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "220px",
              height: "50px",
              display: "block",
              margin: "26px auto 0",
              background: "#21132f",
              color: "#fff",
              border: "none",
              fontWeight: "700",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "REGISTERING..." : "Register"}
          </button>
        </form>
      </section>
    </main>
  );
}

const inputStyle = {
  width: "100%",
  height: "48px",
  border: "1.5px solid #2f2146",
  padding: "0 16px",
  marginBottom: "16px",
  background: "#fff",
};