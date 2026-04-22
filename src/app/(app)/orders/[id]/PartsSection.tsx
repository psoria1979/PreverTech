"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type PartOption = {
  id: string;
  code: string;
  name: string;
  unit: string;
  stock: number;
  unitCost: number;
};

type Usage = {
  id: string;
  quantity: number;
  unitCost: number;
  note: string | null;
  createdAt: string;
  part: { id: string; code: string; name: string; unit: string };
  user: { id: string; name: string; username: string };
};

export function PartsSection({
  orderId,
  currentUserId,
  currentUserRole,
  canEdit,
  parts,
  initial,
}: {
  orderId: string;
  currentUserId: string;
  currentUserRole: "JEFE" | "EMPLEADO";
  canEdit: boolean;
  parts: PartOption[];
  initial: Usage[];
}) {
  const router = useRouter();
  const [items, setItems] = useState<Usage[]>(initial);
  const [partId, setPartId] = useState(parts[0]?.id ?? "");
  const [quantity, setQuantity] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total = items.reduce((s, u) => s + u.quantity * u.unitCost, 0);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const qty = Number(quantity);
    if (!partId || !qty || qty <= 0) return;
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/orders/${orderId}/parts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ partId, quantity: qty, note: note || null }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "No se pudo registrar");
      return;
    }
    const created: Usage = await res.json();
    setItems((prev) => [...prev, created]);
    setQuantity("");
    setNote("");
    router.refresh();
  }

  async function remove(usageId: string) {
    if (!confirm("¿Eliminar este consumo? El stock será devuelto.")) return;
    const res = await fetch(`/api/orders/${orderId}/parts/${usageId}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "No se pudo eliminar");
      return;
    }
    setItems((prev) => prev.filter((u) => u.id !== usageId));
    router.refresh();
  }

  return (
    <section className="mt-4 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-medium text-zinc-500">Repuestos consumidos</h2>
        <span className="text-xs text-zinc-500">
          Total: <strong className="font-mono">${total.toFixed(2)}</strong>
        </span>
      </div>

      {items.length === 0 ? (
        <p className="mb-3 text-sm text-zinc-500">Sin consumos registrados.</p>
      ) : (
        <div className="mb-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left text-xs uppercase text-zinc-500">
              <tr>
                <th className="py-2 pr-2">Repuesto</th>
                <th className="py-2 pr-2 text-right">Cantidad</th>
                <th className="py-2 pr-2 text-right">Costo U.</th>
                <th className="py-2 pr-2 text-right">Subtotal</th>
                <th className="py-2 pr-2">Por</th>
                <th className="py-2 pr-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {items.map((u) => {
                const canDelete =
                  currentUserRole === "JEFE" || u.user.id === currentUserId;
                return (
                  <tr key={u.id}>
                    <td className="py-2 pr-2">
                      <span className="font-mono text-xs">{u.part.code}</span>
                      <span className="ml-2">{u.part.name}</span>
                      {u.note && (
                        <p className="text-xs text-zinc-500">{u.note}</p>
                      )}
                    </td>
                    <td className="py-2 pr-2 text-right font-mono">
                      {u.quantity} {u.part.unit}
                    </td>
                    <td className="py-2 pr-2 text-right font-mono">
                      {u.unitCost.toFixed(2)}
                    </td>
                    <td className="py-2 pr-2 text-right font-mono">
                      {(u.quantity * u.unitCost).toFixed(2)}
                    </td>
                    <td className="py-2 pr-2 text-xs text-zinc-500">
                      {u.user.name}
                      <br />
                      {new Date(u.createdAt).toLocaleDateString("es-AR")}
                    </td>
                    <td className="py-2 pr-2 text-right">
                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => remove(u.id)}
                          className="text-xs text-red-600 hover:underline"
                        >
                          Eliminar
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {canEdit && (
        <form
          onSubmit={add}
          className="grid grid-cols-1 gap-2 border-t border-zinc-200 pt-3 sm:grid-cols-5 dark:border-zinc-800"
        >
          <select
            value={partId}
            onChange={(e) => setPartId(e.target.value)}
            className={`${inputClass} sm:col-span-2`}
          >
            {parts.length === 0 ? (
              <option value="">Sin repuestos cargados</option>
            ) : (
              parts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} — {p.name} (stock: {p.stock} {p.unit})
                </option>
              ))
            )}
          </select>
          <input
            type="number"
            step="0.01"
            min="0.01"
            placeholder="Cantidad"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className={inputClass}
          />
          <input
            type="text"
            placeholder="Nota (opcional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className={inputClass}
          />
          <button
            type="submit"
            disabled={loading || parts.length === 0}
            className="rounded-md bg-orange-600 px-3 py-2 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-50"
          >
            {loading ? "..." : "+ Registrar"}
          </button>
          {error && (
            <p className="text-xs text-red-600 sm:col-span-5">{error}</p>
          )}
        </form>
      )}
    </section>
  );
}

const inputClass =
  "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500 dark:border-zinc-700 dark:bg-zinc-950";
