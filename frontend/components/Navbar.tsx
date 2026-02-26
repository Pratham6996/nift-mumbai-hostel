"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Home,
  UtensilsCrossed,
  MessageSquare,
  Wallet,
  Shield,
  LogIn,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/menu", label: "Menu", icon: UtensilsCrossed },
  { href: "/feedback", label: "Feedback", icon: MessageSquare },
  { href: "/expenses", label: "Expenses", icon: Wallet, auth: true },
];

export default function Navbar() {
  const pathname = usePathname();
  const { user, isAdmin, loading, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="glass fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--accent-primary)] to-[#fd79a8] flex items-center justify-center text-white font-bold text-sm group-hover:scale-110 transition-transform">
              N
            </div>
            <span className="font-semibold text-lg hidden sm:block">
              NIFT <span className="gradient-text">Mumbai</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              if (item.auth && !user) return null;
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    active
                      ? "bg-[var(--accent-primary)] text-white shadow-lg shadow-[var(--accent-glow)]"
                      : "text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-card)]"
                  }`}
                >
                  <Icon size={16} />
                  {item.label}
                </Link>
              );
            })}
            {isAdmin && (
              <Link
                href="/admin"
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  pathname === "/admin"
                    ? "bg-[var(--accent-primary)] text-white shadow-lg shadow-[var(--accent-glow)]"
                    : "text-[var(--warning)] hover:bg-[var(--bg-card)]"
                }`}
              >
                <Shield size={16} />
                Admin
              </Link>
            )}
          </div>

          <div className="hidden md:flex items-center gap-3">
            {loading ? (
              <div className="w-20 h-8 bg-[var(--bg-card)] rounded-lg animate-pulse" />
            ) : user ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-[var(--text-secondary)]">
                  {user.email?.split("@")[0]}
                </span>
                <button
                  onClick={signOut}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-[var(--danger)] hover:bg-[var(--bg-card)] transition-all duration-200"
                >
                  <LogOut size={16} />
                  Sign Out
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-[var(--accent-primary)] to-[#fd79a8] text-white hover:opacity-90 transition-opacity"
              >
                <LogIn size={16} />
                Login
              </Link>
            )}
          </div>

          <button
            className="md:hidden p-2 rounded-lg hover:bg-[var(--bg-card)] transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden glass border-t border-[var(--border-color)] px-4 py-3 space-y-1">
          {navItems.map((item) => {
            if (item.auth && !user) return null;
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? "bg-[var(--accent-primary)] text-white"
                    : "text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-card)]"
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
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-[var(--warning)] hover:bg-[var(--bg-card)]"
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
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-[var(--danger)] hover:bg-[var(--bg-card)] w-full"
              >
                <LogOut size={18} />
                Sign Out
              </button>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium bg-gradient-to-r from-[var(--accent-primary)] to-[#fd79a8] text-white"
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
