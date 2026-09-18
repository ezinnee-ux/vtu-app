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
    const search = searchParams.get("search");
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {};
    if (status && status !== "ALL") {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
        wallet: {
          select: { balance: true, currency: true },
        },
        _count: {
          select: { orders: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({ success: true, data: users });
  } catch (error: unknown) {
    console.error("Admin users error:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const admin = await getUserFromRequest(req);
    if (!admin || admin.role !== "ADMIN") {
      return NextResponse.json({ success: false, message: "Admin access required" }, { status: 403 });
    }

    const { userId, status, role } = await req.json();

    if (!userId) {
      return NextResponse.json({ success: false, message: "User ID is required" }, { status: 400 });
    }

    // Prevent suspending the seed admin account
    const targetUser = await prisma.user.findUnique({ where: { id: userId } });
    if (targetUser?.email === "admin@quickvtu.ng" && status === "SUSPENDED") {
      return NextResponse.json(
        { success: false, message: "Root administrator account cannot be suspended." },
        { status: 400 }
      );
    }

    const data: Record<string, unknown> = {};
    if (status) data.status = status;
    if (role) data.role = role;

    const updated = await prisma.user.update({
      where: { id: userId },
      data,
    });

    return NextResponse.json({
      success: true,
      message: `User ${updated.name} has been updated to ${updated.status}.`,
      data: updated,
    });
  } catch (error: unknown) {
    console.error("Admin update user error:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
