"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, query, where } from "firebase/firestore";
import { getFirebaseAuth, getFirestoreDb } from "@/lib/firebase";

export default function StudentApplicationsPage() {
  const router = useRouter();
  const [applications, setApplications] = useState([]);
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
        const applicationsQuery = query(
          collection(db, "applications"),
          where("studentId", "==", user.uid)
        );

        const snapshot = await getDocs(applicationsQuery);

        const data = snapshot.docs
          .map((docSnap) => ({
            id: docSnap.id,
            ...docSnap.data(),
          }))
          .sort((a, b) => {
            const aTime = a.createdAt?.toMillis?.() || 0;
            const bTime = b.createdAt?.toMillis?.() || 0;
            return bTime - aTime;
          });

        setApplications(data);
      } catch (error) {
        console.error("Error loading applications:", error);
        alert("Could not load your applications.");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  return (
    <ProtectedRoute>
      <main style={pageStyle}>
        <div style={containerStyle}>
          <button
            onClick={() => router.push("/student")}
            style={linkButtonStyle}
          >
            Back to Dashboard
          </button>

          <div style={headerStyle}>
            <div>
              <h1 style={titleStyle}>My Applications</h1>
              <p style={subtitleStyle}>
                View and track your submitted course applications.
              </p>
            </div>

            <button
              onClick={() => router.push("/student/application/new")}
              style={primaryButtonStyle}
            >
              New Application
            </button>
          </div>

          <section style={cardStyle}>
            {loading ? (
              <p style={messageStyle}>Loading applications...</p>
            ) : applications.length === 0 ? (
              <div style={emptyStyle}>
                <h2 style={emptyTitleStyle}>No applications yet</h2>
                <p style={subtitleStyle}>
                  Create your first application and it will appear here.
                </p>
              </div>
            ) : (
              <div style={{ display: "grid", gap: "16px" }}>
                {applications.map((app) => {
                  const status =
                    app.applicationStatus || app.status || "Submitted";

                  return (
                    <div key={app.id} style={applicationCard}>
                      <div>
                        <h3 style={applicationTitle}>
                          {app.courseName || "Untitled application"}
                        </h3>
                        <p style={applicationText}>
                          Application ID: {app.id}
                        </p>
                      </div>

                      <div style={actionsStyle}>
                        <span style={getStatusStyle(status)}>{status}</span>
                        <button
                          onClick={() =>
                            router.push(`/student/application/${app.id}`)
                          }
                          style={secondaryButtonStyle}
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </main>
    </ProtectedRoute>
  );
}

const pageStyle = {
  minHeight: "100vh",
  background: "rgba(247, 241, 232, 1)",
  padding: "40px 20px",
};

const containerStyle = {
  maxWidth: "1000px",
  margin: "0 auto",
};

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "20px",
  marginBottom: "24px",
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
  marginTop: "8px",
};

const cardStyle = {
  background: "#ffffff",
  border: "2px solid #3B2E5A",
  padding: "24px",
  boxShadow: "0 8px 20px rgba(0,0,0,0.05)",
};

const primaryButtonStyle = {
  height: "42px",
  padding: "0 18px",
  border: "2px solid #3B2E5A",
  background: "#3B2E5A",
  color: "#fff",
  fontWeight: "600",
  cursor: "pointer",
};

const secondaryButtonStyle = {
  height: "38px",
  padding: "0 14px",
  border: "2px solid #3B2E5A",
  background: "#fff",
  color: "#3B2E5A",
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

const applicationCard = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "20px",
  padding: "18px",
  border: "1px solid rgba(59, 46, 90, 0.25)",
  background: "#fff",
};

const applicationTitle = {
  margin: 0,
  fontSize: "18px",
  color: "#3B2E5A",
};

const applicationText = {
  margin: "6px 0 0 0",
  fontSize: "13px",
  color: "#666",
};

const actionsStyle = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
};

const messageStyle = {
  color: "#3B2E5A",
  fontSize: "16px",
};

const emptyStyle = {
  border: "1px dashed rgba(59, 46, 90, 0.4)",
  padding: "30px",
  textAlign: "center",
};

const emptyTitleStyle = {
  color: "#3B2E5A",
  fontSize: "22px",
  marginBottom: "8px",
};

const getStatusStyle = (status) => {
  let bg = "#EF8F00";

  if (status === "Accepted" || status === "Approved") bg = "#2E7D32";
  if (status === "Rejected") bg = "#C62828";
  if (status === "Under Review") bg = "#1565C0";

  return {
    padding: "7px 14px",
    color: "#fff",
    fontWeight: "600",
    background: bg,
    fontSize: "13px",
    whiteSpace: "nowrap",
  };
};