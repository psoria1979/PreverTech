import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; usageId: string }> }
) {
  const user = await requireUser();
  const { id, usageId } = await params;

  const usage = await prisma.partUsage.findUnique({ where: { id: usageId } });
  if (!usage || usage.workOrderId !== id) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }
  if (user.role !== "JEFE" && usage.userId !== user.id) {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.part.update({
      where: { id: usage.partId },
      data: { stock: { increment: usage.quantity } },
    });
    await tx.partUsage.delete({ where: { id: usageId } });
  });

  return NextResponse.json({ ok: true });
}
