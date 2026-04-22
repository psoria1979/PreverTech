import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { PageHeader } from "@/components/PageHeader";

export const dynamic = "force-dynamic";

export default async function PartsPage() {
  const user = await requireUser();
  const parts = await prisma.part.findMany({ orderBy: { code: "asc" } });
  const isJefe = user.role === "JEFE";

  return (
    <>
      <PageHeader
        title="Repuestos"
        description="Catálogo e inventario de repuestos."
        actions={
          isJefe ? (
            <Link
              href="/parts/new"
              className="rounded-md bg-orange-600 px-3 py-2 text-sm font-medium text-white hover:bg-orange-700"
            >
              + Nuevo repuesto
            </Link>
          ) : null
        }
      />

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
          <thead className="bg-zinc-50 text-left text-xs font-medium uppercase tracking-wide text-zinc-500 dark:bg-zinc-800/50">
            <tr>
              <th className="px-4 py-3">Código</th>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Unidad</th>
              <th className="px-4 py-3 text-right">Stock</th>
              <th className="px-4 py-3 text-right">Mín.</th>
              <th className="px-4 py-3 text-right">Costo U.</th>
              {isJefe && <th className="px-4 py-3" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {parts.length === 0 ? (
              <tr>
                <td
                  colSpan={isJefe ? 7 : 6}
                  className="px-4 py-8 text-center text-sm text-zinc-500"
                >
                  Sin repuestos cargados.
                </td>
              </tr>
            ) : (
              parts.map((p) => {
                const low = p.stock <= p.minStock;
                return (
                  <tr key={p.id} className="text-sm">
                    <td className="px-4 py-3 font-mono">{p.code}</td>
                    <td className="px-4 py-3">{p.name}</td>
                    <td className="px-4 py-3 text-zinc-500">{p.unit}</td>
                    <td className="px-4 py-3 text-right font-mono">
                      {low ? (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900/40 dark:text-red-200">
                          {p.stock}
                        </span>
                      ) : (
                        p.stock
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-zinc-500">
                      {p.minStock}
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      {p.unitCost.toFixed(2)}
                    </td>
                    {isJefe && (
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/parts/${p.id}`}
                          className="font-medium text-orange-600 hover:underline"
                        >
                          Editar
                        </Link>
                      </td>
                    )}
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
