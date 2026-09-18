import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import prisma from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const admin = await getUserFromRequest(req);
    if (!admin || admin.role !== "ADMIN") {
      return NextResponse.json({ success: false, message: "Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const network = searchParams.get("network");

    const where: Record<string, unknown> = {};
    if (network && network !== "ALL") {
      where.network = { code: network.toLowerCase() };
    }

    const plans = await prisma.dataPlan.findMany({
      where,
      include: { network: true },
      orderBy: [
        { network: { name: "asc" } },
        { providerCost: "asc" },
      ],
    });

    return NextResponse.json({ success: true, data: plans });
  } catch (error: unknown) {
    console.error("Admin plans error:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const admin = await getUserFromRequest(req);
    if (!admin || admin.role !== "ADMIN") {
      return NextResponse.json({ success: false, message: "Admin access required" }, { status: 403 });
    }

    const body = await req.json();
    const { planId, adminMargin, customSellingPrice, isActive, bulkMarginPercent, networkCode } = body;

    // Bulk margin adjustment for a network
    if (bulkMarginPercent !== undefined && networkCode) {
      const plans = await prisma.dataPlan.findMany({
        where: { network: { code: networkCode.toLowerCase() } },
      });

      for (const plan of plans) {
        const newMargin = Math.round((plan.providerCost * bulkMarginPercent) / 100);
        const newSellingPrice = plan.providerCost + newMargin;

        await prisma.dataPlan.update({
          where: { id: plan.id },
          data: {
            adminMargin: newMargin,
            sellingPrice: newSellingPrice,
          },
        });
      }

      return NextResponse.json({
        success: true,
        message: `Applied ${bulkMarginPercent}% profit margin to all ${networkCode.toUpperCase()} data plans.`,
      });
    }

    // Single plan adjustment
    if (!planId) {
      return NextResponse.json({ success: false, message: "Plan ID is required" }, { status: 400 });
    }

    const plan = await prisma.dataPlan.findUnique({ where: { id: planId } });
    if (!plan) {
      return NextResponse.json({ success: false, message: "Plan not found" }, { status: 404 });
    }

    const dataToUpdate: Record<string, unknown> = {};

    if (isActive !== undefined) {
      dataToUpdate.isActive = isActive;
    }

    if (customSellingPrice !== undefined && Number(customSellingPrice) > 0) {
      const price = Number(customSellingPrice);
      dataToUpdate.sellingPrice = price;
      dataToUpdate.adminMargin = price - plan.providerCost;
    } else if (adminMargin !== undefined && Number(adminMargin) >= 0) {
      const margin = Number(adminMargin);
      dataToUpdate.adminMargin = margin;
      dataToUpdate.sellingPrice = plan.providerCost + margin;
    }

    const updated = await prisma.dataPlan.update({
      where: { id: planId },
      data: dataToUpdate,
      include: { network: true },
    });

    return NextResponse.json({
      success: true,
      message: `Updated pricing for ${updated.name}: Selling Price = ₦${updated.sellingPrice.toLocaleString()} (Margin = ₦${updated.adminMargin.toLocaleString()})`,
      data: updated,
    });
  } catch (error: unknown) {
    console.error("Admin update plan error:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
