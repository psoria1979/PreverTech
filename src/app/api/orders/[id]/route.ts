import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser, requireJefe } from "@/lib/session";
import { canViewOrder } from "@/lib/permissions";
import {
  notifyOrderAssigned,
  notifyOrderStatusChanged,
} from "@/lib/notifications";

const updateSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1),
  type: z.enum([
    "PREDICTIVO",
    "PREVENTIVO",
    "CORRECTIVO",
    "MEJORA",
    "INSPECCION",
  ]),
  priority: z.enum(["BAJA", "MEDIA", "ALTA", "CRITICA"]),
  status: z.enum(["PENDIENTE", "EN_PROGRESO", "COMPLETADA", "CANCELADA"]),
  visibility: z.enum(["SOLO_JEFES", "ASIGNADOS", "TODOS"]),
  machineId: z.string().min(1),
  scheduledFor: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  assigneeIds: z.array(z.string()).optional().default([]),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireUser();
  const { id } = await params;
  const order = await prisma.workOrder.findUnique({
    where: { id },
    include: {
      machine: true,
      creator: { select: { id: true, name: true, username: true } },
      assignments: {
        include: { user: { select: { id: true, name: true, username: true } } },
      },
    },
  });
  if (!order) {
    return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  }
  if (!canViewOrder(user, order)) {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
  }
  return NextResponse.json(order);
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireJefe();
  const { id } = await params;
  const parsed = updateSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const { assigneeIds, scheduledFor, status, ...rest } = parsed.data;

  const existing = await prisma.workOrder.findUnique({
    where: { id },
    include: { assignments: { select: { userId: true } } },
  });
  if (!existing) {
    return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  }

  const completedAt =
    status === "COMPLETADA" && existing.status !== "COMPLETADA"
      ? new Date()
      : status !== "COMPLETADA"
        ? null
        : existing.completedAt;

  const order = await prisma.$transaction(async (tx) => {
    await tx.workOrderAssignment.deleteMany({ where: { workOrderId: id } });
    return tx.workOrder.update({
      where: { id },
      data: {
        ...rest,
        status,
        scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
        completedAt,
        assignments: assigneeIds.length
          ? { create: assigneeIds.map((userId) => ({ userId })) }
          : undefined,
      },
    });
  });

  const previousAssignees = new Set(existing.assignments.map((a) => a.userId));
  const newAssignees = assigneeIds.filter((uid) => !previousAssignees.has(uid));
  if (newAssignees.length) {
    await notifyOrderAssigned(newAssignees, {
      id: order.id,
      number: order.number,
      title: order.title,
    });
  }

  if (status !== existing.status) {
    const keptAssignees = assigneeIds.filter((uid) => previousAssignees.has(uid));
    if (keptAssignees.length) {
      await notifyOrderStatusChanged(
        keptAssignees,
        { id: order.id, number: order.number, title: order.title },
        status
      );
    }
  }

  return NextResponse.json(order);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireJefe();
  const { id } = await params;
  await prisma.workOrder.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
