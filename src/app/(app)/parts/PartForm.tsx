"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Part = {
  id: string;
  code: string;
  name: string;
  unit: string;
  description: string | null;
  stock: number;
  minStock: number;
  unitCost: number;
};

export function PartForm({ part }: { part?: Part }) {
  const router = useRouter();
  const [code, setCode] = useState(part?.code ?? "");
  const [name, setName] = useState(part?.name ?? "");
  const [unit, setUnit] = useState(part?.unit ?? "u");
  const [description, setDescription] = useState(part?.description ?? "");
  const [stock, setStock] = useState(String(part?.stock ?? 0));
  const [minStock, setMinStock] = useState(String(part?.minStock ?? 0));
  const [unitCost, setUnitCost] = useState(String(part?.unitCost ?? 0));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const body = {
      code,
      name,
      unit,
      description,
      stock: Number(stock),
      minStock: Number(minStock),
      unitCost: Number(unitCost),
    };
    const url = part ? `/api/parts/${part.id}` : "/api/parts";
    const method = part ? "PUT" : "POST";
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
    router.push("/parts");
    router.refresh();
  }

  async function onDelete() {
    if (!part) return;
    if (!confirm("¿Eliminar este repuesto?")) return;
    setLoading(true);
    const res = await fetch(`/api/parts/${part.id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "No se pudo eliminar");
      setLoading(false);
      return;
    }
    router.push("/parts");
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
        <Field label="Unidad (u, kg, L, m...)">
          <input
            required
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Costo unitario">
          <input
            type="number"
            step="0.01"
            min="0"
            value={unitCost}
            onChange={(e) => setUnitCost(e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Stock actual">
          <input
            type="number"
            step="0.01"
            min="0"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Stock mínimo">
          <input
            type="number"
            step="0.01"
            min="0"
            value={minStock}
            onChange={(e) => setMinStock(e.target.value)}
            className={inputClass}
          />
        </Field>
      </div>
      <Field label="Descripción">
        <textarea
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
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
        {part && (
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
