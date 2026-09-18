import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import prisma from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const wallet = await prisma.wallet.findUnique({
      where: { userId: user.id },
      include: {
        transactions: {
          take: 5,
          orderBy: { createdAt: "desc" },
        },
      },
    });

    // Compute total credits and total debits
    const aggregations = await prisma.walletTransaction.groupBy({
      by: ["type"],
      where: {
        wallet: { userId: user.id },
        status: "SUCCESS",
      },
      _sum: {
        amount: true,
      },
    });

    let totalFunded = 0;
    let totalSpent = 0;

    for (const agg of aggregations) {
      if (agg.type === "CREDIT") totalFunded = agg._sum.amount || 0;
      if (agg.type === "DEBIT") totalSpent = agg._sum.amount || 0;
    }

    return NextResponse.json({
      success: true,
      data: {
        balance: wallet?.balance || 0,
        currency: wallet?.currency || "NGN",
        totalFunded,
        totalSpent,
        recentTransactions: wallet?.transactions || [],
      },
    });
  } catch (error: unknown) {
    console.error("Wallet fetch error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch wallet details", errorCode: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
