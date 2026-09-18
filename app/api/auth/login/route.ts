import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { comparePassword, signJwt, setSessionCookie } from "@/lib/auth";
import { normalizePhoneNumber } from "@/lib/helpers";
import { z } from "zod";

const loginSchema = z.object({
  identifier: z.string().min(3, "Please enter your email or phone number"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: parsed.error.errors[0].message,
          errorCode: "VALIDATION_ERROR",
        },
        { status: 400 }
      );
    }

    const { identifier, password } = parsed.data;
    const cleanId = identifier.trim().toLowerCase();
    const normalizedPhone = normalizePhoneNumber(identifier);

    // Look up by email or phone
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: cleanId },
          { phone: normalizedPhone },
        ],
      },
      include: {
        wallet: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid email/phone or password.",
          errorCode: "INVALID_CREDENTIALS",
        },
        { status: 401 }
      );
    }

    if (user.status === "SUSPENDED") {
      return NextResponse.json(
        {
          success: false,
          message: "Your account has been suspended. Please contact customer support.",
          errorCode: "ACCOUNT_SUSPENDED",
        },
        { status: 403 }
      );
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid email/phone or password.",
          errorCode: "INVALID_CREDENTIALS",
        },
        { status: 401 }
      );
    }

    const token = signJwt({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const response = NextResponse.json({
      success: true,
      message: "Login successful!",
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

    setSessionCookie(response, token);
    return response;
  } catch (error: unknown) {
    console.error("Login error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "An unexpected error occurred during login.",
        errorCode: "SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}
