"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  Smartphone,
  Phone,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Zap,
  Users,
  Percent,
} from "lucide-react";
import ReceiptModal, { ReceiptData } from "@/components/ReceiptModal";
import FundWalletModal from "@/components/FundWalletModal";
import { formatNaira, detectNetworkFromPhone, normalizePhoneNumber } from "@/lib/helpers";

interface Network {
  id: string;
  name: string;
  code: string;
  airtimeDiscountPercent: number;
}

interface SavedNumber {
  id: string;
  phoneNumber: string;
  name: string;
  network: { code: string; name: string };
}

export default function BuyAirtimePage() {
  const searchParams = useSearchParams();
  const initialNetwork = searchParams.get("network") || "mtn";

  const [networks, setNetworks] = useState<Network[]>([]);
  const [selectedNetwork, setSelectedNetwork] = useState<string>(initialNetwork);
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [detectedNetwork, setDetectedNetwork] = useState<string | null>(null);
  const [amount, setAmount] = useState<number | "">(1000);
  const [savedNumbers, setSavedNumbers] = useState<SavedNumber[]>([]);
  const [saveBeneficiary, setSaveBeneficiary] = useState(false);
  const [beneficiaryName, setBeneficiaryName] = useState("");

  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [fundModalOpen, setFundModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const presetAmounts = [100, 200, 500, 1000, 2000, 5000];

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [netRes, userRes, savedRes] = await Promise.all([
        fetch("/api/networks"),
        fetch("/api/auth/me"),
        fetch("/api/saved-numbers"),
      ]);

      const netData = await netRes.json();
      const userData = await userRes.json();
      const savedData = await savedRes.json();

      if (netData.success) setNetworks(netData.data);
      if (userData.success && userData.data?.user) {
        setWalletBalance(userData.data.user.walletBalance || 0);
      }
      if (savedData.success) setSavedNumbers(savedData.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setPhoneNumber(val);
    setErrorMessage("");

    const detected = detectNetworkFromPhone(val);
    if (detected) {
      setDetectedNetwork(detected);
      setSelectedNetwork(detected);
    } else {
      setDetectedNetwork(null);
    }
  };

  const handleSelectBeneficiary = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    if (!id) return;
    const found = savedNumbers.find((s) => s.id === id);
    if (found) {
      setPhoneNumber(found.phoneNumber);
      setSelectedNetwork(found.network.code);
      setDetectedNetwork(found.network.code);
    }
  };

  const activeNetObj = networks.find((n) => n.code === selectedNetwork);
  const discountPercent = activeNetObj?.airtimeDiscountPercent || 2.0;
  const numAmount = Number(amount) || 0;
  const discountedPrice = Math.round(numAmount * (1 - discountPercent / 100));

  const handleOpenReview = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    const clean = normalizePhoneNumber(phoneNumber);
    if (!clean || clean.length < 11) {
      setErrorMessage("Please enter a valid 11-digit Nigerian phone number.");
      return;
    }

    if (!numAmount || numAmount < 50) {
      setErrorMessage("Minimum airtime recharge is ₦50.");
      return;
    }

    setConfirmModalOpen(true);
  };

  const handleExecutePurchase = async () => {
    setPurchasing(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/airtime/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          networkCode: selectedNetwork,
          phoneNumber: normalizePhoneNumber(phoneNumber),
          amount: numAmount,
          saveBeneficiary,
          beneficiaryName: beneficiaryName || `${activeNetObj?.name} - ${phoneNumber}`,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setConfirmModalOpen(false);
        setErrorMessage(data.message || "Airtime purchase failed.");
        setPurchasing(false);
        return;
      }

      // Success
      setWalletBalance((prev) => Math.max(0, prev - numAmount));
      setConfirmModalOpen(false);
      setReceiptData({
        reference: data.data.reference,
        status: data.data.status,
        service: "Airtime Recharge",
        network: data.data.network,
        phoneNumber: data.data.phoneNumber,
        amount: data.data.amount,
        providerReference: data.data.providerReference,
        date: data.data.date,
      });
      setReceiptModalOpen(true);
    } catch {
      setErrorMessage("Network error processing your airtime request.");
      setConfirmModalOpen(false);
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 mb-2">
            <Zap className="w-3.5 h-3.5" />
            Instant Airtime (Up to 2.5% Cashback)
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Buy Mobile Airtime
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Recharge MTN, Airtel, Glo, and 9mobile with automatic instant discount.
          </p>
        </div>

        {/* Current Wallet Balance pill */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-right shrink-0">
          <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
            Wallet Balance
          </span>
          <span className="text-xl font-black text-slate-900 block">
            {formatNaira(walletBalance)}
          </span>
          <button
            type="button"
            onClick={() => setFundModalOpen(true)}
            className="text-[11px] font-bold text-emerald-600 hover:underline mt-0.5 block"
          >
            + Fund Wallet
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleOpenReview} className="space-y-6">
        {/* Step 1: Network Selection */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            1. Select Network
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {networks.map((net) => {
              const isSelected = selectedNetwork === net.code;
              return (
                <button
                  key={net.code}
                  type="button"
                  onClick={() => setSelectedNetwork(net.code)}
                  className={`p-4 rounded-2xl border text-center transition-all flex flex-col items-center justify-center space-y-2 ${
                    isSelected
                      ? "border-amber-500 bg-amber-50/70 ring-2 ring-amber-500/20 shadow-sm"
                      : "border-slate-200 bg-slate-50 hover:bg-slate-100/70"
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm uppercase shadow-sm ${
                      net.code === "mtn"
                        ? "bg-yellow-400 text-black"
                        : net.code === "airtel"
                        ? "bg-red-600 text-white"
                        : net.code === "glo"
                        ? "bg-green-600 text-white"
                        : "bg-lime-600 text-white"
                    }`}
                  >
                    {net.code.slice(0, 3)}
                  </div>
                  <span className="text-xs font-black text-slate-900">{net.name}</span>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
                    {net.airtimeDiscountPercent}% Off
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: Phone Number */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              2. Phone Number
            </h3>
            {savedNumbers.length > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Users className="w-3.5 h-3.5 text-emerald-600" />
                <select
                  onChange={handleSelectBeneficiary}
                  defaultValue=""
                  className="bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold py-1 px-2 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-700"
                >
                  <option value="">Quick Pick Beneficiary</option>
                  {savedNumbers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.phoneNumber})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="relative">
            <Phone className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="tel"
              value={phoneNumber}
              onChange={handlePhoneChange}
              placeholder="e.g. 08031234567"
              required
              className="w-full pl-11 pr-24 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-base font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
            />
            {detectedNetwork && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 px-2.5 py-1 rounded-xl">
                {detectedNetwork}
              </span>
            )}
          </div>

          {/* Beneficiary toggle */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-1">
            <label className="flex items-center space-x-2 text-xs text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={saveBeneficiary}
                onChange={(e) => setSaveBeneficiary(e.target.checked)}
                className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300"
              />
              <span>Save to beneficiaries</span>
            </label>

            {saveBeneficiary && (
              <input
                type="text"
                placeholder="Nickname e.g. Mum's Line"
                value={beneficiaryName}
                onChange={(e) => setBeneficiaryName(e.target.value)}
                className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            )}
          </div>
        </div>

        {/* Step 3: Amount Preset & Custom */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            3. Enter Recharge Amount
          </h3>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {presetAmounts.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setAmount(preset)}
                className={`py-3 px-2 rounded-2xl border text-center font-bold text-xs transition-all ${
                  amount === preset
                    ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                {formatNaira(preset)}
              </button>
            ))}
          </div>

          <div className="relative pt-2">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Or Custom Amount (₦50 - ₦50,000)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-base">
                ₦
              </span>
              <input
                type="number"
                min="50"
                max="50000"
                value={amount}
                onChange={(e) => setAmount(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="Enter custom amount"
                className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-base font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                required
              />
            </div>
          </div>

          {/* Discount calculation preview box */}
          {numAmount > 0 && (
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200/80 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Percent className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-800 font-semibold">
                  {discountPercent}% Airtime Cashback applied!
                </span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 block text-[10px]">You Pay</span>
                <span className="text-base font-black text-emerald-700">
                  {formatNaira(discountedPrice)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Submit review button */}
        <button
          type="submit"
          className="w-full py-4 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-sm transition-all shadow-md shadow-amber-500/20"
        >
          Review & Recharge Airtime
        </button>
      </form>

      {/* Confirmation Modal as requested in prompt:
          'Buy ₦1,000 MTN Airtime for 080XXXXXXXX?' */}
      {confirmModalOpen && activeNetObj && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 text-center">
            <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto shadow-inner">
              <Smartphone className="w-7 h-7" />
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Confirmation Required
              </span>
              <h2 className="text-xl font-black text-slate-900 tracking-tight mt-1">
                Buy {formatNaira(numAmount)} {activeNetObj.name} Airtime for{" "}
                <span className="text-amber-600 font-mono">{normalizePhoneNumber(phoneNumber)}</span>?
              </h2>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 text-left space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Recipient Phone:</span>
                <span className="font-mono font-bold text-slate-900">
                  {normalizePhoneNumber(phoneNumber)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Network:</span>
                <span className="font-bold text-slate-900">{activeNetObj.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Airtime Value:</span>
                <span className="font-bold text-slate-900">{formatNaira(numAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Discounted Price to Pay:</span>
                <span className="font-black text-emerald-700 text-sm">
                  {formatNaira(numAmount)}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200/70">
                <span className="text-slate-500">Your Wallet Balance:</span>
                <span
                  className={`font-bold ${
                    walletBalance < numAmount ? "text-red-600" : "text-slate-900"
                  }`}
                >
                  {formatNaira(walletBalance)}
                </span>
              </div>
            </div>

            {walletBalance < numAmount ? (
              <div className="space-y-3">
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                  Insufficient wallet balance. Please fund your wallet to complete this purchase.
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setConfirmModalOpen(false);
                    setFundModalOpen(true);
                  }}
                  className="w-full py-3 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 shadow-md"
                >
                  Fund Wallet Now
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => setConfirmModalOpen(false)}
                  disabled={purchasing}
                  className="flex-1 py-3 rounded-xl border border-slate-300 font-bold text-xs text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecutePurchase}
                  disabled={purchasing}
                  className="flex-1 py-3 rounded-xl bg-amber-500 text-slate-950 font-black text-xs hover:bg-amber-600 transition-all shadow-md shadow-amber-500/20 flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {purchasing ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Crediting Airtime...
                    </>
                  ) : (
                    "Confirm & Pay"
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      <ReceiptModal
        isOpen={receiptModalOpen}
        onClose={() => setReceiptModalOpen(false)}
        receipt={receiptData}
      />

      <FundWalletModal
        isOpen={fundModalOpen}
        onClose={() => setFundModalOpen(false)}
        onSuccess={(newBal) => setWalletBalance(newBal)}
      />
    </div>
  );
}
