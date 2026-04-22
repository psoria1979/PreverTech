import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser, requireJefe } from "@/lib/session";

const partSchema = z.object({
  code: z.string().min(1).max(50),
  name: z.string().min(1).max(120),
  unit: z.string().min(1).max(20).default("u"),
  description: z.string().max(1000).optional().nullable(),
  stock: z.number().min(0).default(0),
  minStock: z.number().min(0).default(0),
  unitCost: z.number().min(0).default(0),
});

export async function GET() {
  await requireUser();
  const parts = await prisma.part.findMany({ orderBy: { code: "asc" } });
  return NextResponse.json(parts);
}

export async function POST(req: Request) {
  await requireJefe();
  const parsed = partSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  try {
    const part = await prisma.part.create({ data: parsed.data });
    return NextResponse.json(part, { status: 201 });
  } catch (e: unknown) {
    if (
      typeof e === "object" &&
      e !== null &&
      "code" in e &&
      (e as { code?: string }).code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Ya existe un repuesto con ese código" },
        { status: 409 }
      );
    }
    throw e;
  }
}
