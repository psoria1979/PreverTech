import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser, requireJefe } from "@/lib/session";
import { visibleOrdersWhere } from "@/lib/permissions";
import { notifyOrderAssigned } from "@/lib/notifications";

const orderSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1),
  type: z.enum([
    "PREDICTIVO",
    "PREVENTIVO",
    "CORRECTIVO",
    "MEJORA",
    "INSPECCION",
  ]),
  priority: z.enum(["BAJA", "MEDIA", "ALTA", "CRITICA"]).default("MEDIA"),
  status: z
    .enum(["PENDIENTE", "EN_PROGRESO", "COMPLETADA", "CANCELADA"])
    .default("PENDIENTE"),
  visibility: z.enum(["SOLO_JEFES", "ASIGNADOS", "TODOS"]).default("SOLO_JEFES"),
  machineId: z.string().min(1),
  scheduledFor: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  assigneeIds: z.array(z.string()).optional().default([]),
});

export async function GET() {
  const user = await requireUser();
  const where = visibleOrdersWhere(user);
  const orders = await prisma.workOrder.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      machine: { select: { code: true, name: true } },
      creator: { select: { name: true, username: true } },
      assignments: { include: { user: { select: { id: true, name: true } } } },
    },
  });
  return NextResponse.json(orders);
}

export async function POST(req: Request) {
  const user = await requireJefe();
  const parsed = orderSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const { assigneeIds, scheduledFor, ...rest } = parsed.data;

  const order = await prisma.workOrder.create({
    data: {
      ...rest,
      scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
      creatorId: user.id,
      assignments: assigneeIds.length
        ? { create: assigneeIds.map((userId) => ({ userId })) }
        : undefined,
    },
  });

  if (assigneeIds.length) {
    await notifyOrderAssigned(assigneeIds, {
      id: order.id,
      number: order.number,
      title: order.title,
    });
  }

  return NextResponse.json(order, { status: 201 });
}
