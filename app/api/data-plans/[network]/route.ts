import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: { network: string } }
) {
  try {
    const networkCode = params.network.toLowerCase();
    const network = await prisma.network.findUnique({
      where: { code: networkCode },
    });

    if (!network) {
      return NextResponse.json(
        {
          success: false,
          message: `Network ${params.network} not found.`,
          errorCode: "NETWORK_NOT_FOUND",
        },
        { status: 404 }
      );
    }

    const plans = await prisma.dataPlan.findMany({
      where: {
        networkId: network.id,
        isActive: true,
      },
      orderBy: {
        providerCost: "asc",
      },
    });

    // Group plans by category for easy frontend tab presentation:
    // DAILY, 2_DAY, 3_DAY, WEEKLY, BIWEEKLY, MONTHLY, 2_MONTH, 3_MONTH
    const groupedPlans: Record<string, typeof plans> = {};
    for (const plan of plans) {
      if (!groupedPlans[plan.category]) {
        groupedPlans[plan.category] = [];
      }
      groupedPlans[plan.category].push(plan);
    }

    return NextResponse.json({
      success: true,
      data: {
        network,
        plans,
        groupedPlans,
      },
    });
  } catch (error: unknown) {
    console.error("Data plans by network error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch plans for this network",
        errorCode: "SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}
