"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  Wifi,
  Phone,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Zap,
  Clock,
  Sparkles,
  Users,
  ChevronRight,
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

interface DataPlan {
  id: string;
  planCode: string;
  name: string;
  category: string;
  dataSize: string;
  validity: string;
  sellingPrice: number;
  providerCost: number;
  network: { code: string; name: string };
}

interface SavedNumber {
  id: string;
  phoneNumber: string;
  name: string;
  network: { code: string; name: string };
}

export default function BuyDataPage() {
  const searchParams = useSearchParams();
  const initialNetwork = searchParams.get("network") || "mtn";

  const [networks, setNetworks] = useState<Network[]>([]);
  const [selectedNetwork, setSelectedNetwork] = useState<string>(initialNetwork);
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [detectedNetwork, setDetectedNetwork] = useState<string | null>(null);
  const [plans, setPlans] = useState<DataPlan[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("MONTHLY");
  const [selectedPlan, setSelectedPlan] = useState<DataPlan | null>(null);
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

  // Categories list matching user spec
  const categories = [
    { id: "ALL", name: "All Plans" },
    { id: "DAILY", name: "Daily" },
    { id: "2_DAY", name: "2-Day" },
    { id: "3_DAY", name: "3-Day" },
    { id: "WEEKLY", name: "Weekly" },
    { id: "BIWEEKLY", name: "Biweekly" },
    { id: "MONTHLY", name: "Monthly" },
    { id: "2_MONTH", name: "2-Month" },
    { id: "3_MONTH", name: "3-Month" },
  ];

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedNetwork) {
      fetchPlans(selectedNetwork);
    }
  }, [selectedNetwork]);

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

  const fetchPlans = async (netCode: string) => {
    try {
      const res = await fetch(`/api/data-plans/${netCode}`);
      const data = await res.json();
      if (data.success && data.data?.plans) {
        setPlans(data.data.plans);
        setSelectedPlan(null);
      }
    } catch (e) {
      console.error(e);
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

  const filteredPlans = plans.filter((p) => {
    if (selectedCategory === "ALL") return true;
    return p.category === selectedCategory;
  });

  const handleOpenReview = (plan: DataPlan) => {
    setErrorMessage("");
    const clean = normalizePhoneNumber(phoneNumber);
    if (!clean || clean.length < 11) {
      setErrorMessage("Please enter a valid 11-digit phone number first.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setSelectedPlan(plan);
    setConfirmModalOpen(true);
  };

  const handleExecutePurchase = async () => {
    if (!selectedPlan) return;
    setPurchasing(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/data/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planCode: selectedPlan.planCode,
          phoneNumber: normalizePhoneNumber(phoneNumber),
          saveBeneficiary,
          beneficiaryName: beneficiaryName || `${selectedPlan.network.name} - ${phoneNumber}`,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setConfirmModalOpen(false);
        setErrorMessage(data.message || "Data purchase failed.");
        setPurchasing(false);
        return;
      }

      // Success! Deduct balance locally & show receipt
      setWalletBalance((prev) => Math.max(0, prev - selectedPlan.sellingPrice));
      setConfirmModalOpen(false);
      setReceiptData({
        reference: data.data.reference,
        status: data.data.status,
        service: "Mobile Data Subscription",
        network: data.data.network,
        phoneNumber: data.data.phoneNumber,
        amount: data.data.amount,
        planName: data.data.planName,
        dataSize: data.data.dataSize,
        validity: data.data.validity,
        providerReference: data.data.providerReference,
        date: data.data.date,
      });
      setReceiptModalOpen(true);
    } catch {
      setErrorMessage("Network error processing your data request.");
      setConfirmModalOpen(false);
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 mb-2">
            <Zap className="w-3.5 h-3.5" />
            Instant Data Top-Up
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Buy Mobile Data Bundles
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Select network, enter phone number, and choose your preferred daily, weekly or monthly bundle.
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

      {/* Step 1: Select Network */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          1. Select Telecom Network
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {networks.map((net) => {
            const isSelected = selectedNetwork === net.code;
            return (
              <button
                key={net.code}
                type="button"
                onClick={() => {
                  setSelectedNetwork(net.code);
                  setErrorMessage("");
                }}
                className={`p-4 rounded-2xl border text-center transition-all flex flex-col items-center justify-center space-y-2 ${
                  isSelected
                    ? "border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-500/20 shadow-sm"
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
              </button>
            );
          })}
        </div>
      </div>

      {/* Step 2: Recipient Phone Number & Beneficiaries */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            2. Recipient Phone Number
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
            className="w-full pl-11 pr-24 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-base font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
          />
          {detectedNetwork && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-xl">
              {detectedNetwork}
            </span>
          )}
        </div>

        {/* Save beneficiary checkbox */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-1">
          <label className="flex items-center space-x-2 text-xs text-slate-600 cursor-pointer">
            <input
              type="checkbox"
              checked={saveBeneficiary}
              onChange={(e) => setSaveBeneficiary(e.target.checked)}
              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
            />
            <span>Save to beneficiaries for 1-click future recharges</span>
          </label>

          {saveBeneficiary && (
            <input
              type="text"
              placeholder="Nickname e.g. Dad's Line"
              value={beneficiaryName}
              onChange={(e) => setBeneficiaryName(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          )}
        </div>
      </div>

      {/* Step 3: Dynamic Data Plan Category Tabs & Grid */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            3. Choose Data Plan
          </h3>
          <span className="text-xs text-slate-400 font-medium">
            Showing {filteredPlans.length} dynamic plans
          </span>
        </div>

        {/* Category Tabs: Daily, 2-Day, Weekly, Monthly, etc. */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-2 scrollbar-thin">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                selectedCategory === cat.id
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Plans Grid */}
        {filteredPlans.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            No plans available in this category for {selectedNetwork.toUpperCase()}.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredPlans.map((plan) => (
              <div
                key={plan.id}
                className="p-4 rounded-2xl border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all flex flex-col justify-between space-y-3 bg-slate-50/50"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-base font-black text-slate-900">{plan.dataSize}</span>
                    <span className="text-[10px] font-bold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-full">
                      {plan.validity}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 font-medium">{plan.name}</p>
                  <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                    Code: {plan.planCode}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-200/70 flex items-center justify-between">
                  <span className="text-base font-black text-emerald-700">
                    {formatNaira(plan.sellingPrice)}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleOpenReview(plan)}
                    className="py-1.5 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-sm"
                  >
                    Select Plan
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirmation & Review Modal */}
      {confirmModalOpen && selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <Wifi className="w-7 h-7" />
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Confirm Data Order
              </span>
              <h2 className="text-xl font-black text-slate-900 tracking-tight mt-1">
                {selectedPlan.name} ({selectedPlan.dataSize})
              </h2>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 text-left space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Recipient:</span>
                <span className="font-mono font-bold text-slate-900">
                  {normalizePhoneNumber(phoneNumber)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Network:</span>
                <span className="font-bold text-slate-900">{selectedPlan.network.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Validity:</span>
                <span className="font-semibold text-slate-800">{selectedPlan.validity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Amount to Debit:</span>
                <span className="font-black text-emerald-700 text-sm">
                  {formatNaira(selectedPlan.sellingPrice)}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200/70">
                <span className="text-slate-500">Your Wallet Balance:</span>
                <span
                  className={`font-bold ${
                    walletBalance < selectedPlan.sellingPrice ? "text-red-600" : "text-slate-900"
                  }`}
                >
                  {formatNaira(walletBalance)}
                </span>
              </div>
            </div>

            {walletBalance < selectedPlan.sellingPrice ? (
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
                  className="flex-1 py-3 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {purchasing ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Activating...
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
