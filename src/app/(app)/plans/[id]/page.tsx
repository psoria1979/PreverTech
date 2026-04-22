import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireJefe } from "@/lib/session";
import { PageHeader } from "@/components/PageHeader";
import { PlanForm } from "../PlanForm";

export default async function EditPlanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireJefe();
  const { id } = await params;
  const [plan, machines] = await Promise.all([
    prisma.maintenancePlan.findUnique({ where: { id } }),
    prisma.machine.findMany({
      orderBy: { code: "asc" },
      select: { id: true, code: true, name: true },
    }),
  ]);
  if (!plan) notFound();
  return (
    <>
      <PageHeader title={`Editar: ${plan.name}`} />
      <PlanForm machines={machines} plan={plan} />
    </>
  );
}
