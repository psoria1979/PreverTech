const TYPE_TONE: Record<string, string> = {
  PREDICTIVO: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-200",
  PREVENTIVO: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200",
  CORRECTIVO: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200",
  MEJORA: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200",
  INSPECCION: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
};

const PRIORITY_TONE: Record<string, string> = {
  BAJA: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  MEDIA: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200",
  ALTA: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
  CRITICA: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200",
};

const STATUS_TONE: Record<string, string> = {
  PENDIENTE: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
  EN_PROGRESO: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200",
  COMPLETADA: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200",
  CANCELADA: "bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200",
};

const STATUS_LABEL: Record<string, string> = {
  PENDIENTE: "Pendiente",
  EN_PROGRESO: "En progreso",
  COMPLETADA: "Completada",
  CANCELADA: "Cancelada",
};

function Badge({ tone, label }: { tone: string; label: string }) {
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${tone}`}
    >
      {label}
    </span>
  );
}

export function TypeBadge({ value }: { value: string }) {
  return <Badge tone={TYPE_TONE[value] ?? ""} label={value} />;
}

export function PriorityBadge({ value }: { value: string }) {
  return <Badge tone={PRIORITY_TONE[value] ?? ""} label={value} />;
}

export function StatusBadge({ value }: { value: string }) {
  return (
    <Badge tone={STATUS_TONE[value] ?? ""} label={STATUS_LABEL[value] ?? value} />
  );
}
