import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireJefe } from "@/lib/session";
import { PageHeader } from "@/components/PageHeader";
import { OrderForm } from "../../OrderForm";

export default async function EditOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireJefe();
  const { id } = await params;
  const [order, machines, employees] = await Promise.all([
    prisma.workOrder.findUnique({
      where: { id },
      include: { assignments: { select: { userId: true } } },
    }),
    prisma.machine.findMany({
      orderBy: { code: "asc" },
      select: { id: true, code: true, name: true },
    }),
    prisma.user.findMany({
      where: { role: "EMPLEADO", active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, username: true },
    }),
  ]);
  if (!order) notFound();

  return (
    <>
      <PageHeader title={`Editar orden #${order.number}`} />
      <OrderForm machines={machines} employees={employees} order={order} />
    </>
  );
}
