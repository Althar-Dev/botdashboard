'use client';

import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  gradient: string;
  badge?: string;
  badgeType?: 'success' | 'warning' | 'info';
}

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  gradient,
  badge,
  badgeType = 'success',
}: StatCardProps) {
  return (
    <div className="relative overflow-hidden rounded-lg bg-theme-card border border-theme p-3 sm:p-3.5 shadow-sm transition-all duration-300 hover:bg-theme-hover group">
      {/* Background Glow */}
      <div className={`absolute -right-4 -bottom-4 w-20 h-20 rounded-full blur-xl opacity-15 pointer-events-none ${gradient}`} />

      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-theme-sub truncate">{title}</p>
          <h3 className="text-sm sm:text-base font-extrabold text-theme-main mt-0.5 tracking-tight truncate">{value}</h3>
          {subtitle && <p className="text-[10px] text-theme-sub mt-0.5 truncate">{subtitle}</p>}
        </div>

        <div className="p-2 rounded-lg bg-theme-sub border border-theme shadow-inner shrink-0 group-hover:scale-105 transition-transform">
          <Icon className="w-3.5 h-3.5 text-cyan-500" />
        </div>
      </div>

      {badge && (
        <div className="mt-2 pt-2 border-t border-theme flex items-center justify-between">
          <span
            className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold border ${
              badgeType === 'success'
                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                : badgeType === 'warning'
                ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                : 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20'
            }`}
          >
            {badge}
          </span>
          <span className="text-[9px] text-theme-muted">Live</span>
        </div>
      )}
    </div>
  );
}
