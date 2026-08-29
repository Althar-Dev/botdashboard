'use client';

import { useEffect, useState, useCallback } from 'react';
import Header from '@/components/Header';
import { BotConfig } from '@/lib/types';
import { 
  Bot, 
  CreditCard, 
  Sliders, 
  Save, 
  CheckCircle2, 
  Eye,
  EyeOff
} from 'lucide-react';

export default function SettingsPage() {
  const [config, setConfig] = useState<BotConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const fetchConfig = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/config');
      const json = await res.json();
      if (json.success) {
        setConfig(json.data);
      }
    } catch (err) {
      console.error('Failed to fetch config:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;

    try {
      setSaving(true);
      setSuccessMsg('');
      const res = await fetch('/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      const json = await res.json();
      if (json.success) {
        setSuccessMsg('Settings successfully saved to src/database/config.json');
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        alert(json.error || 'Failed to save configuration');
      }
    } catch (err) {
      alert('Error saving configuration');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 overflow-hidden bg-theme-main transition-colors duration-200">
      <Header
        title="Bot & Payment Settings"
        onRefresh={fetchConfig}
      />

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 max-w-4xl w-full mx-auto pb-8">
        {successMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs font-semibold flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4" />
            {successMsg}
          </div>
        )}

        {config && (
          <form onSubmit={handleSaveConfig} className="space-y-5">
            {/* Telegram Bot Credentials */}
            <div className="rounded-xl bg-theme-card border border-theme p-4 sm:p-5 shadow-md space-y-4">
              <div className="flex items-center gap-2.5 border-b border-theme pb-3">
                <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-500">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-theme-main">Telegram Bot Credentials</h2>
                  <p className="text-[11px] text-theme-sub">Access token and system license configuration</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-theme-sub mb-1">
                    Telegram Bot Token
                  </label>
                  <div className="relative">
                    <input
                      type={showToken ? 'text' : 'password'}
                      required
                      value={config.bot.token}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          bot: { ...config.bot, token: e.target.value },
                        })
                      }
                      className="w-full bg-theme-input border border-theme rounded-lg pl-2.5 pr-8 py-1.5 text-xs font-mono text-theme-main focus:outline-none focus:border-cyan-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowToken(!showToken)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-theme-sub hover:text-theme-main"
                    >
                      {showToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-theme-sub mb-1">
                    License Key
                  </label>
                  <input
                    type="text"
                    required
                    value={config.bot.licenseKey}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        bot: { ...config.bot, licenseKey: e.target.value },
                      })
                    }
                    className="w-full bg-theme-input border border-theme rounded-lg px-2.5 py-1.5 text-xs font-mono text-cyan-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-theme-sub mb-1">
                    Shop Name
                  </label>
                  <input
                    type="text"
                    required
                    value={config.bot.shopName}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        bot: { ...config.bot, shopName: e.target.value },
                      })
                    }
                    className="w-full bg-theme-input border border-theme rounded-lg px-2.5 py-1.5 text-xs text-theme-main focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-theme-sub mb-1">
                    Testimonial / Info Channel (@username)
                  </label>
                  <input
                    type="text"
                    value={config.bot.channel}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        bot: { ...config.bot, channel: e.target.value },
                      })
                    }
                    placeholder="@TestimoniTos"
                    className="w-full bg-theme-input border border-theme rounded-lg px-2.5 py-1.5 text-xs text-theme-main focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[11px] font-semibold text-theme-sub mb-1">
                    Telegram Admin IDs (Comma-separated)
                  </label>
                  <input
                    type="text"
                    value={config.bot.adminId ? config.bot.adminId.join(', ') : ''}
                    onChange={(e) => {
                      const ids = e.target.value
                        .split(',')
                        .map((s) => Number(s.trim()))
                        .filter((n) => !isNaN(n) && n > 0);
                      setConfig({
                        ...config,
                        bot: { ...config.bot, adminId: ids },
                      });
                    }}
                    placeholder="8573485920, 439502551"
                    className="w-full bg-theme-input border border-theme rounded-lg px-2.5 py-1.5 text-xs font-mono text-theme-main focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
            </div>

            {/* SValePay Payment Credentials */}
            <div className="rounded-xl bg-theme-card border border-theme p-4 sm:p-5 shadow-md space-y-4">
              <div className="flex items-center gap-2.5 border-b border-theme pb-3">
                <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-theme-main">SValePay Merchant Credentials</h2>
                  <p className="text-[11px] text-theme-sub">QRIS & deposit payment gateway integration credentials</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-theme-sub mb-1">
                    Business ID
                  </label>
                  <input
                    type="text"
                    required
                    value={config.svalepay.business_id}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        svalepay: { ...config.svalepay, business_id: e.target.value },
                      })
                    }
                    placeholder="SVP-MINGST7"
                    className="w-full bg-theme-input border border-theme rounded-lg px-2.5 py-1.5 text-xs font-mono text-theme-main focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-theme-sub mb-1">
                    Secret Key
                  </label>
                  <div className="relative">
                    <input
                      type={showSecret ? 'text' : 'password'}
                      required
                      value={config.svalepay.secret_key}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          svalepay: { ...config.svalepay, secret_key: e.target.value },
                        })
                      }
                      className="w-full bg-theme-input border border-theme rounded-lg pl-2.5 pr-8 py-1.5 text-xs font-mono text-theme-main focus:outline-none focus:border-cyan-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSecret(!showSecret)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-theme-sub hover:text-theme-main"
                    >
                      {showSecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Interface & Layout Settings */}
            <div className="rounded-xl bg-theme-card border border-theme p-4 sm:p-5 shadow-md space-y-4">
              <div className="flex items-center gap-2.5 border-b border-theme pb-3">
                <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-500">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-theme-main">Telegram Bot Button Layout</h2>
                  <p className="text-[11px] text-theme-sub">Configure number of button menu columns in Telegram</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-theme-sub mb-1">
                    Category Columns (btnCtr)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={config.bot.btnCtr}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        bot: { ...config.bot, btnCtr: Number(e.target.value) },
                      })
                    }
                    className="w-full bg-theme-input border border-theme rounded-lg px-2.5 py-1.5 text-xs text-theme-main focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-theme-sub mb-1">
                    Product Columns (btnPrd)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={config.bot.btnPrd}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        bot: { ...config.bot, btnPrd: Number(e.target.value) },
                      })
                    }
                    className="w-full bg-theme-input border border-theme rounded-lg px-2.5 py-1.5 text-xs text-theme-main focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-theme-sub mb-1">
                    Balance Rounding Digits
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={config.bot.digit}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        bot: { ...config.bot, digit: Number(e.target.value) },
                      })
                    }
                    className="w-full bg-theme-input border border-theme rounded-lg px-2.5 py-1.5 text-xs text-theme-main focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-cyan-500/20 transition-all cursor-pointer disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                {saving ? 'Saving...' : 'Save All Settings'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
