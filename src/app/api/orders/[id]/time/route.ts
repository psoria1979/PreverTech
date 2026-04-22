import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { canViewOrder } from "@/lib/permissions";

const timeSchema = z.object({
  minutes: z.number().int().positive().max(24 * 60),
  note: z.string().max(500).optional().nullable(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireUser();
  const { id } = await params;

  const order = await prisma.workOrder.findUnique({
    where: { id },
    include: { assignments: { select: { userId: true } } },
  });
  if (!order) {
    return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  }
  if (!canViewOrder(user, order)) {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
  }
  const isAssignee = order.assignments.some((a) => a.userId === user.id);
  if (user.role !== "JEFE" && !isAssignee) {
    return NextResponse.json(
      { error: "Solo los jefes o empleados asignados pueden cargar tiempo" },
      { status: 403 }
    );
  }

  const parsed = timeSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const log = await prisma.timeLog.create({
    data: {
      workOrderId: id,
      userId: user.id,
      minutes: parsed.data.minutes,
      note: parsed.data.note || null,
    },
    include: { user: { select: { id: true, name: true, username: true } } },
  });
  return NextResponse.json(log, { status: 201 });
}
