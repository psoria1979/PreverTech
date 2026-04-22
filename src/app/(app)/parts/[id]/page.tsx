import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireJefe } from "@/lib/session";
import { PageHeader } from "@/components/PageHeader";
import { PartForm } from "../PartForm";

export default async function EditPartPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireJefe();
  const { id } = await params;
  const part = await prisma.part.findUnique({ where: { id } });
  if (!part) notFound();

  return (
    <>
      <PageHeader title={`Editar: ${part.name}`} />
      <PartForm part={part} />
    </>
  );
}
