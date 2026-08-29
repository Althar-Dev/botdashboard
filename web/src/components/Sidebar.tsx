'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSidebar } from '@/context/SidebarContext';
import {
  LayoutDashboard,
  Package,
  Users,
  Receipt,
  Settings,
  Bot,
  ShieldCheck,
  X
} from 'lucide-react';

const navItems = [
  { href: '/', label: 'Overview', icon: LayoutDashboard },
  { href: '/products', label: 'Products & Stock', icon: Package },
  { href: '/users', label: 'Users & Balance', icon: Users },
  { href: '/transactions', label: 'Transactions', icon: Receipt },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { isMobileOpen, closeMobile } = useSidebar();

  const sidebarContent = (
    <aside className="w-60 bg-theme-sidebar border-r border-theme flex flex-col justify-between shrink-0 h-full transition-colors duration-200">
      <div>
        {/* Brand Header */}
        <div className="h-16 shrink-0 border-b border-theme px-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 via-indigo-500 to-purple-600 flex items-center justify-center shadow-md shadow-cyan-500/20 shrink-0">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-sm text-theme-main tracking-tight flex items-center gap-1">
                Dashboard <span className="text-[9px] font-semibold px-1 py-0.2 rounded bg-cyan-500/10 text-cyan-500 border border-cyan-500/20">PRO</span>
              </h1>
              <p className="text-[10px] text-theme-sub flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Telegram Bot Admin
              </p>
            </div>
          </div>

          {/* Close button on mobile drawer */}
          <button
            onClick={closeMobile}
            className="lg:hidden p-1.5 rounded-lg text-theme-sub hover:text-theme-main hover:bg-theme-sub"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMobile}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium text-xs transition-all duration-200 ${isActive
                    ? 'bg-gradient-to-r from-cyan-500/20 to-indigo-500/10 text-cyan-500 border border-cyan-500/30 shadow-sm'
                    : 'text-theme-sub hover:text-theme-main hover:bg-theme-sub'
                  }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-500' : 'text-theme-sub'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-theme">
        <div className="p-2.5 rounded-lg bg-theme-sub border border-theme">
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-500 font-semibold mb-0.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            Database Connected
          </div>
          <p className="text-[10px] text-theme-sub leading-relaxed">
            Synced with <code className="text-theme-main bg-theme-main px-1 py-0.5 rounded border border-theme font-mono">src/database</code>
          </p>
        </div>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop Sidebar (Fixed) */}
      <div className="hidden lg:flex shrink-0 h-screen sticky top-0">
        {sidebarContent}
      </div>

      {/* Mobile Slide-Over Drawer Overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop blur overlay */}
          <div
            onClick={closeMobile}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
          />

          {/* Drawer sidebar panel */}
          <div className="relative z-10 h-full shadow-2xl animate-slide-in">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
