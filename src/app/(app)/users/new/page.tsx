import { requireJefe } from "@/lib/session";
import { PageHeader } from "@/components/PageHeader";
import { UserForm } from "../UserForm";

export default async function NewUserPage() {
  await requireJefe();
  return (
    <>
      <PageHeader title="Nuevo usuario" />
      <UserForm />
    </>
  );
}
