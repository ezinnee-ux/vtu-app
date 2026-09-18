import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import prisma from "@/lib/db";
import { walletService } from "@/lib/wallet/walletService";

export async function POST(
  req: NextRequest,
  { params }: { params: { reference: string } }
) {
  try {
    const admin = await getUserFromRequest(req);
    if (!admin || admin.role !== "ADMIN") {
      return NextResponse.json({ success: false, message: "Admin access required" }, { status: 403 });
    }

    const { reference } = params;
    const body = await req.json().catch(() => ({}));
    const reason = body.reason || "Manual refund processed by platform administrator";

    const order = await prisma.order.findUnique({
      where: { reference },
    });

    if (!order) {
      return NextResponse.json({ success: false, message: "Order not found" }, { status: 404 });
    }

    if (order.status === "REVERSED") {
      return NextResponse.json({ success: false, message: "This order has already been refunded" }, { status: 400 });
    }

    const refundedOrder = await walletService.refundOrder(order.id, reason);

    return NextResponse.json({
      success: true,
      message: `Order ${reference} (₦${refundedOrder.amount.toLocaleString()}) refunded successfully to customer wallet.`,
      data: refundedOrder,
    });
  } catch (error: unknown) {
    console.error("Admin refund error:", error);
    const msg = error instanceof Error ? error.message : "Failed to process refund";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
