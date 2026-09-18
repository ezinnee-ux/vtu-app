import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
  try {
    const networks = await prisma.network.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: { dataPlans: true },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({
      success: true,
      data: networks,
    });
  } catch (error: unknown) {
    console.error("Networks fetch error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch network providers",
        errorCode: "SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}
