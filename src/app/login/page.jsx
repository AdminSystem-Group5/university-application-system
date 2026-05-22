/*"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

import { getFirebaseAuth, getFirestoreDb } from "@/lib/firebase";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    alert("Login button clicked");

    setErrorMessage("");
    setLoading(true);

    try {
      const auth = getFirebaseAuth();
      const db = getFirestoreDb();

      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      const firebaseUser = userCredential.user;

      const userRef = doc(db, "users", firebaseUser.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        setErrorMessage("User profile not found in Firestore.");
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
    <main className="login-page">
      <section className="login-card">
        <div className="login-header">
          <button
            type="button"
            className="back-home-link"
            onClick={() => router.push("/")}
          >
            BACK TO HOME
          </button>

          <h1 className="login-title">LOGIN</h1>
        </div>

        <form className="login-form" onSubmit={handleLogin}>
          <input
            type="email"
            className="login-input"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            className="login-input"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {errorMessage && (
            <p className="login-error">{errorMessage}</p>
          )}

          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >
            {loading ? "LOGGING IN..." : "LOGIN"}
          </button>
        </form>

        <div className="login-register">
          <p>DON&apos;T HAVE AN ACCOUNT?</p>

          <button
            type="button"
            className="register-link"
            onClick={() => router.push("/register")}
          >
            REGISTER HERE
          </button>
        </div>
      </section>
    </main>
  );
}*/
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

import { getFirebaseAuth, getFirestoreDb } from "@/lib/firebase";
import { useLanguage } from "@/lib/context/language-context";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export default function LoginPage() {
  const router = useRouter();
  const { t } = useLanguage();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

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
        // Firebase Auth account exists but Firestore profile is missing.
        // This happens when registration failed mid-way (e.g. old broken rules).
        // Redirect to register page in repair mode so the user can complete setup.
        router.replace("/register?repair=1");
        return;
      }

      const userData = userSnap.data();

      const userRole = String(userData?.role || "")
        .trim()
        .toLowerCase();

      // DEBUG — remove after fixing
      console.log("DEBUG login:", {
        uid: firebaseUser.uid,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        docExists: userSnap.exists(),
        rawRole: userData?.role,
        userRole,
      });

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

      setErrorMessage(`Role: "${userData?.role}" UID: ${firebaseUser.uid.slice(0,8)} Project: ${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}`);
      setLoading(false);
    } catch (error) {
      console.error("Login error:", error);

      if (error.code === "auth/invalid-credential") {
        setErrorMessage(t("login.errors.invalidCredential"));
      } else if (error.code === "auth/user-not-found") {
        setErrorMessage(t("login.errors.userNotFound"));
      } else if (error.code === "auth/wrong-password") {
        setErrorMessage(t("login.errors.wrongPassword"));
      } else if (error.code === "permission-denied") {
        setErrorMessage(t("login.errors.permissionDenied"));
      } else {
        setErrorMessage(t("login.errors.generic"));
      }

      setLoading(false);
    }
  };

  return (
    <main className="login-page">
      <div style={{ position: "absolute", top: "16px", right: "16px", zIndex: 10 }}>
        <LanguageSwitcher />
      </div>

      <section className="login-card">
        <div className="login-header">
          <button
            type="button"
            className="back-home-link"
            onClick={() => router.push("/")}
          >
            {t("nav.backHome")}
          </button>

          <h1 className="login-title">{t("login.title")}</h1>
        </div>

        <form className="login-form" onSubmit={handleLogin}>
          <input
            type="email"
            className="login-input"
            placeholder={t("login.email")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />

          <input
            type="password"
            className="login-input"
            placeholder={t("login.password")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
          />

          {errorMessage && <p className="login-error">{errorMessage}</p>}

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? t("login.submitting") : t("login.submit")}
          </button>
        </form>

        <div className="login-register">
          <p>{t("login.noAccount")}</p>

          <button
            type="button"
            className="register-link"
            onClick={() => router.push("/register")}
          >
            {t("login.registerLink")}
          </button>
        </div>
      </section>
    </main>
  );
}