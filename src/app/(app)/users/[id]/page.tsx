import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireJefe } from "@/lib/session";
import { PageHeader } from "@/components/PageHeader";
import { UserForm } from "../UserForm";

export default async function EditUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireJefe();
  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      username: true,
      name: true,
      role: true,
      active: true,
    },
  });
  if (!user) notFound();

  return (
    <>
      <PageHeader title={`Editar: ${user.name}`} />
      <UserForm user={user} />
    </>
  );
}
