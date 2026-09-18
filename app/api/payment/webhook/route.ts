import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { paymentService } from "@/lib/payment/paymentService";
import { walletService } from "@/lib/wallet/walletService";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const paystackSignature = req.headers.get("x-paystack-signature");
    const flwSignature = req.headers.get("verif-hash");

    let eventData: Record<string, unknown> = {};
    try {
      eventData = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
    }

    // 1. Paystack Webhook Handler
    if (paystackSignature) {
      const isValid = paymentService.verifyPaystackSignature(rawBody, paystackSignature);
      if (!isValid && process.env.NODE_ENV === "production") {
        return NextResponse.json({ message: "Invalid signature" }, { status: 401 });
      }

      if (eventData.event === "charge.success") {
        const data = eventData.data as { reference?: string; amount?: number };
        const reference = data?.reference;
        const amount = (data?.amount || 0) / 100;

        if (reference) {
          const payment = await prisma.payment.findUnique({
            where: { reference },
          });

          if (payment && payment.status !== "SUCCESS") {
            await prisma.payment.update({
              where: { id: payment.id },
              data: {
                status: "SUCCESS",
                gatewayResponse: rawBody,
              },
            });

            await walletService.creditWallet(
              payment.userId,
              amount,
              "Paystack Webhook Automatic Credit",
              reference
            );
          }
        }
      }
      return NextResponse.json({ status: "success" }, { status: 200 });
    }

    // 2. Flutterwave Webhook Handler
    if (flwSignature) {
      const isValid = paymentService.verifyFlutterwaveSignature(flwSignature);
      if (!isValid && process.env.NODE_ENV === "production") {
        return NextResponse.json({ message: "Invalid signature" }, { status: 401 });
      }

      const txRef = (eventData.tx_ref || eventData.txRef) as string | undefined;
      const amount = Number(eventData.amount || 0);

      if (txRef) {
        const payment = await prisma.payment.findUnique({
          where: { reference: txRef },
        });

        if (payment && payment.status !== "SUCCESS") {
          await prisma.payment.update({
            where: { id: payment.id },
            data: {
              status: "SUCCESS",
              gatewayResponse: rawBody,
            },
          });

          await walletService.creditWallet(
            payment.userId,
            amount,
            "Flutterwave Webhook Automatic Credit",
            txRef
          );
        }
      }
      return NextResponse.json({ status: "success" }, { status: 200 });
    }

    return NextResponse.json({ status: "acknowledged" }, { status: 200 });
  } catch (error: unknown) {
    console.error("Payment webhook error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
