import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import Navbar from "@/components/Navbar";
import ProfileSetupModal from "@/components/ProfileSetupModal";

export const metadata: Metadata = {
  title: "NIFT Mumbai Hostel Platform",
  description: "Digital platform for NIFT Mumbai hostel — menu, feedback & more",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var t = localStorage.getItem('theme') || 'dark';
                  document.documentElement.setAttribute('data-theme', t);
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="antialiased">
        <ThemeProvider>
          <AuthProvider>
            <Navbar />
            <ProfileSetupModal />
            <main className="pt-16 min-h-screen">{children}</main>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
