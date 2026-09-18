import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { hashPassword, signJwt, setSessionCookie } from "@/lib/auth";
import { validateNigerianPhone, normalizePhoneNumber } from "@/lib/helpers";
import { z } from "zod";

const registerSchema = z.object({
  name: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number is too short"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  termsAccepted: z.boolean().refine((val) => val === true, {
    message: "You must accept terms and conditions",
  }),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

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

    const { name, email, phone, password } = parsed.data;
    const normalizedPhone = normalizePhoneNumber(phone);

    if (!validateNigerianPhone(normalizedPhone)) {
      return NextResponse.json(
        {
          success: false,
          message: "Please enter a valid 11-digit Nigerian mobile number (e.g. 08031234567).",
          errorCode: "INVALID_PHONE",
        },
        { status: 400 }
      );
    }

    // Check existing email or phone
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email.toLowerCase() },
          { phone: normalizedPhone },
        ],
      },
    });

    if (existingUser) {
      const field = existingUser.email === email.toLowerCase() ? "Email" : "Phone number";
      return NextResponse.json(
        {
          success: false,
          message: `${field} is already registered. Please login.`,
          errorCode: "USER_EXISTS",
        },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user and wallet atomically
    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        phone: normalizedPhone,
        passwordHash,
        role: "USER",
        status: "ACTIVE",
        emailVerified: true,
        wallet: {
          create: {
            balance: 500.0, // Welcome signup bonus
            currency: "NGN",
          },
        },
        notifications: {
          create: {
            title: "Welcome to QuickVTU!",
            message: "Your account has been created with a ₦500 welcome bonus in your wallet.",
            type: "SUCCESS",
          },
        },
      },
      include: {
        wallet: true,
      },
    });

    // Sign JWT token
    const token = signJwt({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const response = NextResponse.json({
      success: true,
      message: "Registration successful! Welcome bonus credited.",
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
    console.error("Registration error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "An unexpected error occurred during registration.",
        errorCode: "SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}
