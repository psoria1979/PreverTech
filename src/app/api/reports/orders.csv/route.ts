import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { buildOrdersWhere, parseOrderFilters } from "@/lib/order-filters";

export const runtime = "nodejs";

const HEADERS = [
  "numero",
  "titulo",
  "descripcion",
  "tipo",
  "prioridad",
  "estado",
  "visibilidad",
  "maquina_codigo",
  "maquina_nombre",
  "creador",
  "programada",
  "completada",
  "creada",
  "asignados",
];

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET(req: Request) {
  const user = await requireUser();
  const url = new URL(req.url);
  const filters = parseOrderFilters(url.searchParams);
  const where = buildOrdersWhere(user, filters);

  const orders = await prisma.workOrder.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      machine: { select: { code: true, name: true } },
      creator: { select: { name: true } },
      assignments: { include: { user: { select: { name: true } } } },
    },
  });

  const rows = [HEADERS.join(",")];
  for (const o of orders) {
    rows.push(
      [
        o.number,
        o.title,
        o.description,
        o.type,
        o.priority,
        o.status,
        o.visibility,
        o.machine.code,
        o.machine.name,
        o.creator.name,
        o.scheduledFor ? o.scheduledFor.toISOString() : "",
        o.completedAt ? o.completedAt.toISOString() : "",
        o.createdAt.toISOString(),
        o.assignments.map((a) => a.user.name).join("; "),
      ]
        .map(csvEscape)
        .join(",")
    );
  }

  const csv = "﻿" + rows.join("\r\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="ordenes-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
