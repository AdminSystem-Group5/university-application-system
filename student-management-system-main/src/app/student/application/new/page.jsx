"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { getFirebaseAuth, getFirestoreDb } from "@/lib/firebase";

export default function NewApplicationPage() {
  const router = useRouter();

  const [courseName, setCourseName] = useState("");
  const [personalStatement, setPersonalStatement] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const auth = getFirebaseAuth();
    const db = getFirestoreDb();
    const user = auth.currentUser;

    if (!user) {
      alert("Please login first before submitting an application.");
      router.push("/login");
      return;
    }

    try {
      setLoading(true);

      await addDoc(collection(db, "applications"), {
        studentId: user.uid,
        studentEmail: user.email,
        studentName: user.displayName || "Student User",
        courseName,
        personalStatement,
        applicationStatus: "Submitted",
        status: "Submitted",
        statusIndicator: "pending",
        isComplete: true,
        submittedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      alert("Application submitted successfully!");
      router.push("/student/application");
    } catch (error) {
      console.error("Error submitting application:", error);
      alert("Error submitting application. Check console.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={pageStyle}>
      <div style={containerStyle}>
        <button
          type="button"
          onClick={() => router.push("/student")}
          style={linkButtonStyle}
        >
          Back to Dashboard
        </button>

        <h1 style={titleStyle}>New Application</h1>
        <p style={subtitleStyle}>
          Submit your course choice and personal statement.
        </p>

        <form onSubmit={handleSubmit} style={formStyle}>
          <div style={fieldStyle}>
            <label style={labelStyle}>Course Name</label>
            <input
              type="text"
              value={courseName}
              onChange={(e) => setCourseName(e.target.value)}
              required
              style={inputStyle}
            />
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>Personal Statement</label>
            <textarea
              value={personalStatement}
              onChange={(e) => setPersonalStatement(e.target.value)}
              required
              rows="7"
              style={textareaStyle}
            />
          </div>

          <button type="submit" disabled={loading} style={buttonStyle}>
            {loading ? "Submitting..." : "Submit Application"}
          </button>
        </form>
      </div>
    </main>
  );
}

const pageStyle = {
  minHeight: "100vh",
  background: "rgba(247, 241, 232, 1)",
  padding: "40px 20px",
};

const containerStyle = {
  maxWidth: "760px",
  margin: "0 auto",
};

const titleStyle = {
  fontSize: "32px",
  fontWeight: "700",
  color: "#3B2E5A",
  margin: 0,
};

const subtitleStyle = {
  fontSize: "15px",
  color: "#555",
  margin: "8px 0 24px 0",
};

const formStyle = {
  background: "#fff",
  border: "2px solid #3B2E5A",
  padding: "28px",
  boxShadow: "0 8px 20px rgba(0,0,0,0.05)",
};

const fieldStyle = {
  marginBottom: "20px",
};

const labelStyle = {
  display: "block",
  color: "#3B2E5A",
  fontWeight: "600",
  marginBottom: "8px",
};

const inputStyle = {
  width: "100%",
  height: "48px",
  border: "2px solid #3B2E5A",
  padding: "0 14px",
  fontSize: "16px",
  outline: "none",
  background: "#fff",
};

const textareaStyle = {
  ...inputStyle,
  height: "160px",
  paddingTop: "12px",
  resize: "vertical",
};

const buttonStyle = {
  height: "42px",
  padding: "0 18px",
  border: "2px solid #3B2E5A",
  background: "#3B2E5A",
  color: "#fff",
  fontWeight: "600",
  cursor: "pointer",
};

const linkButtonStyle = {
  background: "transparent",
  border: "none",
  color: "#3B2E5A",
  fontWeight: "600",
  cursor: "pointer",
  marginBottom: "20px",
};
