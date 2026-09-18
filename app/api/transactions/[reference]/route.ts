import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import prisma from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: { reference: string } }
) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { reference } = params;

    const order = await prisma.order.findUnique({
      where: { reference },
      include: {
        user: {
          select: { name: true, email: true, phone: true },
        },
        network: true,
        plan: true,
        transaction: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, message: "Transaction not found", errorCode: "NOT_FOUND" },
        { status: 404 }
      );
    }

    // Ensure non-admin users can only view their own transactions
    if (user.role !== "ADMIN" && order.userId !== user.id) {
      return NextResponse.json(
        { success: false, message: "Access denied", errorCode: "FORBIDDEN" },
        { status: 403 }
      );
    }

    const receipt = {
      platformName: "QuickVTU Nigeria",
      reference: order.reference,
      status: order.status,
      service: order.type === "DATA" ? "Mobile Data Subscription" : "Airtime Recharge",
      network: order.network.name,
      networkLogo: order.network.logo,
      phoneNumber: order.phoneNumber,
      customerName: order.user.name,
      customerEmail: order.user.email,
      amount: order.amount,
      planName: order.plan?.name || null,
      dataSize: order.plan?.dataSize || null,
      validity: order.plan?.validity || null,
      paymentMethod: order.paymentMethod,
      providerReference: order.transaction?.providerReference || null,
      date: order.createdAt,
      supportEmail: "support@quickvtu.ng",
      supportPhone: "+234 800 QUICK VTU",
    };

    return NextResponse.json({
      success: true,
      data: receipt,
    });
  } catch (error: unknown) {
    console.error("Receipt error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to retrieve receipt", errorCode: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
