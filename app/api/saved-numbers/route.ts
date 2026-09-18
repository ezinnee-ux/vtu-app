import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import prisma from "@/lib/db";
import { normalizePhoneNumber, validateNigerianPhone, detectNetworkFromPhone } from "@/lib/helpers";

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const savedNumbers = await prisma.savedNumber.findMany({
      where: { userId: user.id },
      include: { network: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: savedNumbers });
  } catch (error: unknown) {
    console.error("Saved numbers error:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { phoneNumber, name, networkCode } = await req.json();
    const cleanPhone = normalizePhoneNumber(phoneNumber);

    if (!validateNigerianPhone(cleanPhone)) {
      return NextResponse.json(
        { success: false, message: "Invalid Nigerian phone number" },
        { status: 400 }
      );
    }

    // Auto-detect network if not provided
    const targetCode = networkCode || detectNetworkFromPhone(cleanPhone) || "mtn";
    const network = await prisma.network.findUnique({
      where: { code: targetCode },
    });

    if (!network) {
      return NextResponse.json({ success: false, message: "Network not found" }, { status: 404 });
    }

    const saved = await prisma.savedNumber.create({
      data: {
        userId: user.id,
        networkId: network.id,
        phoneNumber: cleanPhone,
        name: name || `${network.name} - ${cleanPhone}`,
      },
      include: { network: true },
    });

    return NextResponse.json({ success: true, message: "Number saved to beneficiaries", data: saved });
  } catch (error: unknown) {
    console.error("Save number error:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, message: "ID is required" }, { status: 400 });
    }

    await prisma.savedNumber.deleteMany({
      where: { id, userId: user.id },
    });

    return NextResponse.json({ success: true, message: "Beneficiary removed" });
  } catch (error: unknown) {
    console.error("Delete saved number error:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
