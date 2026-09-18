import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import prisma from "@/lib/db";
import { z } from "zod";

const ticketSchema = z.object({
  subject: z.string().min(3, "Subject must be at least 3 characters"),
  message: z.string().min(10, "Message must be at least 10 characters"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
});

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const tickets = await prisma.supportTicket.findMany({
      where: user.role === "ADMIN" ? {} : { userId: user.id },
      include: {
        user: { select: { name: true, email: true, phone: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: tickets });
  } catch (error: unknown) {
    console.error("Support tickets error:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = ticketSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const ticket = await prisma.supportTicket.create({
      data: {
        userId: user.id,
        subject: parsed.data.subject,
        message: parsed.data.message,
        priority: parsed.data.priority,
        status: "OPEN",
      },
    });

    // Notify user
    await prisma.notification.create({
      data: {
        userId: user.id,
        title: "Support Ticket Received",
        message: `Ticket #${ticket.id.slice(0, 8)} (${ticket.subject}) has been logged. Our support agent will respond shortly.`,
        type: "INFO",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Your support request has been submitted successfully.",
      data: ticket,
    });
  } catch (error: unknown) {
    console.error("Create ticket error:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
