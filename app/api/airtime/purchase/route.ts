import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { vtuService } from "@/lib/vtu/vtuService";
import { walletService } from "@/lib/wallet/walletService";
import {
  generateReference,
  normalizePhoneNumber,
  validateNigerianPhone,
} from "@/lib/helpers";
import { z } from "zod";

const airtimeSchema = z.object({
  networkCode: z.string().min(2),
  phoneNumber: z.string().min(10),
  amount: z.number().min(50, "Minimum airtime is ₦50").max(50000, "Maximum airtime is ₦50,000"),
  idempotencyKey: z.string().optional(),
  saveBeneficiary: z.boolean().optional(),
  beneficiaryName: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Please log in to purchase airtime.", errorCode: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const parsed = airtimeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: parsed.error.errors[0].message, errorCode: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const { networkCode, phoneNumber, amount, idempotencyKey, saveBeneficiary, beneficiaryName } = parsed.data;
    const cleanPhone = normalizePhoneNumber(phoneNumber);

    if (!validateNigerianPhone(cleanPhone)) {
      return NextResponse.json(
        { success: false, message: "Please provide a valid 11-digit Nigerian mobile number.", errorCode: "INVALID_PHONE" },
        { status: 400 }
      );
    }

    const network = await prisma.network.findUnique({
      where: { code: networkCode.toLowerCase() },
    });

    if (!network || !network.isActive) {
      return NextResponse.json(
        { success: false, message: "Selected network is currently unavailable.", errorCode: "NETWORK_UNAVAILABLE" },
        { status: 400 }
      );
    }

    // Check idempotency if key provided
    if (idempotencyKey) {
      const existing = await prisma.order.findUnique({
        where: { idempotencyKey },
        include: { transaction: true },
      });
      if (existing) {
        return NextResponse.json({
          success: existing.status === "SUCCESSFUL",
          message: "Transaction already processed.",
          reference: existing.reference,
          data: existing,
        });
      }
    }

    // Check user's current wallet balance
    const userWallet = await prisma.wallet.findUnique({
      where: { userId: user.id },
    });

    if (!userWallet || userWallet.balance < amount) {
      return NextResponse.json(
        {
          success: false,
          message: `Insufficient wallet balance. You have ₦${(userWallet?.balance || 0).toLocaleString()}, but airtime costs ₦${amount.toLocaleString()}. Please fund your wallet.`,
          errorCode: "INSUFFICIENT_BALANCE",
        },
        { status: 400 }
      );
    }

    const reference = generateReference("VTU");
    const costPrice = Math.round(amount * (1 - network.airtimeDiscountPercent / 100));
    const profit = amount - costPrice;

    // 1. Atomically debit the wallet
    try {
      await walletService.debitWallet(
        user.id,
        amount,
        `Airtime purchase: ₦${amount.toLocaleString()} ${network.name} (${cleanPhone})`,
        reference
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to debit wallet";
      return NextResponse.json(
        { success: false, message: msg, errorCode: "DEBIT_FAILED" },
        { status: 400 }
      );
    }

    // 2. Create the Order with status PENDING
    const order = await prisma.order.create({
      data: {
        reference,
        userId: user.id,
        type: "AIRTIME",
        networkId: network.id,
        phoneNumber: cleanPhone,
        amount,
        costPrice,
        profit,
        status: "PENDING",
        paymentMethod: "WALLET",
        idempotencyKey: idempotencyKey || null,
      },
    });

    // Save beneficiary if requested
    if (saveBeneficiary && beneficiaryName) {
      try {
        const existingBeneficiary = await prisma.savedNumber.findFirst({
          where: { userId: user.id, phoneNumber: cleanPhone },
        });
        if (!existingBeneficiary) {
          await prisma.savedNumber.create({
            data: {
              userId: user.id,
              networkId: network.id,
              phoneNumber: cleanPhone,
              name: beneficiaryName,
            },
          });
        }
      } catch (e) {
        console.error("Failed to save beneficiary:", e);
      }
    }

    // 3. Dispatch to VTU provider
    const vtuResult = await vtuService.purchaseAirtime(cleanPhone, network.code, amount, reference);

    if (vtuResult.success && vtuResult.status === "SUCCESSFUL") {
      // 4. Mark Order & Transaction SUCCESSFUL
      const updatedOrder = await prisma.order.update({
        where: { id: order.id },
        data: {
          status: "SUCCESSFUL",
          transaction: {
            create: {
              reference,
              providerReference: vtuResult.providerReference,
              status: "SUCCESSFUL",
              apiResponse: JSON.stringify(vtuResult.rawResponse),
            },
          },
        },
        include: { network: true, transaction: true },
      });

      // Send in-app notification
      await prisma.notification.create({
        data: {
          userId: user.id,
          title: "Airtime Recharge Successful",
          message: `₦${amount.toLocaleString()} ${network.name} airtime to ${cleanPhone} was successful.`,
          type: "SUCCESS",
        },
      });

      return NextResponse.json({
        success: true,
        message: `Airtime recharge of ₦${amount.toLocaleString()} was successful!`,
        reference,
        data: {
          reference: updatedOrder.reference,
          providerReference: vtuResult.providerReference,
          amount: updatedOrder.amount,
          network: network.name,
          phoneNumber: cleanPhone,
          status: "SUCCESSFUL",
          date: updatedOrder.createdAt,
        },
      });
    } else if (vtuResult.status === "PENDING") {
      // Telco gateway is processing
      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: "PROCESSING",
          transaction: {
            create: {
              reference,
              providerReference: vtuResult.providerReference,
              status: "PENDING",
              apiResponse: JSON.stringify(vtuResult.rawResponse),
            },
          },
        },
      });

      return NextResponse.json({
        success: true,
        message: "Airtime purchase is being processed by the telecommunications network.",
        reference,
        data: {
          reference,
          status: "PROCESSING",
          phoneNumber: cleanPhone,
          amount,
          network: network.name,
          date: new Date(),
        },
      });
    } else {
      // Failed: Automatically refund wallet so user never loses money!
      await walletService.refundOrder(
        order.id,
        vtuResult.errorMessage || "Provider rejected airtime transaction"
      );

      return NextResponse.json(
        {
          success: false,
          message: vtuResult.message || "Airtime top-up failed. Your wallet has been automatically refunded.",
          reference,
          errorCode: "VTU_DELIVERY_FAILED",
          refunded: true,
        },
        { status: 422 }
      );
    }
  } catch (error: unknown) {
    console.error("Airtime purchase fatal error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "An error occurred while processing your request. Please try again.",
        errorCode: "SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}
