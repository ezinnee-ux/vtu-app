import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { vtuService } from "@/lib/vtu/vtuService";
import { walletService } from "@/lib/wallet/walletService";

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
      include: { transaction: true },
    });

    if (!order) {
      return NextResponse.json({ success: false, message: "Order not found" }, { status: 404 });
    }

    // Query status from provider service
    const statusResult = await vtuService.checkTransactionStatus(
      order.reference,
      order.transaction?.providerReference || undefined
    );

    // If order was processing and now provider says SUCCESSFUL
    if (order.status !== "SUCCESSFUL" && statusResult.status === "SUCCESSFUL") {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: "SUCCESSFUL",
          transaction: {
            update: {
              status: "SUCCESSFUL",
              apiResponse: JSON.stringify(statusResult.rawResponse),
            },
          },
        },
      });
    } else if (order.status !== "REVERSED" && statusResult.status === "FAILED") {
      await walletService.refundOrder(order.id, statusResult.message);
    }

    return NextResponse.json({
      success: true,
      data: {
        reference: order.reference,
        status: statusResult.status,
        message: statusResult.message,
        details: statusResult.rawResponse,
      },
    });
  } catch (error: unknown) {
    console.error("VTU status check error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to check transaction status", errorCode: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
