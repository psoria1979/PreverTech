import { requireJefe } from "@/lib/session";
import { PageHeader } from "@/components/PageHeader";
import { MachineForm } from "../MachineForm";

export default async function NewMachinePage() {
  await requireJefe();
  return (
    <>
      <PageHeader title="Nueva máquina" />
      <MachineForm />
    </>
  );
}
