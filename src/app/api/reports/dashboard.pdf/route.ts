import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { visibleOrdersWhere } from "@/lib/permissions";
import { renderDashboardPdf } from "@/lib/dashboard-pdf";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const user = await requireUser();
  const url = new URL(req.url);
  const fromStr = url.searchParams.get("from");
  const toStr = url.searchParams.get("to");
  const from = fromStr ? new Date(fromStr) : null;
  const to = toStr ? new Date(toStr) : null;
  if (to) to.setHours(23, 59, 59, 999);

  const and: Prisma.WorkOrderWhereInput[] = [];
  const visibility = visibleOrdersWhere(user);
  if (visibility) and.push(visibility);
  const createdAt: Prisma.DateTimeFilter = {};
  if (from) createdAt.gte = from;
  if (to) createdAt.lte = to;
  if (Object.keys(createdAt).length) and.push({ createdAt });
  const where: Prisma.WorkOrderWhereInput = and.length ? { AND: and } : {};

  const [
    total,
    pendiente,
    enProgreso,
    completada,
    cancelada,
    byType,
    byPriority,
    byStatus,
    machinesByStatus,
    topMachines,
  ] = await Promise.all([
    prisma.workOrder.count({ where }),
    prisma.workOrder.count({ where: { ...where, status: "PENDIENTE" } }),
    prisma.workOrder.count({ where: { ...where, status: "EN_PROGRESO" } }),
    prisma.workOrder.count({ where: { ...where, status: "COMPLETADA" } }),
    prisma.workOrder.count({ where: { ...where, status: "CANCELADA" } }),
    prisma.workOrder.groupBy({
      by: ["type"],
      where,
      _count: { _all: true },
    }),
    prisma.workOrder.groupBy({
      by: ["priority"],
      where,
      _count: { _all: true },
    }),
    prisma.workOrder.groupBy({
      by: ["status"],
      where,
      _count: { _all: true },
    }),
    prisma.machine.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    prisma.workOrder.groupBy({
      by: ["machineId"],
      where,
      _count: { _all: true },
      orderBy: { _count: { machineId: "desc" } },
      take: 5,
    }),
  ]);

  const machineMap = topMachines.length
    ? Object.fromEntries(
        (
          await prisma.machine.findMany({
            where: { id: { in: topMachines.map((m) => m.machineId) } },
            select: { id: true, code: true, name: true },
          })
        ).map((m) => [m.id, m])
      )
    : {};

  const buffer = await renderDashboardPdf({
    from,
    to,
    generatedAt: new Date(),
    generatedBy: user.name ?? user.username,
    totals: { total, pendiente, enProgreso, completada, cancelada },
    byType: byType.map((r) => ({ label: r.type, value: r._count._all })),
    byPriority: byPriority.map((r) => ({
      label: r.priority,
      value: r._count._all,
    })),
    byStatus: byStatus.map((r) => ({
      label: r.status,
      value: r._count._all,
    })),
    machinesByStatus: machinesByStatus.map((r) => ({
      label: r.status,
      value: r._count._all,
    })),
    topMachines: topMachines.map((r) => {
      const m = machineMap[r.machineId];
      return {
        label: m ? `${m.code} — ${m.name}` : r.machineId.slice(0, 8),
        value: r._count._all,
      };
    }),
  });

  const stamp = new Date().toISOString().slice(0, 10);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="dashboard-${stamp}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
