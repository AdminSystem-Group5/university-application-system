// student notifications page
"use client";

import { useLanguage } from "@/lib/context/language-context";

export default function NotificationsPage() {
  const { t } = useLanguage();
  return (
    <div style={{ maxWidth: "800px", margin: "100px auto", padding: "2rem" }}>
      <h2>{t("student.notifications.title")}</h2>
      <p>{t("student.notifications.none")}</p>
    </div>
  );
}
