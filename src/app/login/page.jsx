"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
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

      const userRef = doc(db, "users", userCredential.user.uid);
      const userSnap = await getDoc(userRef);

      alert("Login successful!");

      if (userSnap.exists()) {
        const userData = userSnap.data();

        if (userData.role === "admin" || userData.role === "university_admin") {
          router.push("/admin");
        } else {
          router.push("/student");
        }
      } else {
        router.push("/student");
      }
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
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      className="min-h-screen"
      style={{
        background: "rgba(247, 241, 232, 1)",
      }}
    >
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "60px 24px",
          background: "rgba(255,255,255,0.18)",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "520px",
            border: "2px solid #3B2E5A",
            background: "rgba(255,255,255,0.9)",
            padding: "40px 36px 36px 36px",
            boxShadow: "0 12px 30px rgba(0, 0, 0, 0.08)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginBottom: "10px",
            }}
          >
            <button
              type="button"
              onClick={() => router.push("/")}
              style={backButtonStyle}
            >
              BACK TO HOME
            </button>
          </div>

          <h1 style={titleStyle}>LOGIN</h1>

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: "18px" }}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email Address"
                required
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: "18px" }}>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
                style={inputStyle}
              />
            </div>

            {errorMessage && (
              <p
                style={{
                  margin: "0 0 16px 0",
                  color: "#C62828",
                  textAlign: "center",
                  fontSize: "13px",
                  fontWeight: 600,
                }}
              >
                {errorMessage}
              </p>
            )}

            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginTop: "26px",
              }}
            >
              <button type="submit" disabled={loading} style={loginButtonStyle}>
                {loading ? "LOGGING IN..." : "LOGIN"}
              </button>
            </div>

            <div
              style={{
                marginTop: "16px",
                textAlign: "center",
              }}
            >
              <button
                type="button"
                onClick={() => router.push("/reset-password")}
                style={forgotButtonStyle}
              >
                Forgot Password?
              </button>
            </div>

            <div style={registerTextStyle}>
              <div>DON&apos;T HAVE AN ACCOUNT?</div>

              <button
                type="button"
                onClick={() => router.push("/register")}
                style={registerButtonStyle}
              >
                REGISTER HERE
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}

const inputStyle = {
  width: "100%",
  height: "44px",
  border: "2px solid #3B2E5A",
  padding: "0 14px",
  fontSize: "15px",
  outline: "none",
  background: "#fff",
};

const backButtonStyle = {
  background: "transparent",
  border: "none",
  padding: 0,
  fontSize: "13px",
  fontWeight: 600,
  cursor: "pointer",
  color: "#3B2E5A",
};

const titleStyle = {
  margin: "0 0 28px 0",
  textAlign: "center",
  fontSize: "26px",
  fontWeight: 700,
  color: "#3B2E5A",
  letterSpacing: "0.03em",
};

const loginButtonStyle = {
  minWidth: "160px",
  height: "44px",
  border: "2px solid #3B2E5A",
  background: "#3B2E5A",
  color: "#ffffff",
  fontSize: "15px",
  fontWeight: 600,
  cursor: "pointer",
};

const forgotButtonStyle = {
  background: "transparent",
  border: "none",
  color: "#3B2E5A",
  cursor: "pointer",
  textDecoration: "underline",
  fontSize: "13px",
};

const registerTextStyle = {
  marginTop: "22px",
  textAlign: "center",
  fontSize: "12px",
  color: "#3B2E5A",
  lineHeight: "1.5",
};

const registerButtonStyle = {
  marginTop: "4px",
  background: "transparent",
  border: "none",
  padding: 0,
  fontSize: "12px",
  cursor: "pointer",
  color: "#3B2E5A",
  textDecoration: "underline",
  fontWeight: 600,
};
