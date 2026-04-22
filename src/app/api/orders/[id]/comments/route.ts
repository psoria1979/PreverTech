import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { canViewOrder } from "@/lib/permissions";

const commentSchema = z.object({
  body: z.string().trim().min(1).max(2000),
});

async function loadOrderForUser(
  user: { id: string; role: "JEFE" | "EMPLEADO" },
  id: string
) {
  const order = await prisma.workOrder.findUnique({
    where: { id },
    include: { assignments: { select: { userId: true } } },
  });
  if (!order) return { error: NextResponse.json({ error: "No encontrada" }, { status: 404 }) };
  if (!canViewOrder(user, order)) {
    return { error: NextResponse.json({ error: "Sin permisos" }, { status: 403 }) };
  }
  return { order };
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireUser();
  const { id } = await params;
  const { order, error } = await loadOrderForUser(user, id);
  if (error) return error;

  const comments = await prisma.orderComment.findMany({
    where: { workOrderId: order!.id },
    orderBy: { createdAt: "asc" },
    include: { user: { select: { id: true, name: true, username: true } } },
  });
  return NextResponse.json(comments);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireUser();
  const { id } = await params;
  const { order, error } = await loadOrderForUser(user, id);
  if (error) return error;

  const parsed = commentSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Comentario inválido", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const comment = await prisma.orderComment.create({
    data: {
      workOrderId: order!.id,
      userId: user.id,
      body: parsed.data.body,
    },
    include: { user: { select: { id: true, name: true, username: true } } },
  });
  return NextResponse.json(comment, { status: 201 });
}
