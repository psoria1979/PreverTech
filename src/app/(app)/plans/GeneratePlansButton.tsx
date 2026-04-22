"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function GeneratePlansButton({ dueCount }: { dueCount: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function run() {
    if (dueCount === 0) {
      alert("No hay planes vencidos para generar.");
      return;
    }
    if (!confirm(`Generar órdenes para ${dueCount} plan(es) vencido(s)?`)) return;
    setLoading(true);
    const res = await fetch("/api/plans/generate", { method: "POST" });
    setLoading(false);
    if (!res.ok) {
      alert("Error al generar");
      return;
    }
    const data = await res.json();
    alert(`Se generaron ${data.generated} órdenes.`);
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={run}
      disabled={loading}
      className={`rounded-md border px-3 py-2 text-sm font-medium disabled:opacity-50 ${
        dueCount > 0
          ? "border-red-300 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"
          : "border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
      }`}
    >
      {loading
        ? "Generando..."
        : dueCount > 0
          ? `Generar ${dueCount} vencido${dueCount === 1 ? "" : "s"}`
          : "Generar vencidos"}
    </button>
  );
}
