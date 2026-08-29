'use client';

import { useEffect, useState, useCallback } from 'react';
import Header from '@/components/Header';
import { UserOrder } from '@/lib/types';
import { 
  Receipt, 
  Search, 
  Download, 
  CheckCircle2, 
  DollarSign
} from 'lucide-react';

type ExtendedOrder = UserOrder & { userId: number; username?: string };

export default function TransactionsPage() {
  const [orders, setOrders] = useState<ExtendedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const url = new URL('/api/transactions', window.location.origin);
      if (query) url.searchParams.set('q', query);
      if (statusFilter) url.searchParams.set('status', statusFilter);

      const res = await fetch(url.toString());
      const json = await res.json();
      if (json.success) {
        setOrders(json.data);
      }
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
    } finally {
      setLoading(false);
    }
  }, [query, statusFilter]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleExportCSV = () => {
    if (orders.length === 0) return;
    const headers = ['Order ID', 'User ID', 'Username', 'Product', 'Price', 'Method', 'Status', 'Date'];
    const rows = orders.map((o) => [
      o.id,
      o.userId,
      o.username || '',
      `"${o.product}"`,
      o.price,
      o.method,
      o.status,
      o.date,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `svalepay_transactions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  const totalFilteredRevenue = orders.reduce((acc, o) => acc + (o.price || 0), 0);

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 overflow-hidden bg-theme-main transition-colors duration-200">
      <Header
        title="Transaction History"
        onRefresh={fetchTransactions}
      />

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 max-w-7xl w-full mx-auto pb-8">
        {/* Top Controls & Metrics - Always 2 Cards Per Row */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <div className="rounded-lg bg-theme-card border border-theme p-3 sm:p-3.5 shadow-sm flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-theme-sub">Total Showing</p>
              <h3 className="text-sm sm:text-base font-extrabold text-theme-main mt-0.5">{orders.length} Orders</h3>
            </div>
            <div className="p-2 rounded-lg bg-theme-sub border border-theme shrink-0">
              <Receipt className="w-3.5 h-3.5 text-cyan-500" />
            </div>
          </div>

          <div className="rounded-lg bg-theme-card border border-theme p-3 sm:p-3.5 shadow-sm flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-theme-sub">Total Volume</p>
              <h3 className="text-sm sm:text-base font-extrabold text-emerald-500 mt-0.5">{formatRupiah(totalFilteredRevenue)}</h3>
            </div>
            <div className="p-2 rounded-lg bg-theme-sub border border-theme shrink-0">
              <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
            </div>
          </div>

          <div className="rounded-lg bg-theme-card border border-theme p-3 sm:p-3.5 shadow-sm flex items-center justify-center col-span-2">
            <button
              onClick={handleExportCSV}
              disabled={orders.length === 0}
              className="w-full py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm shadow-cyan-500/20 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV Report
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="rounded-xl bg-theme-card border border-theme p-4 sm:p-5 shadow-md space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto">
              <button
                onClick={() => setStatusFilter('')}
                className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                  statusFilter === ''
                    ? 'bg-cyan-500/20 text-cyan-500 border border-cyan-500/30'
                    : 'bg-theme-sub text-theme-sub hover:text-theme-main'
                }`}
              >
                All Status
              </button>
              <button
                onClick={() => setStatusFilter('success')}
                className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                  statusFilter === 'success'
                    ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30'
                    : 'bg-theme-sub text-theme-sub hover:text-theme-main'
                }`}
              >
                Success
              </button>
              <button
                onClick={() => setStatusFilter('pending')}
                className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                  statusFilter === 'pending'
                    ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30'
                    : 'bg-theme-sub text-theme-sub hover:text-theme-main'
                }`}
              >
                Pending
              </button>
            </div>

            <div className="relative w-full md:w-72">
              <Search className="w-3.5 h-3.5 text-theme-sub absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search TRX ID, Product, Username..."
                className="w-full bg-theme-input border border-theme rounded-lg pl-8 pr-3 py-1.5 text-xs text-theme-main focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Transactions Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-theme-sub whitespace-nowrap">
              <thead className="text-[10px] uppercase font-bold bg-theme-sub text-theme-sub border-b border-theme">
                <tr>
                  <th className="px-3 py-2 rounded-l-md">Transaction ID</th>
                  <th className="px-3 py-2">User</th>
                  <th className="px-3 py-2">Product</th>
                  <th className="px-3 py-2">Price</th>
                  <th className="px-3 py-2">Method</th>
                  <th className="px-3 py-2">Delivered Account Data</th>
                  <th className="px-3 py-2">Timestamp</th>
                  <th className="px-3 py-2 rounded-r-md">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme">
                {orders.length > 0 ? (
                  orders.map((ord, idx) => (
                    <tr key={ord.id || idx} className="hover:bg-theme-hover transition-colors">
                      <td className="px-3 py-2 font-mono font-bold text-cyan-500">{ord.id}</td>
                      <td className="px-3 py-2">
                        <div className="font-medium text-theme-main">
                          {ord.username ? `@${ord.username}` : `ID: ${ord.userId}`}
                        </div>
                      </td>
                      <td className="px-3 py-2 font-medium text-theme-main">{ord.product}</td>
                      <td className="px-3 py-2 font-bold text-emerald-500">
                        {formatRupiah(ord.price)}
                      </td>
                      <td className="px-3 py-2">
                        <span className="capitalize px-2 py-0.5 rounded bg-theme-sub text-[10px] text-theme-sub border border-theme">
                          {ord.method || 'saldo'}
                        </span>
                      </td>
                      <td className="px-3 py-2 max-w-xs truncate font-mono text-[11px] text-theme-sub">
                        {ord.data ? (
                          <span title={ord.data} className="bg-theme-input px-2 py-0.5 rounded border border-theme">
                            {ord.data}
                          </span>
                        ) : (
                          '-'
                        )}
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
                    <td colSpan={8} className="text-center py-8 text-theme-muted text-xs">
                      {loading ? 'Loading transactions...' : 'No transaction history found.'}
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
