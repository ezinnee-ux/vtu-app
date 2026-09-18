import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { walletService } from "@/lib/wallet/walletService";
import { paymentService } from "@/lib/payment/paymentService";
import { generateReference } from "@/lib/helpers";
import { z } from "zod";

const fundSchema = z.object({
  amount: z.number().min(100, "Minimum wallet funding amount is ₦100").max(1000000, "Maximum limit is ₦1,000,000"),
  gateway: z.enum(["PAYSTACK", "FLUTTERWAVE", "TEST"]),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = fundSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: parsed.error.errors[0].message, errorCode: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const { amount, gateway } = parsed.data;
    const reference = generateReference(`PAY-${gateway.substring(0, 3)}`);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const callbackUrl = `${appUrl}/dashboard/wallet?funded=true`;

    // 1. If TEST sandbox mode is requested
    if (gateway === "TEST" || process.env.VTU_TEST_MODE === "true") {
      // Record payment
      await prisma.payment.create({
        data: {
          userId: user.id,
          reference,
          gateway: "TEST",
          amount,
          status: "SUCCESS",
          gatewayResponse: JSON.stringify({ message: "Instant Sandbox Top-up Success", simulated: true }),
        },
      });

      // Credit wallet
      const creditResult = await walletService.creditWallet(
        user.id,
        amount,
        "Wallet Funding (Sandbox Mode)",
        reference
      );

      return NextResponse.json({
        success: true,
        message: `Successfully credited your wallet with ₦${amount.toLocaleString()}!`,
        reference,
        data: {
          reference,
          gateway: "TEST",
          amount,
          newBalance: creditResult.wallet?.balance ?? amount,
          simulated: true,
        },
      });
    }

    // 2. Paystack Gateway Initialization
    if (gateway === "PAYSTACK") {
      const paystackData = await paymentService.initializePaystack(
        user.email,
        amount,
        reference,
        callbackUrl
      );

      await prisma.payment.create({
        data: {
          userId: user.id,
          reference,
          gateway: "PAYSTACK",
          amount,
          status: "PENDING",
          gatewayResponse: JSON.stringify(paystackData),
        },
      });

      return NextResponse.json({
        success: true,
        message: "Payment initialized",
        reference,
        data: {
          checkoutUrl: paystackData.authorization_url,
          accessCode: paystackData.access_code,
          reference,
        },
      });
    }

    // 3. Flutterwave Gateway Initialization
    if (gateway === "FLUTTERWAVE") {
      const flwData = await paymentService.initializeFlutterwave(
        user.email,
        amount,
        reference,
        callbackUrl,
        user.name,
        user.phone
      );

      await prisma.payment.create({
        data: {
          userId: user.id,
          reference,
          gateway: "FLUTTERWAVE",
          amount,
          status: "PENDING",
          gatewayResponse: JSON.stringify(flwData),
        },
      });

      return NextResponse.json({
        success: true,
        message: "Payment initialized",
        reference,
        data: {
          checkoutUrl: flwData.link,
          reference,
        },
      });
    }

    return NextResponse.json(
      { success: false, message: "Invalid payment gateway", errorCode: "INVALID_GATEWAY" },
      { status: 400 }
    );
  } catch (error: unknown) {
    console.error("Wallet fund fatal error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to initialize wallet funding.", errorCode: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
