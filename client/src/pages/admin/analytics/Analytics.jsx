import React, { useState } from "react";
import { TrendingUp, Ticket, Bot, Users, Clock3, Star } from "lucide-react";

const Analytics = () => {
  const [period, setPeriod] = useState("30");

  const chartData = [42, 58, 51, 74, 62, 83, 91, 77, 96, 88, 105, 112];

  return (
    <div className="min-h-full px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-400">
            Administration
          </p>

          <h1 className="mt-1 text-2xl font-bold text-white">Analytics</h1>

          <p className="mt-1 text-sm text-slate-500">
            Analyze support performance and customer service trends.
          </p>
        </div>

        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-sm text-slate-300 outline-none"
        >
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        {[
          ["Tickets", "1,284", "+12.5%", Ticket, "text-blue-400"],
          ["AI Resolution", "65.6%", "+8.4%", Bot, "text-purple-400"],
          ["Active Agents", "24", "+3", Users, "text-emerald-400"],
          ["Avg. Response", "4m 18s", "-18%", Clock3, "text-amber-400"],
          ["Customer Rating", "4.8", "+0.2", Star, "text-yellow-400"],
          ["Resolution Rate", "91.2%", "+4.7%", TrendingUp, "text-cyan-400"],
        ].map(([title, value, trend, Icon, iconColor]) => (
          <div
            key={title}
            className="rounded-2xl border border-slate-800 bg-[#0a1222] p-5"
          >
            <div className="flex items-center justify-between">
              <Icon size={19} className={iconColor} />

              <span className="text-[11px] font-medium text-emerald-400">
                {trend}
              </span>
            </div>

            <p className="mt-4 text-xs text-slate-500">{title}</p>
            <p className="mt-1 text-2xl font-bold text-white">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-slate-800 bg-[#0a1222] p-5 sm:p-6">
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-white">Ticket Volume</h2>

          <p className="mt-1 text-xs text-slate-600">
            Ticket activity for the selected period
          </p>
        </div>

        <div className="flex h-64 items-end gap-2 overflow-hidden">
          {chartData.map((height, index) => (
            <div key={index} className="group flex h-full flex-1 items-end">
              <div
                className="w-full rounded-t-lg bg-blue-500/50 transition group-hover:bg-blue-400/70"
                style={{
                  height: `${height}%`,
                }}
              />
            </div>
          ))}
        </div>

        <div className="mt-3 flex justify-between text-[10px] text-slate-700">
          <span>Day 1</span>
          <span>Day 6</span>
          <span>Day 12</span>
          <span>Day 18</span>
          <span>Day 24</span>
          <span>Day 30</span>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
