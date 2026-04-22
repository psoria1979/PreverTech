import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { canViewOrder } from "@/lib/permissions";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string; photoId: string }> }
) {
  const user = await requireUser();
  const { id, photoId } = await params;
  const order = await prisma.workOrder.findUnique({
    where: { id },
    include: { assignments: { select: { userId: true } } },
  });
  if (!order) return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  if (!canViewOrder(user, order)) {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
  }

  const photo = await prisma.workOrderPhoto.findUnique({ where: { id: photoId } });
  if (!photo || photo.workOrderId !== id) {
    return NextResponse.json({ error: "Foto no encontrada" }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(photo.data), {
    headers: {
      "Content-Type": photo.mimeType,
      "Content-Length": String(photo.size),
      "Cache-Control": "private, max-age=60",
    },
  });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; photoId: string }> }
) {
  const user = await requireUser();
  const { id, photoId } = await params;
  const order = await prisma.workOrder.findUnique({
    where: { id },
    include: { assignments: { select: { userId: true } } },
  });
  if (!order) return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  const isAssignee = order.assignments.some((a) => a.userId === user.id);
  if (user.role !== "JEFE" && !isAssignee) {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
  }

  const photo = await prisma.workOrderPhoto.findUnique({ where: { id: photoId } });
  if (!photo || photo.workOrderId !== id) {
    return NextResponse.json({ error: "Foto no encontrada" }, { status: 404 });
  }

  await prisma.workOrderPhoto.delete({ where: { id: photoId } });
  return NextResponse.json({ ok: true });
}
