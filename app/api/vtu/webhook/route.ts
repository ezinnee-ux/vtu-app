import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { walletService } from "@/lib/wallet/walletService";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const reference = body.reference || body.request_id || body.order_id;
    const status = (body.status || "").toLowerCase();

    if (!reference) {
      return NextResponse.json({ message: "Reference is required" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { reference },
      include: { transaction: true },
    });

    if (!order) {
      return NextResponse.json({ message: "Order not found" }, { status: 404 });
    }

    if (order.status === "SUCCESSFUL" || order.status === "REVERSED") {
      return NextResponse.json({ message: "Order already finalized" });
    }

    if (status === "success" || status === "successful" || status === "delivered") {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: "SUCCESSFUL",
          transaction: {
            update: {
              status: "SUCCESSFUL",
              apiResponse: JSON.stringify(body),
            },
          },
        },
      });

      await prisma.notification.create({
        data: {
          userId: order.userId,
          title: `${order.type === "DATA" ? "Data" : "Airtime"} Delivered`,
          message: `Your ${order.type} order ${order.reference} was successfully delivered to ${order.phoneNumber}.`,
          type: "SUCCESS",
        },
      });
    } else if (status === "failed" || status === "rejected") {
      await walletService.refundOrder(
        order.id,
        body.message || "VTU provider callback reported delivery failure"
      );
    }

    return NextResponse.json({ success: true, message: "Webhook processed" });
  } catch (error: unknown) {
    console.error("VTU Webhook error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
