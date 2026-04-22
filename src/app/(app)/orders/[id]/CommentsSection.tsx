"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Comment = {
  id: string;
  body: string;
  createdAt: string;
  user: { id: string; name: string; username: string };
};

export function CommentsSection({
  orderId,
  currentUserId,
  currentUserRole,
  initial,
}: {
  orderId: string;
  currentUserId: string;
  currentUserRole: "JEFE" | "EMPLEADO";
  initial: Comment[];
}) {
  const router = useRouter();
  const [comments, setComments] = useState<Comment[]>(initial);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = body.trim();
    if (!trimmed) return;
    setSending(true);
    setError(null);
    const res = await fetch(`/api/orders/${orderId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: trimmed }),
    });
    setSending(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "No se pudo enviar");
      return;
    }
    const c: Comment = await res.json();
    setComments((prev) => [...prev, c]);
    setBody("");
    router.refresh();
  }

  async function remove(id: string) {
    if (!confirm("¿Eliminar este comentario?")) return;
    const res = await fetch(`/api/orders/${orderId}/comments/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "No se pudo eliminar");
      return;
    }
    setComments((prev) => prev.filter((c) => c.id !== id));
    router.refresh();
  }

  return (
    <section className="mt-4 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="mb-3 text-sm font-medium text-zinc-500">Comentarios</h2>

      {comments.length === 0 ? (
        <p className="mb-3 text-sm text-zinc-500">Sin comentarios.</p>
      ) : (
        <ul className="mb-4 space-y-3">
          {comments.map((c) => {
            const canDelete =
              currentUserRole === "JEFE" || c.user.id === currentUserId;
            return (
              <li
                key={c.id}
                className="rounded-md border border-zinc-200 p-3 text-sm dark:border-zinc-800"
              >
                <div className="mb-1 flex items-baseline justify-between gap-2">
                  <div>
                    <span className="font-medium">{c.user.name}</span>{" "}
                    <span className="text-xs text-zinc-500">
                      @{c.user.username}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-3">
                    <span className="text-xs text-zinc-500">
                      {new Date(c.createdAt).toLocaleString("es-AR")}
                    </span>
                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => remove(c.id)}
                        className="text-xs text-red-600 hover:underline"
                      >
                        Eliminar
                      </button>
                    )}
                  </div>
                </div>
                <p className="whitespace-pre-wrap">{c.body}</p>
              </li>
            );
          })}
        </ul>
      )}

      <form onSubmit={submit} className="space-y-2">
        <textarea
          rows={2}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Escribí un comentario..."
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500 dark:border-zinc-700 dark:bg-zinc-950"
        />
        {error && <p className="text-xs text-red-600">{error}</p>}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={sending || !body.trim()}
            className="rounded-md bg-orange-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-50"
          >
            {sending ? "Enviando..." : "Comentar"}
          </button>
        </div>
      </form>
    </section>
  );
}
