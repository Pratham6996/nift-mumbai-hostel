"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  UtensilsCrossed,
  MessageSquare,
  Shield,
  ArrowRight,
  Sparkles,
  Users,
  Star,
  ChefHat,
} from "lucide-react";

const features = [
  {
    icon: UtensilsCrossed,
    title: "Weekly Menu",
    desc: "Browse the complete hostel mess menu — updated every week with breakfast, lunch, snacks & dinner.",
    href: "/menu",
    gradient: "from-emerald-400 to-teal-500",
    bgGlow: "rgba(16, 185, 129, 0.08)",
  },
  {
    icon: MessageSquare,
    title: "Feedback",
    desc: "Share your thoughts on food quality, hygiene, and services. Your voice shapes better hostel life.",
    href: "/feedback",
    gradient: "from-[var(--accent-primary)] to-[var(--accent-tertiary)]",
    bgGlow: "var(--accent-glow)",
  },
];

const stats = [
  { label: "Hostel Residents", value: "500+", icon: Users },
  { label: "Feedbacks Shared", value: "1.2K+", icon: Star },
  { label: "Updated Weekly", value: "Menu", icon: ChefHat },
];

export default function HomePage() {
  const { user, isAdmin } = useAuth();

  return (
    <div className="relative overflow-hidden">
      {/* Aurora Background */}
      <div className="aurora-bg" />
      <div
        className="aurora-orb w-[400px] h-[400px] top-[20%] left-[60%] opacity-[0.06] animate-float"
        style={{ background: "radial-gradient(circle, var(--accent-gold), transparent 70%)" }}
      />

      {/* ── Hero Section ── */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-24 sm:pt-32 pb-20">
        <div className="text-center mb-20 stagger-children">
          {/* Badge */}
          <div className="animate-fade-in-up inline-flex items-center gap-2 mb-8 px-5 py-2 rounded-full glass text-xs font-semibold tracking-widest uppercase text-[var(--accent-primary)]">
            <Sparkles size={14} />
            National Institute of Fashion Technology
          </div>

          {/* Headline */}
          <h1
            className="animate-fade-in-up text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold leading-[0.95] mb-8 tracking-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Your Hostel
            <br />
            <span className="gradient-text">Reimagined</span>
          </h1>

          {/* Subtitle */}
          <p className="animate-fade-in-up text-lg sm:text-xl text-[var(--text-secondary)] max-w-2xl mx-auto mb-12 leading-relaxed">
            A digital platform built for NIFT Mumbai hostel residents — view the
            weekly mess menu, share feedback, and stay connected.
          </p>

          {/* CTAs */}
          <div className="animate-fade-in-up flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/menu"
              className="group flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-tertiary)] text-white font-semibold text-base hover:opacity-90 transition-all duration-300 shadow-xl shadow-[var(--accent-glow)] animate-shimmer"
            >
              View This Week&apos;s Menu
              <ArrowRight
                size={18}
                className="transition-transform duration-300 group-hover:translate-x-1"
              />
            </Link>
            {!user && (
              <Link
                href="/login"
                className="flex items-center gap-2 px-8 py-4 rounded-2xl glass text-[var(--text-primary)] font-semibold text-base hover:bg-[var(--bg-card-hover)] transition-all duration-300"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>

        {/* ── Stats Ribbon ── */}
        <div className="animate-fade-in-up max-w-3xl mx-auto grid grid-cols-3 gap-4 mb-20">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="glass rounded-2xl p-5 text-center card-hover group"
              >
                <div className="flex justify-center mb-3">
                  <div className="w-10 h-10 rounded-xl bg-[var(--accent-primary)]/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Icon size={20} className="text-[var(--accent-primary)]" />
                  </div>
                </div>
                <p
                  className="text-2xl sm:text-3xl font-bold gradient-text-warm mb-1"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {stat.value}
                </p>
                <p className="text-xs sm:text-sm text-[var(--text-muted)]">
                  {stat.label}
                </p>
              </div>
            );
          })}
        </div>

        {/* ── Feature Cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto stagger-children">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <Link
                key={f.href}
                href={f.href}
                className="animate-fade-in-up glass rounded-3xl p-8 card-hover group relative overflow-hidden"
              >
                {/* Glow orb */}
                <div
                  className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-[60px]"
                  style={{ background: f.bgGlow }}
                />
                <div className="relative z-10">
                  <div
                    className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${f.gradient} flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg`}
                  >
                    <Icon size={24} className="text-white" />
                  </div>
                  <h3
                    className="font-bold text-xl mb-3"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {f.title}
                  </h3>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-4">
                    {f.desc}
                  </p>
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-[var(--accent-primary)] group-hover:gap-2 transition-all duration-300">
                    Explore
                    <ArrowRight size={14} />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Admin Link */}
        {isAdmin && (
          <div className="mt-12 text-center animate-fade-in">
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl glass text-[var(--accent-gold)] font-medium hover:bg-[var(--bg-card-hover)] transition-all duration-300"
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
