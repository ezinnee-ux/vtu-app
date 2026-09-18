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

const dataPurchaseSchema = z.object({
  planCode: z.string().min(2),
  phoneNumber: z.string().min(10),
  idempotencyKey: z.string().optional(),
  saveBeneficiary: z.boolean().optional(),
  beneficiaryName: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Please log in to purchase data.", errorCode: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const parsed = dataPurchaseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: parsed.error.errors[0].message, errorCode: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const { planCode, phoneNumber, idempotencyKey, saveBeneficiary, beneficiaryName } = parsed.data;
    const cleanPhone = normalizePhoneNumber(phoneNumber);

    if (!validateNigerianPhone(cleanPhone)) {
      return NextResponse.json(
        { success: false, message: "Please provide a valid 11-digit Nigerian mobile number.", errorCode: "INVALID_PHONE" },
        { status: 400 }
      );
    }

    // Find requested dynamic data plan
    const plan = await prisma.dataPlan.findUnique({
      where: { planCode },
      include: { network: true },
    });

    if (!plan || !plan.isActive) {
      return NextResponse.json(
        { success: false, message: "Selected data bundle is no longer active or available.", errorCode: "PLAN_NOT_FOUND" },
        { status: 404 }
      );
    }

    // Check idempotency if key provided
    if (idempotencyKey) {
      const existing = await prisma.order.findUnique({
        where: { idempotencyKey },
        include: { transaction: true, plan: true, network: true },
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

    // Check user's current wallet balance against selling price
    const userWallet = await prisma.wallet.findUnique({
      where: { userId: user.id },
    });

    if (!userWallet || userWallet.balance < plan.sellingPrice) {
      return NextResponse.json(
        {
          success: false,
          message: `Insufficient wallet balance. You have ₦${(userWallet?.balance || 0).toLocaleString()}, but ${plan.name} costs ₦${plan.sellingPrice.toLocaleString()}. Please fund your wallet.`,
          errorCode: "INSUFFICIENT_BALANCE",
        },
        { status: 400 }
      );
    }

    const reference = generateReference("VTU");
    const profit = plan.adminMargin;
    const costPrice = plan.providerCost;

    // 1. Atomically debit the wallet
    try {
      await walletService.debitWallet(
        user.id,
        plan.sellingPrice,
        `Data Subscription: ${plan.network.name} ${plan.name} (${cleanPhone})`,
        reference
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to debit wallet";
      return NextResponse.json(
        { success: false, message: msg, errorCode: "DEBIT_FAILED" },
        { status: 400 }
      );
    }

    // 2. Create Order record with status PENDING
    const order = await prisma.order.create({
      data: {
        reference,
        userId: user.id,
        type: "DATA",
        networkId: plan.network.id,
        planId: plan.id,
        phoneNumber: cleanPhone,
        amount: plan.sellingPrice,
        costPrice,
        profit,
        status: "PENDING",
        paymentMethod: "WALLET",
        idempotencyKey: idempotencyKey || null,
      },
    });

    // Save beneficiary if checked
    if (saveBeneficiary && beneficiaryName) {
      try {
        const existingBeneficiary = await prisma.savedNumber.findFirst({
          where: { userId: user.id, phoneNumber: cleanPhone },
        });
        if (!existingBeneficiary) {
          await prisma.savedNumber.create({
            data: {
              userId: user.id,
              networkId: plan.network.id,
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
    const vtuResult = await vtuService.purchaseData(cleanPhone, plan.network.code, plan.planCode, reference);

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
        include: { network: true, plan: true, transaction: true },
      });

      // Send in-app notification
      await prisma.notification.create({
        data: {
          userId: user.id,
          title: "Data Bundle Activated",
          message: `${plan.name} (${plan.dataSize}) for ${cleanPhone} has been activated successfully.`,
          type: "SUCCESS",
        },
      });

      return NextResponse.json({
        success: true,
        message: `${plan.name} (${plan.dataSize}) data successfully delivered!`,
        reference,
        data: {
          reference: updatedOrder.reference,
          providerReference: vtuResult.providerReference,
          planName: plan.name,
          dataSize: plan.dataSize,
          validity: plan.validity,
          amount: updatedOrder.amount,
          network: plan.network.name,
          phoneNumber: cleanPhone,
          status: "SUCCESSFUL",
          date: updatedOrder.createdAt,
        },
      });
    } else if (vtuResult.status === "PENDING") {
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
        message: "Data activation request accepted by network provider and is currently processing.",
        reference,
        data: {
          reference,
          status: "PROCESSING",
          planName: plan.name,
          dataSize: plan.dataSize,
          phoneNumber: cleanPhone,
          amount: plan.sellingPrice,
          network: plan.network.name,
          date: new Date(),
        },
      });
    } else {
      // Provider failed: Automatically refund wallet
      await walletService.refundOrder(
        order.id,
        vtuResult.errorMessage || "Provider failed to activate data subscription"
      );

      return NextResponse.json(
        {
          success: false,
          message: vtuResult.message || "Data activation failed. Your wallet balance has been refunded automatically.",
          reference,
          errorCode: "VTU_DELIVERY_FAILED",
          refunded: true,
        },
        { status: 422 }
      );
    }
  } catch (error: unknown) {
    console.error("Data purchase fatal error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "An unexpected error occurred while processing data top-up.",
        errorCode: "SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}
