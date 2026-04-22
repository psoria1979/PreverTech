import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser, requireJefe } from "@/lib/session";

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
  priority: z.enum(["BAJA", "MEDIA", "ALTA", "CRITICA"]).default("MEDIA"),
  visibility: z.enum(["SOLO_JEFES", "ASIGNADOS", "TODOS"]).default("SOLO_JEFES"),
  frequencyDays: z.number().int().positive().max(3650),
  nextDueAt: z.string(),
  active: z.boolean().default(true),
});

export async function GET() {
  await requireUser();
  const plans = await prisma.maintenancePlan.findMany({
    orderBy: [{ active: "desc" }, { nextDueAt: "asc" }],
    include: {
      machine: { select: { id: true, code: true, name: true } },
    },
  });
  return NextResponse.json(plans);
}

export async function POST(req: Request) {
  await requireJefe();
  const parsed = planSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const { nextDueAt, ...rest } = parsed.data;
  const plan = await prisma.maintenancePlan.create({
    data: { ...rest, nextDueAt: new Date(nextDueAt) },
  });
  return NextResponse.json(plan, { status: 201 });
}
