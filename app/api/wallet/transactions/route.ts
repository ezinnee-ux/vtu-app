import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import prisma from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type"); // CREDIT or DEBIT
    const limit = parseInt(searchParams.get("limit") || "30", 10);

    const where: Record<string, unknown> = {
      wallet: { userId: user.id },
    };

    if (type && (type === "CREDIT" || type === "DEBIT")) {
      where.type = type;
    }

    const transactions = await prisma.walletTransaction.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json({
      success: true,
      data: transactions,
    });
  } catch (error: unknown) {
    console.error("Wallet transactions error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch wallet transactions", errorCode: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
