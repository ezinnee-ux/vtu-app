"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Users, Plus, Trash2, Wifi, Smartphone, Phone, AlertCircle, Loader2 } from "lucide-react";
import { normalizePhoneNumber, validateNigerianPhone } from "@/lib/helpers";

interface SavedNumber {
  id: string;
  phoneNumber: string;
  name: string;
  network: { code: string; name: string };
}

export default function SavedNumbersPage() {
  const [saved, setSaved] = useState<SavedNumber[]>([]);
  const [loading, setLoading] = useState(true);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [name, setName] = useState("");
  const [networkCode, setNetworkCode] = useState("mtn");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchSaved();
  }, []);

  const fetchSaved = async () => {
    try {
      const res = await fetch("/api/saved-numbers");
      const data = await res.json();
      if (data.success) {
        setSaved(data.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const clean = normalizePhoneNumber(phoneNumber);
    if (!validateNigerianPhone(clean)) {
      setError("Please enter a valid 11-digit Nigerian mobile number.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/saved-numbers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: clean,
          name: name || `Contact - ${clean}`,
          networkCode,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setPhoneNumber("");
        setName("");
        fetchSaved();
      } else {
        setError(data.message || "Failed to add beneficiary.");
      }
    } catch {
      setError("Network error adding beneficiary.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/saved-numbers?id=${id}`, { method: "DELETE" });
      setSaved((prev) => prev.filter((s) => s.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Saved Beneficiaries
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Store phone numbers for your family, friends, or office routers for quick 1-click top-ups.
        </p>
      </div>

      {/* Add Beneficiary Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Add New Beneficiary
        </h3>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-400 mb-1 uppercase">
              Nickname / Label
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Mum MTN"
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 mb-1 uppercase">
              Phone Number
            </label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="08031234567"
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 mb-1 uppercase">
              Network
            </label>
            <select
              value={networkCode}
              onChange={(e) => setNetworkCode(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="mtn">MTN</option>
              <option value="airtel">Airtel</option>
              <option value="glo">Glo</option>
              <option value="9mobile">9mobile</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Save Number
            </button>
          </div>
        </form>
      </div>

      {/* Saved Numbers Grid */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Saved Numbers ({saved.length})
        </h3>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400 animate-pulse">
            Loading saved contacts...
          </div>
        ) : saved.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-2">
            <Users className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700">No saved beneficiaries yet</p>
            <p className="text-xs text-slate-400">
              Add your frequent recharge numbers above for 1-click top-ups.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {saved.map((item) => (
              <div
                key={item.id}
                className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div
                      className={`w-9 h-9 rounded-xl font-black text-xs uppercase flex items-center justify-center ${
                        item.network.code === "mtn"
                          ? "bg-yellow-400 text-black"
                          : item.network.code === "airtel"
                          ? "bg-red-600 text-white"
                          : item.network.code === "glo"
                          ? "bg-green-600 text-white"
                          : "bg-lime-600 text-white"
                      }`}
                    >
                      {item.network.code.slice(0, 3)}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs">{item.name}</h4>
                      <span className="font-mono text-[11px] text-slate-500 font-semibold">
                        {item.phoneNumber}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-1.5 rounded-lg text-slate-300 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Remove beneficiary"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                  <Link
                    href={`/dashboard/buy-data?network=${item.network.code}`}
                    className="flex-1 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[11px] flex items-center justify-center gap-1 transition-colors"
                  >
                    <Wifi className="w-3 h-3" />
                    Buy Data
                  </Link>
                  <Link
                    href={`/dashboard/buy-airtime?network=${item.network.code}`}
                    className="flex-1 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold text-[11px] flex items-center justify-center gap-1 transition-colors"
                  >
                    <Smartphone className="w-3 h-3" />
                    Buy Airtime
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
