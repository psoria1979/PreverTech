"use client";

import { useState } from "react";

export function ChangePinForm() {
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    if (newPin !== confirmPin) {
      setError("El PIN nuevo y la confirmación no coinciden");
      return;
    }
    if (newPin.length < 4) {
      setError("El PIN nuevo debe tener al menos 4 caracteres");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/profile/pin", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPin, newPin }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "No se pudo actualizar");
      return;
    }
    setSuccess(true);
    setCurrentPin("");
    setNewPin("");
    setConfirmPin("");
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 text-sm">
      <Field label="PIN actual">
        <input
          type="password"
          inputMode="numeric"
          required
          value={currentPin}
          onChange={(e) => setCurrentPin(e.target.value)}
          className={inputClass}
        />
      </Field>
      <Field label="Nuevo PIN">
        <input
          type="password"
          inputMode="numeric"
          required
          minLength={4}
          maxLength={12}
          value={newPin}
          onChange={(e) => setNewPin(e.target.value)}
          className={inputClass}
        />
      </Field>
      <Field label="Confirmar nuevo PIN">
        <input
          type="password"
          inputMode="numeric"
          required
          minLength={4}
          maxLength={12}
          value={confirmPin}
          onChange={(e) => setConfirmPin(e.target.value)}
          className={inputClass}
        />
      </Field>
      {error && <p className="text-xs text-red-600">{error}</p>}
      {success && (
        <p className="text-xs text-green-700 dark:text-green-400">
          PIN actualizado correctamente.
        </p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="rounded-md bg-orange-600 px-3 py-2 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-50"
      >
        {loading ? "Actualizando..." : "Actualizar PIN"}
      </button>
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
      <span className="mb-1 block text-xs font-medium">{label}</span>
      {children}
    </label>
  );
}
