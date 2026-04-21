import { prisma } from "@/lib/prisma";
import { requireJefe } from "@/lib/session";
import { PageHeader } from "@/components/PageHeader";
import { OrderForm } from "../OrderForm";

export default async function NewOrderPage() {
  await requireJefe();
  const [machines, employees] = await Promise.all([
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

  return (
    <>
      <PageHeader title="Nueva orden de trabajo" />
      <OrderForm machines={machines} employees={employees} />
    </>
  );
}
