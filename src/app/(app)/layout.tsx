import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { SignOutButton } from "@/components/SignOutButton";
import { NavLink } from "@/components/NavLink";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const isJefe = user.role === "JEFE";
  const unread = await prisma.notification.count({
    where: { userId: user.id, readAt: null },
  });

  return (
    <div className="flex min-h-screen flex-1">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 md:flex">
        <div className="mb-6 px-2">
          <Link href="/dashboard" className="text-lg font-semibold">
            PreverTech
          </Link>
          <p className="text-xs text-zinc-500">Mantenimiento industrial</p>
        </div>
        <nav className="flex-1 space-y-1">
          <NavLink href="/dashboard" label="Dashboard" />
          <NavLink href="/orders" label="Órdenes de trabajo" />
          <NavLink href="/machines" label="Máquinas" />
          <NavLink
            href="/notifications"
            label="Notificaciones"
            badge={unread > 0 ? unread : undefined}
          />
          {isJefe && <NavLink href="/users" label="Usuarios" />}
        </nav>
        <div className="mt-6 border-t border-zinc-200 pt-4 dark:border-zinc-800">
          <Link
            href="/profile"
            className="block rounded-md px-2 py-1 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <p className="text-sm font-medium">{user.name}</p>
            <p className="text-xs text-zinc-500">
              @{user.username} · {isJefe ? "Jefe" : "Empleado"}
            </p>
          </Link>
          <SignOutButton />
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900 md:hidden">
          <Link href="/dashboard" className="font-semibold">
            PreverTech
          </Link>
          <SignOutButton compact />
        </header>
        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
