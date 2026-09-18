"use client";

import React, { useState } from "react";
import { X, Wallet, ShieldCheck, ArrowRight, Loader2, Sparkles } from "lucide-react";
import { formatNaira } from "@/lib/helpers";

interface FundWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (newBalance: number) => void;
}

export default function FundWalletModal({ isOpen, onClose, onSuccess }: FundWalletModalProps) {
  const [amount, setAmount] = useState<number | "">(2000);
  const [gateway, setGateway] = useState<"PAYSTACK" | "FLUTTERWAVE" | "TEST">("TEST");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  if (!isOpen) return null;

  const presets = [1000, 2000, 5000, 10000, 20000, 50000];

  const handleFund = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    const numAmount = Number(amount);
    if (!numAmount || numAmount < 100) {
      setError("Please enter a valid amount of at least ₦100.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/wallet/fund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: numAmount, gateway }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || "Failed to initiate wallet funding.");
        setLoading(false);
        return;
      }

      if (gateway === "TEST" || data.data?.simulated) {
        setSuccessMessage(`Success! ₦${numAmount.toLocaleString()} added to your wallet instantly.`);
        if (onSuccess && data.data?.newBalance !== undefined) {
          onSuccess(data.data.newBalance);
        }
        setTimeout(() => {
          onClose();
        }, 1500);
      } else if (data.data?.checkoutUrl) {
        // Redirect to Paystack or Flutterwave payment gateway checkout
        window.location.href = data.data.checkoutUrl;
      }
    } catch {
      setError("Network error while connecting to payment service.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-800 text-base">Fund Digital Wallet</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleFund} className="p-6 space-y-5">
          {error && (
            <div className="p-3 text-xs bg-red-50 border border-red-200 text-red-700 rounded-xl">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="p-3 text-xs bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              {successMessage}
            </div>
          )}

          {/* Amount input */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Enter Amount (NGN)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg">
                ₦
              </span>
              <input
                type="number"
                min="100"
                max="1000000"
                value={amount}
                onChange={(e) => setAmount(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="2,000"
                className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-lg font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                required
              />
            </div>
          </div>

          {/* Quick Preset Buttons */}
          <div>
            <span className="text-[11px] font-semibold text-slate-400 block mb-2">
              Quick Select Amount
            </span>
            <div className="grid grid-cols-3 gap-2">
              {presets.map((preset) => (
                <button
                  type="button"
                  key={preset}
                  onClick={() => setAmount(preset)}
                  className={`py-2 px-1 text-xs font-bold rounded-xl border transition-all ${
                    amount === preset
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50"
                  }`}
                >
                  {formatNaira(preset)}
                </button>
              ))}
            </div>
          </div>

          {/* Payment Gateway Options */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Select Payment Channel
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setGateway("TEST")}
                className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                  gateway === "TEST"
                    ? "border-emerald-500 bg-emerald-50/80 ring-2 ring-emerald-500/20"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <span className="text-xs font-black text-slate-900">Instant Test</span>
                <span className="text-[10px] text-emerald-700 font-semibold mt-1">
                  Sandbox Zero Fee
                </span>
              </button>

              <button
                type="button"
                onClick={() => setGateway("PAYSTACK")}
                className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                  gateway === "PAYSTACK"
                    ? "border-emerald-500 bg-emerald-50/80 ring-2 ring-emerald-500/20"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <span className="text-xs font-black text-slate-900">Paystack</span>
                <span className="text-[10px] text-slate-500 mt-1">Cards & USSD</span>
              </button>

              <button
                type="button"
                onClick={() => setGateway("FLUTTERWAVE")}
                className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                  gateway === "FLUTTERWAVE"
                    ? "border-emerald-500 bg-emerald-50/80 ring-2 ring-emerald-500/20"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <span className="text-xs font-black text-slate-900">Flutterwave</span>
                <span className="text-[10px] text-slate-500 mt-1">Bank Transfer</span>
              </button>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2 text-slate-600 text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Encrypted with bank-grade 256-bit security.</span>
          </div>

          {/* Action button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing Payment...
              </>
            ) : (
              <>
                Proceed to Pay {amount ? formatNaira(Number(amount)) : ""}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
