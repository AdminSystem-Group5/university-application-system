"use client";

import { useRouter } from "next/navigation";

export default function AboutPage() {
  const router = useRouter();

  return (
    <main className="home-page">

      {/* HEADER */}
      <header className="topbar">
        <div className="container topbar-content">

          <div className="brand-block">
            <h1 className="logo">UAAMS</h1>
            <p className="subtitle">
              University Administration & Application Management System
            </p>
          </div>

          <div className="nav-center">
            <button
              onClick={() => router.push("/")}
              className="btn btn-outline nav-btn"
            >
              DASHBOARD
            </button>

            <button
              onClick={() => router.push("/partners")}
              className="btn btn-outline nav-btn"
            >
              PARTNERS
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

      {/* MAIN CONTENT */}
      <section style={{ padding: "40px 0" }}>
        <div className="container">

          {/* TITLE BOX */}
          <div
            style={{
              border: "1px solid #000",
              background: "rgba(255,255,255,0.35)",
              padding: "28px",
              textAlign: "center",
              marginBottom: "40px",
            }}
          >
            <h1 style={{ color: "#3B2E5A", marginBottom: "12px" }}>
              ABOUT US
            </h1>

            <p style={{ maxWidth: "720px", margin: "0 auto" }}>
              Learn more about the University Administration &
              Application Management System and how it supports
              students and universities.
            </p>
          </div>

          {/* DESCRIPTION BOX */}
          <div
            style={{
              border: "2px solid #000",
              padding: "28px",
              marginBottom: "40px",
              background: "#fff",
            }}
          >
            <h3
              style={{
                marginBottom: "12px",
                color: "#3B2E5A",
              }}
            >
              WHAT IS UAAMS?
            </h3>

            <p style={{ lineHeight: "1.7" }}>
              The University Administration & Application Management
              System (UAAMS) is a centralised platform designed to
              simplify student applications and administrative
              processes. It allows students to submit applications,
              upload documents, and track their progress, while
              universities can efficiently review and manage
              admissions in one place.
            </p>
          </div>

          {/* FEATURE BOXES */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "28px",
            }}
          >

            <FeatureCard
              title="FOR STUDENTS"
              items={[
                "Submit applications online",
                "Upload supporting documents",
                "Track application status"
              ]}
            />

            <FeatureCard
              title="FOR UNIVERSITIES"
              items={[
                "Review applications efficiently",
                "Manage admission decisions",
                "Communicate outcomes"
              ]}
            />

            <FeatureCard
              title="CENTRALISED SYSTEM"
              items={[
                "Single unified platform",
                "Secure document storage",
                "Real-time updates"
              ]}
            />

          </div>

        </div>
      </section>

      {/* FOOTER */}
      <footer
        style={{
          marginTop: "16px",
          borderTop: "1px solid rgba(0,0,0,0.18)",
          background: "rgba(255,255,255,0.35)",
          backdropFilter: "blur(6px)",
        }}
      >
        <div
          className="container"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1.2fr 1fr",
            gap: "32px",
            paddingTop: "28px",
            paddingBottom: "20px",
            alignItems: "start",
          }}
        >

          {/* NAVIGATION */}
          <div>
            <h4 style={{ marginBottom: "14px", fontWeight: 700 }}>
              NAVIGATION
            </h4>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                color: "var(--text-soft)",
              }}
            >
              <span
                onClick={() => router.push("/partners")}
                style={{ cursor: "pointer" }}
              >
                Partners
              </span>

              <span
                onClick={() => router.push("/about")}
                style={{ cursor: "pointer" }}
              >
                About Us
              </span>
            </div>
          </div>

          {/* CENTER INFO */}
          <div style={{ textAlign: "center" }}>
            <h4 style={{ marginBottom: "10px", fontWeight: 700 }}>
              UAAMS
            </h4>

            <p style={{ color: "var(--text-soft)", lineHeight: "1.7" }}>
              University Administration & Application Management System
            </p>

            <p style={{ color: "var(--text-light)", lineHeight: "1.8" }}>
              Full Address
              <br />
              Email Address
              <br />
              Full Phone Number
            </p>
          </div>

          {/* SUPPORT */}
          <div style={{ textAlign: "right" }}>
            <h4 style={{ marginBottom: "14px", fontWeight: 700 }}>
              SUPPORT
            </h4>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                alignItems: "flex-end",
                color: "var(--text-soft)",
              }}
            >
              <span>Privacy Policy</span>
              <span>Terms & Conditions</span>
            </div>
          </div>

        </div>

        <div
          style={{
            borderTop: "1px solid rgba(0,0,0,0.12)",
            textAlign: "center",
            padding: "14px",
            color: "var(--text-light)",
          }}
        >
          2026 UAAMS. All rights reserved.
        </div>

      </footer>

    </main>
  );
}

/* FEATURE CARD */

function FeatureCard({ title, items }) {
  return (
    <div
      style={{
        border: "2px solid #000",
        background: "#fff",
        minHeight: "180px",
      }}
    >
      <div
        style={{
          background: "#3B2E5A",
          color: "#fff",
          padding: "12px",
          textAlign: "center",
          fontWeight: "700",
        }}
      >
        {title}
      </div>

      <div
        style={{
          padding: "20px",
          fontSize: "14px",
          lineHeight: "1.8",
        }}
      >
        {items.map((item, index) => (
          <p key={index}>{item}</p>
        ))}
      </div>
    </div>
  );
}