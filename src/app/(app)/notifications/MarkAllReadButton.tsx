"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function MarkAllReadButton() {
  const router = useRouter();
  const [pending, start] = useTransition();

  async function markAll() {
    await fetch("/api/notifications/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    start(() => router.refresh());
  }

  return (
    <button
      type="button"
      onClick={markAll}
      disabled={pending}
      className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
    >
      Marcar todo leído
    </button>
  );
}
