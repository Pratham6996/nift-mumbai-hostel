"use client";

import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";
import { UtensilsCrossed, Coffee, Sun, Moon, Cookie } from "lucide-react";

interface DayMenu {
  breakfast: string[];
  lunch: string[];
  snacks: string[];
  dinner: string[];
}

interface WeeklyMenu {
  id: string;
  week_start_date: string;
  monday: DayMenu;
  tuesday: DayMenu;
  wednesday: DayMenu;
  thursday: DayMenu;
  friday: DayMenu;
  saturday: DayMenu;
  sunday: DayMenu;
}

const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;
const dayLabels: Record<string, string> = {
  monday: "Mon",
  tuesday: "Tue",
  wednesday: "Wed",
  thursday: "Thu",
  friday: "Fri",
  saturday: "Sat",
  sunday: "Sun",
};

const mealIcons = {
  breakfast: Coffee,
  lunch: Sun,
  snacks: Cookie,
  dinner: Moon,
};

const mealColors: Record<string, string> = {
  breakfast: "from-amber-500 to-orange-500",
  lunch: "from-emerald-500 to-teal-500",
  snacks: "from-pink-500 to-rose-500",
  dinner: "from-indigo-500 to-purple-500",
};

export default function MenuPage() {
  const [menu, setMenu] = useState<WeeklyMenu | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(() => {
    const today = new Date().getDay();
    return days[today === 0 ? 6 : today - 1];
  });

  useEffect(() => {
    apiGet<WeeklyMenu | { message: string }>("/api/menu")
      .then((data) => {
        if ("message" in data) {
          setMenu(null);
        } else {
          setMenu(data);
        }
      })
      .catch(() => setMenu(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-[var(--bg-card)] rounded-lg" />
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="h-12 bg-[var(--bg-card)] rounded-lg" />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-40 bg-[var(--bg-card)] rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!menu) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 text-center">
        <UtensilsCrossed size={48} className="mx-auto text-[var(--text-muted)] mb-4" />
        <h2 className="text-xl font-semibold mb-2">No Menu Available</h2>
        <p className="text-[var(--text-secondary)]">
          The weekly menu hasn't been uploaded yet. Check back later!
        </p>
      </div>
    );
  }

  const dayMenu = menu[selectedDay] as DayMenu;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          Weekly <span className="gradient-text">Menu</span>
        </h1>
        <p className="text-[var(--text-secondary)]">
          Week of {new Date(menu.week_start_date).toLocaleDateString("en-IN", { month: "long", day: "numeric", year: "numeric" })}
        </p>
      </div>

      <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
        {days.map((day) => {
          const isToday = day === days[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];
          return (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`flex-shrink-0 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                selectedDay === day
                  ? "bg-[var(--accent-primary)] text-white shadow-lg shadow-[var(--accent-glow)]"
                  : "glass text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-card-hover)]"
              }`}
            >
              <span className="block">{dayLabels[day]}</span>
              {isToday && (
                <span className="block text-[10px] opacity-70 mt-0.5">Today</span>
              )}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {(["breakfast", "lunch", "snacks", "dinner"] as const).map((meal) => {
          const Icon = mealIcons[meal];
          const items = dayMenu?.[meal] || [];
          return (
            <div key={meal} className="glass rounded-2xl p-5 card-hover">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${mealColors[meal]} flex items-center justify-center`}>
                  <Icon size={18} className="text-white" />
                </div>
                <h3 className="font-semibold capitalize">{meal}</h3>
              </div>
              {items.length > 0 ? (
                <ul className="space-y-2">
                  {items.map((item, i) => (
                    <li
                      key={i}
                      className="flex items-center gap-2 text-sm text-[var(--text-secondary)]"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-secondary)] flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-[var(--text-muted)] italic">No items listed</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
