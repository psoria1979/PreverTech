import { prisma } from "@/lib/prisma";

type OrderContext = {
  id: string;
  number: number;
  title: string;
};

async function notify(
  userIds: string[],
  workOrderId: string,
  title: string,
  message: string
) {
  if (userIds.length === 0) return;
  await prisma.notification.createMany({
    data: userIds.map((userId) => ({
      userId,
      workOrderId,
      title,
      message,
    })),
  });
}

export async function notifyOrderAssigned(
  userIds: string[],
  order: OrderContext
) {
  await notify(
    userIds,
    order.id,
    "Nueva orden asignada",
    `Te asignaron la orden #${order.number} — ${order.title}`
  );
}

export async function notifyOrderStatusChanged(
  userIds: string[],
  order: OrderContext,
  newStatus: string
) {
  const STATUS_LABEL: Record<string, string> = {
    PENDIENTE: "pendiente",
    EN_PROGRESO: "en progreso",
    COMPLETADA: "completada",
    CANCELADA: "cancelada",
  };
  await notify(
    userIds,
    order.id,
    "Estado de orden actualizado",
    `La orden #${order.number} — ${order.title} ahora está ${STATUS_LABEL[newStatus] ?? newStatus}`
  );
}
