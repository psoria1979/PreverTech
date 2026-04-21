"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Machine = {
  id: string;
  code: string;
  name: string;
  location: string | null;
  description: string | null;
  status: "OPERATIVA" | "EN_MANTENIMIENTO" | "FUERA_DE_SERVICIO";
};

export function MachineForm({ machine }: { machine?: Machine }) {
  const router = useRouter();
  const [code, setCode] = useState(machine?.code ?? "");
  const [name, setName] = useState(machine?.name ?? "");
  const [location, setLocation] = useState(machine?.location ?? "");
  const [description, setDescription] = useState(machine?.description ?? "");
  const [status, setStatus] = useState(machine?.status ?? "OPERATIVA");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const url = machine ? `/api/machines/${machine.id}` : "/api/machines";
    const method = machine ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, name, location, description, status }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Error al guardar");
      setLoading(false);
      return;
    }
    router.push("/machines");
    router.refresh();
  }

  async function onDelete() {
    if (!machine) return;
    if (!confirm("¿Eliminar esta máquina? Esta acción no se puede deshacer."))
      return;
    setLoading(true);
    const res = await fetch(`/api/machines/${machine.id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "No se pudo eliminar");
      setLoading(false);
      return;
    }
    router.push("/machines");
    router.refresh();
  }

  return (
    <form
      onSubmit={onSubmit}
      className="max-w-2xl space-y-4 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Código">
          <input
            required
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Nombre">
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Ubicación">
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Estado">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as Machine["status"])}
            className={inputClass}
          >
            <option value="OPERATIVA">Operativa</option>
            <option value="EN_MANTENIMIENTO">En mantenimiento</option>
            <option value="FUERA_DE_SERVICIO">Fuera de servicio</option>
          </select>
        </Field>
      </div>
      <Field label="Descripción">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className={inputClass}
        />
      </Field>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex items-center justify-between">
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-50"
        >
          {loading ? "Guardando..." : "Guardar"}
        </button>
        {machine && (
          <button
            type="button"
            onClick={onDelete}
            disabled={loading}
            className="rounded-md border border-red-300 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
          >
            Eliminar
          </button>
        )}
      </div>
    </form>
  );
}

const inputClass =
  "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500 dark:border-zinc-700 dark:bg-zinc-950";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}
