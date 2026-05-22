"use client";

import { useState } from "react";
import { useLanguage } from "@/lib/context/language-context";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export default function ForgotPasswordForm() {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(t("forgotPassword.successMessage"));
  };

  return (
    <div style={{ maxWidth: "400px", margin: "100px auto", padding: "2rem", position: "relative" }}>
      <div style={{ position: "absolute", top: "-70px", right: 0 }}>
        <LanguageSwitcher />
      </div>
      <h2>{t("forgotPassword.title")}</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder={t("forgotPassword.email")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ width: "100%", padding: "0.5rem", marginBottom: "1rem" }}
        />
        <button type="submit" style={{ width: "100%", padding: "0.5rem" }}>
          {t("forgotPassword.submit")}
        </button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
}