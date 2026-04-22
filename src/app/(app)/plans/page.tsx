import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireJefe } from "@/lib/session";
import { PageHeader } from "@/components/PageHeader";
import { TypeBadge, PriorityBadge } from "@/components/Badges";
import { GeneratePlansButton } from "./GeneratePlansButton";

export const dynamic = "force-dynamic";

export default async function PlansPage() {
  await requireJefe();
  const plans = await prisma.maintenancePlan.findMany({
    orderBy: [{ active: "desc" }, { nextDueAt: "asc" }],
    include: { machine: { select: { code: true, name: true } } },
  });

  const now = new Date();
  const duePlans = plans.filter(
    (p) => p.active && p.nextDueAt <= now
  ).length;

  return (
    <>
      <PageHeader
        title="Planes de mantenimiento"
        description="Planes recurrentes que generan órdenes automáticamente."
        actions={
          <div className="flex gap-2">
            <GeneratePlansButton dueCount={duePlans} />
            <Link
              href="/plans/new"
              className="rounded-md bg-orange-600 px-3 py-2 text-sm font-medium text-white hover:bg-orange-700"
            >
              + Nuevo plan
            </Link>
          </div>
        }
      />

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
          <thead className="bg-zinc-50 text-left text-xs font-medium uppercase tracking-wide text-zinc-500 dark:bg-zinc-800/50">
            <tr>
              <th className="px-4 py-3">Plan</th>
              <th className="px-4 py-3">Máquina</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Prioridad</th>
              <th className="px-4 py-3">Frecuencia</th>
              <th className="px-4 py-3">Próxima</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {plans.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-10 text-center text-sm text-zinc-500"
                >
                  No hay planes de mantenimiento cargados.
                </td>
              </tr>
            ) : (
              plans.map((p) => {
                const overdue = p.active && p.nextDueAt <= now;
                return (
                  <tr key={p.id} className="text-sm">
                    <td className="px-4 py-3">
                      <p className="font-medium">{p.name}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs">
                        {p.machine.code}
                      </span>
                      <p className="text-xs text-zinc-500">{p.machine.name}</p>
                    </td>
                    <td className="px-4 py-3">
                      <TypeBadge value={p.type} />
                    </td>
                    <td className="px-4 py-3">
                      <PriorityBadge value={p.priority} />
                    </td>
                    <td className="px-4 py-3 text-xs">
                      cada {p.frequencyDays} día
                      {p.frequencyDays === 1 ? "" : "s"}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <span
                        className={
                          overdue
                            ? "font-semibold text-red-600 dark:text-red-400"
                            : ""
                        }
                      >
                        {new Date(p.nextDueAt).toLocaleDateString("es-AR")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {p.active ? (
                        <span className="text-green-600">Activo</span>
                      ) : (
                        <span className="text-zinc-500">Pausado</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/plans/${p.id}`}
                        className="font-medium text-orange-600 hover:underline"
                      >
                        Editar
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
