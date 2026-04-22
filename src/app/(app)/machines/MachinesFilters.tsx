"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function MachinesFilters({
  initialQ,
  initialStatus,
}: {
  initialQ: string;
  initialStatus: string;
}) {
  const router = useRouter();
  const [q, setQ] = useState(initialQ);
  const [status, setStatus] = useState(initialStatus);
  const [, start] = useTransition();

  function apply(e: React.FormEvent) {
    e.preventDefault();
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (status) sp.set("status", status);
    start(() => router.push(`/machines?${sp.toString()}`));
  }

  function clear() {
    setQ("");
    setStatus("");
    start(() => router.push("/machines"));
  }

  return (
    <form
      onSubmit={apply}
      className="mb-4 flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 sm:flex-row sm:items-end dark:border-zinc-800 dark:bg-zinc-900"
    >
      <label className="flex-1">
        <span className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
          Buscar (código, nombre, ubicación)
        </span>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Escribí para buscar..."
          className={inputClass}
        />
      </label>
      <label className="sm:w-56">
        <span className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
          Estado
        </span>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className={inputClass}
        >
          <option value="">Todos</option>
          <option value="OPERATIVA">Operativa</option>
          <option value="EN_MANTENIMIENTO">En mantenimiento</option>
          <option value="FUERA_DE_SERVICIO">Fuera de servicio</option>
        </select>
      </label>
      <div className="flex gap-2">
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
      </div>
    </form>
  );
}

const inputClass =
  "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500 dark:border-zinc-700 dark:bg-zinc-950";
