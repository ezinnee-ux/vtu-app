"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Users,
  TrendingUp,
  History,
  Sliders,
  RotateCcw,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Loader2,
  DollarSign,
  Wallet,
  ArrowLeft,
  ChevronRight,
  Server,
  Zap,
} from "lucide-react";
import { formatNaira } from "@/lib/helpers";

interface AdminOverview {
  users: { total: number; active: number; suspended: number };
  orders: { total: number; successful: number; pending: number; failed: number };
  finances: {
    totalRevenue: number;
    totalCost: number;
    totalProfit: number;
    airtimeRevenue: number;
    dataRevenue: number;
    totalWalletFunding: number;
    userWalletFloat: number;
  };
  provider: {
    provider: string;
    balance: number;
    currency: string;
    status: string;
  };
}

interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  createdAt: string;
  wallet?: { balance: number };
  _count: { orders: number };
}

interface AdminOrder {
  id: string;
  reference: string;
  type: string;
  phoneNumber: string;
  amount: number;
  costPrice: number;
  profit: number;
  status: string;
  createdAt: string;
  user: { name: string; email: string };
  network: { name: string; code: string };
  plan?: { name: string; dataSize: string } | null;
  transaction?: { providerReference: string; apiResponse: string } | null;
}

interface AdminPlan {
  id: string;
  planCode: string;
  name: string;
  category: string;
  dataSize: string;
  validity: string;
  providerCost: number;
  adminMargin: number;
  sellingPrice: number;
  isActive: boolean;
  network: { name: string; code: string };
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"OVERVIEW" | "USERS" | "TRANSACTIONS" | "PRICING">("OVERVIEW");
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [plans, setPlans] = useState<AdminPlan[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter & Search states
  const [userSearch, setUserSearch] = useState("");
  const [txSearch, setTxSearch] = useState("");
  const [txStatus, setTxStatus] = useState("ALL");
  const [txNetwork, setTxNetwork] = useState("ALL");
  const [selectedPlanNetwork, setSelectedPlanNetwork] = useState("ALL");

  // Margin edit states
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [editMargin, setEditMargin] = useState<number>(0);
  const [savingPlan, setSavingPlan] = useState(false);
  const [bulkPercent, setBulkPercent] = useState<number>(5);
  const [selectedBulkNet, setSelectedBulkNet] = useState("mtn");
  const [actionMessage, setActionMessage] = useState("");

  useEffect(() => {
    fetchInitialAdmin();
  }, []);

  useEffect(() => {
    if (activeTab === "USERS") fetchUsers();
    if (activeTab === "TRANSACTIONS") fetchOrders();
    if (activeTab === "PRICING") fetchPlans();
  }, [activeTab]);

  const fetchInitialAdmin = async () => {
    try {
      const res = await fetch("/api/admin/overview");
      const data = await res.json();
      if (data.success) {
        setOverview(data.data);
      } else {
        router.push("/dashboard");
      }
    } catch {
      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const query = userSearch ? `?search=${encodeURIComponent(userSearch)}` : "";
      const res = await fetch(`/api/admin/users${query}`);
      const data = await res.json();
      if (data.success) setUsers(data.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchOrders = async () => {
    try {
      const params = new URLSearchParams();
      if (txSearch) params.set("search", txSearch);
      if (txStatus !== "ALL") params.set("status", txStatus);
      if (txNetwork !== "ALL") params.set("network", txNetwork);

      const res = await fetch(`/api/admin/transactions?${params.toString()}`);
      const data = await res.json();
      if (data.success) setOrders(data.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchPlans = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedPlanNetwork !== "ALL") params.set("network", selectedPlanNetwork);
      const res = await fetch(`/api/admin/plans?${params.toString()}`);
      const data = await res.json();
      if (data.success) setPlans(data.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleUserStatus = async (userId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, status: nextStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, status: nextStatus } : u))
        );
        setActionMessage(`User status changed to ${nextStatus}.`);
        setTimeout(() => setActionMessage(""), 3000);
      } else {
        alert(data.message);
      }
    } catch {
      alert("Failed to update user status");
    }
  };

  const handleProcessRefund = async (reference: string) => {
    if (!confirm(`Are you sure you want to refund order ${reference} back to the customer's wallet?`))
      return;

    try {
      const res = await fetch(`/api/admin/transactions/${reference}/refund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Admin manual refund" }),
      });
      const data = await res.json();
      if (data.success) {
        setActionMessage(data.message);
        setTimeout(() => setActionMessage(""), 3500);
        fetchOrders();
      } else {
        alert(data.message);
      }
    } catch {
      alert("Failed to process refund");
    }
  };

  const handleSavePlanMargin = async (planId: string) => {
    setSavingPlan(true);
    try {
      const res = await fetch("/api/admin/plans", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, adminMargin: editMargin }),
      });
      const data = await res.json();
      if (data.success) {
        setEditingPlanId(null);
        fetchPlans();
        setActionMessage(data.message);
        setTimeout(() => setActionMessage(""), 3000);
      } else {
        alert(data.message);
      }
    } catch {
      alert("Failed to save margin");
    } finally {
      setSavingPlan(false);
    }
  };

  const handleBulkMargin = async () => {
    try {
      const res = await fetch("/api/admin/plans", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          networkCode: selectedBulkNet,
          bulkMarginPercent: bulkPercent,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActionMessage(data.message);
        setTimeout(() => setActionMessage(""), 3500);
        fetchPlans();
      }
    } catch {
      alert("Bulk update failed");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-bold tracking-wider text-purple-300">
            Loading Admin Control Panel...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Admin Top Navigation */}
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Link
            href="/dashboard"
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Back to User Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-white text-base block leading-tight">
                QuickVTU Admin Control
              </span>
              <span className="text-[10px] uppercase font-semibold text-purple-400">
                Platform Operations
              </span>
            </div>
          </div>
        </div>

        {/* Live Provider Status badge */}
        {overview && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-xs">
            <Server className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-300 font-semibold">{overview.provider.provider}:</span>
            <span className="font-bold text-emerald-400">
              {formatNaira(overview.provider.balance)}
            </span>
          </div>
        )}
      </header>

      {/* Admin Tabs */}
      <div className="bg-slate-900/50 border-b border-slate-800 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex items-center space-x-2 overflow-x-auto py-2">
          <button
            onClick={() => setActiveTab("OVERVIEW")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 ${
              activeTab === "OVERVIEW"
                ? "bg-purple-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Financials & Metrics
          </button>

          <button
            onClick={() => setActiveTab("USERS")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 ${
              activeTab === "USERS"
                ? "bg-purple-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <Users className="w-4 h-4" />
            User Management ({overview?.users.total || 0})
          </button>

          <button
            onClick={() => setActiveTab("TRANSACTIONS")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 ${
              activeTab === "TRANSACTIONS"
                ? "bg-purple-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <History className="w-4 h-4" />
            All Transactions & Refunds
          </button>

          <button
            onClick={() => setActiveTab("PRICING")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 ${
              activeTab === "PRICING"
                ? "bg-purple-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <Sliders className="w-4 h-4" />
            Pricing & Margin Engine
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-8 space-y-6">
        {actionMessage && (
          <div className="p-4 bg-purple-950 border border-purple-800 text-purple-300 text-xs font-semibold rounded-2xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
            <span>{actionMessage}</span>
          </div>
        )}

        {/* TAB 1: OVERVIEW */}
        {activeTab === "OVERVIEW" && overview && (
          <div className="space-y-6">
            {/* Top Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-2">
                <span className="text-xs text-slate-400 font-medium">Total Platform Revenue</span>
                <p className="text-2xl font-black text-white">
                  {formatNaira(overview.finances.totalRevenue)}
                </p>
                <span className="text-[10px] text-emerald-400 block font-semibold">
                  Gross Sales Volume
                </span>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-2">
                <span className="text-xs text-slate-400 font-medium">Total Net Profit</span>
                <p className="text-2xl font-black text-emerald-400">
                  {formatNaira(overview.finances.totalProfit)}
                </p>
                <span className="text-[10px] text-slate-400 block">
                  Selling Price - Wholesale Cost
                </span>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-2">
                <span className="text-xs text-slate-400 font-medium">Wallet Deposits Volume</span>
                <p className="text-2xl font-black text-teal-400">
                  {formatNaira(overview.finances.totalWalletFunding)}
                </p>
                <span className="text-[10px] text-slate-400 block">Paystack & FLW Inflow</span>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-2">
                <span className="text-xs text-slate-400 font-medium">Wholesale VTU Balance</span>
                <p className="text-2xl font-black text-amber-400">
                  {formatNaira(overview.provider.balance)}
                </p>
                <span className="text-[10px] text-amber-300 block font-semibold">
                  {overview.provider.status}
                </span>
              </div>
            </div>

            {/* Breakdown Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Sales Split */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
                <h3 className="font-bold text-white text-sm">Revenue by Service</h3>
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between pb-2 border-b border-slate-800">
                    <span className="text-slate-400">Mobile Data Sales:</span>
                    <span className="font-black text-white">
                      {formatNaira(overview.finances.dataRevenue)}
                    </span>
                  </div>
                  <div className="flex justify-between pb-2 border-b border-slate-800">
                    <span className="text-slate-400">Airtime Sales:</span>
                    <span className="font-black text-white">
                      {formatNaira(overview.finances.airtimeRevenue)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Circulating User Balances:</span>
                    <span className="font-black text-purple-400">
                      {formatNaira(overview.finances.userWalletFloat)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Order Status Counters */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
                <h3 className="font-bold text-white text-sm">Order Status Summary</h3>
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between pb-2 border-b border-slate-800">
                    <span className="text-slate-400">Total Processed Orders:</span>
                    <span className="font-black text-white">{overview.orders.total}</span>
                  </div>
                  <div className="flex justify-between pb-2 border-b border-slate-800">
                    <span className="text-slate-400">Successful Deliveries:</span>
                    <span className="font-bold text-emerald-400">{overview.orders.successful}</span>
                  </div>
                  <div className="flex justify-between pb-2 border-b border-slate-800">
                    <span className="text-slate-400">Pending / Queued:</span>
                    <span className="font-bold text-amber-400">{overview.orders.pending}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Failed / Refunded:</span>
                    <span className="font-bold text-red-400">{overview.orders.failed}</span>
                  </div>
                </div>
              </div>

              {/* User Statistics */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
                <h3 className="font-bold text-white text-sm">Registered Accounts</h3>
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between pb-2 border-b border-slate-800">
                    <span className="text-slate-400">Total Accounts:</span>
                    <span className="font-black text-white">{overview.users.total}</span>
                  </div>
                  <div className="flex justify-between pb-2 border-b border-slate-800">
                    <span className="text-slate-400">Active Users:</span>
                    <span className="font-bold text-emerald-400">{overview.users.active}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Suspended Users:</span>
                    <span className="font-bold text-red-400">{overview.users.suspended}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: USER MANAGEMENT */}
        {activeTab === "USERS" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-white">Registered Users & Wallets</h2>
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && fetchUsers()}
                  placeholder="Search user name or phone..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-800/60 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="px-6 py-3.5">User Details</th>
                    <th className="px-6 py-3.5">Phone Number</th>
                    <th className="px-6 py-3.5">Wallet Balance</th>
                    <th className="px-6 py-3.5">Orders</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-bold text-white block">{u.name}</span>
                        <span className="text-[11px] text-slate-400">{u.email}</span>
                      </td>
                      <td className="px-6 py-4 font-mono font-semibold text-slate-300">{u.phone}</td>
                      <td className="px-6 py-4 font-black text-emerald-400 text-sm">
                        {formatNaira(u.wallet?.balance || 0)}
                      </td>
                      <td className="px-6 py-4 text-slate-400">{u._count.orders} orders</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            u.status === "ACTIVE"
                              ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                              : "bg-red-950 text-red-400 border border-red-800"
                          }`}
                        >
                          {u.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleToggleUserStatus(u.id, u.status)}
                          className={`py-1 px-3 rounded-lg text-xs font-bold transition-colors ${
                            u.status === "ACTIVE"
                              ? "bg-red-900/60 text-red-300 hover:bg-red-900 border border-red-800"
                              : "bg-emerald-900/60 text-emerald-300 hover:bg-emerald-900 border border-emerald-800"
                          }`}
                        >
                          {u.status === "ACTIVE" ? "Suspend" : "Activate"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: TRANSACTIONS & MANUAL REFUND */}
        {activeTab === "TRANSACTIONS" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-white">All Platform Transactions</h2>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={txSearch}
                  onChange={(e) => setTxSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && fetchOrders()}
                  placeholder="Search ref or phone..."
                  className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
                />
                <select
                  value={txStatus}
                  onChange={(e) => setTxStatus(e.target.value)}
                  className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300"
                >
                  <option value="ALL">All Status</option>
                  <option value="SUCCESSFUL">Successful</option>
                  <option value="PENDING">Pending</option>
                  <option value="FAILED">Failed</option>
                  <option value="REVERSED">Refunded</option>
                </select>
                <button
                  onClick={fetchOrders}
                  className="py-1.5 px-3 rounded-xl bg-purple-600 text-white font-bold text-xs hover:bg-purple-700"
                >
                  Filter
                </button>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-800/60 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="px-6 py-3.5">Reference / Customer</th>
                    <th className="px-6 py-3.5">Service</th>
                    <th className="px-6 py-3.5">Selling Price</th>
                    <th className="px-6 py-3.5">Provider Cost</th>
                    <th className="px-6 py-3.5">Net Profit</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {orders.map((o) => (
                    <tr key={o.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-mono font-bold text-white block">{o.reference}</span>
                        <span className="text-[11px] text-slate-400">{o.user?.name} ({o.phoneNumber})</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-slate-200 block">
                          {o.type === "DATA" ? `${o.network.name} Data` : `${o.network.name} Airtime`}
                        </span>
                        {o.plan && (
                          <span className="text-[10px] text-emerald-400">{o.plan.dataSize}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-bold text-white">{formatNaira(o.amount)}</td>
                      <td className="px-6 py-4 font-bold text-slate-400">{formatNaira(o.costPrice)}</td>
                      <td className="px-6 py-4 font-black text-emerald-400">+{formatNaira(o.profit)}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            o.status === "SUCCESSFUL"
                              ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                              : o.status === "REVERSED"
                              ? "bg-purple-950 text-purple-400 border border-purple-800"
                              : "bg-red-950 text-red-400 border border-red-800"
                          }`}
                        >
                          {o.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {o.status !== "REVERSED" && (
                          <button
                            onClick={() => handleProcessRefund(o.reference)}
                            className="py-1 px-2.5 rounded-lg bg-red-950 hover:bg-red-900 text-red-300 border border-red-800 text-[11px] font-bold transition-colors"
                          >
                            Refund
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: PRICING & PROFIT MARGIN ENGINE */}
        {activeTab === "PRICING" && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
              <h3 className="font-bold text-white text-base">Bulk Margin Configurator</h3>
              <p className="text-xs text-slate-400">
                Adjust wholesale-to-retail profit margins for entire network catalogs in one click.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <select
                  value={selectedBulkNet}
                  onChange={(e) => setSelectedBulkNet(e.target.value)}
                  className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-white"
                >
                  <option value="mtn">MTN Nigeria</option>
                  <option value="airtel">Airtel Nigeria</option>
                  <option value="glo">Glo Nigeria</option>
                  <option value="9mobile">9mobile</option>
                </select>

                <div className="flex items-center gap-1">
                  <span className="text-xs text-slate-400">Set Margin %:</span>
                  <input
                    type="number"
                    value={bulkPercent}
                    onChange={(e) => setBulkPercent(Number(e.target.value))}
                    className="w-20 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-white"
                  />
                  <span className="text-xs text-slate-400">%</span>
                </div>

                <button
                  type="button"
                  onClick={handleBulkMargin}
                  className="py-2 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition-colors"
                >
                  Apply to All Plans
                </button>
              </div>
            </div>

            {/* Individual Data Plans Price Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden space-y-4 p-6">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-white text-base">Dynamic Data Plan Selling Prices</h3>
                <select
                  value={selectedPlanNetwork}
                  onChange={(e) => setSelectedPlanNetwork(e.target.value)}
                  className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-white"
                >
                  <option value="ALL">All Networks</option>
                  <option value="mtn">MTN</option>
                  <option value="airtel">Airtel</option>
                  <option value="glo">Glo</option>
                  <option value="9mobile">9mobile</option>
                </select>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-800/60 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-3">Network / Plan</th>
                      <th className="px-4 py-3">Data Size</th>
                      <th className="px-4 py-3">Validity</th>
                      <th className="px-4 py-3">Wholesale Cost</th>
                      <th className="px-4 py-3">Admin Margin</th>
                      <th className="px-4 py-3">Customer Selling Price</th>
                      <th className="px-4 py-3 text-right">Edit Margin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {plans.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-3 font-bold text-white">
                          <span className="uppercase text-purple-400 mr-1.5">[{p.network.code}]</span>
                          {p.name}
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-200">{p.dataSize}</td>
                        <td className="px-4 py-3 text-slate-400">{p.validity}</td>
                        <td className="px-4 py-3 font-mono text-slate-300">
                          {formatNaira(p.providerCost)}
                        </td>
                        <td className="px-4 py-3 font-mono text-emerald-400">
                          {editingPlanId === p.id ? (
                            <input
                              type="number"
                              value={editMargin}
                              onChange={(e) => setEditMargin(Number(e.target.value))}
                              className="w-20 px-2 py-1 bg-slate-800 border border-purple-500 rounded text-xs text-white"
                              autoFocus
                            />
                          ) : (
                            formatNaira(p.adminMargin)
                          )}
                        </td>
                        <td className="px-4 py-3 font-bold text-white text-sm">
                          {editingPlanId === p.id
                            ? formatNaira(p.providerCost + editMargin)
                            : formatNaira(p.sellingPrice)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {editingPlanId === p.id ? (
                            <div className="flex items-center justify-end space-x-1">
                              <button
                                onClick={() => handleSavePlanMargin(p.id)}
                                disabled={savingPlan}
                                className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-[10px]"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingPlanId(null)}
                                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px]"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setEditingPlanId(p.id);
                                setEditMargin(p.adminMargin);
                              }}
                              className="py-1 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-[11px]"
                            >
                              Edit
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
