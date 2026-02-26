import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "NIFT Mumbai Hostel Platform",
  description: "Digital platform for NIFT Mumbai hostel — menu, feedback, expenses & more",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        <AuthProvider>
          <Navbar />
          <main className="pt-16 min-h-screen">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
