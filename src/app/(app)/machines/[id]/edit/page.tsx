import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireJefe } from "@/lib/session";
import { PageHeader } from "@/components/PageHeader";
import { MachineForm } from "../../MachineForm";

export default async function EditMachinePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireJefe();
  const { id } = await params;
  const machine = await prisma.machine.findUnique({ where: { id } });
  if (!machine) notFound();

  return (
    <>
      <PageHeader title={`Editar: ${machine.name}`} />
      <MachineForm machine={machine} />
    </>
  );
}
