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

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  updateProfile,
  onAuthStateChanged,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";

import { getFirebaseAuth, getFirestoreDb } from "@/lib/firebase";
import { useLanguage } from "@/lib/context/language-context";
import LanguageSwitcher from "@/components/LanguageSwitcher";

function generateAgentCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export default function RegisterPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const isRepairMode = searchParams.get("repair") === "1";

  const [accountType, setAccountType] = useState("student");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nationality, setNationality] = useState("");
  const [levelOfStudy, setLevelOfStudy] = useState("Undergraduate");
  const [agencyName, setAgencyName] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [repairUser, setRepairUser] = useState(null);

  // In repair mode, get the currently signed-in user
  useEffect(() => {
    if (!isRepairMode) return;
    const auth = getFirebaseAuth();
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        setRepairUser(user);
        setEmail(user.email || "");
        setDisplayName(user.displayName || "");
      } else {
        // Not signed in — send back to login
        router.replace("/login");
      }
    });
    return () => unsub();
  }, [isRepairMode, router]);

  const isAgent = accountType === "agent";

  const handleRegister = async (e) => {
    e.preventDefault();

    setErrorMessage("");
    setLoading(true);

    try {
      const auth = getFirebaseAuth();
      const db = getFirestoreDb();

      let firebaseUser;

      if (isRepairMode && repairUser) {
        // REPAIR MODE: user already exists in Auth — only create the missing Firestore doc
        firebaseUser = repairUser;

        // Check if doc was created in the meantime
        const existingSnap = await getDoc(doc(db, "users", firebaseUser.uid));
        if (existingSnap.exists()) {
          const role = existingSnap.data().role;
          router.replace(role === "agent" ? "/agent" : role === "student" ? "/student" : "/admin");
          return;
        }
      } else {
        // NORMAL MODE: create Firebase Auth account first
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email.trim(),
          password
        );
        firebaseUser = userCredential.user;
      }

      // Force a fresh ID token so Firestore security rules see request.auth
      // immediately after account creation (avoids race where token hasn't propagated).
      await firebaseUser.getIdToken(true);

      await updateProfile(firebaseUser, {
        displayName: displayName.trim(),
      });

      const baseDoc = {
        uid: firebaseUser.uid,
        displayName: displayName.trim(),
        email: firebaseUser.email?.toLowerCase() || email.trim().toLowerCase(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // Check if a user doc already exists (e.g. from a previous partial registration).
      // If it has a valid role, redirect straight to the right dashboard.
      // If it has no role, the Firestore update rule now allows setting it.
      const existingSnap = await getDoc(doc(db, "users", firebaseUser.uid));
      if (existingSnap.exists()) {
        const existingRole = existingSnap.data().role;
        if (existingRole === "agent") { router.replace("/agent"); return; }
        if (existingRole === "student") { router.replace("/student"); return; }
        if (existingRole === "university_admin" || existingRole === "admin") {
          router.replace("/admin"); return;
        }
        // Doc exists but role is missing — fall through to repair it via setDoc/update
      }

      if (isAgent) {
        await setDoc(doc(db, "users", firebaseUser.uid), {
          ...baseDoc,
          role: "agent",
          agencyName: agencyName.trim(),
          agentCode: generateAgentCode(),
        });
        router.replace("/agent");
      } else {
        await setDoc(doc(db, "users", firebaseUser.uid), {
          ...baseDoc,
          role: "student",
          nationality: nationality.trim(),
          levelOfStudy,
        });
        router.replace("/student");
      }
    } catch (error) {
      console.error("Register error:", error);

      if (error.code === "auth/email-already-in-use") {
        setErrorMessage(t("register.errors.emailInUse"));
      } else if (error.code === "auth/invalid-email") {
        setErrorMessage(t("register.errors.invalidEmail"));
      } else if (error.code === "auth/weak-password") {
        setErrorMessage(t("register.errors.weakPassword"));
      } else if (error.code === "permission-denied") {
        setErrorMessage(t("register.errors.permissionDenied"));
      } else {
        setErrorMessage(t("register.errors.generic"));
      }

      setLoading(false);
    }
  };

  return (
    <main style={{ minHeight: "100vh", background: "#F7F1E8", padding: "70px 40px", position: "relative" }}>
      <div style={{ position: "absolute", top: "16px", right: "16px" }}>
        <LanguageSwitcher />
      </div>

      <section style={{ maxWidth: "620px", margin: "0 auto", background: "#fff", border: "2px solid #000", padding: "50px" }}>
        <h1 style={{ textAlign: "center", marginBottom: "32px", color: "#16162b" }}>
          {t("register.title")}
        </h1>

        <button
          type="button"
          onClick={() => router.push("/")}
          style={{ width: "180px", height: "44px", background: "#fff", border: "2px solid #21132f", color: "#21132f", fontWeight: "700", cursor: "pointer", marginBottom: "26px" }}
        >
          {t("nav.backHome")}
        </button>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "24px" }}>
          <button
            type="button"
            onClick={() => setAccountType("student")}
            style={{
              height: "52px",
              border: "2px solid #21132f",
              background: accountType === "student" ? "#21132f" : "#fff",
              color: accountType === "student" ? "#fff" : "#21132f",
              fontWeight: "800",
              fontSize: "14px",
              cursor: "pointer",
            }}
          >
            {t("register.student")}
          </button>

          <button
            type="button"
            onClick={() => setAccountType("agent")}
            style={{
              height: "52px",
              border: "2px solid #21132f",
              background: accountType === "agent" ? "#21132f" : "#fff",
              color: accountType === "agent" ? "#fff" : "#21132f",
              fontWeight: "800",
              fontSize: "14px",
              cursor: "pointer",
            }}
          >
            {t("register.agent")}
          </button>
        </div>

        <form onSubmit={handleRegister}>
          <input
            type="text"
            placeholder={t("register.fullName")}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            style={inputStyle}
            required
            disabled={loading}
          />

          <input
            type="email"
            placeholder={t("register.email")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
            required
            disabled={loading}
          />

          <input
            type="password"
            placeholder={t("register.password")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
            required
            disabled={loading}
          />

          {isAgent ? (
            <input
              type="text"
              placeholder={t("register.agencyName")}
              value={agencyName}
              onChange={(e) => setAgencyName(e.target.value)}
              style={inputStyle}
              required
              disabled={loading}
            />
          ) : (
            <>
              <input
                type="text"
                placeholder={t("register.nationality")}
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
                <option value="Undergraduate">{t("register.levels.undergraduate")}</option>
                <option value="Postgraduate">{t("register.levels.postgraduate")}</option>
                <option value="Foundation">{t("register.levels.foundation")}</option>
                <option value="PhD">{t("register.levels.phd")}</option>
              </select>
            </>
          )}

          {errorMessage && (
            <p style={{ color: "red", fontSize: "0.9rem", marginBottom: "16px" }}>
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
            {loading ? t("register.submitting") : isAgent ? t("register.submitAgent") : t("register.submit")}
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