import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireJefe } from "@/lib/session";

const partSchema = z.object({
  code: z.string().min(1).max(50),
  name: z.string().min(1).max(120),
  unit: z.string().min(1).max(20),
  description: z.string().max(1000).optional().nullable(),
  stock: z.number().min(0),
  minStock: z.number().min(0),
  unitCost: z.number().min(0),
});

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireJefe();
  const { id } = await params;
  const parsed = partSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const part = await prisma.part.update({ where: { id }, data: parsed.data });
  return NextResponse.json(part);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireJefe();
  const { id } = await params;
  try {
    await prisma.part.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    if (
      typeof e === "object" &&
      e !== null &&
      "code" in e &&
      (e as { code?: string }).code === "P2003"
    ) {
      return NextResponse.json(
        { error: "No se puede eliminar: el repuesto tiene consumos registrados" },
        { status: 409 }
      );
    }
    throw e;
  }
}
