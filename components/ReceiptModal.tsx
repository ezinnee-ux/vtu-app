"use client";

import React, { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import {
  CheckCircle2,
  Download,
  Share2,
  X,
  Copy,
  Printer,
  ShieldCheck,
  Check,
} from "lucide-react";
import { formatNaira } from "@/lib/helpers";

export interface ReceiptData {
  platformName?: string;
  reference: string;
  status: string;
  service: string;
  network: string;
  networkLogo?: string;
  phoneNumber: string;
  customerName?: string;
  customerEmail?: string;
  amount: number;
  planName?: string | null;
  dataSize?: string | null;
  validity?: string | null;
  paymentMethod?: string;
  providerReference?: string | null;
  date: string | Date;
}

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  receipt: ReceiptData | null;
}

export default function ReceiptModal({ isOpen, onClose, receipt }: ReceiptModalProps) {
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);

  useEffect(() => {
    if (isOpen && receipt && receipt.status === "SUCCESSFUL") {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#00875a", "#22c55e", "#f59e0b", "#3b82f6"],
        });
      } catch {
        // confetti fallback
      }
    }
  }, [isOpen, receipt]);

  if (!isOpen || !receipt) return null;

  const handleCopyRef = () => {
    navigator.clipboard.writeText(receipt.reference);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    const text = `QuickVTU Receipt: ${receipt.service} of ${formatNaira(receipt.amount)} for ${receipt.phoneNumber} was SUCCESSFUL. Ref: ${receipt.reference}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "QuickVTU Transaction Receipt",
          text,
          url: window.location.href,
        });
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      } catch {
        // Fallback to copy
        navigator.clipboard.writeText(text);
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      }
    } else {
      navigator.clipboard.writeText(text);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(receipt.date).toLocaleString("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header Close Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70 no-print">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
              Verified Receipt
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Receipt Body */}
        <div id="printable-receipt" className="p-6 text-center">
          {/* Status Icon */}
          <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 border-4 border-emerald-50 flex items-center justify-center text-emerald-600 mb-3 shadow-inner">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">
            {receipt.platformName || "QuickVTU Nigeria"}
          </span>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
            {formatNaira(receipt.amount)}
          </h2>
          <p className="text-xs font-semibold text-emerald-600 mt-1 flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            Transaction Successful & Delivered
          </p>

          {/* Detailed Info Grid */}
          <div className="mt-6 bg-slate-50 rounded-2xl p-4 border border-slate-100 text-left space-y-3">
            <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200/70">
              <span className="text-slate-500 font-medium">Service</span>
              <span className="font-bold text-slate-900">{receipt.service}</span>
            </div>

            {receipt.planName && (
              <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200/70">
                <span className="text-slate-500 font-medium">Package</span>
                <span className="font-bold text-emerald-700">
                  {receipt.planName} ({receipt.dataSize || ""})
                </span>
              </div>
            )}

            {receipt.validity && (
              <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200/70">
                <span className="text-slate-500 font-medium">Validity</span>
                <span className="font-semibold text-slate-800">{receipt.validity}</span>
              </div>
            )}

            <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200/70">
              <span className="text-slate-500 font-medium">Network</span>
              <span className="font-bold text-slate-900">{receipt.network}</span>
            </div>

            <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200/70">
              <span className="text-slate-500 font-medium">Recipient Phone</span>
              <span className="font-mono font-bold text-slate-900">{receipt.phoneNumber}</span>
            </div>

            {receipt.customerName && (
              <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200/70">
                <span className="text-slate-500 font-medium">Customer</span>
                <span className="font-semibold text-slate-800">{receipt.customerName}</span>
              </div>
            )}

            <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200/70">
              <span className="text-slate-500 font-medium">Payment Mode</span>
              <span className="font-medium text-slate-700 uppercase">{receipt.paymentMethod || "WALLET"}</span>
            </div>

            <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200/70">
              <span className="text-slate-500 font-medium">Reference</span>
              <div className="flex items-center space-x-1 font-mono text-[11px] font-bold text-slate-700">
                <span>{receipt.reference}</span>
                <button
                  onClick={handleCopyRef}
                  className="p-1 hover:bg-slate-200 rounded no-print transition-colors"
                  title="Copy reference"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-slate-400" />}
                </button>
              </div>
            </div>

            {receipt.providerReference && (
              <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200/70">
                <span className="text-slate-500 font-medium">Provider Ref</span>
                <span className="font-mono text-[11px] text-slate-600">{receipt.providerReference}</span>
              </div>
            )}

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Date & Time</span>
              <span className="text-slate-600">{formattedDate}</span>
            </div>
          </div>

          <div className="mt-4 text-[10px] text-slate-400">
            Questions regarding this receipt? Contact support@quickvtu.ng
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center gap-2 no-print">
          <button
            onClick={handlePrint}
            className="flex-1 py-2.5 px-3 rounded-xl bg-white border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition-colors flex items-center justify-center gap-1.5 shadow-sm"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            Download / Print
          </button>
          <button
            onClick={handleShare}
            className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20"
          >
            {shared ? (
              <>
                <Check className="w-4 h-4" />
                Copied / Shared!
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4" />
                Share Receipt
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
