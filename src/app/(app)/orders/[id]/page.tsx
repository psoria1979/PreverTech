import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { canViewOrder } from "@/lib/permissions";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge, PriorityBadge, TypeBadge } from "@/components/Badges";
import { PhotosSection } from "./PhotosSection";
import { CommentsSection } from "./CommentsSection";

export const dynamic = "force-dynamic";

const VISIBILITY_LABEL: Record<string, string> = {
  SOLO_JEFES: "Solo jefes",
  ASIGNADOS: "Jefes + empleados asignados",
  TODOS: "Jefes + todos los empleados",
};

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const order = await prisma.workOrder.findUnique({
    where: { id },
    include: {
      machine: true,
      creator: { select: { id: true, name: true, username: true } },
      assignments: {
        include: { user: { select: { id: true, name: true, username: true } } },
      },
      photos: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          filename: true,
          mimeType: true,
          size: true,
          createdAt: true,
        },
      },
      comments: {
        orderBy: { createdAt: "asc" },
        include: { user: { select: { id: true, name: true, username: true } } },
      },
    },
  });
  if (!order) notFound();
  if (!canViewOrder(user, order)) {
    return (
      <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">
        No tenés permiso para ver esta orden.
      </div>
    );
  }

  const isJefe = user.role === "JEFE";
  const isAssignee = order.assignments.some((a) => a.userId === user.id);
  const canUpload = isJefe || isAssignee;

  return (
    <>
      <PageHeader
        title={`Orden #${order.number}`}
        description={order.title}
        actions={
          <div className="flex gap-2">
            <a
              href={`/orders/${order.id}/pdf`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              Imprimir PDF
            </a>
            {isJefe && (
              <Link
                href={`/orders/${order.id}/edit`}
                className="rounded-md bg-orange-600 px-3 py-2 text-sm font-medium text-white hover:bg-orange-700"
              >
                Editar
              </Link>
            )}
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="rounded-xl border border-zinc-200 bg-white p-5 lg:col-span-2 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-4 flex flex-wrap gap-2">
            <TypeBadge value={order.type} />
            <PriorityBadge value={order.priority} />
            <StatusBadge value={order.status} />
          </div>
          <h2 className="mb-1 text-sm font-medium text-zinc-500">Descripción</h2>
          <p className="whitespace-pre-wrap text-sm">{order.description}</p>

          {order.notes && (
            <>
              <h2 className="mt-4 mb-1 text-sm font-medium text-zinc-500">
                Notas
              </h2>
              <p className="whitespace-pre-wrap text-sm">{order.notes}</p>
            </>
          )}
        </section>

        <aside className="space-y-3 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <Row label="Máquina">
            <p className="font-mono text-sm">{order.machine.code}</p>
            <p className="text-xs text-zinc-500">{order.machine.name}</p>
          </Row>
          <Row label="Creada por">
            <p className="text-sm">{order.creator.name}</p>
            <p className="text-xs text-zinc-500">
              {new Date(order.createdAt).toLocaleString("es-AR")}
            </p>
          </Row>
          {order.scheduledFor && (
            <Row label="Programada para">
              <p className="text-sm">
                {new Date(order.scheduledFor).toLocaleDateString("es-AR")}
              </p>
            </Row>
          )}
          {order.completedAt && (
            <Row label="Completada">
              <p className="text-sm">
                {new Date(order.completedAt).toLocaleString("es-AR")}
              </p>
            </Row>
          )}
          <Row label="Visibilidad">
            <p className="text-sm">{VISIBILITY_LABEL[order.visibility]}</p>
          </Row>
          {order.assignments.length > 0 && (
            <Row label="Asignados">
              <ul className="text-sm">
                {order.assignments.map((a) => (
                  <li key={a.userId}>
                    {a.user.name}{" "}
                    <span className="text-xs text-zinc-500">
                      @{a.user.username}
                    </span>
                  </li>
                ))}
              </ul>
            </Row>
          )}
        </aside>
      </div>

      <PhotosSection
        orderId={order.id}
        initial={order.photos.map((p) => ({
          ...p,
          createdAt: p.createdAt.toISOString(),
        }))}
        canUpload={canUpload}
      />

      <CommentsSection
        orderId={order.id}
        currentUserId={user.id}
        currentUserRole={user.role}
        initial={order.comments.map((c) => ({
          id: c.id,
          body: c.body,
          createdAt: c.createdAt.toISOString(),
          user: c.user,
        }))}
      />
    </>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </p>
      <div className="mt-0.5">{children}</div>
    </div>
  );
}
