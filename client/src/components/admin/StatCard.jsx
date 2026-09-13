import React from "react";

const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendType = "positive",
  iconClassName = "bg-blue-500/10 text-blue-400",
}) => {
  return (
    <div className="group rounded-2xl border border-slate-800 bg-[#0a1222] p-5 transition-all duration-300 hover:border-slate-700 hover:bg-[#0c1629]">
      <div className="flex items-start justify-between gap-4">
        {/* Content */}
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
            {title}
          </p>

          <h3 className="mt-2 truncate text-2xl font-bold tracking-tight text-white sm:text-3xl">
            {value}
          </h3>

          {subtitle && (
            <p className="mt-2 text-xs text-slate-500">{subtitle}</p>
          )}

          {trend && (
            <div className="mt-3 flex items-center gap-2">
              <span
                className={`text-xs font-semibold ${
                  trendType === "negative"
                    ? "text-red-400"
                    : trendType === "neutral"
                      ? "text-slate-400"
                      : "text-emerald-400"
                }`}
              >
                {trend}
              </span>

              <span className="text-[11px] text-slate-600">
                vs previous period
              </span>
            </div>
          )}
        </div>

        {/* Icon */}
        {Icon && (
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-105 ${iconClassName}`}
          >
            <Icon size={20} />
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
