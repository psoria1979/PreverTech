import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { visibleOrdersWhere } from "@/lib/permissions";
import { PageHeader } from "@/components/PageHeader";
import { DashboardCharts } from "./DashboardCharts";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireUser();
  const where = visibleOrdersWhere(user);

  const [
    totalOrders,
    pendingOrders,
    inProgressOrders,
    completedOrders,
    byType,
    byPriority,
    byStatus,
    machinesByStatus,
    topMachines,
    recentOrders,
  ] = await Promise.all([
    prisma.workOrder.count({ where }),
    prisma.workOrder.count({ where: { ...where, status: "PENDIENTE" } }),
    prisma.workOrder.count({ where: { ...where, status: "EN_PROGRESO" } }),
    prisma.workOrder.count({ where: { ...where, status: "COMPLETADA" } }),
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
    prisma.workOrder.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { machine: true },
    }),
  ]);

  const machineIds = topMachines.map((m) => m.machineId);
  const machineMap = machineIds.length
    ? Object.fromEntries(
        (
          await prisma.machine.findMany({
            where: { id: { in: machineIds } },
            select: { id: true, code: true, name: true },
          })
        ).map((m) => [m.id, m])
      )
    : {};

  const typeData = byType.map((t) => ({
    label: t.type,
    value: t._count._all,
  }));
  const priorityData = byPriority.map((p) => ({
    label: p.priority,
    value: p._count._all,
  }));
  const statusData = byStatus.map((s) => ({
    label: s.status,
    value: s._count._all,
  }));
  const machineStatusData = machinesByStatus.map((m) => ({
    label: m.status,
    value: m._count._all,
  }));
  const topMachineData = topMachines.map((m) => {
    const machine = machineMap[m.machineId];
    return {
      label: machine ? `${machine.code}` : m.machineId.slice(0, 6),
      value: m._count._all,
    };
  });

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={`Hola, ${user.name}. Panorama general del mantenimiento.`}
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="Órdenes totales" value={totalOrders} />
        <Kpi label="Pendientes" value={pendingOrders} tone="amber" />
        <Kpi label="En progreso" value={inProgressOrders} tone="blue" />
        <Kpi label="Completadas" value={completedOrders} tone="green" />
      </div>

      <DashboardCharts
        typeData={typeData}
        priorityData={priorityData}
        statusData={statusData}
        machineStatusData={machineStatusData}
        topMachineData={topMachineData}
      />

      <section className="mt-8 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-3 text-lg font-semibold">Últimas órdenes</h2>
        {recentOrders.length === 0 ? (
          <p className="text-sm text-zinc-500">Aún no hay órdenes cargadas.</p>
        ) : (
          <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {recentOrders.map((o) => (
              <li
                key={o.id}
                className="flex items-center justify-between py-2 text-sm"
              >
                <div>
                  <p className="font-medium">
                    #{o.number} · {o.title}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {o.machine.code} — {o.type} — {o.status}
                  </p>
                </div>
                <span className="text-xs text-zinc-500">
                  {new Date(o.createdAt).toLocaleDateString("es-AR")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

function Kpi({
  label,
  value,
  tone = "zinc",
}: {
  label: string;
  value: number;
  tone?: "zinc" | "amber" | "blue" | "green";
}) {
  const tones = {
    zinc: "text-zinc-900 dark:text-zinc-100",
    amber: "text-amber-600 dark:text-amber-400",
    blue: "text-blue-600 dark:text-blue-400",
    green: "text-green-600 dark:text-green-400",
  };
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-xs uppercase tracking-wide text-zinc-500">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${tones[tone]}`}>{value}</p>
    </div>
  );
}
