"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function DashboardRangeForm({
  initialFrom,
  initialTo,
}: {
  initialFrom: string;
  initialTo: string;
}) {
  const router = useRouter();
  const [from, setFrom] = useState(initialFrom);
  const [to, setTo] = useState(initialTo);
  const [, startTransition] = useTransition();

  function apply(e: React.FormEvent) {
    e.preventDefault();
    const sp = new URLSearchParams();
    if (from) sp.set("from", from);
    if (to) sp.set("to", to);
    startTransition(() => router.push(`/dashboard?${sp.toString()}`));
  }

  function clear() {
    setFrom("");
    setTo("");
    startTransition(() => router.push("/dashboard"));
  }

  const reportUrl = (() => {
    const sp = new URLSearchParams();
    if (from) sp.set("from", from);
    if (to) sp.set("to", to);
    const qs = sp.toString();
    return qs ? `/api/reports/dashboard.pdf?${qs}` : "/api/reports/dashboard.pdf";
  })();

  return (
    <form
      onSubmit={apply}
      className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 sm:flex-row sm:items-end dark:border-zinc-800 dark:bg-zinc-900"
    >
      <label className="flex-1">
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
      <label className="flex-1">
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
        <a
          href={reportUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          Descargar PDF
        </a>
      </div>
    </form>
  );
}

const inputClass =
  "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500 dark:border-zinc-700 dark:bg-zinc-950";
