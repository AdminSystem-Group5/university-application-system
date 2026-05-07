"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { sendPasswordResetEmail } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase";

export default function ResetPasswordPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      const auth = getFirebaseAuth();
      await sendPasswordResetEmail(auth, email);

      alert("Password reset email sent!");
      router.push("/login");
    } catch (error) {
      console.error("Password reset error:", error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "rgba(247, 241, 232, 1)",
        padding: "60px 24px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "520px",
          border: "2px solid #3B2E5A",
          background: "#fff",
          padding: "40px 36px 36px 36px",
          boxShadow: "0 12px 30px rgba(0, 0, 0, 0.08)",
        }}
      >
        <button
          type="button"
          onClick={() => router.push("/login")}
          style={backButtonStyle}
        >
          BACK TO LOGIN
        </button>

        <h1 style={titleStyle}>RESET PASSWORD</h1>

        <form onSubmit={handleReset}>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={inputStyle}
          />

          <button type="submit" disabled={loading} style={buttonStyle}>
            {loading ? "Sending..." : "Send Reset Email"}
          </button>
        </form>
      </div>
    </main>
  );
}

const inputStyle = {
  width: "100%",
  height: "44px",
  border: "2px solid #3B2E5A",
  padding: "0 14px",
  marginBottom: "22px",
  fontSize: "15px",
  outline: "none",
  background: "#fff",
};

const buttonStyle = {
  width: "100%",
  height: "44px",
  border: "2px solid #3B2E5A",
  background: "#3B2E5A",
  color: "#ffffff",
  fontSize: "15px",
  fontWeight: 600,
  cursor: "pointer",
};

const backButtonStyle = {
  display: "block",
  marginLeft: "auto",
  marginBottom: "18px",
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
