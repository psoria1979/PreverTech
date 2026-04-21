import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { visibleOrdersWhere } from "@/lib/permissions";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge, PriorityBadge, TypeBadge } from "@/components/Badges";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const user = await requireUser();
  const where = visibleOrdersWhere(user);
  const orders = await prisma.workOrder.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      machine: { select: { code: true, name: true } },
      creator: { select: { name: true } },
    },
  });
  const isJefe = user.role === "JEFE";

  return (
    <>
      <PageHeader
        title="Órdenes de trabajo"
        description={
          isJefe
            ? "Todas las órdenes cargadas en el sistema."
            : "Órdenes asignadas o visibles para tu rol."
        }
        actions={
          isJefe ? (
            <Link
              href="/orders/new"
              className="rounded-md bg-orange-600 px-3 py-2 text-sm font-medium text-white hover:bg-orange-700"
            >
              + Nueva orden
            </Link>
          ) : null
        }
      />

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
          <thead className="bg-zinc-50 text-left text-xs font-medium uppercase tracking-wide text-zinc-500 dark:bg-zinc-800/50">
            <tr>
              <th className="px-4 py-3">N°</th>
              <th className="px-4 py-3">Título</th>
              <th className="px-4 py-3">Máquina</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Prioridad</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {orders.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-10 text-center text-sm text-zinc-500"
                >
                  No hay órdenes para mostrar.
                </td>
              </tr>
            ) : (
              orders.map((o) => (
                <tr key={o.id} className="text-sm">
                  <td className="px-4 py-3 font-mono">#{o.number}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{o.title}</p>
                    <p className="text-xs text-zinc-500">
                      por {o.creator.name}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs">{o.machine.code}</span>
                    <p className="text-xs text-zinc-500">{o.machine.name}</p>
                  </td>
                  <td className="px-4 py-3">
                    <TypeBadge value={o.type} />
                  </td>
                  <td className="px-4 py-3">
                    <PriorityBadge value={o.priority} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge value={o.status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/orders/${o.id}`}
                      className="font-medium text-orange-600 hover:underline"
                    >
                      Ver
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
