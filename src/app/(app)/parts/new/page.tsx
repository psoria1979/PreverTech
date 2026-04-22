import { requireJefe } from "@/lib/session";
import { PageHeader } from "@/components/PageHeader";
import { PartForm } from "../PartForm";

export default async function NewPartPage() {
  await requireJefe();
  return (
    <>
      <PageHeader title="Nuevo repuesto" />
      <PartForm />
    </>
  );
}
