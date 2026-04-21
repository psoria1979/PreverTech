import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { canViewOrder } from "@/lib/permissions";
import { renderOrderPdf } from "@/lib/order-pdf";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireUser();
  const { id } = await params;
  const order = await prisma.workOrder.findUnique({
    where: { id },
    include: {
      machine: true,
      creator: { select: { name: true, username: true } },
      assignments: {
        include: { user: { select: { name: true, username: true } } },
      },
    },
  });
  if (!order) {
    return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  }
  if (!canViewOrder(user, order)) {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
  }

  const buffer = await renderOrderPdf(order);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="orden-${order.number}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
