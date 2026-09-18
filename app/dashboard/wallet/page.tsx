"use client";

import React, { useState, useEffect } from "react";
import {
  Wallet,
  PlusCircle,
  ArrowDownLeft,
  ArrowUpRight,
  History,
  ShieldCheck,
  Eye,
  EyeOff,
  Filter,
} from "lucide-react";
import FundWalletModal from "@/components/FundWalletModal";
import { formatNaira } from "@/lib/helpers";

interface WalletData {
  balance: number;
  currency: string;
  totalFunded: number;
  totalSpent: number;
  recentTransactions: Array<{
    id: string;
    amount: number;
    type: "CREDIT" | "DEBIT";
    description: string;
    reference: string;
    status: string;
    balanceBefore: number;
    balanceAfter: number;
    createdAt: string;
  }>;
}

export default function WalletPage() {
  const [data, setData] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBalance, setShowBalance] = useState(true);
  const [fundModalOpen, setFundModalOpen] = useState(false);
  const [filterType, setFilterType] = useState<"ALL" | "CREDIT" | "DEBIT">("ALL");

  useEffect(() => {
    fetchWallet();
  }, []);

  const fetchWallet = async () => {
    try {
      const res = await fetch("/api/wallet");
      const resData = await res.json();
      if (resData.success) {
        setData(resData.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filteredTxs =
    data?.recentTransactions.filter((tx) => {
      if (filterType === "ALL") return true;
      return tx.type === filterType;
    }) || [];

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-44 bg-slate-200 rounded-3xl" />
        <div className="h-64 bg-slate-200 rounded-3xl" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Wallet Balance Hero Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-tr from-slate-950 via-slate-900 to-emerald-950 text-white p-6 sm:p-8 shadow-xl border border-slate-800">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
              <span>Nigerian Naira Wallet Account</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-3xl sm:text-4xl font-black tracking-tight">
                {showBalance ? formatNaira(data.balance, true) : "₦ ••••••••"}
              </span>
              <button
                type="button"
                onClick={() => setShowBalance(!showBalance)}
                className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                {showBalance ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-slate-400">
              Funds are available for instant 1-click airtime and data purchases.
            </p>
          </div>

          <button
            onClick={() => setFundModalOpen(true)}
            className="py-3 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20 hover:-translate-y-0.5 shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            Fund Digital Wallet
          </button>
        </div>

        {/* Total stats strip */}
        <div className="mt-8 pt-6 border-t border-slate-800/80 grid grid-cols-2 gap-4">
          <div>
            <span className="text-xs text-slate-400 block font-medium">Total Lifetime Deposits</span>
            <span className="text-lg font-black text-emerald-400 mt-0.5 block">
              {formatNaira(data.totalFunded)}
            </span>
          </div>
          <div>
            <span className="text-xs text-slate-400 block font-medium">Total VTU Spend</span>
            <span className="text-lg font-black text-slate-200 mt-0.5 block">
              {formatNaira(data.totalSpent)}
            </span>
          </div>
        </div>
      </div>

      {/* Wallet Ledger Transactions */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">Wallet Transaction Ledger</h3>
            <p className="text-xs text-slate-500">Record of debits and credits in your digital wallet</p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
            {(["ALL", "CREDIT", "DEBIT"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  filterType === t
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                {t === "ALL" ? "All" : t === "CREDIT" ? "Deposits (+)" : "Debits (-)"}
              </button>
            ))}
          </div>
        </div>

        {filteredTxs.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <History className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-700">No wallet transactions found</p>
            <p className="text-xs text-slate-400">
              When you fund your wallet or make purchases, entries will appear here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredTxs.map((tx) => {
              const isCredit = tx.type === "CREDIT";
              return (
                <div
                  key={tx.id}
                  className="px-6 py-4 flex items-center justify-between hover:bg-slate-50/80 transition-colors"
                >
                  <div className="flex items-center space-x-3.5">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                        isCredit
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {isCredit ? (
                        <ArrowDownLeft className="w-5 h-5" />
                      ) : (
                        <ArrowUpRight className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 leading-snug">
                        {tx.description}
                      </h4>
                      <div className="flex items-center space-x-2 text-[10px] text-slate-400 mt-0.5">
                        <span className="font-mono">{tx.reference}</span>
                        <span>•</span>
                        <span>{new Date(tx.createdAt).toLocaleDateString("en-NG")}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`text-sm font-black block ${
                        isCredit ? "text-emerald-600" : "text-slate-900"
                      }`}
                    >
                      {isCredit ? "+" : "-"}
                      {formatNaira(tx.amount)}
                    </span>
                    <span className="text-[10px] text-slate-400 block font-mono">
                      Bal: {formatNaira(tx.balanceAfter)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Reusable Fund Modal */}
      <FundWalletModal
        isOpen={fundModalOpen}
        onClose={() => setFundModalOpen(false)}
        onSuccess={(newBal) => {
          setData({ ...data, balance: newBal });
          fetchWallet();
        }}
      />
    </div>
  );
}
