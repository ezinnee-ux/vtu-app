import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { paymentService } from "@/lib/payment/paymentService";
import { walletService } from "@/lib/wallet/walletService";

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { reference, gateway } = await req.json();
    if (!reference) {
      return NextResponse.json({ success: false, message: "Reference is required" }, { status: 400 });
    }

    // Check payment record
    const payment = await prisma.payment.findUnique({
      where: { reference },
    });

    if (!payment) {
      return NextResponse.json({ success: false, message: "Payment record not found" }, { status: 404 });
    }

    if (payment.status === "SUCCESS") {
      return NextResponse.json({
        success: true,
        message: "Payment already verified and credited.",
        data: payment,
      });
    }

    // Verify through gateway service
    let isVerified = false;
    let verifiedAmount = payment.amount;

    if (gateway === "PAYSTACK" || payment.gateway === "PAYSTACK") {
      const paystackRes = await paymentService.verifyPaystack(reference);
      if (paystackRes.data && paystackRes.data.status === "success") {
        isVerified = true;
        verifiedAmount = paystackRes.data.amount / 100; // Convert Kobo to Naira
      }
    } else if (gateway === "TEST" || payment.gateway === "TEST") {
      isVerified = true;
    }

    if (isVerified) {
      // Update payment record
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: "SUCCESS",
          gatewayResponse: JSON.stringify({ verified: true, verifiedAt: new Date() }),
        },
      });

      // Credit wallet atomically
      await walletService.creditWallet(
        user.id,
        verifiedAmount,
        `Wallet Funding (${payment.gateway})`,
        reference
      );

      return NextResponse.json({
        success: true,
        message: `Successfully verified and credited ₦${verifiedAmount.toLocaleString()} to your wallet!`,
        data: {
          reference,
          amount: verifiedAmount,
          status: "SUCCESS",
        },
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          message: "Payment could not be verified by payment processor.",
          errorCode: "PAYMENT_NOT_VERIFIED",
        },
        { status: 400 }
      );
    }
  } catch (error: unknown) {
    console.error("Payment verification error:", error);
    return NextResponse.json(
      { success: false, message: "Server error verifying payment", errorCode: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
