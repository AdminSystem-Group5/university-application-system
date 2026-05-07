"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { getFirebaseAuth, getFirestoreDb } from "@/lib/firebase";

export default function ApplicationDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getFirebaseAuth();
    const db = getFirestoreDb();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/login");
        return;
      }

      try {
        const snapshot = await getDoc(doc(db, "applications", params.id));

        if (!snapshot.exists()) {
          setApplication(null);
          return;
        }

        const data = { id: snapshot.id, ...snapshot.data() };

        if (data.studentId !== user.uid) {
          alert("You can only view your own applications.");
          router.replace("/student/application");
          return;
        }

        setApplication(data);
      } catch (error) {
        console.error("Error loading application:", error);
        alert("Could not load this application.");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [params.id, router]);

  return (
    <main style={pageStyle}>
      <div style={containerStyle}>
        <button
          onClick={() => router.push("/student/application")}
          style={linkButtonStyle}
        >
          Back to Applications
        </button>

        <h1 style={titleStyle}>Application Details</h1>

        {loading ? (
          <p style={messageStyle}>Loading application...</p>
        ) : !application ? (
          <section style={cardStyle}>
            <h2 style={sectionTitleStyle}>Application not found</h2>
            <p style={subtitleStyle}>
              This application does not exist or is no longer available.
            </p>
          </section>
        ) : (
          <section style={cardStyle}>
            <h2 style={sectionTitleStyle}>
              {application.courseName || "Untitled application"}
            </h2>

            <div style={rowStyle}>
              <strong>Status</strong>
              <span>
                {application.applicationStatus ||
                  application.status ||
                  "Submitted"}
              </span>
            </div>

            <div style={rowStyle}>
              <strong>Student</strong>
              <span>{application.studentName || "Student"}</span>
            </div>

            <div style={rowStyle}>
              <strong>Email</strong>
              <span>{application.studentEmail || "No email saved"}</span>
            </div>

            <div style={statementStyle}>
              <strong style={{ color: "#3B2E5A" }}>Personal Statement</strong>
              <p style={statementTextStyle}>
                {application.personalStatement || "No personal statement saved."}
              </p>
            </div>
          </section>
        )}
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
  maxWidth: "900px",
  margin: "0 auto",
};

const titleStyle = {
  fontSize: "32px",
  fontWeight: "700",
  color: "#3B2E5A",
  margin: "0 0 24px 0",
};

const cardStyle = {
  background: "#fff",
  border: "2px solid #3B2E5A",
  padding: "28px",
  boxShadow: "0 8px 20px rgba(0,0,0,0.05)",
};

const sectionTitleStyle = {
  color: "#3B2E5A",
  fontSize: "24px",
  marginBottom: "22px",
};

const rowStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: "20px",
  borderTop: "1px solid rgba(59, 46, 90, 0.18)",
  padding: "14px 0",
  color: "#555",
};

const statementStyle = {
  marginTop: "24px",
  borderTop: "1px solid rgba(59, 46, 90, 0.18)",
  paddingTop: "18px",
};

const statementTextStyle = {
  color: "#555",
  lineHeight: 1.7,
  marginTop: "10px",
};

const messageStyle = {
  color: "#3B2E5A",
  fontSize: "16px",
};

const subtitleStyle = {
  fontSize: "15px",
  color: "#555",
};

const linkButtonStyle = {
  background: "transparent",
  border: "none",
  color: "#3B2E5A",
  fontWeight: "600",
  cursor: "pointer",
  marginBottom: "20px",
};