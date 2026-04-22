import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  const user = await requireUser();
  const { id, commentId } = await params;

  const comment = await prisma.orderComment.findUnique({
    where: { id: commentId },
  });
  if (!comment || comment.workOrderId !== id) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }
  if (user.role !== "JEFE" && comment.userId !== user.id) {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
  }

  await prisma.orderComment.delete({ where: { id: commentId } });
  return NextResponse.json({ ok: true });
}
