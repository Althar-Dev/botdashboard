'use client';

import { useEffect, useState, useCallback } from 'react';
import Header from '@/components/Header';
import { BotUser } from '@/lib/types';
import {
  Search,
  Wallet,
  History,
  X,
  ShoppingBag,
  UserCheck
} from 'lucide-react';

export default function UsersPage() {
  const [users, setUsers] = useState<BotUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showSaldoModal, setShowSaldoModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<BotUser | null>(null);
  const [saldoMode, setSaldoMode] = useState<'add' | 'deduct' | 'set'>('add');
  const [amountInput, setAmountInput] = useState<number>(0);

  const [showHistoryModal, setShowHistoryModal] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/users');
      const json = await res.json();
      if (json.success) {
        setUsers(json.data);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Handle Saldo Adjustment
  const handleAdjustSaldo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || amountInput < 0) return;

    try {
      let bodyData: any = { userId: selectedUser.id };
      if (saldoMode === 'set') {
        bodyData.saldo = Number(amountInput);
      } else {
        bodyData.action = saldoMode;
        bodyData.amount = Number(amountInput);
      }

      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData),
      });

      const json = await res.json();
      if (json.success) {
        setShowSaldoModal(false);
        setAmountInput(0);
        setSelectedUser(null);
        fetchUsers();
      } else {
        alert(json.error || 'Failed to update balance');
      }
    } catch (err) {
      alert('Error updating balance');
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    return (
      String(u.id).includes(q) ||
      (u.username && u.username.toLowerCase().includes(q))
    );
  });

  const totalPoolSaldo = users.reduce((acc, u) => acc + (u.saldo || 0), 0);
  const totalUserOrders = users.reduce((acc, u) => acc + (u.transaksi || 0), 0);

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 overflow-hidden bg-theme-main transition-colors duration-200">
      <Header
        title="Users & Balance Management"
        onRefresh={fetchUsers}
      />

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 max-w-7xl w-full mx-auto pb-8">
        {/* Stat Cards Row - Always 2 Cards Per Row */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <div className="rounded-lg bg-theme-card border border-theme p-3 sm:p-3.5 shadow-sm flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-theme-sub">Users</p>
              <h3 className="text-sm sm:text-base font-extrabold text-theme-main mt-0.5">{users.length} Users</h3>
              <p className="text-[10px] text-theme-sub mt-0.5">Telegram Bot</p>
            </div>
            <div className="p-2 rounded-lg bg-theme-sub border border-theme shrink-0">
              <UserCheck className="w-3.5 h-3.5 text-cyan-500" />
            </div>
          </div>

          <div className="rounded-lg bg-theme-card border border-theme p-3 sm:p-3.5 shadow-sm flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-theme-sub">Deposit</p>
              <h3 className="text-sm sm:text-base font-extrabold text-emerald-500 mt-0.5">{formatRupiah(totalPoolSaldo)}</h3>
              <p className="text-[10px] text-theme-sub mt-0.5">User pool balance</p>
            </div>
            <div className="p-2 rounded-lg bg-theme-sub border border-theme shrink-0">
              <Wallet className="w-3.5 h-3.5 text-emerald-500" />
            </div>
          </div>

          <div className="rounded-lg bg-theme-card border border-theme p-3 sm:p-3.5 shadow-sm flex items-center justify-between col-span-2 sm:col-span-1">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-theme-sub">Purchases</p>
              <h3 className="text-sm sm:text-base font-extrabold text-indigo-500 mt-0.5">{totalUserOrders} Orders</h3>
              <p className="text-[10px] text-theme-sub mt-0.5">Successful transactions</p>
            </div>
            <div className="p-2 rounded-lg bg-theme-sub border border-theme shrink-0">
              <ShoppingBag className="w-3.5 h-3.5 text-indigo-500" />
            </div>
          </div>
        </div>

        {/* User Search & Table */}
        <div className="rounded-xl bg-theme-card border border-theme p-4 sm:p-5 shadow-md space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-theme-main">Telegram Users Directory</h2>
              <p className="text-[11px] text-theme-sub mt-0.5">Manage balances or inspect individual user transaction history</p>
            </div>

            {/* Search input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-theme-sub absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search ID / Username..."
                className="w-full bg-theme-input border border-theme rounded-lg pl-8 pr-3 py-1.5 text-xs text-theme-main focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* User Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-theme-sub whitespace-nowrap">
              <thead className="text-[10px] uppercase font-bold bg-theme-sub text-theme-sub border-b border-theme">
                <tr>
                  <th className="px-3 py-2 rounded-l-md">Telegram ID</th>
                  <th className="px-3 py-2">Username</th>
                  <th className="px-3 py-2">Active Balance</th>
                  <th className="px-3 py-2">Total Orders</th>
                  <th className="px-3 py-2">Registered</th>
                  <th className="px-3 py-2 rounded-r-md text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-theme-hover transition-colors">
                      <td className="px-3 py-2 font-mono font-bold text-cyan-500">{u.id}</td>
                      <td className="px-3 py-2 font-medium text-theme-main">
                        {u.username ? (
                          <span className="text-theme-main">@{u.username}</span>
                        ) : (
                          <span className="text-theme-muted italic">No username</span>
                        )}
                      </td>
                      <td className="px-3 py-2 font-bold text-emerald-500">
                        {formatRupiah(u.saldo || 0)}
                      </td>
                      <td className="px-3 py-2">
                        <span className="px-2 py-0.5 rounded-full bg-theme-sub text-[10px] font-semibold text-theme-main border border-theme">
                          {u.transaksi || 0} orders
                        </span>
                      </td>
                      <td className="px-3 py-2 text-[11px] text-theme-muted">
                        {u.createdAt ? new Date(u.createdAt).toLocaleString('en-US') : '-'}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedUser(u);
                              setSaldoMode('add');
                              setAmountInput(0);
                              setShowSaldoModal(true);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-500 text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer"
                          >
                            <Wallet className="w-3 h-3" />
                            Manage Balance
                          </button>

                          <button
                            onClick={() => {
                              setSelectedUser(u);
                              setShowHistoryModal(true);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-theme-sub hover:bg-theme-hover border border-theme text-theme-main text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer"
                          >
                            <History className="w-3 h-3" />
                            History
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-6 text-theme-muted text-xs">
                      {searchQuery ? 'No matching users found.' : 'No registered users yet.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Saldo Adjustment Modal */}
      {showSaldoModal && selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-theme-card border border-theme rounded-xl w-full max-w-sm p-5 shadow-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-theme pb-2.5">
              <div>
                <h3 className="text-sm font-bold text-theme-main">
                  Manage Balance: {selectedUser.username ? `@${selectedUser.username}` : selectedUser.id}
                </h3>
                <p className="text-[11px] text-theme-sub">Current balance: <strong className="text-emerald-500">{formatRupiah(selectedUser.saldo || 0)}</strong></p>
              </div>
              <button onClick={() => setShowSaldoModal(false)} className="text-theme-sub hover:text-theme-main">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAdjustSaldo} className="space-y-3">
              {/* Mode Selector */}
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-theme-input rounded-lg border border-theme">
                <button
                  type="button"
                  onClick={() => setSaldoMode('add')}
                  className={`py-1 text-[11px] font-semibold rounded transition-all ${saldoMode === 'add' ? 'bg-emerald-500 text-white' : 'text-theme-sub hover:text-theme-main'
                    }`}
                >
                  + Add
                </button>
                <button
                  type="button"
                  onClick={() => setSaldoMode('deduct')}
                  className={`py-1 text-[11px] font-semibold rounded transition-all ${saldoMode === 'deduct' ? 'bg-rose-500 text-white' : 'text-theme-sub hover:text-theme-main'
                    }`}
                >
                  - Deduct
                </button>
                <button
                  type="button"
                  onClick={() => setSaldoMode('set')}
                  className={`py-1 text-[11px] font-semibold rounded transition-all ${saldoMode === 'set' ? 'bg-cyan-500 text-white' : 'text-theme-sub hover:text-theme-main'
                    }`}
                >
                  Set
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-theme-sub mb-1">
                  Amount (IDR)
                </label>
                <input
                  type="number"
                  min={0}
                  required
                  value={amountInput}
                  onChange={(e) => setAmountInput(Number(e.target.value))}
                  placeholder="0"
                  className="w-full bg-theme-input border border-theme rounded-lg px-2.5 py-1.5 text-xs text-theme-main focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowSaldoModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-theme-sub text-theme-main text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-semibold shadow-md shadow-emerald-500/20"
                >
                  Save Balance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* User History Modal */}
      {showHistoryModal && selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-theme-card border border-theme rounded-xl w-full max-w-xl p-5 shadow-2xl space-y-3 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-theme pb-2.5">
              <div>
                <h3 className="text-sm font-bold text-theme-main">
                  Order History: {selectedUser.username ? `@${selectedUser.username}` : selectedUser.id}
                </h3>
                <p className="text-[11px] text-theme-sub">Total Orders: {selectedUser.order?.length || 0}</p>
              </div>
              <button onClick={() => setShowHistoryModal(false)} className="text-theme-sub hover:text-theme-main">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-0.5">
              {selectedUser.order && selectedUser.order.length > 0 ? (
                selectedUser.order.map((ord, idx) => (
                  <div
                    key={ord.id || idx}
                    className="p-3 rounded-lg bg-theme-sub border border-theme space-y-1.5 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-cyan-500">{ord.id}</span>
                      <span className="font-bold text-emerald-500">{formatRupiah(ord.price)}</span>
                    </div>
                    <div className="flex items-center justify-between text-theme-sub">
                      <span className="font-medium text-theme-main">{ord.product}</span>
                      <span className="text-theme-muted text-[10px]">{ord.date ? new Date(ord.date).toLocaleString('en-US') : '-'}</span>
                    </div>
                    {ord.data && (
                      <div className="p-1.5 rounded bg-theme-input font-mono text-[10px] text-theme-main whitespace-pre-wrap">
                        {ord.data}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-theme-muted text-xs">
                  User has no transaction history.
                </div>
              )}
            </div>

            <div className="flex justify-end pt-1 border-t border-theme">
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="px-3 py-1.5 rounded-lg bg-theme-sub text-theme-main text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
