"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

type Option = { value: string; label: string };
type Machine = { id: string; code: string; name: string };

const TYPES: Option[] = [
  { value: "PREDICTIVO", label: "Predictivo" },
  { value: "PREVENTIVO", label: "Preventivo" },
  { value: "CORRECTIVO", label: "Correctivo" },
  { value: "MEJORA", label: "Mejora" },
  { value: "INSPECCION", label: "Inspección" },
];
const STATUSES: Option[] = [
  { value: "PENDIENTE", label: "Pendiente" },
  { value: "EN_PROGRESO", label: "En progreso" },
  { value: "COMPLETADA", label: "Completada" },
  { value: "CANCELADA", label: "Cancelada" },
];
const PRIORITIES: Option[] = [
  { value: "BAJA", label: "Baja" },
  { value: "MEDIA", label: "Media" },
  { value: "ALTA", label: "Alta" },
  { value: "CRITICA", label: "Crítica" },
];

export function OrdersFilters({ machines }: { machines: Machine[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const [, startTransition] = useTransition();

  const [q, setQ] = useState(params.get("q") ?? "");
  const [type, setType] = useState(params.get("type") ?? "");
  const [status, setStatus] = useState(params.get("status") ?? "");
  const [priority, setPriority] = useState(params.get("priority") ?? "");
  const [machineId, setMachineId] = useState(params.get("machineId") ?? "");
  const [from, setFrom] = useState(params.get("from") ?? "");
  const [to, setTo] = useState(params.get("to") ?? "");

  function apply() {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (type) sp.set("type", type);
    if (status) sp.set("status", status);
    if (priority) sp.set("priority", priority);
    if (machineId) sp.set("machineId", machineId);
    if (from) sp.set("from", from);
    if (to) sp.set("to", to);
    startTransition(() => {
      router.push(`/orders?${sp.toString()}`);
    });
  }

  function clear() {
    setQ("");
    setType("");
    setStatus("");
    setPriority("");
    setMachineId("");
    setFrom("");
    setTo("");
    startTransition(() => router.push("/orders"));
  }

  const exportCsvUrl = `/api/reports/orders.csv?${params.toString()}`;

  return (
    <div className="mb-4 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <form
        className="grid grid-cols-1 gap-3 md:grid-cols-3 lg:grid-cols-4"
        onSubmit={(e) => {
          e.preventDefault();
          apply();
        }}
      >
        <label className="md:col-span-2">
          <span className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
            Buscar (título, descripción)
          </span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Escribí para buscar..."
            className={inputClass}
          />
        </label>
        <Select label="Tipo" value={type} onChange={setType} options={TYPES} />
        <Select
          label="Estado"
          value={status}
          onChange={setStatus}
          options={STATUSES}
        />
        <Select
          label="Prioridad"
          value={priority}
          onChange={setPriority}
          options={PRIORITIES}
        />
        <label>
          <span className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
            Máquina
          </span>
          <select
            value={machineId}
            onChange={(e) => setMachineId(e.target.value)}
            className={inputClass}
          >
            <option value="">Todas</option>
            {machines.map((m) => (
              <option key={m.id} value={m.id}>
                {m.code} — {m.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
            Desde
          </span>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className={inputClass}
          />
        </label>
        <label>
          <span className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
            Hasta
          </span>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className={inputClass}
          />
        </label>
        <div className="flex items-end gap-2 md:col-span-3 lg:col-span-4">
          <button
            type="submit"
            className="rounded-md bg-orange-600 px-3 py-2 text-sm font-medium text-white hover:bg-orange-700"
          >
            Aplicar
          </button>
          <button
            type="button"
            onClick={clear}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            Limpiar
          </button>
          <a
            href={exportCsvUrl}
            className="ml-auto rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            Exportar CSV
          </a>
        </div>
      </form>
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Option[];
}) {
  return (
    <label>
      <span className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass}
      >
        <option value="">Todos</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

const inputClass =
  "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500 dark:border-zinc-700 dark:bg-zinc-950";
