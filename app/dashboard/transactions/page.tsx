"use client";

import React, { useState, useEffect } from "react";
import {
  History,
  Search,
  Receipt,
  Filter,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  XCircle,
  RotateCcw,
} from "lucide-react";
import ReceiptModal, { ReceiptData } from "@/components/ReceiptModal";
import { formatNaira } from "@/lib/helpers";

interface Order {
  id: string;
  reference: string;
  type: string;
  phoneNumber: string;
  amount: number;
  status: string;
  createdAt: string;
  network: { name: string; code: string };
  plan?: { name: string; dataSize: string; validity: string } | null;
}

export default function TransactionsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptData | null>(null);

  useEffect(() => {
    fetchTransactions();
  }, [typeFilter, statusFilter]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (typeFilter !== "ALL") query.set("type", typeFilter);
      if (statusFilter !== "ALL") query.set("status", statusFilter);
      if (search) query.set("search", search);

      const res = await fetch(`/api/transactions?${query.toString()}`);
      const data = await res.json();
      if (data.success) {
        setOrders(data.data.orders || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTransactions();
  };

  const handleOpenReceipt = async (reference: string) => {
    try {
      const res = await fetch(`/api/transactions/${reference}`);
      const data = await res.json();
      if (data.success) {
        setSelectedReceipt(data.data);
        setReceiptModalOpen(true);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Transaction History & Receipts
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          View all your mobile data subscriptions and airtime top-ups with instant printable receipts.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Reference ID or Phone Number..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">All Services</option>
              <option value="DATA">Data Bundles</option>
              <option value="AIRTIME">Airtime</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="SUCCESSFUL">Successful</option>
              <option value="PENDING">Processing / Pending</option>
              <option value="FAILED">Failed</option>
              <option value="REVERSED">Refunded</option>
            </select>

            <button
              type="submit"
              className="py-2.5 px-4 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors shrink-0 shadow-sm"
            >
              Filter
            </button>
          </div>
        </form>
      </div>

      {/* Transactions Table / List */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400 animate-pulse">
            Loading your transactions...
          </div>
        ) : orders.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <History className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-800 text-sm">No transactions found</h3>
            <p className="text-xs text-slate-400">Try adjusting your search criteria or make a new top-up.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3.5">Reference / Date</th>
                  <th className="px-6 py-3.5">Service Details</th>
                  <th className="px-6 py-3.5">Recipient</th>
                  <th className="px-6 py-3.5">Amount</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((order) => {
                  return (
                    <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-mono font-bold text-slate-900 block">
                          {order.reference}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(order.createdAt).toLocaleString("en-NG", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <span className="font-bold text-slate-900 block">
                          {order.type === "DATA"
                            ? `${order.network.name} ${order.plan?.name || "Data Bundle"}`
                            : `${order.network.name} Airtime`}
                        </span>
                        {order.plan?.validity && (
                          <span className="text-[10px] text-emerald-600 font-semibold">
                            {order.plan.validity}
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 font-mono font-semibold text-slate-800">
                        {order.phoneNumber}
                      </td>

                      <td className="px-6 py-4 font-black text-slate-900 text-sm">
                        {formatNaira(order.amount)}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${
                            order.status === "SUCCESSFUL"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : order.status === "PROCESSING" || order.status === "PENDING"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : order.status === "REVERSED"
                              ? "bg-purple-50 text-purple-700 border border-purple-200"
                              : "bg-red-50 text-red-700 border border-red-200"
                          }`}
                        >
                          {order.status === "SUCCESSFUL" && <CheckCircle2 className="w-3 h-3" />}
                          {order.status === "PROCESSING" && <Clock className="w-3 h-3" />}
                          {order.status === "REVERSED" && <RotateCcw className="w-3 h-3" />}
                          {order.status === "FAILED" && <XCircle className="w-3 h-3" />}
                          {order.status}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleOpenReceipt(order.reference)}
                          className="py-1.5 px-3 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 font-bold text-xs inline-flex items-center gap-1 transition-colors"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      <ReceiptModal
        isOpen={receiptModalOpen}
        onClose={() => setReceiptModalOpen(false)}
        receipt={selectedReceipt}
      />
    </div>
  );
}
