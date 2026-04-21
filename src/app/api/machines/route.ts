import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser, requireJefe } from "@/lib/session";

const machineSchema = z.object({
  code: z.string().min(1).max(50),
  name: z.string().min(1).max(120),
  location: z.string().max(120).optional().nullable(),
  description: z.string().max(1000).optional().nullable(),
  status: z
    .enum(["OPERATIVA", "EN_MANTENIMIENTO", "FUERA_DE_SERVICIO"])
    .default("OPERATIVA"),
});

export async function GET() {
  await requireUser();
  const machines = await prisma.machine.findMany({
    orderBy: { code: "asc" },
  });
  return NextResponse.json(machines);
}

export async function POST(req: Request) {
  await requireJefe();
  const body = await req.json();
  const parsed = machineSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  try {
    const machine = await prisma.machine.create({ data: parsed.data });
    return NextResponse.json(machine, { status: 201 });
  } catch (e: unknown) {
    if (
      typeof e === "object" &&
      e !== null &&
      "code" in e &&
      (e as { code?: string }).code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Ya existe una máquina con ese código" },
        { status: 409 }
      );
    }
    throw e;
  }
}
