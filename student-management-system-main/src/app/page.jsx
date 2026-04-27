'use client';

import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  return (
    <main className="home-page">

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

      <section style={{ paddingTop: "24px", paddingBottom: "28px" }}>
        <div className="container">

          <div
            style={{
              border: "1px solid #000",
              minHeight: "420px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              textAlign: "center",
              padding: "60px 80px",
              background: "rgba(255,255,255,0.25)",
            }}
          >
            <span className="badge">
              Smart university platform
            </span>

            <h2
              className="hero-title"
              style={{ marginTop: "16px" }}
            >
              Welcome to the University Administration Dashboard
            </h2>

            <p
              className="hero-text"
              style={{
                maxWidth: "760px",
                marginTop: "18px",
              }}
            >
              Manage student applications, university processes, and admissions
              workflows in one centralised platform.
            </p>

            <div
              className="hero-actions"
              style={{
                marginTop: "36px",
              }}
            >
              <button
                onClick={() => router.push("/login")}
                className="btn btn-primary"
              >
                Login
              </button>

              <button
                onClick={() => router.push("/register")}
                className="btn btn-secondary"
              >
                Register
              </button>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "24px",
              marginTop: "28px",
            }}
          >
            <div className="feature-card">
              <h4>Application Tracking</h4>
              <p>Track applications easily.</p>
            </div>

            <div className="feature-card">
              <h4>Secure Access</h4>
              <p>Safe student and staff login.</p>
            </div>

            <div className="feature-card">
              <h4>Centralised Management</h4>
              <p>Everything in one place.</p>
            </div>
          </div>

        </div>
      </section>

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
          <div>
            <h4
              style={{
                margin: "0 0 14px 0",
                fontSize: "0.95rem",
                fontWeight: 700,
                letterSpacing: "0.04em",
              }}
            >
              NAVIGATION
            </h4>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                fontSize: "0.92rem",
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

          <div style={{ textAlign: "center" }}>
            <h4
              style={{
                margin: "0 0 10px 0",
                fontSize: "1rem",
                fontWeight: 700,
                letterSpacing: "0.03em",
              }}
            >
              UAAMS
            </h4>

            <p
              style={{
                margin: "0 0 12px 0",
                fontSize: "0.92rem",
                color: "var(--text-soft)",
                lineHeight: "1.7",
              }}
            >
              University Administration & Application Management System
            </p>

            <p
              style={{
                margin: "0",
                fontSize: "0.9rem",
                color: "var(--text-light)",
                lineHeight: "1.8",
              }}
            >
              Full Address
              <br />
              Email Address
              <br />
              Full Phone Number
            </p>
          </div>

          <div style={{ textAlign: "right" }}>
            <h4
              style={{
                margin: "0 0 14px 0",
                fontSize: "0.95rem",
                fontWeight: 700,
                letterSpacing: "0.04em",
              }}
            >
              SUPPORT
            </h4>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                fontSize: "0.92rem",
                color: "var(--text-soft)",
                alignItems: "flex-end",
              }}
            >
              <span style={{ cursor: "pointer" }}>Privacy Policy</span>
              <span style={{ cursor: "pointer" }}>Terms & Conditions</span>
            </div>
          </div>
        </div>

        <div
          style={{
            borderTop: "1px solid rgba(0,0,0,0.12)",
          }}
        >
          <div
            className="container"
            style={{
              paddingTop: "14px",
              paddingBottom: "14px",
              textAlign: "center",
              fontSize: "0.85rem",
              color: "var(--text-light)",
            }}
          >
            2026 UAAMS. All rights reserved.
          </div>
        </div>
      </footer>

    </main>
  );
}