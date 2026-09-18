export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import prisma from "@/lib/db";
import { vtuService } from "@/lib/vtu/vtuService";

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ success: false, message: "Admin access required" }, { status: 403 });
    }

    // Platform user statistics
    const totalUsers = await prisma.user.count();
    const activeUsers = await prisma.user.count({ where: { status: "ACTIVE" } });
    const suspendedUsers = await prisma.user.count({ where: { status: "SUSPENDED" } });

    // Order statistics
    const totalOrders = await prisma.order.count();
    const successfulOrders = await prisma.order.count({ where: { status: "SUCCESSFUL" } });
    const pendingOrders = await prisma.order.count({
      where: { status: { in: ["PENDING", "PROCESSING"] } },
    });
    const failedOrders = await prisma.order.count({
      where: { status: { in: ["FAILED", "REVERSED"] } },
    });

    // Financial calculations
    const successfulSales = await prisma.order.findMany({
      where: { status: "SUCCESSFUL" },
      select: { amount: true, costPrice: true, profit: true, type: true },
    });

    let totalRevenue = 0;
    let totalCost = 0;
    let totalProfit = 0;
    let airtimeRevenue = 0;
    let dataRevenue = 0;

    for (const sale of successfulSales) {
      totalRevenue += sale.amount;
      totalCost += sale.costPrice;
      totalProfit += sale.profit;
      if (sale.type === "AIRTIME") airtimeRevenue += sale.amount;
      if (sale.type === "DATA") dataRevenue += sale.amount;
    }

    // Wallet funding stats
    const walletFundingCredits = await prisma.walletTransaction.aggregate({
      where: { type: "CREDIT", status: "SUCCESS" },
      _sum: { amount: true },
    });
    const totalWalletFunding = walletFundingCredits._sum.amount || 0;

    // Total user wallet balances held in system
    const totalCirculatingWallet = await prisma.wallet.aggregate({
      _sum: { balance: true },
    });

    // Provider balance inquiry
    const providerBalance = await vtuService.getProviderBalance();

    return NextResponse.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          active: activeUsers,
          suspended: suspendedUsers,
        },
        orders: {
          total: totalOrders,
          successful: successfulOrders,
          pending: pendingOrders,
          failed: failedOrders,
        },
        finances: {
          totalRevenue,
          totalCost,
          totalProfit,
          airtimeRevenue,
          dataRevenue,
          totalWalletFunding,
          userWalletFloat: totalCirculatingWallet._sum.balance || 0,
        },
        provider: providerBalance,
      },
    });
  } catch (error: unknown) {
    console.error("Admin overview error:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
