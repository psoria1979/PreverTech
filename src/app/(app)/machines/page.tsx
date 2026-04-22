import Link from "next/link";
import type { Prisma, MachineStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { PageHeader } from "@/components/PageHeader";
import { MachinesFilters } from "./MachinesFilters";

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
  FUERA_DE_SERVICIO: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200",
};

const STATUSES: MachineStatus[] = [
  "OPERATIVA",
  "EN_MANTENIMIENTO",
  "FUERA_DE_SERVICIO",
];

export default async function MachinesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser();
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const statusRaw = typeof sp.status === "string" ? sp.status : "";
  const status = STATUSES.includes(statusRaw as MachineStatus)
    ? (statusRaw as MachineStatus)
    : "";

  const where: Prisma.MachineWhereInput = {};
  if (q) {
    where.OR = [
      { code: { contains: q, mode: "insensitive" } },
      { name: { contains: q, mode: "insensitive" } },
      { location: { contains: q, mode: "insensitive" } },
    ];
  }
  if (status) where.status = status;

  const machines = await prisma.machine.findMany({
    where,
    orderBy: { code: "asc" },
  });
  const isJefe = user.role === "JEFE";

  return (
    <>
      <PageHeader
        title="Máquinas"
        description="Inventario de equipos industriales."
        actions={
          isJefe ? (
            <Link
              href="/machines/new"
              className="rounded-md bg-orange-600 px-3 py-2 text-sm font-medium text-white hover:bg-orange-700"
            >
              + Nueva máquina
            </Link>
          ) : null
        }
      />

      <MachinesFilters initialQ={q} initialStatus={status} />

      <p className="mb-2 text-xs text-zinc-500">
        {machines.length} máquina{machines.length === 1 ? "" : "s"}
      </p>

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
          <thead className="bg-zinc-50 dark:bg-zinc-800/50">
            <tr className="text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
              <th className="px-4 py-3">Código</th>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Ubicación</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {machines.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-sm text-zinc-500"
                >
                  {q || status
                    ? "No hay máquinas que coincidan con los filtros."
                    : "Sin máquinas cargadas."}
                </td>
              </tr>
            ) : (
              machines.map((m) => (
                <tr key={m.id} className="text-sm">
                  <td className="px-4 py-3 font-mono">{m.code}</td>
                  <td className="px-4 py-3">{m.name}</td>
                  <td className="px-4 py-3 text-zinc-500">
                    {m.location || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_TONE[m.status]}`}
                    >
                      {STATUS_LABEL[m.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/machines/${m.id}`}
                      className="text-sm font-medium text-orange-600 hover:underline"
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
