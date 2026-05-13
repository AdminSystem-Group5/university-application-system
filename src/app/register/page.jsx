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
    <main style={pageStyle}>
      <section style={registerBoxStyle}>
        <button
          type="button"
          onClick={() => router.push("/")}
          style={backButtonStyle}
        >
          BACK
        </button>

        <h1 style={titleStyle}>CREATE YOUR ACCOUNT</h1>

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
            <p style={errorTextStyle}>
              {errorMessage}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              ...registerButtonStyle,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "REGISTERING..." : "Register"}
          </button>
        </form>
      </section>
    </main>
  );
}

const pageStyle = {
  minHeight: "100vh",
  background: "#F7F1E8",
  padding: "70px 40px",
};

const registerBoxStyle = {
  maxWidth: "620px",
  margin: "0 auto",
  background: "#fff",
  border: "2px solid #000",
  padding: "34px 50px 50px",
};

const backButtonStyle = {
  marginBottom: "32px",
  background: "#fff",
  border: "2px solid #000",
  color: "#000",
  fontWeight: "700",
  fontSize: "1rem",
  padding: "2px 8px",
  cursor: "pointer",
};

const titleStyle = {
  textAlign: "center",
  marginBottom: "32px",
  color: "#16162b",
};

const inputStyle = {
  width: "100%",
  height: "48px",
  border: "1.5px solid #2f2146",
  padding: "0 16px",
  marginBottom: "16px",
  background: "#fff",
};

const errorTextStyle = {
  color: "red",
  fontSize: "0.9rem",
  marginBottom: "16px",
};

const registerButtonStyle = {
  width: "220px",
  height: "50px",
  display: "block",
  margin: "26px auto 0",
  background: "#21132f",
  color: "#fff",
  border: "none",
  fontWeight: "700",
};