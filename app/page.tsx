"use client";

import React, { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  Wifi,
  Smartphone,
  ShieldCheck,
  Zap,
  Clock,
  RotateCcw,
  CheckCircle2,
  ChevronRight,
  HelpCircle,
  Headphones,
  ArrowRight,
  TrendingDown,
  Star,
  Users,
} from "lucide-react";
import { formatNaira, detectNetworkFromPhone } from "@/lib/helpers";

export default function LandingPage() {
  // Interactive top-up quick preview calculator
  const [quickNetwork, setQuickNetwork] = useState<"mtn" | "airtel" | "glo" | "9mobile">("mtn");
  const [quickPhone, setQuickPhone] = useState("");
  const [quickType, setQuickType] = useState<"data" | "airtime">("data");
  const [quickAmount, setQuickAmount] = useState(1000);

  // Auto-detect network from phone
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuickPhone(val);
    const detected = detectNetworkFromPhone(val);
    if (detected) {
      setQuickNetwork(detected);
    }
  };

  const faqs = [
    {
      q: "How fast is mobile data and airtime delivery?",
      a: "Our virtual top-up system is 100% automated with direct telecom switch integrations. Airtime and data are delivered in under 10 seconds after payment confirmation.",
    },
    {
      q: "What happens if a transaction fails?",
      a: "We have an automatic idempotency and rollback engine. If the telecom provider rejects a top-up or is unreachable, your money is immediately refunded back to your QuickVTU wallet.",
    },
    {
      q: "How do I fund my wallet?",
      a: "You can fund your digital wallet through secure Nigerian payment gateways including Paystack and Flutterwave via Debit Cards, USSD, and Bank Transfers, or our instant sandbox channel.",
    },
    {
      q: "Are the data plans valid for full 30 days?",
      a: "Yes! All monthly data bundles are official direct bundles valid for the full period stated (e.g. 30 days, 7 days, or 1 day depending on package chosen).",
    },
    {
      q: "Can I save my family members' numbers for quick top-up?",
      a: "Absolutely. Our Beneficiary Saved Numbers feature lets you save frequent numbers with nicknames like 'Mum MTN' or 'Office Router' for 1-click purchases.",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-1">
        {/* --- HERO SECTION --- */}
        <section className="relative overflow-hidden bg-gradient-to-b from-emerald-50/70 via-slate-50 to-white pt-12 pb-20 lg:pt-20 lg:pb-28">
          {/* Subtle background glow decorative elements */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-tr from-emerald-200/40 via-teal-100/20 to-transparent blur-3xl pointer-events-none -z-10" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              {/* Left Column: Heading & Value Proposition */}
              <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100/80 border border-emerald-300/60 text-emerald-800 text-xs font-bold shadow-sm">
                  <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                  Nigeria&apos;s Next-Gen VTU Platform
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.1]">
                  Your Data. Your Airtime.{" "}
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700">
                    Anytime.
                  </span>
                </h1>

                <p className="text-lg text-slate-600 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                  Purchase high-speed MTN, Airtel, Glo, and 9mobile data subscriptions, cheap airtime
                  with 2% cashback, and manage seamless digital payments with 24/7 automated delivery.
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3.5 pt-2">
                  <Link
                    href="/dashboard/buy-data"
                    className="px-6 py-3.5 rounded-2xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/25 flex items-center gap-2 hover:-translate-y-0.5"
                  >
                    <Wifi className="w-4 h-4" />
                    Buy Data Bundles
                  </Link>

                  <Link
                    href="/dashboard/buy-airtime"
                    className="px-6 py-3.5 rounded-2xl bg-white border border-slate-300 text-slate-800 font-bold text-sm hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2 hover:-translate-y-0.5"
                  >
                    <Smartphone className="w-4 h-4 text-emerald-600" />
                    Buy Airtime (2% Off)
                  </Link>

                  <Link
                    href="/register"
                    className="px-6 py-3.5 rounded-2xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 transition-all shadow-md flex items-center gap-1.5 hover:-translate-y-0.5"
                  >
                    Get Started Free
                    <ArrowRight className="w-4 h-4 text-emerald-400" />
                  </Link>
                </div>

                {/* Social Proof metrics */}
                <div className="pt-6 border-t border-slate-200/80 grid grid-cols-3 gap-4 text-center lg:text-left">
                  <div>
                    <span className="block text-2xl font-black text-slate-900">99.9%</span>
                    <span className="text-xs text-slate-500 font-medium">Uptime Guarantee</span>
                  </div>
                  <div>
                    <span className="block text-2xl font-black text-slate-900">&lt; 10s</span>
                    <span className="text-xs text-slate-500 font-medium">Instant Delivery</span>
                  </div>
                  <div>
                    <span className="block text-2xl font-black text-emerald-600">₦0 Fee</span>
                    <span className="text-xs text-slate-500 font-medium">Auto-Refund Policy</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Live Interactive Quick Top-Up Widget */}
              <div className="lg:col-span-5">
                <div className="relative mx-auto max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-200">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-emerald-500" />
                      <span className="font-bold text-slate-900 text-sm">Instant Top-Up Widget</span>
                    </div>
                    <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                      Automated Switch
                    </span>
                  </div>

                  {/* Switch between Data & Airtime */}
                  <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl mt-4">
                    <button
                      type="button"
                      onClick={() => setQuickType("data")}
                      className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                        quickType === "data"
                          ? "bg-white text-emerald-700 shadow-sm"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <Wifi className="w-3.5 h-3.5" />
                      Mobile Data
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuickType("airtime")}
                      className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                        quickType === "airtime"
                          ? "bg-white text-emerald-700 shadow-sm"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      Airtime Recharge
                    </button>
                  </div>

                  {/* Network Selector Chips */}
                  <div className="mt-4">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                      Select Network
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {(["mtn", "airtel", "glo", "9mobile"] as const).map((net) => (
                        <button
                          key={net}
                          type="button"
                          onClick={() => setQuickNetwork(net)}
                          className={`py-2 text-xs font-bold rounded-xl border uppercase transition-all ${
                            quickNetwork === net
                              ? "border-emerald-600 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/20"
                              : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          {net}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Phone Input with prefix detection */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Phone Number
                      </label>
                      <span className="text-[10px] text-emerald-600 font-semibold">
                        Network auto-detected
                      </span>
                    </div>
                    <input
                      type="tel"
                      value={quickPhone}
                      onChange={handlePhoneChange}
                      placeholder="e.g. 08031234567"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                    />
                  </div>

                  {/* Amount / Plan Preview */}
                  <div className="mt-4 p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-slate-400 font-medium block">
                        {quickType === "data" ? "Popular 1.5GB Monthly" : "Airtime Value"}
                      </span>
                      <span className="text-base font-black text-slate-900">
                        {quickType === "data" ? "1.5GB — 30 Days" : formatNaira(quickAmount)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] text-slate-400 font-medium block">You Pay</span>
                      <span className="text-base font-black text-emerald-600">
                        {quickType === "data" ? "₦1,020" : formatNaira(quickAmount * 0.98)}
                      </span>
                    </div>
                  </div>

                  {/* Direct Launch Button */}
                  <Link
                    href={
                      quickType === "data"
                        ? `/dashboard/buy-data?network=${quickNetwork}`
                        : `/dashboard/buy-airtime?network=${quickNetwork}`
                    }
                    className="mt-5 w-full py-3.5 rounded-2xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 group"
                  >
                    <span>Proceed to Top-Up</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>

                  <p className="text-[11px] text-slate-400 text-center mt-3">
                    Instant delivery via our secured VTU gateway API
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* --- SUPPORTED NETWORKS SHOWCASE --- */}
        <section className="py-12 bg-white border-y border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-center text-xs font-bold uppercase tracking-widest text-slate-400 mb-8">
              Supported Telecommunication Networks in Nigeria
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="p-5 rounded-2xl bg-yellow-50/60 border border-yellow-200/80 flex items-center space-x-3.5 hover:shadow-md transition-shadow">
                <div className="w-11 h-11 rounded-xl bg-yellow-400 text-black font-black flex items-center justify-center text-sm shadow-sm">
                  MTN
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">MTN Nigeria</h4>
                  <span className="text-xs font-semibold text-yellow-700">2.0% Airtime Discount</span>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-red-50/60 border border-red-200/80 flex items-center space-x-3.5 hover:shadow-md transition-shadow">
                <div className="w-11 h-11 rounded-xl bg-red-600 text-white font-black flex items-center justify-center text-sm shadow-sm">
                  AIR
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Airtel Nigeria</h4>
                  <span className="text-xs font-semibold text-red-700">2.0% Airtime Discount</span>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-green-50/60 border border-green-200/80 flex items-center space-x-3.5 hover:shadow-md transition-shadow">
                <div className="w-11 h-11 rounded-xl bg-green-600 text-white font-black flex items-center justify-center text-sm shadow-sm">
                  GLO
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Glo Nigeria</h4>
                  <span className="text-xs font-semibold text-green-700">2.5% Airtime Discount</span>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-lime-50/60 border border-lime-200/80 flex items-center space-x-3.5 hover:shadow-md transition-shadow">
                <div className="w-11 h-11 rounded-xl bg-lime-600 text-white font-black flex items-center justify-center text-xs shadow-sm">
                  9MOB
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">9mobile</h4>
                  <span className="text-xs font-semibold text-lime-800">2.0% Airtime Discount</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* --- SERVICE CARDS --- */}
        <section className="py-20 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-100 px-3 py-1 rounded-full">
                Comprehensive VTU Catalog
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                Designed for Everyday Nigerian Mobile Services
              </h2>
              <p className="text-slate-600 text-sm sm:text-base">
                Choose from a full spectrum of daily, weekly, and monthly telecom plans with zero
                downtime.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Card 1: Data */}
              <div className="bg-white rounded-3xl p-7 border border-slate-200 shadow-sm hover:shadow-xl transition-all group">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <Wifi className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Mobile Data Bundles</h3>
                <p className="text-sm text-slate-600 leading-relaxed mb-4">
                  SME, Gifting, and Corporate data packages across MTN, Airtel, Glo, and 9mobile at
                  unbeatable wholesale rates.
                </p>
                <div className="flex flex-wrap gap-1.5 mb-6">
                  <span className="text-[11px] font-semibold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg">
                    Daily Plans
                  </span>
                  <span className="text-[11px] font-semibold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg">
                    Weekly Plans
                  </span>
                  <span className="text-[11px] font-semibold bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg">
                    Monthly Plans
                  </span>
                </div>
                <Link
                  href="/dashboard/buy-data"
                  className="text-xs font-bold text-emerald-600 group-hover:text-emerald-700 flex items-center gap-1"
                >
                  Explore Data Plans <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Card 2: Airtime */}
              <div className="bg-white rounded-3xl p-7 border border-slate-200 shadow-sm hover:shadow-xl transition-all group">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <Smartphone className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Instant Airtime Top-Up</h3>
                <p className="text-sm text-slate-600 leading-relaxed mb-4">
                  Top up any phone number in Nigeria in seconds with up to 2.5% automatic cashback
                  discount credited instantly.
                </p>
                <div className="flex flex-wrap gap-1.5 mb-6">
                  <span className="text-[11px] font-semibold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg">
                    Preset ₦100 - ₦5,000
                  </span>
                  <span className="text-[11px] font-semibold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg">
                    Custom Amounts
                  </span>
                  <span className="text-[11px] font-semibold bg-amber-50 text-amber-700 px-2.5 py-1 rounded-lg">
                    Cashback
                  </span>
                </div>
                <Link
                  href="/dashboard/buy-airtime"
                  className="text-xs font-bold text-amber-600 group-hover:text-amber-700 flex items-center gap-1"
                >
                  Recharge Airtime <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Card 3: Digital Wallet */}
              <div className="bg-white rounded-3xl p-7 border border-slate-200 shadow-sm hover:shadow-xl transition-all group">
                <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-600 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <TrendingDown className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Digital Wallet System</h3>
                <p className="text-sm text-slate-600 leading-relaxed mb-4">
                  Store funds safely in your personal wallet. Experience 1-click purchases without entering
                  card details every single time.
                </p>
                <div className="flex flex-wrap gap-1.5 mb-6">
                  <span className="text-[11px] font-semibold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg">
                    Paystack
                  </span>
                  <span className="text-[11px] font-semibold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg">
                    Flutterwave
                  </span>
                  <span className="text-[11px] font-semibold bg-teal-50 text-teal-700 px-2.5 py-1 rounded-lg">
                    Zero Balance Fee
                  </span>
                </div>
                <Link
                  href="/dashboard/wallet"
                  className="text-xs font-bold text-teal-600 group-hover:text-teal-700 flex items-center gap-1"
                >
                  Manage Wallet <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* --- HOW IT WORKS --- */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-100 px-3 py-1 rounded-full">
                Simple 3-Step Process
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                How QuickVTU Works
              </h2>
              <p className="text-slate-600 text-sm sm:text-base">
                Enjoy seamless recharges from anywhere in Nigeria on mobile or desktop.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
              {/* Step 1 */}
              <div className="bg-slate-50 rounded-3xl p-8 border border-slate-200/80 relative text-center">
                <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white font-black text-lg flex items-center justify-center mx-auto mb-6 shadow-md">
                  1
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Create an Account</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Sign up in under 30 seconds with your phone number and email. New accounts receive a ₦500
                  welcome balance.
                </p>
              </div>

              {/* Step 2 */}
              <div className="bg-slate-50 rounded-3xl p-8 border border-slate-200/80 relative text-center">
                <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white font-black text-lg flex items-center justify-center mx-auto mb-6 shadow-md shadow-emerald-600/20">
                  2
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Select Network & Plan</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Choose MTN, Airtel, Glo, or 9mobile. Pick your desired daily, weekly, or monthly plan
                  or airtime amount.
                </p>
              </div>

              {/* Step 3 */}
              <div className="bg-slate-50 rounded-3xl p-8 border border-slate-200/80 relative text-center">
                <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white font-black text-lg flex items-center justify-center mx-auto mb-6 shadow-md">
                  3
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Instant Delivery & Receipt</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Confirm your purchase. Your line is credited instantly with automated notifications and
                  a printable receipt.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* --- WHY CHOOSE US --- */}
        <section className="py-20 bg-slate-900 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950 px-3 py-1 rounded-full border border-emerald-800">
                  Engineered for Reliability
                </span>
                <h2 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
                  Why Nigerians Trust QuickVTU for Daily Digital Subscriptions
                </h2>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Unlike traditional platforms that leave you stranded with pending debits, QuickVTU is built
                  with financial-grade idempotency and automatic refund mechanisms.
                </p>

                <div className="space-y-4 pt-2">
                  <div className="flex items-start space-x-3.5">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm">Automatic Failure Rollback</h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Never worry about lost funds. If a telecom operator network fails, your money is
                        refunded in real time.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3.5">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm">Bank-Grade Payment Integration</h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Secured with Paystack and Flutterwave payment infrastructure with HMAC verification.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3.5">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm">Saved Numbers & Beneficiaries</h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Save loved ones and client numbers for ultra-rapid repeat top-ups.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats showcase card */}
              <div className="bg-slate-800/80 border border-slate-700 rounded-3xl p-8 space-y-6">
                <h3 className="text-lg font-bold text-white">Platform Performance Metrics</h3>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-slate-300">Transaction Success Rate</span>
                      <span className="text-emerald-400 font-bold">99.8%</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div className="bg-emerald-500 h-2 rounded-full w-[99.8%]" />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-slate-300">Average Delivery Time</span>
                      <span className="text-emerald-400 font-bold">4.2 Seconds</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div className="bg-emerald-500 h-2 rounded-full w-[95%]" />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-slate-300">Server & Telecom Switch Uptime</span>
                      <span className="text-emerald-400 font-bold">99.9%</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div className="bg-emerald-500 h-2 rounded-full w-[99.9%]" />
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-700/80 text-xs text-slate-400 flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span>
                    Audited with idempotency keys to completely eliminate double billing or duplicate
                    telecom debits.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* --- TESTIMONIALS --- */}
        <section className="py-20 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-100 px-3 py-1 rounded-full">
                Real Customer Reviews
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                Loved by Everyday Nigerians
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex text-amber-400 space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-slate-600 leading-relaxed italic">
                  &quot;I run a small graphic design studio in Ikeja. QuickVTU has saved me during late night
                  uploads when regular bank apps fail. The 10GB monthly MTN plan activated in seconds.&quot;
                </p>
                <div className="pt-2 border-t border-slate-100 flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center">
                    TO
                  </div>
                  <div>
                    <h5 className="font-bold text-xs text-slate-900">Tunde Olatunji</h5>
                    <span className="text-[11px] text-slate-400">Freelance Designer, Lagos</span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex text-amber-400 space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-slate-600 leading-relaxed italic">
                  &quot;The automatic refund feature gives me peace of mind. One time Glo network was having
                  issues, and my wallet balance was returned immediately. Very honest platform!&quot;
                </p>
                <div className="pt-2 border-t border-slate-100 flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-full bg-purple-100 text-purple-800 font-bold text-xs flex items-center justify-center">
                    AA
                  </div>
                  <div>
                    <h5 className="font-bold text-xs text-slate-900">Amina Abubakar</h5>
                    <span className="text-[11px] text-slate-400">Civil Servant, Abuja</span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex text-amber-400 space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-slate-600 leading-relaxed italic">
                  &quot;The downloadable receipts are great for my office expense reports. Everything is neat,
                  fast, and straightforward. Highly recommended.&quot;
                </p>
                <div className="pt-2 border-t border-slate-100 flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-800 font-bold text-xs flex items-center justify-center">
                    EN
                  </div>
                  <div>
                    <h5 className="font-bold text-xs text-slate-900">Emeka Nnamani</h5>
                    <span className="text-[11px] text-slate-400">Business Owner, Port Harcourt</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* --- FAQ SECTION --- */}
        <section className="py-20 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-100 px-3 py-1 rounded-full">
                Got Questions?
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                Frequently Asked Questions
              </h2>
            </div>

            <div className="space-y-4">
              {faqs.map((faq, i) => (
                <div key={i} className="p-6 rounded-2xl bg-slate-50 border border-slate-200">
                  <h4 className="font-bold text-slate-900 text-base mb-2 flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    {faq.q}
                  </h4>
                  <p className="text-sm text-slate-600 leading-relaxed pl-6">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* --- CALL TO ACTION --- */}
        <section className="py-16 bg-gradient-to-tr from-emerald-700 to-teal-800 text-white text-center">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
              Ready for Instant Data and Airtime Recharges?
            </h2>
            <p className="text-emerald-100 text-base max-w-xl mx-auto leading-relaxed">
              Join thousands of Nigerians enjoying fast top-ups, discounted rates, and zero failed
              transactions today.
            </p>
            <div className="flex flex-wrap justify-center gap-4 pt-2">
              <Link
                href="/register"
                className="px-8 py-4 rounded-2xl bg-white text-emerald-800 font-black text-sm hover:bg-emerald-50 transition-all shadow-xl hover:-translate-y-0.5"
              >
                Create Free Account (₦500 Bonus)
              </Link>
              <Link
                href="/login"
                className="px-8 py-4 rounded-2xl bg-emerald-800/60 border border-emerald-500/60 text-white font-bold text-sm hover:bg-emerald-800 transition-all"
              >
                Login to Dashboard
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
