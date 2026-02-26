"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { apiGet, apiPost, apiDelete } from "@/lib/api";
import {
  Wallet,
  Plus,
  Trash2,
  Download,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface Expense {
  id: string;
  user_id: string;
  item_name: string;
  category: string;
  amount: number;
  date: string;
  created_at: string;
}

interface Summary {
  month: string;
  total: number;
  by_category: Record<string, number>;
  count: number;
}

const categoryEmoji: Record<string, string> = {
  food: "🍛",
  drink: "🥤",
  snacks: "🍪",
};

const PIE_COLORS = ["#6c5ce7", "#00b894", "#fdcb6e"];

export default function ExpensesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const monthStr = `${year}-${String(month).padStart(2, "0")}`;

  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState("food");
  const [formAmount, setFormAmount] = useState("");
  const [formDate, setFormDate] = useState(now.toISOString().slice(0, 10));
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [exp, sum] = await Promise.all([
        apiGet<Expense[]>(`/api/expenses?month=${monthStr}`),
        apiGet<Summary>(`/api/expenses/summary?month=${monthStr}`),
      ]);
      setExpenses(exp);
      setSummary(sum);
    } catch {
      setExpenses([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchData();
  }, [user, monthStr]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiPost("/api/expenses", {
        item_name: formName,
        category: formCategory,
        amount: parseFloat(formAmount),
        date: formDate,
      });
      setFormName("");
      setFormAmount("");
      setShowForm(false);
      fetchData();
    } catch {}
    setSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this expense?")) return;
    try {
      await apiDelete(`/api/expenses/${id}`);
      fetchData();
    } catch {}
  };

  const exportCSV = () => {
    if (!expenses.length) return;
    const headers = ["Date", "Item", "Category", "Amount"];
    const rows = expenses.map((e) => [e.date, e.item_name, e.category, e.amount.toString()]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `expenses_${monthStr}.csv`;
    a.click();
  };

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(year - 1); }
    else setMonth(month - 1);
  };

  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(year + 1); }
    else setMonth(month + 1);
  };

  if (authLoading || !user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="h-64 bg-[var(--bg-card)] rounded-2xl animate-pulse" />
      </div>
    );
  }

  const pieData = summary
    ? Object.entries(summary.by_category).map(([name, value]) => ({ name, value }))
    : [];

  const dailyData: Record<string, number> = {};
  expenses.forEach((e) => {
    const day = e.date.slice(8);
    dailyData[day] = (dailyData[day] || 0) + e.amount;
  });
  const barData = Object.entries(dailyData)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, total]) => ({ day, total: Math.round(total * 100) / 100 }));

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-1">
            My <span className="gradient-text">Expenses</span>
          </h1>
          <p className="text-[var(--text-secondary)] text-sm">
            Track and analyse your hostel spending.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportCSV}
            disabled={!expenses.length}
            className="flex items-center gap-2 px-4 py-2 rounded-xl glass text-sm text-[var(--text-secondary)] hover:text-white transition-colors disabled:opacity-40"
          >
            <Download size={16} />
            CSV
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-[var(--accent-primary)] to-[#fd79a8] text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            <Plus size={16} />
            Add
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="glass rounded-2xl p-6 mb-8 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Item name"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              required
              className="px-4 py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] transition-all"
            />
            <select
              value={formCategory}
              onChange={(e) => setFormCategory(e.target.value)}
              className="px-4 py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] transition-all"
            >
              <option value="food">🍛 Food</option>
              <option value="drink">🥤 Drink</option>
              <option value="snacks">🍪 Snacks</option>
            </select>
            <input
              type="number"
              placeholder="Amount (₹)"
              value={formAmount}
              onChange={(e) => setFormAmount(e.target.value)}
              required
              min="0.01"
              step="0.01"
              className="px-4 py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] transition-all"
            />
            <input
              type="date"
              value={formDate}
              onChange={(e) => setFormDate(e.target.value)}
              className="px-4 py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[var(--accent-primary)] to-[#fd79a8] text-white font-semibold hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Plus size={16} />
            )}
            Add Expense
          </button>
        </form>
      )}

      <div className="flex items-center justify-between mb-6">
        <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-[var(--bg-card)] transition-colors">
          <ChevronLeft size={20} className="text-[var(--text-secondary)]" />
        </button>
        <div className="flex items-center gap-2 text-lg font-semibold">
          <Calendar size={18} className="text-[var(--accent-secondary)]" />
          {new Date(year, month - 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
        </div>
        <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-[var(--bg-card)] transition-colors">
          <ChevronRight size={20} className="text-[var(--text-secondary)]" />
        </button>
      </div>

      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="glass rounded-2xl p-5 text-center">
            <p className="text-sm text-[var(--text-muted)] mb-1">Total Spent</p>
            <p className="text-2xl font-bold gradient-text">₹{summary.total.toLocaleString("en-IN")}</p>
          </div>
          <div className="glass rounded-2xl p-5 text-center">
            <p className="text-sm text-[var(--text-muted)] mb-1">Transactions</p>
            <p className="text-2xl font-bold">{summary.count}</p>
          </div>
          <div className="glass rounded-2xl p-5 text-center">
            <p className="text-sm text-[var(--text-muted)] mb-1">Daily Average</p>
            <p className="text-2xl font-bold">
              ₹{summary.count > 0 ? Math.round(summary.total / Math.max(Object.keys(dailyData).length, 1)) : 0}
            </p>
          </div>
        </div>
      )}

      {barData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="glass rounded-2xl p-5">
            <h3 className="font-semibold mb-4 text-sm">Daily Spending</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={barData}>
                <XAxis dataKey="day" tick={{ fill: "#a0a0b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#a0a0b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "#1a1a2e",
                    border: "1px solid #2a2a3e",
                    borderRadius: "12px",
                    color: "#f1f1f7",
                  }}
                  formatter={(val: number) => [`₹${val}`, "Spent"]}
                />
                <Bar dataKey="total" fill="#6c5ce7" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="glass rounded-2xl p-5">
            <h3 className="font-semibold mb-4 text-sm">By Category</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "#1a1a2e",
                    border: "1px solid #2a2a3e",
                    borderRadius: "12px",
                    color: "#f1f1f7",
                  }}
                  formatter={(val: number) => [`₹${val}`, ""]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 bg-[var(--bg-card)] rounded-xl animate-pulse" />
          ))}
        </div>
      ) : expenses.length === 0 ? (
        <div className="text-center py-16">
          <Wallet size={40} className="mx-auto text-[var(--text-muted)] mb-3" />
          <p className="text-[var(--text-secondary)]">No expenses this month.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {expenses.map((e) => (
            <div
              key={e.id}
              className="glass rounded-xl px-5 py-3 flex items-center justify-between group card-hover"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{categoryEmoji[e.category] || "📦"}</span>
                <div>
                  <p className="font-medium text-sm">{e.item_name}</p>
                  <p className="text-xs text-[var(--text-muted)]">{new Date(e.date).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold">₹{e.amount}</span>
                <button
                  onClick={() => handleDelete(e.id)}
                  className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-[var(--danger)]/10 text-[var(--danger)] transition-all"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
