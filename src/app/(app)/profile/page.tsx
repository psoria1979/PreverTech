import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { PageHeader } from "@/components/PageHeader";
import { ChangePinForm } from "./ChangePinForm";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await requireUser();
  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: {
      id: true,
      username: true,
      name: true,
      role: true,
      createdAt: true,
    },
  });
  if (!user) return null;

  return (
    <>
      <PageHeader
        title="Mi perfil"
        description="Datos de tu cuenta y cambio de PIN."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-4 text-sm font-semibold">Cuenta</h2>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-xs uppercase text-zinc-500">Nombre</dt>
              <dd>{user.name}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-zinc-500">Usuario</dt>
              <dd className="font-mono">@{user.username}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-zinc-500">Rol</dt>
              <dd>{user.role === "JEFE" ? "Jefe" : "Empleado"}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-zinc-500">Alta</dt>
              <dd>{new Date(user.createdAt).toLocaleDateString("es-AR")}</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-4 text-sm font-semibold">Cambiar PIN</h2>
          <ChangePinForm />
        </section>
      </div>
    </>
  );
}
