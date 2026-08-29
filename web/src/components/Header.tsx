'use client';

import { RefreshCw, Sun, Moon, Menu, Play, Square, Loader2, CheckCircle2, Zap, Power } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { useSidebar } from '@/context/SidebarContext';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  onRefresh?: () => void;
}

export default function Header({ onRefresh }: HeaderProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isBotRunning, setIsBotRunning] = useState(false);
  const [isTogglingBot, setIsTogglingBot] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const { theme, toggleTheme } = useTheme();
  const { toggleMobile } = useSidebar();

  const fetchBotStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/bot');
      const json = await res.json();
      if (json.success) {
        setIsBotRunning(json.isRunning);
      }
    } catch (err) {
      console.error('Failed to fetch bot status:', err);
    }
  }, []);

  useEffect(() => {
    fetchBotStatus();
  }, [fetchBotStatus]);

  const handleRefreshClick = async () => {
    if (onRefresh) {
      setIsRefreshing(true);
      await onRefresh();
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  const handleToggleBot = async () => {
    try {
      setIsTogglingBot(true);
      const action = isBotRunning ? 'stop' : 'start';
      const res = await fetch('/api/bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const json = await res.json();
      if (json.success) {
        setIsBotRunning(json.isRunning);
        setToastMsg(json.message || (json.isRunning ? 'Bot launched!' : 'Bot stopped!'));
        setTimeout(() => setToastMsg(''), 3500);
      }
    } catch (err) {
      alert('Error controlling bot process');
    } finally {
      setIsTogglingBot(false);
    }
  };

  return (
    <header className="h-16 shrink-0 bg-theme-header border-b border-theme px-4 sm:px-6 flex items-center justify-between z-30 transition-colors duration-200 relative">
      {/* Toast Feedback Banner */}
      {toastMsg && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-xl flex items-center gap-1.5 animate-bounce">
          <CheckCircle2 className="w-3.5 h-3.5" />
          {toastMsg}
        </div>
      )}

      <div className="flex items-center gap-3">
        {/* Mobile Hamburger Menu Toggle Button */}
        <button
          onClick={toggleMobile}
          className="lg:hidden p-2 rounded-lg bg-theme-sub border border-theme text-theme-main hover:text-cyan-500 transition-all cursor-pointer"
          title="Open Menu"
        >
          <Menu className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Dynamic Run / Stop Bot Trigger Button */}
        <button
          onClick={handleToggleBot}
          disabled={isTogglingBot}
          className={`px-3 py-1.5 rounded-full border text-[11px] font-extrabold flex items-center gap-2 transition-all cursor-pointer shadow-md active:scale-95 disabled:opacity-50 group ${
            isBotRunning
              ? 'bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/30 text-rose-500 shadow-rose-500/10'
              : 'bg-gradient-to-r from-emerald-500/15 via-cyan-500/15 to-indigo-500/15 hover:from-emerald-500/25 hover:to-indigo-500/25 border-emerald-500/30 text-emerald-500 shadow-emerald-500/10'
          }`}
          title={isBotRunning ? 'Click to stop Telegram Bot' : 'Click to launch Telegram Bot process'}
        >
          {isTogglingBot ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>{isBotRunning ? 'Stopping...' : 'Starting...'}</span>
            </>
          ) : isBotRunning ? (
            <>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <Power className="w-3.5 h-3.5 text-rose-500 group-hover:scale-110 transition-transform" />
              <span>Stop Bot</span>
            </>
          ) : (
            <>
              <Zap className="w-3.5 h-3.5 text-emerald-500 fill-emerald-500/20 group-hover:scale-110 transition-transform" />
              <span>Run Bot</span>
            </>
          )}
        </button>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg bg-theme-sub border border-theme text-theme-main hover:text-cyan-500 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? (
            <>
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden md:inline">Light</span>
            </>
          ) : (
            <>
              <Moon className="w-3.5 h-3.5 text-indigo-500" />
              <span className="hidden md:inline">Dark</span>
            </>
          )}
        </button>

        {/* Refresh button */}
        {onRefresh && (
          <button
            onClick={handleRefreshClick}
            disabled={isRefreshing}
            className="p-2 rounded-lg bg-theme-sub border border-theme text-theme-main hover:text-cyan-500 transition-all cursor-pointer group"
            title="Refresh Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 transition-transform duration-500 ${isRefreshing ? 'animate-spin text-cyan-500' : 'group-hover:rotate-180'}`} />
          </button>
        )}

        {/* Profile Avatar */}
        <div className="flex items-center gap-2 pl-2 border-l border-theme">
          <div className="w-8 h-8 rounded-lg bg-theme-sub border border-theme flex items-center justify-center font-bold text-cyan-500 text-xs shadow-inner">
            S
          </div>
          <div className="hidden xl:block">
            <p className="text-xs font-semibold text-theme-main">Shop Admin</p>
            <p className="text-[9px] text-theme-sub">Super Admin</p>
          </div>
        </div>
      </div>
    </header>
  );
}
