import { prisma } from "@/lib/prisma";
import { requireJefe } from "@/lib/session";
import { PageHeader } from "@/components/PageHeader";
import { PlanForm } from "../PlanForm";

export default async function NewPlanPage() {
  await requireJefe();
  const machines = await prisma.machine.findMany({
    orderBy: { code: "asc" },
    select: { id: true, code: true, name: true },
  });
  return (
    <>
      <PageHeader title="Nuevo plan de mantenimiento" />
      <PlanForm machines={machines} />
    </>
  );
}
