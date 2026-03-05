"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  Mail,
  Lock,
  Sparkles,
  UserPlus,
  LogIn,
  ShieldCheck,
  ArrowLeft,
  RefreshCw,
} from "lucide-react";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "register">("login");
  const [regStep, setRegStep] = useState<"form" | "otp">("form");
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const router = useRouter();
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setOtp(["", "", "", "", "", ""]);
    setRegStep("form");
    setError("");
    setSuccess("");
    setResendCooldown(0);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
    } else {
      router.push("/");
    }
    setLoading(false);
  };

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || "Failed to send verification code");
      } else {
        setRegStep("otp");
        setResendCooldown(60);
        setSuccess("Verification code sent! Check your email.");
      }
    } catch {
      setError("Network error. Please try again.");
    }
    setLoading(false);
  };

  const handleVerifyOtp = async () => {
    const otpString = otp.join("");
    if (otpString.length < 6) {
      setError("Please enter the full 6-digit code");
      return;
    }
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: otpString }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || "Verification failed");
      } else {
        setSuccess("Account created! You can now sign in.");
        setMode("login");
        resetForm();
      }
    } catch {
      setError("Network error. Please try again.");
    }
    setLoading(false);
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
    if (e.key === "Enter" && otp.join("").length === 6) {
      handleVerifyOtp();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length > 0) {
      const newOtp = [...otp];
      pasted.split("").forEach((char, i) => {
        if (i < 6) newOtp[i] = char;
      });
      setOtp(newOtp);
      otpRefs.current[Math.min(pasted.length, 5)]?.focus();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-[var(--accent-primary)] opacity-[0.06] blur-[80px] animate-float" />
        <div
          className="absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full opacity-[0.04] blur-[80px]"
          style={{ background: "#fd79a8" }}
        />
      </div>

      <div className="glass rounded-2xl p-8 md:p-10 w-full max-w-md relative glow-box">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--accent-primary)] to-[#fd79a8] mb-4">
            {mode === "login" ? (
              <Sparkles size={24} className="text-white" />
            ) : regStep === "otp" ? (
              <ShieldCheck size={24} className="text-white" />
            ) : (
              <UserPlus size={24} className="text-white" />
            )}
          </div>
          <h1 className="text-2xl font-bold mb-2">
            {mode === "login"
              ? "Welcome Back"
              : regStep === "otp"
              ? "Verify Email"
              : "Create Account"}
          </h1>
          <p className="text-[var(--text-secondary)] text-sm">
            {mode === "login"
              ? "Sign in to your hostel account"
              : regStep === "otp"
              ? `Enter the code sent to ${email}`
              : "Register to get started"}
          </p>
        </div>

        {error && (
          <div className="mb-6 px-4 py-3 rounded-xl bg-[var(--danger)]/10 border border-[var(--danger)]/20 text-[var(--danger)] text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 px-4 py-3 rounded-xl bg-[var(--success)]/10 border border-[var(--success)]/20 text-[var(--success)] text-sm">
            {success}
          </div>
        )}

        {/* LOGIN FORM */}
        {mode === "login" && (
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                />
                <input
                  type="email"
                  placeholder="you@nift.ac.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                Password
              </label>
              <div className="relative">
                <Lock
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                />
                <input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-[var(--accent-primary)] to-[#fd79a8] text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Sign In <LogIn size={18} />
                </>
              )}
            </button>
          </form>
        )}

        {/* REGISTER — STEP 1: Email + Password */}
        {mode === "register" && regStep === "form" && (
          <form onSubmit={handleSendOtp} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                />
                <input
                  type="email"
                  placeholder="you@nift.ac.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                Password
              </label>
              <div className="relative">
                <Lock
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                />
                <input
                  type="password"
                  placeholder="Min 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-[var(--accent-primary)] to-[#fd79a8] text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Send Verification Code <Mail size={18} />
                </>
              )}
            </button>
          </form>
        )}

        {/* REGISTER — STEP 2: Enter OTP */}
        {mode === "register" && regStep === "otp" && (
          <div className="space-y-6">
            {/* OTP Input Boxes */}
            <div className="flex justify-center gap-3" onPaste={handleOtpPaste}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { otpRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  className="w-12 h-14 text-center text-xl font-bold rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] transition-all"
                />
              ))}
            </div>

            {/* Verify Button */}
            <button
              onClick={handleVerifyOtp}
              disabled={loading || otp.join("").length < 6}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-[var(--accent-primary)] to-[#fd79a8] text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Verify & Create Account <ShieldCheck size={18} />
                </>
              )}
            </button>

            {/* Resend + Back */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => {
                  setRegStep("form");
                  setOtp(["", "", "", "", "", ""]);
                  setError("");
                  setSuccess("");
                }}
                className="flex items-center gap-1 text-sm text-[var(--text-secondary)] hover:text-white transition-colors"
              >
                <ArrowLeft size={14} /> Change email
              </button>

              <button
                onClick={() => handleSendOtp()}
                disabled={resendCooldown > 0 || loading}
                className="flex items-center gap-1 text-sm text-[var(--accent-secondary)] hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <RefreshCw size={14} />
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
              </button>
            </div>
          </div>
        )}

        {/* Toggle Login / Register */}
        {regStep === "form" && (
          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setMode(mode === "login" ? "register" : "login");
                setError("");
                setSuccess("");
              }}
              className="text-sm text-[var(--text-secondary)] hover:text-white transition-colors"
            >
              {mode === "login"
                ? "Don't have an account? Register →"
                : "Already have an account? Sign In →"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
