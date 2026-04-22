import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { canViewOrder } from "@/lib/permissions";

export const runtime = "nodejs";

const MAX_SIZE = 8 * 1024 * 1024; // 8 MB
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"];

async function loadOrderForUser(user: { id: string; role: "JEFE" | "EMPLEADO" }, id: string) {
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

function canUpload(
  user: { id: string; role: "JEFE" | "EMPLEADO" },
  order: { assignments: { userId: string }[] }
) {
  if (user.role === "JEFE") return true;
  return order.assignments.some((a) => a.userId === user.id);
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireUser();
  const { id } = await params;
  const { order, error } = await loadOrderForUser(user, id);
  if (error) return error;

  const photos = await prisma.workOrderPhoto.findMany({
    where: { workOrderId: order!.id },
    orderBy: { createdAt: "asc" },
    select: { id: true, filename: true, mimeType: true, size: true, createdAt: true },
  });
  return NextResponse.json(photos);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireUser();
  const { id } = await params;
  const { order, error } = await loadOrderForUser(user, id);
  if (error) return error;
  if (!canUpload(user, order!)) {
    return NextResponse.json(
      { error: "Solo los jefes y empleados asignados pueden subir fotos" },
      { status: 403 }
    );
  }

  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Archivo no recibido" }, { status: 400 });
  }
  if (!ALLOWED.includes(file.type)) {
    return NextResponse.json({ error: "Tipo de archivo no permitido" }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "Archivo demasiado grande (máx 8 MB)" }, { status: 400 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const created = await prisma.workOrderPhoto.create({
    data: {
      workOrderId: order!.id,
      filename: file.name.slice(0, 200),
      mimeType: file.type,
      size: file.size,
      data: bytes,
    },
    select: { id: true, filename: true, mimeType: true, size: true, createdAt: true },
  });
  return NextResponse.json(created, { status: 201 });
}
