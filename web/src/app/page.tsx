'use client';

import { useEffect, useState, useCallback } from 'react';
import Header from '@/components/Header';
import StatCard from '@/components/StatCard';
import { OverviewStats } from '@/lib/types';
import {
  DollarSign,
  ShoppingCart,
  Users,
  Box,
  TrendingUp,
  ArrowUpRight,
  CheckCircle2
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';

export default function OverviewPage() {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/stats');
      const json = await res.json();
      if (json.success) {
        setStats(json.data);
      }
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 overflow-hidden bg-theme-main transition-colors duration-200">
      <Header
        title="Dashboard Overview"
        onRefresh={fetchStats}
      />

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 max-w-7xl w-full mx-auto pb-8">
        {/* KPI Cards Grid */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <StatCard
            title="Revenue"
            value={loading ? '...' : formatRupiah(stats?.totalRevenue || 0)}
            subtitle="Successful sales"
            icon={DollarSign}
            gradient="bg-emerald-500"
            badge="Verified"
            badgeType="success"
          />
          <StatCard
            title="Transactions"
            value={loading ? '...' : stats?.totalTransactions || 0}
            subtitle="Orders processed"
            icon={ShoppingCart}
            gradient="bg-cyan-500"
            badge="Bot Activity"
            badgeType="info"
          />
          <StatCard
            title="Users"
            value={loading ? '...' : stats?.totalUsers || 0}
            subtitle="Active Telegram users"
            icon={Users}
            gradient="bg-indigo-500"
            badge="User Base"
            badgeType="info"
          />
          <StatCard
            title="Stock"
            value={loading ? '...' : stats?.totalStockAvailable || 0}
            subtitle="Available accounts"
            icon={Box}
            gradient="bg-purple-500"
            badge={stats?.totalStockAvailable === 0 ? 'Out of Stock' : 'In Stock'}
            badgeType={stats?.totalStockAvailable === 0 ? 'warning' : 'success'}
          />
        </div>

        {/* Analytics Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Revenue Trend Area Chart */}
          <div className="lg:col-span-2 rounded-xl bg-theme-card border border-theme p-4 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-theme-main flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-cyan-500" />
                  Daily Revenue Trend
                </h2>
                <p className="text-[11px] text-theme-sub mt-0.5">Revenue performance over recent days</p>
              </div>
            </div>

            <div className="h-56 w-full">
              {stats?.revenueByDay && stats.revenueByDay.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.revenueByDay}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" opacity={0.6} />
                    <XAxis dataKey="date" stroke="var(--text-sub)" fontSize={10} tickLine={false} />
                    <YAxis stroke="var(--text-sub)" fontSize={10} tickLine={false} tickFormatter={(val) => `Rp ${val}`} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--bg-card)',
                        borderColor: 'var(--border-color)',
                        borderRadius: '0.5rem',
                        fontSize: '0.75rem',
                        color: 'var(--text-main)',
                      }}
                      formatter={(val: any) => [`Rp ${Number(val).toLocaleString('id-ID')}`, 'Revenue']}
                    />
                    <Area
                      type="monotone"
                      dataKey="amount"
                      stroke="#06b6d4"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorRevenue)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-theme-muted text-xs">
                  No chart data available
                </div>
              )}
            </div>
          </div>

          {/* Orders Breakdown Chart */}
          <div className="rounded-xl bg-theme-card border border-theme p-4 shadow-lg flex flex-col justify-between">
            <div>
              <h2 className="text-sm font-bold text-theme-main flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-indigo-500" />
                Daily Orders Volume
              </h2>
              <p className="text-[11px] text-theme-sub mt-0.5">Order frequency by day</p>
            </div>

            <div className="h-44 w-full my-3">
              {stats?.revenueByDay && stats.revenueByDay.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.revenueByDay}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" opacity={0.4} />
                    <XAxis dataKey="date" stroke="var(--text-sub)" fontSize={9} tickLine={false} />
                    <YAxis stroke="var(--text-sub)" fontSize={9} tickLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--bg-card)',
                        borderColor: 'var(--border-color)',
                        borderRadius: '0.5rem',
                        fontSize: '0.75rem',
                        color: 'var(--text-main)',
                      }}
                    />
                    <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-theme-muted text-xs">
                  No orders recorded
                </div>
              )}
            </div>

            <div className="p-2.5 rounded-lg bg-theme-sub border border-theme text-[11px] text-theme-sub flex items-center justify-between">
              <span>Total Product Categories</span>
              <span className="font-bold text-cyan-500">{stats?.totalCategories || 0} Categories</span>
            </div>
          </div>
        </div>

        {/* Recent Orders Table */}
        <div className="rounded-xl bg-theme-card border border-theme p-4 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-theme-main">Recent Transactions</h2>
              <p className="text-[11px] text-theme-sub mt-0.5">List of recent orders processed by Telegram bot</p>
            </div>
            <a
              href="/transactions"
              className="text-xs font-semibold text-cyan-500 hover:text-cyan-400 flex items-center gap-1 transition-colors"
            >
              View All <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-theme-sub whitespace-nowrap">
              <thead className="text-[10px] uppercase font-bold bg-theme-sub text-theme-sub border-b border-theme">
                <tr>
                  <th className="px-3 py-2 rounded-l-md">Order ID</th>
                  <th className="px-3 py-2">User</th>
                  <th className="px-3 py-2">Product</th>
                  <th className="px-3 py-2">Price</th>
                  <th className="px-3 py-2">Method</th>
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2 rounded-r-md">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme">
                {stats?.recentOrders && stats.recentOrders.length > 0 ? (
                  stats.recentOrders.map((ord, idx) => (
                    <tr key={ord.id || idx} className="hover:bg-theme-hover transition-colors">
                      <td className="px-3 py-2 font-mono font-bold text-cyan-500">{ord.id}</td>
                      <td className="px-3 py-2">
                        <div className="font-medium text-theme-main">
                          {ord.username ? `@${ord.username}` : `ID: ${ord.userId}`}
                        </div>
                      </td>
                      <td className="px-3 py-2 font-medium text-theme-main">{ord.product}</td>
                      <td className="px-3 py-2 font-semibold text-emerald-500">
                        {formatRupiah(ord.price)}
                      </td>
                      <td className="px-3 py-2">
                        <span className="capitalize px-2 py-0.5 rounded bg-theme-sub text-[10px] text-theme-sub border border-theme">
                          {ord.method}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-[11px] text-theme-muted">
                        {ord.date ? new Date(ord.date).toLocaleString('en-US') : '-'}
                      </td>
                      <td className="px-3 py-2">
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" />
                          Success
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center py-6 text-theme-muted text-xs">
                      No transaction history found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
