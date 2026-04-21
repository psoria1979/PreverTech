import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireJefe } from "@/lib/session";
import { PageHeader } from "@/components/PageHeader";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  await requireJefe();
  const users = await prisma.user.findMany({
    orderBy: [{ role: "asc" }, { name: "asc" }],
    select: {
      id: true,
      username: true,
      name: true,
      role: true,
      active: true,
    },
  });

  return (
    <>
      <PageHeader
        title="Usuarios"
        description="Jefes y empleados del sistema."
        actions={
          <Link
            href="/users/new"
            className="rounded-md bg-orange-600 px-3 py-2 text-sm font-medium text-white hover:bg-orange-700"
          >
            + Nuevo usuario
          </Link>
        }
      />

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
          <thead className="bg-zinc-50 text-left text-xs font-medium uppercase tracking-wide text-zinc-500 dark:bg-zinc-800/50">
            <tr>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Usuario</th>
              <th className="px-4 py-3">Rol</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {users.map((u) => (
              <tr key={u.id} className="text-sm">
                <td className="px-4 py-3 font-medium">{u.name}</td>
                <td className="px-4 py-3 font-mono text-zinc-600 dark:text-zinc-400">
                  @{u.username}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      u.role === "JEFE"
                        ? "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200"
                        : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                    }`}
                  >
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs">
                  {u.active ? (
                    <span className="text-green-600">Activo</span>
                  ) : (
                    <span className="text-zinc-500">Inactivo</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/users/${u.id}`}
                    className="font-medium text-orange-600 hover:underline"
                  >
                    Editar
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
