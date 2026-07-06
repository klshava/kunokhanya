import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kunokhanya Training Academy",
  description: "Student management, registration and fee tracking for Kunokhanya Training Academy.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
