import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const network = searchParams.get("network");

    const where: Record<string, unknown> = { isActive: true };
    if (category && category !== "ALL") {
      where.category = category.toUpperCase();
    }
    if (network) {
      where.network = { code: network.toLowerCase() };
    }

    const plans = await prisma.dataPlan.findMany({
      where,
      include: {
        network: true,
      },
      orderBy: [
        { providerCost: "asc" },
      ],
    });

    return NextResponse.json({
      success: true,
      data: plans,
    });
  } catch (error: unknown) {
    console.error("Data plans fetch error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch data plans",
        errorCode: "SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}
