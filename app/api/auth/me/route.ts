import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
          errorCode: "UNAUTHORIZED",
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          walletBalance: user.wallet?.balance || 0,
        },
      },
    });
  } catch (error: unknown) {
    console.error("Auth me error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to retrieve session",
        errorCode: "SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}
