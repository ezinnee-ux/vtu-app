import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "QuickVTU Nigeria | Instant Mobile Data & Airtime Recharge",
  description:
    "Buy instant MTN, Airtel, Glo, and 9mobile data subscriptions, cheap airtime with discounts, and digital bill payments with 24/7 automated delivery in Nigeria.",
  keywords: "VTU, Nigeria, Buy Data, Airtime, MTN, Airtel, Glo, 9mobile, Paystack, Flutterwave, Cheap Data",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable}`}>
      <body className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
        {children}
      </body>
    </html>
  );
}
