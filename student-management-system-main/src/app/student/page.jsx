"use client";

import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase";

export default function StudentDashboardPage() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const auth = getFirebaseAuth();
      await signOut(auth);
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
      alert("Could not log out. Please try again.");
    }
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "rgba(247, 241, 232, 1)",
        padding: "40px",
      }}
    >
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: "24px",
            marginBottom: "12px",
          }}
        >
          <h1
            style={{
              fontSize: "48px",
              color: "#3B2E5A",
              margin: 0,
            }}
          >
            Student Dashboard
          </h1>

          <button
            type="button"
            onClick={handleLogout}
            style={{
              background: "#fff",
              color: "#3B2E5A",
              border: "2px solid #3B2E5A",
              padding: "12px 20px",
              cursor: "pointer",
              fontWeight: "600",
            }}
          >
            Logout
          </button>
        </div>

        <p
          style={{
            color: "#555",
            marginBottom: "40px",
            fontSize: "18px",
          }}
        >
          Welcome to your student portal. Manage your applications easily.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "24px",
          }}
        >
          <div
            style={{
              background: "#fff",
              border: "2px solid #3B2E5A",
              padding: "28px",
            }}
          >
            <h2
              style={{
                color: "#3B2E5A",
                fontSize: "32px",
                marginBottom: "16px",
              }}
            >
              My Applications
            </h2>

            <p
              style={{
                color: "#555",
                marginBottom: "24px",
              }}
            >
              View your submitted applications and track their status.
            </p>

            <button
              onClick={() => router.push("/student/application")}
              style={{
                background: "#3B2E5A",
                color: "#fff",
                border: "none",
                padding: "14px 24px",
                cursor: "pointer",
                fontWeight: "600",
              }}
            >
              View Applications
            </button>
          </div>

          <div
            style={{
              background: "#fff",
              border: "2px solid #3B2E5A",
              padding: "28px",
            }}
          >
            <h2
              style={{
                color: "#3B2E5A",
                fontSize: "32px",
                marginBottom: "16px",
              }}
            >
              New Application
            </h2>

            <p
              style={{
                color: "#555",
                marginBottom: "24px",
              }}
            >
              Submit a new university application quickly and securely.
            </p>

            <button
              onClick={() => router.push("/student/application/new")}
              style={{
                background: "#3B2E5A",
                color: "#fff",
                border: "none",
                padding: "14px 24px",
                cursor: "pointer",
                fontWeight: "600",
              }}
            >
              Create Application
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
