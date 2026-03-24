"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function LoginPage() {
  const router = useRouter();
  const { signIn } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");

    try {
      await signIn(email, password);
      router.push("/admin");
    } catch (error) {
      console.error(error);

      // 🔥 Firebase-specific error handling
      switch (error.code) {
        case "auth/user-not-found":
          setErrorMessage("No account found with this email.");
          break;
        case "auth/wrong-password":
          setErrorMessage("Incorrect password. Please try again.");
          break;
        case "auth/invalid-email":
          setErrorMessage("Invalid email format.");
          break;
        case "auth/invalid-credential":
          setErrorMessage("Invalid email or password.");
          break;
        case "auth/too-many-requests":
          setErrorMessage("Too many failed attempts. Try again later.");
          break;
        default:
          setErrorMessage("Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-md rounded-xl border bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">Admin Login</h1>
        <p className="mt-2 text-sm text-gray-600">
          Sign in with your university admin account.
        </p>

        {/* ✅ Error message */}
        {errorMessage && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleLogin} className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@test.com"
              className="w-full rounded-lg border px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full rounded-lg border px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </main>
  );
}