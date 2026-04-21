import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireJefe } from "@/lib/session";

const createSchema = z.object({
  username: z.string().min(2).max(50).regex(/^[a-z0-9._-]+$/i, {
    message: "Solo letras, números, punto, guion y guion bajo",
  }),
  name: z.string().min(1).max(120),
  pin: z.string().min(4).max(12),
  role: z.enum(["JEFE", "EMPLEADO"]).default("EMPLEADO"),
});

export async function GET() {
  await requireJefe();
  const users = await prisma.user.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      username: true,
      name: true,
      role: true,
      active: true,
      createdAt: true,
    },
  });
  return NextResponse.json(users);
}

export async function POST(req: Request) {
  await requireJefe();
  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const { pin, username, ...rest } = parsed.data;
  try {
    const user = await prisma.user.create({
      data: {
        ...rest,
        username: username.toLowerCase(),
        pinHash: await bcrypt.hash(pin, 10),
      },
      select: { id: true, username: true, name: true, role: true },
    });
    return NextResponse.json(user, { status: 201 });
  } catch (e: unknown) {
    if (
      typeof e === "object" &&
      e !== null &&
      "code" in e &&
      (e as { code?: string }).code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Ya existe un usuario con ese nombre" },
        { status: 409 }
      );
    }
    throw e;
  }
}
