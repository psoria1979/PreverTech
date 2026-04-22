"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Photo = {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  createdAt: string | Date;
};

export function PhotosSection({
  orderId,
  initial,
  canUpload,
}: {
  orderId: string;
  initial: Photo[];
  canUpload: boolean;
}) {
  const router = useRouter();
  const [photos, setPhotos] = useState<Photo[]>(initial);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    setError(null);
    try {
      const added: Photo[] = [];
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch(`/api/orders/${orderId}/photos`, {
          method: "POST",
          body: fd,
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Error al subir archivo");
        }
        added.push(await res.json());
      }
      setPhotos((prev) => [...prev, ...added]);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al subir archivo");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function onDelete(photoId: string) {
    if (!confirm("¿Eliminar esta foto?")) return;
    const res = await fetch(`/api/orders/${orderId}/photos/${photoId}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "No se pudo eliminar");
      return;
    }
    setPhotos((prev) => prev.filter((p) => p.id !== photoId));
    router.refresh();
  }

  return (
    <section className="mt-4 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-medium text-zinc-500">Fotos adjuntas</h2>
        {canUpload && (
          <>
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              onChange={onUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="rounded-md bg-orange-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-orange-700 disabled:opacity-50"
            >
              {uploading ? "Subiendo..." : "+ Subir fotos"}
            </button>
          </>
        )}
      </div>

      {error && (
        <p className="mb-2 text-xs text-red-600 dark:text-red-400">{error}</p>
      )}

      {photos.length === 0 ? (
        <p className="text-sm text-zinc-500">Sin fotos adjuntas.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {photos.map((p) => {
            const url = `/api/orders/${orderId}/photos/${p.id}`;
            return (
              <figure
                key={p.id}
                className="group relative overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800"
              >
                <a href={url} target="_blank" rel="noopener noreferrer">
                  {}
                  <img
                    src={url}
                    alt={p.filename}
                    className="aspect-square w-full object-cover"
                  />
                </a>
                {canUpload && (
                  <button
                    type="button"
                    onClick={() => onDelete(p.id)}
                    className="absolute right-1 top-1 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    ✕
                  </button>
                )}
              </figure>
            );
          })}
        </div>
      )}
    </section>
  );
}
