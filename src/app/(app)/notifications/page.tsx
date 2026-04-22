import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { PageHeader } from "@/components/PageHeader";
import { MarkAllReadButton } from "./MarkAllReadButton";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const user = await requireUser();
  const items = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  const unread = items.filter((n) => !n.readAt).length;

  return (
    <>
      <PageHeader
        title="Notificaciones"
        description={unread > 0 ? `Tenés ${unread} sin leer.` : "Estás al día."}
        actions={unread > 0 ? <MarkAllReadButton /> : null}
      />

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        {items.length === 0 ? (
          <p className="p-6 text-sm text-zinc-500">Aún no hay notificaciones.</p>
        ) : (
          <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {items.map((n) => (
              <li
                key={n.id}
                className={`flex items-start justify-between gap-4 px-4 py-3 text-sm ${
                  !n.readAt ? "bg-orange-50/50 dark:bg-orange-950/10" : ""
                }`}
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{n.title}</p>
                  <p className="text-zinc-600 dark:text-zinc-300">
                    {n.message}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {new Date(n.createdAt).toLocaleString("es-AR")}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  {!n.readAt && (
                    <span className="inline-block h-2 w-2 rounded-full bg-orange-500" />
                  )}
                  {n.workOrderId && (
                    <Link
                      href={`/orders/${n.workOrderId}`}
                      className="text-xs font-medium text-orange-600 hover:underline"
                    >
                      Ver orden
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
