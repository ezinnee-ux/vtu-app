import React from "react";
import Link from "next/link";
import { Zap, ShieldCheck, Headphones, Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-800">
          {/* Col 1: Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-bold shadow-md">
                <Zap className="w-5 h-5 fill-slate-950 text-slate-950" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                QuickVTU <span className="text-emerald-400 font-normal text-sm">Nigeria</span>
              </span>
            </Link>
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
              Nigeria&apos;s most reliable virtual top-up platform. Enjoy lightning-fast mobile data,
              instant airtime recharges with cashback discounts, and seamless 24/7 digital payments.
            </p>
            <div className="flex items-center space-x-3 pt-2">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800/50">
                <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                256-Bit SSL Secured
              </span>
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                99.9% Automated Uptime
              </span>
            </div>
          </div>

          {/* Col 2: Services */}
          <div>
            <h4 className="text-white text-sm font-bold uppercase tracking-wider mb-4">
              Services
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/dashboard/buy-data" className="hover:text-emerald-400 transition-colors">
                  MTN SME & Direct Data
                </Link>
              </li>
              <li>
                <Link href="/dashboard/buy-data" className="hover:text-emerald-400 transition-colors">
                  Airtel CG & Gifting Data
                </Link>
              </li>
              <li>
                <Link href="/dashboard/buy-data" className="hover:text-emerald-400 transition-colors">
                  Glo Monthly & Special Bundles
                </Link>
              </li>
              <li>
                <Link href="/dashboard/buy-data" className="hover:text-emerald-400 transition-colors">
                  9mobile Morecliq Bundles
                </Link>
              </li>
              <li>
                <Link href="/dashboard/buy-airtime" className="hover:text-emerald-400 transition-colors">
                  Instant Airtime VTU (2% Off)
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Quick Links */}
          <div>
            <h4 className="text-white text-sm font-bold uppercase tracking-wider mb-4">
              Platform
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/login" className="hover:text-emerald-400 transition-colors">
                  Customer Login
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-emerald-400 transition-colors">
                  Create Free Account
                </Link>
              </li>
              <li>
                <Link href="/dashboard/wallet" className="hover:text-emerald-400 transition-colors">
                  Fund Digital Wallet
                </Link>
              </li>
              <li>
                <Link href="/dashboard/transactions" className="hover:text-emerald-400 transition-colors">
                  Check Receipt / Status
                </Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-emerald-400 transition-colors text-purple-400">
                  Admin Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Support */}
          <div>
            <h4 className="text-white text-sm font-bold uppercase tracking-wider mb-4">
              Help & Support
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <Headphones className="w-4 h-4" />
                24/7 Priority Support
              </li>
              <li>
                <a href="mailto:support@quickvtu.ng" className="hover:text-emerald-400 transition-colors">
                  support@quickvtu.ng
                </a>
              </li>
              <li>
                <a href="tel:+2348000000000" className="hover:text-emerald-400 transition-colors">
                  +234 800 QUICK VTU
                </a>
              </li>
              <li>
                <a
                  href="https://wa.me/2348000000000"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block mt-2 px-3 py-1.5 rounded-lg bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold hover:bg-emerald-600/30 transition-colors"
                >
                  WhatsApp Direct Desk
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-1">
            <span>Built with</span>
            <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" />
            <span>for Nigerian Mobile Subscribers. © {new Date().getFullYear()} QuickVTU Inc.</span>
          </div>
          <div className="flex items-center space-x-6">
            <span className="hover:text-slate-400 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-slate-400 cursor-pointer">Terms of Service</span>
            <span className="hover:text-slate-400 cursor-pointer">Security Standards</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
