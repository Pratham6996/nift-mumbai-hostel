"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiPut } from "@/lib/api";
import { User, GraduationCap, Building2, Loader2 } from "lucide-react";

const departments = [
  "Fashion Design",
  "Textile Design",
  "Knitwear Design",
  "Accessory Design",
  "Leather Design",
  "Fashion Communication",
  "Fashion Management",
  "Fashion Technology",
  "Master of Design",
  "Master of Fashion Management",
  "Other",
];

const years = ["1st Year", "2nd Year", "3rd Year", "4th Year", "Alumni"];

export default function ProfileSetupModal() {
  const { needsProfile, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState("");
  const [department, setDepartment] = useState("");
  const [year, setYear] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!needsProfile) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !department || !year) {
      setError("Please fill in all fields.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await apiPut("/api/auth/profile", {
        full_name: fullName.trim(),
        department,
        year,
      });
      refreshProfile();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save profile");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
      <div className="glass rounded-3xl p-8 max-w-md w-full shadow-2xl border border-[var(--border-color)] animate-in">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--accent-primary)] to-[#fd79a8] flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[var(--accent-glow)]">
            <User size={28} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Welcome! 👋</h2>
          <p className="text-sm text-[var(--text-secondary)]">
            Complete your profile to get started with the hostel platform.
          </p>
        </div>

        {error && (
          <div className="mb-4 px-4 py-2.5 rounded-xl bg-[var(--danger)]/10 text-[var(--danger)] text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)] mb-2">
              <User size={14} />
              Full Name
            </label>
            <input
              type="text"
              placeholder="Enter your full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] transition-all"
            />
          </div>

          {/* Department */}
          <div>
            <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)] mb-2">
              <Building2 size={14} />
              Department
            </label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] transition-all appearance-none"
            >
              <option value="" disabled>
                Select your department
              </option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Year */}
          <div>
            <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)] mb-2">
              <GraduationCap size={14} />
              Year
            </label>
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] transition-all appearance-none"
            >
              <option value="" disabled>
                Select your year
              </option>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[var(--accent-primary)] to-[#fd79a8] text-white font-semibold hover:opacity-90 disabled:opacity-50 transition-all shadow-lg shadow-[var(--accent-glow)] mt-6"
          >
            {submitting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Saving…
              </>
            ) : (
              "Complete Profile"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
