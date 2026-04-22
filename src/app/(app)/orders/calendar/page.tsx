import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { visibleOrdersWhere } from "@/lib/permissions";
import { PageHeader } from "@/components/PageHeader";

export const dynamic = "force-dynamic";

const TYPE_DOT: Record<string, string> = {
  PREDICTIVO: "bg-purple-500",
  PREVENTIVO: "bg-blue-500",
  CORRECTIVO: "bg-red-500",
  MEJORA: "bg-green-500",
  INSPECCION: "bg-amber-500",
};

const DAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

function monthBounds(year: number, month: number) {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 1);
  return { start, end };
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser();
  const sp = await searchParams;
  const now = new Date();
  const year = Number(sp.year) || now.getFullYear();
  const month0 =
    typeof sp.month === "string" ? Math.max(1, Math.min(12, Number(sp.month))) - 1 : now.getMonth();

  const { start, end } = monthBounds(year, month0);

  const visibility = visibleOrdersWhere(user);
  const where: Prisma.WorkOrderWhereInput = {
    scheduledFor: { gte: start, lt: end },
    ...(visibility ? { AND: [visibility] } : {}),
  };

  const orders = await prisma.workOrder.findMany({
    where,
    orderBy: { scheduledFor: "asc" },
    include: { machine: { select: { code: true } } },
  });

  const byDay = new Map<number, typeof orders>();
  for (const o of orders) {
    if (!o.scheduledFor) continue;
    const day = o.scheduledFor.getDate();
    if (!byDay.has(day)) byDay.set(day, []);
    byDay.get(day)!.push(o);
  }

  // Build calendar grid — Monday-first
  const firstDayJs = start.getDay(); // 0=Sun..6=Sat
  const firstDayMon = (firstDayJs + 6) % 7; // 0=Mon..6=Sun
  const daysInMonth = new Date(year, month0 + 1, 0).getDate();
  const cells: Array<{ day: number; inMonth: boolean }> = [];
  for (let i = 0; i < firstDayMon; i++) cells.push({ day: 0, inMonth: false });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, inMonth: true });
  while (cells.length % 7 !== 0) cells.push({ day: 0, inMonth: false });

  const monthName = new Date(year, month0, 1).toLocaleDateString("es-AR", {
    month: "long",
    year: "numeric",
  });

  const prev = new Date(year, month0 - 1, 1);
  const next = new Date(year, month0 + 1, 1);
  const prevUrl = `/orders/calendar?year=${prev.getFullYear()}&month=${prev.getMonth() + 1}`;
  const nextUrl = `/orders/calendar?year=${next.getFullYear()}&month=${next.getMonth() + 1}`;
  const todayUrl = `/orders/calendar`;

  const todayY = now.getFullYear();
  const todayM = now.getMonth();
  const todayD = now.getDate();

  return (
    <>
      <PageHeader
        title="Calendario de órdenes"
        description="Órdenes programadas por mes."
        actions={
          <div className="flex items-center gap-2">
            <Link
              href={prevUrl}
              className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              ← Anterior
            </Link>
            <Link
              href={todayUrl}
              className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              Hoy
            </Link>
            <Link
              href={nextUrl}
              className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              Siguiente →
            </Link>
          </div>
        }
      />

      <p className="mb-3 text-lg font-semibold capitalize">{monthName}</p>

      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-xl border border-zinc-200 bg-zinc-200 text-xs dark:border-zinc-800 dark:bg-zinc-800">
        {DAYS.map((d) => (
          <div
            key={d}
            className="bg-zinc-50 px-2 py-2 text-center font-medium text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300"
          >
            {d}
          </div>
        ))}
        {cells.map((c, i) => {
          const isToday =
            c.inMonth && year === todayY && month0 === todayM && c.day === todayD;
          const dayOrders = c.inMonth ? byDay.get(c.day) ?? [] : [];
          return (
            <div
              key={i}
              className={`min-h-[96px] bg-white p-1 dark:bg-zinc-900 ${
                c.inMonth ? "" : "opacity-40"
              }`}
            >
              {c.inMonth && (
                <div
                  className={`mb-1 text-right text-xs font-medium ${
                    isToday
                      ? "inline-flex h-5 w-5 items-center justify-center rounded-full bg-orange-600 text-white"
                      : "text-zinc-500"
                  }`}
                >
                  {c.day}
                </div>
              )}
              <ul className="space-y-0.5">
                {dayOrders.slice(0, 4).map((o) => (
                  <li key={o.id}>
                    <Link
                      href={`/orders/${o.id}`}
                      className="group flex items-center gap-1 truncate rounded px-1 py-0.5 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      title={`#${o.number} · ${o.machine.code} — ${o.title}`}
                    >
                      <span
                        className={`h-1.5 w-1.5 shrink-0 rounded-full ${TYPE_DOT[o.type] ?? "bg-zinc-400"}`}
                      />
                      <span className="truncate text-[11px]">
                        #{o.number} {o.title}
                      </span>
                    </Link>
                  </li>
                ))}
                {dayOrders.length > 4 && (
                  <li className="px-1 text-[11px] text-zinc-500">
                    +{dayOrders.length - 4} más
                  </li>
                )}
              </ul>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-3 text-xs text-zinc-600 dark:text-zinc-400">
        {Object.entries(TYPE_DOT).map(([type, dot]) => (
          <span key={type} className="inline-flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${dot}`} />
            {type}
          </span>
        ))}
      </div>
    </>
  );
}
