"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type TimeLog = {
  id: string;
  minutes: number;
  note: string | null;
  createdAt: string;
  user: { id: string; name: string; username: string };
};

function fmtMinutes(total: number) {
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
}

export function TimeSection({
  orderId,
  currentUserId,
  currentUserRole,
  canEdit,
  initial,
}: {
  orderId: string;
  currentUserId: string;
  currentUserRole: "JEFE" | "EMPLEADO";
  canEdit: boolean;
  initial: TimeLog[];
}) {
  const router = useRouter();
  const [logs, setLogs] = useState<TimeLog[]>(initial);
  const [hours, setHours] = useState("");
  const [minutes, setMinutes] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total = logs.reduce((s, l) => s + l.minutes, 0);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const mins = (Number(hours) || 0) * 60 + (Number(minutes) || 0);
    if (mins <= 0) {
      setError("Indicá horas o minutos");
      return;
    }
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/orders/${orderId}/time`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ minutes: mins, note: note || null }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "No se pudo registrar");
      return;
    }
    const created: TimeLog = await res.json();
    setLogs((prev) => [...prev, created]);
    setHours("");
    setMinutes("");
    setNote("");
    router.refresh();
  }

  async function remove(id: string) {
    if (!confirm("¿Eliminar este registro de tiempo?")) return;
    const res = await fetch(`/api/orders/${orderId}/time/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "No se pudo eliminar");
      return;
    }
    setLogs((prev) => prev.filter((l) => l.id !== id));
    router.refresh();
  }

  return (
    <section className="mt-4 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-medium text-zinc-500">
          Tiempo trabajado
        </h2>
        <span className="text-xs text-zinc-500">
          Total: <strong className="font-mono">{fmtMinutes(total)}</strong>
        </span>
      </div>

      {logs.length === 0 ? (
        <p className="mb-3 text-sm text-zinc-500">Sin registros de tiempo.</p>
      ) : (
        <ul className="mb-4 divide-y divide-zinc-200 text-sm dark:divide-zinc-800">
          {logs.map((l) => {
            const canDelete =
              currentUserRole === "JEFE" || l.user.id === currentUserId;
            return (
              <li
                key={l.id}
                className="flex items-start justify-between py-2"
              >
                <div>
                  <p>
                    <span className="font-mono">{fmtMinutes(l.minutes)}</span>{" "}
                    · {l.user.name}
                  </p>
                  {l.note && (
                    <p className="text-xs text-zinc-500">{l.note}</p>
                  )}
                  <p className="text-xs text-zinc-400">
                    {new Date(l.createdAt).toLocaleString("es-AR")}
                  </p>
                </div>
                {canDelete && (
                  <button
                    type="button"
                    onClick={() => remove(l.id)}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Eliminar
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {canEdit && (
        <form
          onSubmit={add}
          className="grid grid-cols-2 gap-2 border-t border-zinc-200 pt-3 sm:grid-cols-5 dark:border-zinc-800"
        >
          <label className="sm:col-span-1">
            <span className="mb-1 block text-xs font-medium text-zinc-600">
              Horas
            </span>
            <input
              type="number"
              min="0"
              max="24"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="sm:col-span-1">
            <span className="mb-1 block text-xs font-medium text-zinc-600">
              Minutos
            </span>
            <input
              type="number"
              min="0"
              max="59"
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="col-span-2 sm:col-span-2">
            <span className="mb-1 block text-xs font-medium text-zinc-600">
              Nota (opcional)
            </span>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className={inputClass}
            />
          </label>
          <button
            type="submit"
            disabled={loading}
            className="col-span-2 self-end rounded-md bg-orange-600 px-3 py-2 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-50 sm:col-span-1"
          >
            {loading ? "..." : "+ Cargar"}
          </button>
          {error && (
            <p className="col-span-2 text-xs text-red-600 sm:col-span-5">
              {error}
            </p>
          )}
        </form>
      )}
    </section>
  );
}

const inputClass =
  "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500 dark:border-zinc-700 dark:bg-zinc-950";
