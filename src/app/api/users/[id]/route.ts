import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireJefe } from "@/lib/session";

const updateSchema = z.object({
  name: z.string().min(1).max(120),
  role: z.enum(["JEFE", "EMPLEADO"]),
  active: z.boolean(),
  pin: z.string().min(4).max(12).optional().or(z.literal("")),
});

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const current = await requireJefe();
  const { id } = await params;
  const parsed = updateSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const { pin, active, role, name } = parsed.data;

  if (current.id === id && (role !== "JEFE" || !active)) {
    return NextResponse.json(
      { error: "No podés quitarte permisos a vos mismo" },
      { status: 400 }
    );
  }

  const data: {
    name: string;
    role: "JEFE" | "EMPLEADO";
    active: boolean;
    pinHash?: string;
  } = { name, role, active };
  if (pin) data.pinHash = await bcrypt.hash(pin, 10);

  const user = await prisma.user.update({
    where: { id },
    data,
    select: { id: true, username: true, name: true, role: true, active: true },
  });
  return NextResponse.json(user);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const current = await requireJefe();
  const { id } = await params;
  if (current.id === id) {
    return NextResponse.json(
      { error: "No podés eliminar tu propio usuario" },
      { status: 400 }
    );
  }
  try {
    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    if (
      typeof e === "object" &&
      e !== null &&
      "code" in e &&
      (e as { code?: string }).code === "P2003"
    ) {
      return NextResponse.json(
        {
          error:
            "No se puede eliminar: el usuario tiene órdenes creadas. Desactivalo en su lugar.",
        },
        { status: 409 }
      );
    }
    throw e;
  }
}
