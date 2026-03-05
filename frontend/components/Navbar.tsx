"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import {
  Home,
  UtensilsCrossed,
  MessageSquare,
  Shield,
  LogIn,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
} from "lucide-react";
import { useState } from "react";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/menu", label: "Menu", icon: UtensilsCrossed },
  { href: "/feedback", label: "Feedback", icon: MessageSquare },
];

export default function Navbar() {
  const pathname = usePathname();
  const { user, profile, isAdmin, loading, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="glass-strong fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-tertiary)] flex items-center justify-center text-white font-bold text-sm group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg shadow-[var(--accent-glow)]">
              N
            </div>
            <div className="hidden sm:flex flex-col leading-tight">
              <span
                className="font-bold text-base tracking-tight"
                style={{ fontFamily: "var(--font-display)" }}
              >
                NIFT
              </span>
              <span className="text-[10px] font-medium tracking-[0.2em] uppercase text-[var(--accent-primary)]">
                Mumbai
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                    active
                      ? "text-[var(--accent-primary)]"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  <Icon size={16} />
                  {item.label}
                  {active && (
                    <span className="absolute bottom-0 left-3 right-3 h-[2px] rounded-full bg-[var(--accent-primary)]" />
                  )}
                </Link>
              );
            })}
            {isAdmin && (
              <Link
                href="/admin"
                className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                  pathname === "/admin"
                    ? "text-[var(--accent-gold)]"
                    : "text-[var(--accent-gold)] opacity-70 hover:opacity-100"
                }`}
              >
                <Shield size={16} />
                Admin
                {pathname === "/admin" && (
                  <span className="absolute bottom-0 left-3 right-3 h-[2px] rounded-full bg-[var(--accent-gold)]" />
                )}
              </Link>
            )}
          </div>

          {/* Desktop Right Section */}
          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl hover:bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-[var(--accent-primary)] transition-all duration-300"
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              <div className="transition-transform duration-500" style={{ transform: theme === "dark" ? "rotate(0deg)" : "rotate(180deg)" }}>
                {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
              </div>
            </button>
            {loading ? (
              <div className="w-24 h-9 bg-[var(--bg-card)] rounded-xl animate-pulse" />
            ) : user ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--bg-card)]">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-tertiary)] flex items-center justify-center text-white text-xs font-bold">
                    {(profile?.full_name || user.email || "U")[0].toUpperCase()}
                  </div>
                  <span className="text-sm text-[var(--text-secondary)] max-w-[120px] truncate">
                    {profile?.full_name || user.email?.split("@")[0]}
                  </span>
                </div>
                <button
                  onClick={signOut}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-[var(--danger)] hover:bg-[var(--danger)]/10 transition-all duration-200"
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-tertiary)] text-white hover:opacity-90 transition-all duration-200 shadow-lg shadow-[var(--accent-glow)]"
              >
                <LogIn size={16} />
                Login
              </Link>
            )}
          </div>

          {/* Mobile Controls */}
          <div className="flex md:hidden items-center gap-1">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--accent-primary)] transition-colors"
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button
              className="p-2 rounded-lg hover:bg-[var(--bg-card)] transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden glass-strong border-t border-[var(--border-color)] px-4 py-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? "bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)]"
                }`}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
          {isAdmin && (
            <Link
              href="/admin"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-[var(--accent-gold)] hover:bg-[var(--bg-card)]"
            >
              <Shield size={18} />
              Admin
            </Link>
          )}
          <div className="border-t border-[var(--border-color)] pt-3 mt-2">
            {user ? (
              <button
                onClick={() => {
                  signOut();
                  setMobileOpen(false);
                }}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-[var(--danger)] hover:bg-[var(--bg-card)] w-full"
              >
                <LogOut size={18} />
                Sign Out
              </button>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-tertiary)] text-white"
              >
                <LogIn size={18} />
                Login
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
