import "./globals.css";
import { AuthProvider } from "@/lib/context/auth-context";
import { LanguageProvider } from "@/lib/context/language-context";

export const metadata = {
  title: "Student Management System",
  description: "Student Management System",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <LanguageProvider>
          <AuthProvider>{children}</AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
