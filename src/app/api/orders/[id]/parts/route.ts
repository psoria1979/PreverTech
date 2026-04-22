import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { canViewOrder } from "@/lib/permissions";

const usageSchema = z.object({
  partId: z.string().min(1),
  quantity: z.number().positive(),
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
      { error: "Solo los jefes o empleados asignados pueden registrar consumos" },
      { status: 403 }
    );
  }

  const parsed = usageSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const { partId, quantity, note } = parsed.data;

  try {
    const usage = await prisma.$transaction(async (tx) => {
      const part = await tx.part.findUnique({ where: { id: partId } });
      if (!part) throw new Error("PART_NOT_FOUND");
      if (part.stock < quantity) throw new Error("INSUFFICIENT_STOCK");

      await tx.part.update({
        where: { id: partId },
        data: { stock: { decrement: quantity } },
      });

      return tx.partUsage.create({
        data: {
          workOrderId: id,
          partId,
          userId: user.id,
          quantity,
          unitCost: part.unitCost,
          note: note || null,
        },
        include: {
          part: { select: { id: true, code: true, name: true, unit: true } },
          user: { select: { id: true, name: true, username: true } },
        },
      });
    });
    return NextResponse.json(usage, { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "PART_NOT_FOUND") {
      return NextResponse.json({ error: "Repuesto no encontrado" }, { status: 404 });
    }
    if (msg === "INSUFFICIENT_STOCK") {
      return NextResponse.json(
        { error: "Stock insuficiente para el consumo" },
        { status: 400 }
      );
    }
    throw e;
  }
}
