import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { visibleOrdersWhere } from "@/lib/permissions";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge, PriorityBadge, TypeBadge } from "@/components/Badges";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  OPERATIVA: "Operativa",
  EN_MANTENIMIENTO: "En mantenimiento",
  FUERA_DE_SERVICIO: "Fuera de servicio",
};

const STATUS_TONE: Record<string, string> = {
  OPERATIVA:
    "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200",
  EN_MANTENIMIENTO:
    "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
  FUERA_DE_SERVICIO:
    "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200",
};

export default async function MachineDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const machine = await prisma.machine.findUnique({ where: { id } });
  if (!machine) notFound();

  const visibility = visibleOrdersWhere(user);
  const where = visibility
    ? { AND: [{ machineId: id }, visibility] }
    : { machineId: id };

  const [orders, counts] = await Promise.all([
    prisma.workOrder.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { creator: { select: { name: true } } },
    }),
    prisma.workOrder.groupBy({
      by: ["status"],
      where,
      _count: { _all: true },
    }),
  ]);

  const countMap = Object.fromEntries(
    counts.map((c) => [c.status, c._count._all])
  );
  const isJefe = user.role === "JEFE";

  return (
    <>
      <PageHeader
        title={`${machine.code} — ${machine.name}`}
        description={machine.location || undefined}
        actions={
          isJefe ? (
            <Link
              href={`/machines/${machine.id}/edit`}
              className="rounded-md bg-orange-600 px-3 py-2 text-sm font-medium text-white hover:bg-orange-700"
            >
              Editar
            </Link>
          ) : null
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="rounded-xl border border-zinc-200 bg-white p-5 lg:col-span-2 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-3">
            <span
              className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_TONE[machine.status]}`}
            >
              {STATUS_LABEL[machine.status]}
            </span>
          </div>
          {machine.description ? (
            <p className="whitespace-pre-wrap text-sm">{machine.description}</p>
          ) : (
            <p className="text-sm text-zinc-500">Sin descripción.</p>
          )}
        </section>

        <aside className="space-y-4 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <div>
            <h3 className="mb-2 text-sm font-semibold">Resumen de órdenes</h3>
            <ul className="space-y-1 text-sm">
              <li className="flex justify-between">
                <span>Total</span>
                <span className="font-mono">{orders.length}</span>
              </li>
              <li className="flex justify-between">
                <span>Pendientes</span>
                <span className="font-mono">
                  {countMap["PENDIENTE"] ?? 0}
                </span>
              </li>
              <li className="flex justify-between">
                <span>En progreso</span>
                <span className="font-mono">
                  {countMap["EN_PROGRESO"] ?? 0}
                </span>
              </li>
              <li className="flex justify-between">
                <span>Completadas</span>
                <span className="font-mono">
                  {countMap["COMPLETADA"] ?? 0}
                </span>
              </li>
            </ul>
          </div>

          <div className="border-t border-zinc-200 pt-4 text-center dark:border-zinc-800">
            <h3 className="mb-2 text-sm font-semibold">QR de la máquina</h3>
            {}
            <img
              src={`/api/machines/${machine.id}/qr`}
              alt={`QR de ${machine.code}`}
              className="mx-auto h-40 w-40 rounded border border-zinc-200 bg-white dark:border-zinc-800"
            />
            <a
              href={`/api/machines/${machine.id}/qr`}
              download={`qr-${machine.code}.png`}
              className="mt-2 inline-block text-xs font-medium text-orange-600 hover:underline"
            >
              Descargar PNG
            </a>
          </div>
        </aside>
      </div>

      <section className="mt-6 rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="border-b border-zinc-200 px-5 py-3 text-lg font-semibold dark:border-zinc-800">
          Historial de órdenes
        </h2>
        {orders.length === 0 ? (
          <p className="p-6 text-sm text-zinc-500">
            Esta máquina aún no tiene órdenes registradas.
          </p>
        ) : (
          <ol className="relative px-5 py-4">
            {orders.map((o, idx) => (
              <li
                key={o.id}
                className="relative border-l-2 border-zinc-200 pb-5 pl-5 last:pb-0 dark:border-zinc-800"
              >
                <span className="absolute -left-[7px] top-1 h-3 w-3 rounded-full border-2 border-white bg-orange-500 dark:border-zinc-900" />
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <Link
                    href={`/orders/${o.id}`}
                    className="text-sm font-medium text-orange-600 hover:underline"
                  >
                    #{o.number} — {o.title}
                  </Link>
                  <span className="text-xs text-zinc-500">
                    {new Date(o.createdAt).toLocaleDateString("es-AR")}
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap gap-1">
                  <TypeBadge value={o.type} />
                  <PriorityBadge value={o.priority} />
                  <StatusBadge value={o.status} />
                </div>
                <p className="mt-1 text-xs text-zinc-500">
                  por {o.creator.name}
                </p>
                {idx === 0 && null}
              </li>
            ))}
          </ol>
        )}
      </section>
    </>
  );
}
