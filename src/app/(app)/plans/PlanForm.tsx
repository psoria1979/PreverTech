"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Machine = { id: string; code: string; name: string };

type Plan = {
  id: string;
  name: string;
  description: string | null;
  machineId: string;
  type: string;
  priority: string;
  visibility: string;
  frequencyDays: number;
  nextDueAt: Date | string;
  active: boolean;
};

export function PlanForm({
  machines,
  plan,
}: {
  machines: Machine[];
  plan?: Plan;
}) {
  const router = useRouter();
  const isEdit = !!plan;

  const [name, setName] = useState(plan?.name ?? "");
  const [description, setDescription] = useState(plan?.description ?? "");
  const [machineId, setMachineId] = useState(
    plan?.machineId ?? machines[0]?.id ?? ""
  );
  const [type, setType] = useState(plan?.type ?? "PREVENTIVO");
  const [priority, setPriority] = useState(plan?.priority ?? "MEDIA");
  const [visibility, setVisibility] = useState(plan?.visibility ?? "SOLO_JEFES");
  const [frequencyDays, setFrequencyDays] = useState(
    String(plan?.frequencyDays ?? 30)
  );
  const [nextDueAt, setNextDueAt] = useState(
    plan?.nextDueAt
      ? new Date(plan.nextDueAt).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10)
  );
  const [active, setActive] = useState(plan?.active ?? true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const body = {
      name,
      description: description || null,
      machineId,
      type,
      priority,
      visibility,
      frequencyDays: Number(frequencyDays),
      nextDueAt,
      active,
    };
    const url = plan ? `/api/plans/${plan.id}` : "/api/plans";
    const method = plan ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Error al guardar");
      setLoading(false);
      return;
    }
    router.push("/plans");
    router.refresh();
  }

  async function onDelete() {
    if (!plan) return;
    if (!confirm("¿Eliminar este plan de mantenimiento?")) return;
    setLoading(true);
    const res = await fetch(`/api/plans/${plan.id}`, { method: "DELETE" });
    if (!res.ok) {
      setError("No se pudo eliminar");
      setLoading(false);
      return;
    }
    router.push("/plans");
    router.refresh();
  }

  if (machines.length === 0) {
    return (
      <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
        Necesitás cargar al menos una máquina antes de crear un plan.
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="max-w-3xl space-y-4 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <Field label="Nombre del plan">
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputClass}
        />
      </Field>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Máquina">
          <select
            required
            value={machineId}
            onChange={(e) => setMachineId(e.target.value)}
            className={inputClass}
          >
            {machines.map((m) => (
              <option key={m.id} value={m.id}>
                {m.code} — {m.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Tipo de trabajo">
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className={inputClass}
          >
            <option value="PREDICTIVO">Predictivo</option>
            <option value="PREVENTIVO">Preventivo</option>
            <option value="CORRECTIVO">Correctivo</option>
            <option value="MEJORA">Mejora</option>
            <option value="INSPECCION">Inspección</option>
          </select>
        </Field>
        <Field label="Prioridad">
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className={inputClass}
          >
            <option value="BAJA">Baja</option>
            <option value="MEDIA">Media</option>
            <option value="ALTA">Alta</option>
            <option value="CRITICA">Crítica</option>
          </select>
        </Field>
        <Field label="Visibilidad de las órdenes generadas">
          <select
            value={visibility}
            onChange={(e) => setVisibility(e.target.value)}
            className={inputClass}
          >
            <option value="SOLO_JEFES">Solo jefes</option>
            <option value="ASIGNADOS">Jefes y asignados</option>
            <option value="TODOS">Jefes y todos los empleados</option>
          </select>
        </Field>
        <Field label="Frecuencia (días)">
          <input
            type="number"
            min="1"
            max="3650"
            required
            value={frequencyDays}
            onChange={(e) => setFrequencyDays(e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Próxima generación">
          <input
            type="date"
            required
            value={nextDueAt}
            onChange={(e) => setNextDueAt(e.target.value)}
            className={inputClass}
          />
        </Field>
      </div>

      <Field label="Descripción de la tarea">
        <textarea
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={inputClass}
        />
      </Field>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={active}
          onChange={(e) => setActive(e.target.checked)}
        />
        Plan activo (si se desactiva, no genera órdenes)
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex items-center justify-between border-t border-zinc-200 pt-4 dark:border-zinc-800">
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-50"
        >
          {loading ? "Guardando..." : isEdit ? "Actualizar" : "Crear plan"}
        </button>
        {isEdit && (
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
