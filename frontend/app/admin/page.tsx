"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { apiGet, apiPost, apiDelete } from "@/lib/api";
import {
  Shield,
  UtensilsCrossed,
  MessageSquare,
  Users,
  Trash2,
  Upload,
  BarChart3,
  ChevronDown,
} from "lucide-react";

interface FeedbackItem {
  id: string;
  user_id: string;
  category: string;
  content: string;
  image_url?: string;
  is_anonymous: boolean;
  upvotes: number;
  created_at: string;
}

interface FeedbackStats {
  total: number;
  by_category: Record<string, number>;
}

interface UserItem {
  id: string;
  email: string;
  role: string;
  created_at: string;
}

const dayNames = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;

export default function AdminPage() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"menu" | "feedback" | "users">("menu");

  const [menuDate, setMenuDate] = useState("");
  const [menuData, setMenuData] = useState<Record<string, Record<string, string>>>(() => {
    const init: Record<string, Record<string, string>> = {};
    dayNames.forEach((d) => {
      init[d] = { breakfast: "", lunch: "", snacks: "", dinner: "" };
    });
    return init;
  });
  const [menuSubmitting, setMenuSubmitting] = useState(false);
  const [menuMsg, setMenuMsg] = useState("");

  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [stats, setStats] = useState<FeedbackStats | null>(null);
  const [fbLoading, setFbLoading] = useState(false);

  const [users, setUsers] = useState<UserItem[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      router.push("/");
    }
  }, [user, isAdmin, authLoading, router]);

  useEffect(() => {
    if (activeTab === "feedback" && isAdmin) {
      setFbLoading(true);
      Promise.all([
        apiGet<FeedbackItem[]>("/api/feedback?limit=100"),
        apiGet<FeedbackStats>("/api/admin/feedback/stats"),
      ])
        .then(([fb, st]) => {
          setFeedbacks(fb);
          setStats(st);
        })
        .finally(() => setFbLoading(false));
    }
    if (activeTab === "users" && isAdmin) {
      setUsersLoading(true);
      apiGet<UserItem[]>("/api/admin/users")
        .then(setUsers)
        .finally(() => setUsersLoading(false));
    }
  }, [activeTab, isAdmin]);

  const handleMenuSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMenuSubmitting(true);
    setMenuMsg("");
    try {
      const body: Record<string, unknown> = { week_start_date: menuDate };
      dayNames.forEach((d) => {
        body[d] = {
          breakfast: menuData[d].breakfast.split(",").map((s) => s.trim()).filter(Boolean),
          lunch: menuData[d].lunch.split(",").map((s) => s.trim()).filter(Boolean),
          snacks: menuData[d].snacks.split(",").map((s) => s.trim()).filter(Boolean),
          dinner: menuData[d].dinner.split(",").map((s) => s.trim()).filter(Boolean),
        };
      });
      await apiPost("/api/admin/menu", body);
      setMenuMsg("Menu uploaded successfully!");
    } catch (err: unknown) {
      setMenuMsg(err instanceof Error ? err.message : "Failed to upload");
    }
    setMenuSubmitting(false);
  };

  const handleDeleteFeedback = async (id: string) => {
    if (!confirm("Delete this feedback permanently?")) return;
    try {
      await apiDelete(`/api/admin/feedback/${id}`);
      setFeedbacks((prev) => prev.filter((fb) => fb.id !== id));
    } catch {}
  };

  if (authLoading || !isAdmin) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="h-64 bg-[var(--bg-card)] rounded-2xl animate-pulse" />
      </div>
    );
  }

  const tabs = [
    { key: "menu", label: "Menu", icon: UtensilsCrossed },
    { key: "feedback", label: "Feedback", icon: MessageSquare },
    { key: "users", label: "Users", icon: Users },
  ] as const;

  const [expandedDay, setExpandedDay] = useState<string | null>("monday");

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
          <Shield size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-sm text-[var(--text-secondary)]">Manage hostel platform</p>
        </div>
      </div>

      <div className="flex gap-2 mb-8">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === t.key
                  ? "bg-[var(--accent-primary)] text-white shadow-lg shadow-[var(--accent-glow)]"
                  : "glass text-[var(--text-secondary)] hover:text-white"
              }`}
            >
              <Icon size={16} />
              {t.label}
            </button>
          );
        })}
      </div>

      {activeTab === "menu" && (
        <form onSubmit={handleMenuSubmit} className="glass rounded-2xl p-6 space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <Upload size={18} className="text-[var(--accent-secondary)]" />
            <h2 className="font-semibold">Upload Weekly Menu</h2>
          </div>

          {menuMsg && (
            <div
              className={`px-4 py-2 rounded-xl text-sm ${
                menuMsg.includes("success")
                  ? "bg-[var(--success)]/10 text-[var(--success)]"
                  : "bg-[var(--danger)]/10 text-[var(--danger)]"
              }`}
            >
              {menuMsg}
            </div>
          )}

          <div>
            <label className="block text-sm text-[var(--text-secondary)] mb-2">
              Week Start Date (Monday)
            </label>
            <input
              type="date"
              value={menuDate}
              onChange={(e) => setMenuDate(e.target.value)}
              required
              className="px-4 py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] transition-all w-full sm:w-auto"
            />
          </div>

          {dayNames.map((day) => (
            <div key={day} className="border border-[var(--border-color)] rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => setExpandedDay(expandedDay === day ? null : day)}
                className="w-full flex items-center justify-between px-4 py-3 bg-[var(--bg-secondary)] hover:bg-[var(--bg-card-hover)] transition-colors"
              >
                <span className="font-medium capitalize">{day}</span>
                <ChevronDown
                  size={16}
                  className={`text-[var(--text-muted)] transition-transform ${
                    expandedDay === day ? "rotate-180" : ""
                  }`}
                />
              </button>
              {expandedDay === day && (
                <div className="p-4 space-y-3">
                  {(["breakfast", "lunch", "snacks", "dinner"] as const).map((meal) => (
                    <div key={meal}>
                      <label className="block text-xs text-[var(--text-muted)] mb-1 capitalize">
                        {meal} (comma-separated)
                      </label>
                      <input
                        type="text"
                        placeholder={`e.g. Poha, Tea, Toast`}
                        value={menuData[day][meal]}
                        onChange={(e) =>
                          setMenuData((prev) => ({
                            ...prev,
                            [day]: { ...prev[day], [meal]: e.target.value },
                          }))
                        }
                        className="w-full px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] transition-all"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          <button
            type="submit"
            disabled={menuSubmitting || !menuDate}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[var(--accent-primary)] to-[#fd79a8] text-white font-semibold hover:opacity-90 disabled:opacity-50"
          >
            {menuSubmitting ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Upload size={16} />
            )}
            Upload Menu
          </button>
        </form>
      )}

      {activeTab === "feedback" && (
        <div className="space-y-6">
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="glass rounded-xl p-4 text-center">
                <p className="text-2xl font-bold gradient-text">{stats.total}</p>
                <p className="text-xs text-[var(--text-muted)]">Total</p>
              </div>
              {Object.entries(stats.by_category).map(([cat, count]) => (
                <div key={cat} className="glass rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold">{count}</p>
                  <p className="text-xs text-[var(--text-muted)] capitalize">{cat}</p>
                </div>
              ))}
            </div>
          )}

          {fbLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-20 bg-[var(--bg-card)] rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {feedbacks.map((fb) => (
                <div key={fb.id} className="glass rounded-xl px-5 py-4 flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-[var(--accent-primary)]/10 text-[var(--accent-secondary)] capitalize">
                        {fb.category}
                      </span>
                      <span className="text-xs text-[var(--text-muted)]">
                        👍 {fb.upvotes}
                      </span>
                      {fb.is_anonymous && (
                        <span className="text-xs text-[var(--text-muted)]">🕶️ Anonymous</span>
                      )}
                    </div>
                    <p className="text-sm text-[var(--text-primary)]">{fb.content}</p>
                    {fb.image_url && (
                      <a href={fb.image_url} target="_blank" rel="noopener noreferrer" className="inline-block mt-2">
                        <img
                          src={fb.image_url}
                          alt="Feedback attachment"
                          className="w-20 h-20 object-cover rounded-lg border border-[var(--border-color)] hover:opacity-80 transition-opacity"
                        />
                      </a>
                    )}
                    <p className="text-xs text-[var(--text-muted)] mt-1">
                      {new Date(fb.created_at).toLocaleDateString("en-IN")}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteFeedback(fb.id)}
                    className="p-2 rounded-lg hover:bg-[var(--danger)]/10 text-[var(--danger)] transition-all flex-shrink-0"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "users" && (
        <div className="glass rounded-2xl overflow-hidden">
          {usersLoading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-12 bg-[var(--bg-card)] rounded-lg animate-pulse" />
              ))}
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border-color)]">
                  <th className="text-left px-5 py-3 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                    Email
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                    Role
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                    Joined
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-[var(--border-color)] last:border-0 hover:bg-[var(--bg-card-hover)] transition-colors">
                    <td className="px-5 py-3 text-sm">{u.email}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`text-xs font-medium px-2.5 py-1 rounded-lg ${
                          u.role === "admin"
                            ? "bg-amber-500/10 text-amber-400"
                            : "bg-[var(--accent-primary)]/10 text-[var(--accent-secondary)]"
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm text-[var(--text-muted)]">
                      {new Date(u.created_at).toLocaleDateString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
