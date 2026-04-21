"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Machine = { id: string; code: string; name: string };
type Employee = { id: string; name: string; username: string };

type OrderInitial = {
  id: string;
  title: string;
  description: string;
  type: string;
  priority: string;
  status: string;
  visibility: string;
  machineId: string;
  scheduledFor: Date | string | null;
  notes: string | null;
  assignments: { userId: string }[];
};

export function OrderForm({
  machines,
  employees,
  order,
}: {
  machines: Machine[];
  employees: Employee[];
  order?: OrderInitial;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(order?.title ?? "");
  const [description, setDescription] = useState(order?.description ?? "");
  const [type, setType] = useState(order?.type ?? "CORRECTIVO");
  const [priority, setPriority] = useState(order?.priority ?? "MEDIA");
  const [status, setStatus] = useState(order?.status ?? "PENDIENTE");
  const [visibility, setVisibility] = useState(
    order?.visibility ?? "SOLO_JEFES"
  );
  const [machineId, setMachineId] = useState(
    order?.machineId ?? machines[0]?.id ?? ""
  );
  const [scheduledFor, setScheduledFor] = useState(
    order?.scheduledFor
      ? new Date(order.scheduledFor).toISOString().slice(0, 10)
      : ""
  );
  const [notes, setNotes] = useState(order?.notes ?? "");
  const [assigneeIds, setAssigneeIds] = useState<string[]>(
    order?.assignments.map((a) => a.userId) ?? []
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleAssignee(id: string) {
    setAssigneeIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const url = order ? `/api/orders/${order.id}` : "/api/orders";
    const method = order ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description,
        type,
        priority,
        status,
        visibility,
        machineId,
        scheduledFor: scheduledFor || null,
        notes: notes || null,
        assigneeIds: visibility === "ASIGNADOS" ? assigneeIds : [],
      }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Error al guardar");
      setLoading(false);
      return;
    }
    const saved = await res.json();
    router.push(`/orders/${saved.id}`);
    router.refresh();
  }

  async function onDelete() {
    if (!order) return;
    if (!confirm("¿Eliminar esta orden?")) return;
    setLoading(true);
    const res = await fetch(`/api/orders/${order.id}`, { method: "DELETE" });
    if (!res.ok) {
      setError("No se pudo eliminar");
      setLoading(false);
      return;
    }
    router.push("/orders");
    router.refresh();
  }

  if (machines.length === 0) {
    return (
      <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
        Necesitás cargar al menos una máquina antes de crear órdenes.
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="max-w-3xl space-y-4 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <Field label="Título">
        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
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
        <Field label="Estado">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className={inputClass}
          >
            <option value="PENDIENTE">Pendiente</option>
            <option value="EN_PROGRESO">En progreso</option>
            <option value="COMPLETADA">Completada</option>
            <option value="CANCELADA">Cancelada</option>
          </select>
        </Field>
        <Field label="Programada para">
          <input
            type="date"
            value={scheduledFor}
            onChange={(e) => setScheduledFor(e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Visibilidad">
          <select
            value={visibility}
            onChange={(e) => setVisibility(e.target.value)}
            className={inputClass}
          >
            <option value="SOLO_JEFES">Solo jefes</option>
            <option value="ASIGNADOS">Jefes y empleados asignados</option>
            <option value="TODOS">Jefes y todos los empleados</option>
          </select>
        </Field>
      </div>

      <Field label="Descripción del trabajo">
        <textarea
          required
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={inputClass}
        />
      </Field>

      <Field label="Notas internas (opcional)">
        <textarea
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className={inputClass}
        />
      </Field>

      {visibility === "ASIGNADOS" && (
        <div>
          <p className="mb-2 text-sm font-medium">Empleados asignados</p>
          {employees.length === 0 ? (
            <p className="text-sm text-zinc-500">No hay empleados cargados.</p>
          ) : (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {employees.map((e) => (
                <label
                  key={e.id}
                  className="flex items-center gap-2 rounded-md border border-zinc-200 p-2 text-sm dark:border-zinc-700"
                >
                  <input
                    type="checkbox"
                    checked={assigneeIds.includes(e.id)}
                    onChange={() => toggleAssignee(e.id)}
                  />
                  <span>
                    {e.name}{" "}
                    <span className="text-xs text-zinc-500">@{e.username}</span>
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex items-center justify-between border-t border-zinc-200 pt-4 dark:border-zinc-800">
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-50"
        >
          {loading ? "Guardando..." : order ? "Actualizar" : "Crear orden"}
        </button>
        {order && (
          <button
            type="button"
            onClick={onDelete}
            disabled={loading}
            className="rounded-md border border-red-300 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
          >
            Eliminar orden
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
