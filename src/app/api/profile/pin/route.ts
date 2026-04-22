import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

const schema = z.object({
  currentPin: z.string().min(1),
  newPin: z.string().min(4).max(12),
});

export async function PUT(req: Request) {
  const sessionUser = await requireUser();
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: { id: true, pinHash: true },
  });
  if (!user) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  }

  const ok = await bcrypt.compare(parsed.data.currentPin, user.pinHash);
  if (!ok) {
    return NextResponse.json(
      { error: "El PIN actual no es correcto" },
      { status: 400 }
    );
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { pinHash: await bcrypt.hash(parsed.data.newPin, 10) },
  });

  return NextResponse.json({ ok: true });
}
