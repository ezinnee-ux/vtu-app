"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Wifi,
  Smartphone,
  Wallet,
  History,
  Headphones,
  CheckCircle2,
  Clock,
  XCircle,
  ArrowUpRight,
  Eye,
  EyeOff,
  PlusCircle,
  Receipt,
  Users,
  Sparkles,
} from "lucide-react";
import FundWalletModal from "@/components/FundWalletModal";
import ReceiptModal, { ReceiptData } from "@/components/ReceiptModal";
import { formatNaira } from "@/lib/helpers";

interface DashboardData {
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
    walletBalance: number;
  };
  stats: {
    total: number;
    successful: number;
    pending: number;
    failed: number;
  };
  recentOrders: Array<{
    id: string;
    reference: string;
    type: string;
    amount: number;
    phoneNumber: string;
    status: string;
    createdAt: string;
    network: { name: string; code: string };
    plan?: { name: string; dataSize: string } | null;
  }>;
}

export default function UserDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBalance, setShowBalance] = useState(true);
  const [fundModalOpen, setFundModalOpen] = useState(false);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptData | null>(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      // Fetch user profile and recent transactions concurrently
      const [userRes, txRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/transactions?limit=6"),
      ]);

      const userData = await userRes.json();
      const txData = await txRes.json();

      if (userData.success && userData.data?.user) {
        setData({
          user: userData.data.user,
          stats: txData.data?.stats || { total: 0, successful: 0, pending: 0, failed: 0 },
          recentOrders: txData.data?.orders || [],
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReceipt = async (reference: string) => {
    try {
      const res = await fetch(`/api/transactions/${reference}`);
      const resData = await res.json();
      if (resData.success) {
        setSelectedReceipt(resData.data);
        setReceiptModalOpen(true);
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-36 bg-slate-200 rounded-3xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-slate-200 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-8">
      {/* Welcome & Wallet Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 text-white p-6 sm:p-8 shadow-xl">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-300 bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-700/50">
              <Sparkles className="w-3.5 h-3.5" />
              QuickVTU Instant Platform
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Hello, {data.user.name} 👋
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-md">
              Manage your digital subscriptions, top up data and airtime, and track your wallet
              balance in real-time.
            </p>
          </div>

          {/* Wallet Balance Widget Card */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/15 min-w-[240px] text-left">
            <div className="flex items-center justify-between text-xs text-emerald-200 font-semibold mb-1">
              <span>Available Wallet Balance</span>
              <button
                type="button"
                onClick={() => setShowBalance(!showBalance)}
                className="hover:text-white transition-colors"
              >
                {showBalance ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            <div className="text-3xl font-black tracking-tight text-white">
              {showBalance ? formatNaira(data.user.walletBalance) : "₦ •••••••"}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={() => setFundModalOpen(true)}
                className="flex-1 py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                Fund Wallet
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction Status Counters */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
          Transaction Overview
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 font-medium">Total Volume</span>
              <p className="text-2xl font-black text-slate-900 mt-1">{data.stats.total}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <History className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs text-emerald-600 font-medium">Successful</span>
              <p className="text-2xl font-black text-emerald-600 mt-1">{data.stats.successful}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs text-amber-600 font-medium">Pending / Queued</span>
              <p className="text-2xl font-black text-amber-600 mt-1">{data.stats.pending}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs text-red-600 font-medium">Failed / Reversed</span>
              <p className="text-2xl font-black text-red-600 mt-1">{data.stats.failed}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
              <XCircle className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Quick Actions Grid */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
          Quick Service Shortcuts
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          <Link
            href="/dashboard/buy-data"
            className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all text-center group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-2.5 group-hover:scale-110 transition-transform">
              <Wifi className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800 block">Buy Data</span>
            <span className="text-[10px] text-slate-400">SME & Direct</span>
          </Link>

          <Link
            href="/dashboard/buy-airtime"
            className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-amber-500 hover:shadow-md transition-all text-center group"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-2.5 group-hover:scale-110 transition-transform">
              <Smartphone className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800 block">Buy Airtime</span>
            <span className="text-[10px] text-amber-600 font-semibold">2% Cashback</span>
          </Link>

          <button
            onClick={() => setFundModalOpen(true)}
            className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-teal-500 hover:shadow-md transition-all text-center group"
          >
            <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center mx-auto mb-2.5 group-hover:scale-110 transition-transform">
              <Wallet className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800 block">Fund Wallet</span>
            <span className="text-[10px] text-slate-400">Card / USSD</span>
          </button>

          <Link
            href="/dashboard/transactions"
            className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-blue-500 hover:shadow-md transition-all text-center group"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mx-auto mb-2.5 group-hover:scale-110 transition-transform">
              <History className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800 block">Transactions</span>
            <span className="text-[10px] text-slate-400">Receipts</span>
          </Link>

          <Link
            href="/dashboard/saved-numbers"
            className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-purple-500 hover:shadow-md transition-all text-center group"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mx-auto mb-2.5 group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800 block">Beneficiaries</span>
            <span className="text-[10px] text-slate-400">Saved Lines</span>
          </Link>

          <Link
            href="/dashboard/support"
            className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-rose-500 hover:shadow-md transition-all text-center group"
          >
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center mx-auto mb-2.5 group-hover:scale-110 transition-transform">
              <Headphones className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800 block">Help Desk</span>
            <span className="text-[10px] text-slate-400">24/7 Support</span>
          </Link>
        </div>
      </div>

      {/* Recent Transactions List */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Recent Transactions</h3>
            <p className="text-xs text-slate-500">Your latest data subscriptions and airtime top-ups</p>
          </div>
          <Link
            href="/dashboard/transactions"
            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
          >
            View All <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {data.recentOrders.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <History className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-700">No transactions recorded yet</p>
            <p className="text-xs text-slate-400">Top up airtime or buy data to see your history here.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {data.recentOrders.map((order) => (
              <div
                key={order.id}
                className="px-6 py-4 flex items-center justify-between hover:bg-slate-50/80 transition-colors"
              >
                <div className="flex items-center space-x-3.5">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black uppercase ${
                      order.type === "DATA"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {order.network.name.slice(0, 3)}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      {order.type === "DATA"
                        ? `${order.network.name} Data (${order.plan?.dataSize || "Bundle"})`
                        : `${order.network.name} Airtime`}
                    </h4>
                    <span className="text-xs text-slate-500 font-mono">{order.phoneNumber}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <span className="text-sm font-black text-slate-900 block">
                      {formatNaira(order.amount)}
                    </span>
                    <span
                      className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        order.status === "SUCCESSFUL"
                          ? "bg-emerald-50 text-emerald-700"
                          : order.status === "PROCESSING" || order.status === "PENDING"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>

                  <button
                    onClick={() => handleOpenReceipt(order.reference)}
                    className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 hover:border-emerald-200 transition-colors"
                    title="View Receipt"
                  >
                    <Receipt className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reusable Modals */}
      <FundWalletModal
        isOpen={fundModalOpen}
        onClose={() => setFundModalOpen(false)}
        onSuccess={(newBal) => {
          setData({
            ...data,
            user: { ...data.user, walletBalance: newBal },
          });
        }}
      />

      <ReceiptModal
        isOpen={receiptModalOpen}
        onClose={() => setReceiptModalOpen(false)}
        receipt={selectedReceipt}
      />
    </div>
  );
}
