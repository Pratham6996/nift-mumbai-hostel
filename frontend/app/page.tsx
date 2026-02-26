"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { UtensilsCrossed, MessageSquare, Wallet, Shield, ArrowRight } from "lucide-react";

const features = [
  {
    icon: UtensilsCrossed,
    title: "Weekly Menu",
    desc: "Check what's cooking in the hostel mess every day of the week.",
    href: "/menu",
    color: "from-emerald-500 to-teal-600",
  },
  {
    icon: MessageSquare,
    title: "Feedback",
    desc: "Share your thoughts on food quality, hygiene, and more.",
    href: "/feedback",
    color: "from-blue-500 to-indigo-600",
  },
  {
    icon: Wallet,
    title: "Expenses",
    desc: "Track your food spending with charts and export to CSV.",
    href: "/expenses",
    color: "from-amber-500 to-orange-600",
  },
];

export default function HomePage() {
  const { user, isAdmin } = useAuth();

  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-[var(--accent-primary)] opacity-[0.07] blur-[100px] animate-float" />
        <div
          className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-[0.05] blur-[100px]"
          style={{ background: "#fd79a8", animationDelay: "3s" }}
        />
      </div>

      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-20 pb-32">
        <div className="text-center mb-16">
          <div className="inline-block mb-6 px-4 py-1.5 rounded-full glass text-xs font-medium text-[var(--accent-secondary)] tracking-wider uppercase">
            NIFT Mumbai Hostel
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight mb-6">
            Your Hostel,{" "}
            <span className="gradient-text">Digitally</span>
            <br />
            Managed
          </h1>
          <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto mb-10">
            View the weekly mess menu, submit feedback, track your expenses — all in one place.
            Built for NIFT Mumbai hostel residents.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/menu"
              className="flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-[var(--accent-primary)] to-[#fd79a8] text-white font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-[var(--accent-glow)]"
            >
              View This Week's Menu
              <ArrowRight size={18} />
            </Link>
            {!user && (
              <Link
                href="/login"
                className="flex items-center gap-2 px-8 py-3 rounded-xl glass text-[var(--text-primary)] font-semibold hover:bg-[var(--bg-card-hover)] transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <Link
                key={f.href}
                href={f.href}
                className="glass rounded-2xl p-6 card-hover group"
              >
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                >
                  <Icon size={22} className="text-white" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  {f.desc}
                </p>
              </Link>
            );
          })}
        </div>

        {isAdmin && (
          <div className="mt-10 text-center">
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl glass text-[var(--warning)] font-medium hover:bg-[var(--bg-card-hover)] transition-colors"
            >
              <Shield size={18} />
              Admin Dashboard
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
