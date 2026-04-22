import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireJefe } from "@/lib/session";

const planSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional().nullable(),
  machineId: z.string().min(1),
  type: z.enum([
    "PREDICTIVO",
    "PREVENTIVO",
    "CORRECTIVO",
    "MEJORA",
    "INSPECCION",
  ]),
  priority: z.enum(["BAJA", "MEDIA", "ALTA", "CRITICA"]),
  visibility: z.enum(["SOLO_JEFES", "ASIGNADOS", "TODOS"]),
  frequencyDays: z.number().int().positive().max(3650),
  nextDueAt: z.string(),
  active: z.boolean(),
});

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireJefe();
  const { id } = await params;
  const parsed = planSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const { nextDueAt, ...rest } = parsed.data;
  const plan = await prisma.maintenancePlan.update({
    where: { id },
    data: { ...rest, nextDueAt: new Date(nextDueAt) },
  });
  return NextResponse.json(plan);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireJefe();
  const { id } = await params;
  await prisma.maintenancePlan.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
