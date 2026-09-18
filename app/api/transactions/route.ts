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
    const type = searchParams.get("type");
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    const where: Record<string, unknown> = {
      userId: user.id,
    };

    if (type && type !== "ALL") {
      where.type = type.toUpperCase();
    }

    if (status && status !== "ALL") {
      where.status = status.toUpperCase();
    }

    if (search) {
      where.OR = [
        { reference: { contains: search } },
        { phoneNumber: { contains: search } },
      ];
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        network: true,
        plan: true,
        transaction: true,
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    // Summary statistics for dashboard cards
    const totalOrders = await prisma.order.count({ where: { userId: user.id } });
    const successfulOrders = await prisma.order.count({ where: { userId: user.id, status: "SUCCESSFUL" } });
    const pendingOrders = await prisma.order.count({
      where: { userId: user.id, status: { in: ["PENDING", "PROCESSING"] } },
    });
    const failedOrders = await prisma.order.count({
      where: { userId: user.id, status: { in: ["FAILED", "REVERSED"] } },
    });

    return NextResponse.json({
      success: true,
      data: {
        orders,
        stats: {
          total: totalOrders,
          successful: successfulOrders,
          pending: pendingOrders,
          failed: failedOrders,
        },
      },
    });
  } catch (error: unknown) {
    console.error("Transactions fetch error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch transactions", errorCode: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
