import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser, requireJefe } from "@/lib/session";

const machineSchema = z.object({
  code: z.string().min(1).max(50),
  name: z.string().min(1).max(120),
  location: z.string().max(120).optional().nullable(),
  description: z.string().max(1000).optional().nullable(),
  status: z.enum(["OPERATIVA", "EN_MANTENIMIENTO", "FUERA_DE_SERVICIO"]),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireUser();
  const { id } = await params;
  const machine = await prisma.machine.findUnique({ where: { id } });
  if (!machine) {
    return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  }
  return NextResponse.json(machine);
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireJefe();
  const { id } = await params;
  const parsed = machineSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const machine = await prisma.machine.update({
    where: { id },
    data: parsed.data,
  });
  return NextResponse.json(machine);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireJefe();
  const { id } = await params;
  try {
    await prisma.machine.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    if (
      typeof e === "object" &&
      e !== null &&
      "code" in e &&
      (e as { code?: string }).code === "P2003"
    ) {
      return NextResponse.json(
        { error: "No se puede eliminar: la máquina tiene órdenes asociadas" },
        { status: 409 }
      );
    }
    throw e;
  }
}
