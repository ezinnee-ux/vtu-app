"use client";

import React, { useState, useEffect } from "react";
import {
  Headphones,
  Send,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  HelpCircle,
} from "lucide-react";

interface Ticket {
  id: string;
  subject: string;
  message: string;
  status: string;
  priority: string;
  adminResponse: string | null;
  createdAt: string;
}

export default function SupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState<"LOW" | "MEDIUM" | "HIGH">("MEDIUM");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const res = await fetch("/api/support");
      const data = await res.json();
      if (data.success) {
        setTickets(data.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, message, priority }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccess("Your support ticket has been created. A support officer will respond shortly.");
        setSubject("");
        setMessage("");
        fetchTickets();
      } else {
        setError(data.message || "Failed to submit ticket.");
      }
    } catch {
      setError("Network error submitting ticket.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Help Desk & Customer Support
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Reach our 24/7 technical and transaction support team or log an inquiry ticket.
        </p>
      </div>

      {/* Direct Contact Channels Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-emerald-50 border border-emerald-200/80 space-y-2">
          <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">
            WhatsApp Desk
          </span>
          <p className="text-xs text-slate-600">Direct chat with our automated support agent.</p>
          <a
            href="https://wa.me/2348000000000"
            target="_blank"
            rel="noreferrer"
            className="inline-block pt-1 text-xs font-bold text-emerald-700 hover:underline"
          >
            Start WhatsApp Chat →
          </a>
        </div>

        <div className="p-5 rounded-3xl bg-blue-50 border border-blue-200/80 space-y-2">
          <span className="text-xs font-bold text-blue-800 uppercase tracking-wider block">
            Email Inquiries
          </span>
          <p className="text-xs text-slate-600">Send logs, receipts, or business proposals.</p>
          <a
            href="mailto:support@quickvtu.ng"
            className="inline-block pt-1 text-xs font-bold text-blue-700 hover:underline"
          >
            support@quickvtu.ng →
          </a>
        </div>

        <div className="p-5 rounded-3xl bg-purple-50 border border-purple-200/80 space-y-2">
          <span className="text-xs font-bold text-purple-800 uppercase tracking-wider block">
            Toll-Free Phone
          </span>
          <p className="text-xs text-slate-600">Speak directly with an operations agent.</p>
          <a
            href="tel:+2348000000000"
            className="inline-block pt-1 text-xs font-bold text-purple-700 hover:underline"
          >
            +234 800 QUICK VTU →
          </a>
        </div>
      </div>

      {/* Log a Ticket Form */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Open a Support Ticket
        </h3>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-slate-400 mb-1 uppercase">
                Subject
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Issue with MTN Data Top-up for 08031234567"
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1 uppercase">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as "LOW" | "MEDIUM" | "HIGH")}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High (Urgent)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 mb-1 uppercase">
              Detailed Description & Order Reference (if applicable)
            </label>
            <textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe what happened, including any relevant transaction references..."
              required
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="py-3 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-md shadow-emerald-600/20 disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Submitting Ticket...
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                Submit Support Ticket
              </>
            )}
          </button>
        </form>
      </div>

      {/* Ticket History */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Your Recent Support Tickets ({tickets.length})
        </h3>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400 animate-pulse">
            Loading tickets...
          </div>
        ) : tickets.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-xs text-slate-400">
            No support tickets logged yet.
          </div>
        ) : (
          <div className="space-y-3">
            {tickets.map((t) => (
              <div
                key={t.id}
                className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono font-bold text-slate-500">
                      #{t.id.slice(0, 8)}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900">{t.subject}</h4>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      t.status === "RESOLVED"
                        ? "bg-emerald-50 text-emerald-700"
                        : t.status === "IN_PROGRESS"
                        ? "bg-blue-50 text-blue-700"
                        : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {t.status}
                  </span>
                </div>

                <p className="text-xs text-slate-600">{t.message}</p>

                {t.adminResponse && (
                  <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl text-xs space-y-1">
                    <span className="font-bold text-emerald-900 block">Agent Response:</span>
                    <p className="text-emerald-800">{t.adminResponse}</p>
                  </div>
                )}

                <div className="text-[10px] text-slate-400">
                  Logged: {new Date(t.createdAt).toLocaleString("en-NG")}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
