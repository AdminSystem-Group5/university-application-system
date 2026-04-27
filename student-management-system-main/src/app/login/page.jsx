"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

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
            maxWidth: "520px", // BIGGER BOX
            border: "2px solid #3B2E5A", // DARK PURPLE
            background: "rgba(255,255,255,0.9)",
            padding: "40px 36px 36px 36px", // MORE SPACE
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
              style={{
                background: "transparent",
                border: "none",
                padding: 0,
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                color: "#3B2E5A", // PURPLE
              }}
            >
              BACK TO HOME
            </button>
          </div>

          <h1
            style={{
              margin: "0 0 28px 0",
              textAlign: "center",
              fontSize: "26px", // BIGGER TITLE
              fontWeight: 700,
              color: "#3B2E5A", // PURPLE TITLE
              letterSpacing: "0.03em",
            }}
          >
            LOGIN
          </h1>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              alert("Static login page for UI preview only.");
            }}
          >
            <div style={{ marginBottom: "18px" }}>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                required
                style={{
                  width: "100%",
                  height: "44px", // BIGGER INPUT
                  border: "2px solid #3B2E5A",
                  padding: "0 14px",
                  fontSize: "15px",
                  outline: "none",
                  background: "#fff",
                }}
              />
            </div>

            <div style={{ marginBottom: "18px" }}>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
                style={{
                  width: "100%",
                  height: "44px",
                  border: "2px solid #3B2E5A",
                  padding: "0 14px",
                  fontSize: "15px",
                  outline: "none",
                  background: "#fff",
                }}
              />
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginTop: "26px",
              }}
            >
              <button
                type="submit"
                style={{
                  minWidth: "160px", // BIGGER BUTTON
                  height: "44px",
                  border: "2px solid #3B2E5A",
                  background: "#3B2E5A", // PURPLE BUTTON
                  color: "#ffffff",
                  fontSize: "15px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                LOGIN
              </button>
            </div>

            <div
              style={{
                marginTop: "22px",
                textAlign: "center",
                fontSize: "12px",
                color: "#3B2E5A",
                lineHeight: "1.5",
              }}
            >
              <div>DON'T HAVE AN ACCOUNT?</div>
              <button
                type="button"
                onClick={() => router.push("/register")}
                style={{
                  marginTop: "4px",
                  background: "transparent",
                  border: "none",
                  padding: 0,
                  fontSize: "12px",
                  cursor: "pointer",
                  color: "#3B2E5A",
                  textDecoration: "underline",
                  fontWeight: 600,
                }}
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