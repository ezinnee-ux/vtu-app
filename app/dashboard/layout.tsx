"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Wifi,
  Smartphone,
  Wallet,
  History,
  Users,
  Headphones,
  ShieldCheck,
  LogOut,
  PlusCircle,
  Menu,
  X,
  Zap,
  Eye,
  EyeOff,
} from "lucide-react";
import FundWalletModal from "@/components/FundWalletModal";
import { formatNaira } from "@/lib/helpers";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  walletBalance: number;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [fundModalOpen, setFundModalOpen] = useState(false);
  const [showBalance, setShowBalance] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    fetchUser();
  }, [pathname]);

  const fetchUser = async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (data.success && data.data?.user) {
        setUser(data.data.user);
      } else {
        router.push("/login");
      }
    } catch {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  };

  const navLinks = [
    { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { name: "Buy Data Bundles", href: "/dashboard/buy-data", icon: Wifi },
    { name: "Buy Airtime", href: "/dashboard/buy-airtime", icon: Smartphone },
    { name: "Digital Wallet", href: "/dashboard/wallet", icon: Wallet },
    { name: "Transaction History", href: "/dashboard/transactions", icon: History },
    { name: "Saved Beneficiaries", href: "/dashboard/saved-numbers", icon: Users },
    { name: "Customer Support", href: "/dashboard/support", icon: Headphones },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-bold text-slate-500 tracking-wider">Loading QuickVTU...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Mobile Top App Bar */}
      <div className="md:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30 shadow-sm">
        <Link href="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
            <Zap className="w-4 h-4 fill-white" />
          </div>
          <span className="font-bold text-slate-900 text-lg">QuickVTU</span>
        </Link>
        <div className="flex items-center space-x-2">
          {user && (
            <button
              onClick={() => setFundModalOpen(true)}
              className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200 flex items-center gap-1"
            >
              <PlusCircle className="w-3.5 h-3.5 text-emerald-600" />
              {showBalance ? formatNaira(user.walletBalance) : "••••"}
            </button>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg text-slate-600 hover:bg-slate-100"
          >
            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Sidebar for Desktop & Mobile Overlay */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-40 h-screen w-64 bg-white border-r border-slate-200 flex flex-col justify-between transition-transform duration-200 ease-in-out md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div>
          {/* Brand Logo Header */}
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-600/20">
                <Zap className="w-5 h-5 fill-white" />
              </div>
              <div>
                <span className="text-xl font-bold tracking-tight text-slate-900 block leading-tight">
                  QuickVTU
                </span>
                <span className="text-[10px] uppercase tracking-wider font-semibold text-emerald-600">
                  User Dashboard
                </span>
              </div>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden p-1 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Wallet Summary Mini-Card in Sidebar */}
          {user && (
            <div className="mx-4 my-4 p-4 rounded-2xl bg-gradient-to-br from-emerald-800 to-teal-900 text-white shadow-md relative overflow-hidden">
              <div className="flex items-center justify-between text-[11px] text-emerald-200 font-semibold mb-1">
                <span>Wallet Balance</span>
                <button
                  type="button"
                  onClick={() => setShowBalance(!showBalance)}
                  className="hover:text-white"
                >
                  {showBalance ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              <div className="text-xl font-black tracking-tight">
                {showBalance ? formatNaira(user.walletBalance) : "₦ ••••••"}
              </div>
              <button
                onClick={() => {
                  setFundModalOpen(true);
                  setSidebarOpen(false);
                }}
                className="mt-3 w-full py-1.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                Fund Wallet
              </button>
            </div>
          )}

          {/* Navigation Links */}
          <nav className="px-3 space-y-1 mt-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                    isActive
                      ? "bg-emerald-50 text-emerald-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-emerald-600" : "text-slate-400"}`} />
                  {link.name}
                </Link>
              );
            })}

            {user?.role === "ADMIN" && (
              <Link
                href="/admin"
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 transition-colors mt-2"
              >
                <ShieldCheck className="w-4 h-4 text-purple-600" />
                Admin Dashboard
              </Link>
            )}
          </nav>
        </div>

        {/* User profile footer in sidebar */}
        <div className="p-4 border-t border-slate-100">
          {user && (
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2.5 overflow-hidden">
                <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="truncate">
                  <p className="text-xs font-bold text-slate-900 truncate">{user.name}</p>
                  <p className="text-[10px] text-slate-400 truncate">{user.phone}</p>
                </div>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full py-2 px-3 rounded-xl border border-slate-200 text-slate-600 hover:text-red-600 hover:border-red-200 hover:bg-red-50 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">{children}</main>
      </div>

      {/* Reusable Fund Wallet Modal */}
      <FundWalletModal
        isOpen={fundModalOpen}
        onClose={() => setFundModalOpen(false)}
        onSuccess={(newBal) => {
          if (user) setUser({ ...user, walletBalance: newBal });
        }}
      />
    </div>
  );
}
