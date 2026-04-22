import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; logId: string }> }
) {
  const user = await requireUser();
  const { id, logId } = await params;

  const log = await prisma.timeLog.findUnique({ where: { id: logId } });
  if (!log || log.workOrderId !== id) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }
  if (user.role !== "JEFE" && log.userId !== user.id) {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
  }

  await prisma.timeLog.delete({ where: { id: logId } });
  return NextResponse.json({ ok: true });
}
