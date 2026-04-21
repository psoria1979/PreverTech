"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type UserData = {
  id: string;
  username: string;
  name: string;
  role: "JEFE" | "EMPLEADO";
  active: boolean;
};

export function UserForm({ user }: { user?: UserData }) {
  const router = useRouter();
  const isEdit = !!user;

  const [username, setUsername] = useState(user?.username ?? "");
  const [name, setName] = useState(user?.name ?? "");
  const [role, setRole] = useState<UserData["role"]>(user?.role ?? "EMPLEADO");
  const [active, setActive] = useState(user?.active ?? true);
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const body = isEdit
      ? { name, role, active, pin }
      : { username, name, role, pin };

    const url = isEdit ? `/api/users/${user!.id}` : "/api/users";
    const method = isEdit ? "PUT" : "POST";
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
    router.push("/users");
    router.refresh();
  }

  async function onDelete() {
    if (!user) return;
    if (!confirm("¿Eliminar este usuario?")) return;
    setLoading(true);
    const res = await fetch(`/api/users/${user.id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "No se pudo eliminar");
      setLoading(false);
      return;
    }
    router.push("/users");
    router.refresh();
  }

  return (
    <form
      onSubmit={onSubmit}
      className="max-w-xl space-y-4 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <Field label="Nombre completo">
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputClass}
        />
      </Field>

      <Field label="Usuario">
        <input
          required
          disabled={isEdit}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className={`${inputClass} disabled:opacity-60`}
          pattern="[a-zA-Z0-9._-]+"
          title="Solo letras, números, punto, guion y guion bajo"
        />
        {isEdit && (
          <span className="mt-1 block text-xs text-zinc-500">
            El usuario no se puede cambiar una vez creado.
          </span>
        )}
      </Field>

      <Field label={isEdit ? "Nuevo PIN (dejar vacío para no cambiar)" : "PIN"}>
        <input
          type="password"
          inputMode="numeric"
          required={!isEdit}
          minLength={4}
          maxLength={12}
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          className={inputClass}
        />
      </Field>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Rol">
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as UserData["role"])}
            className={inputClass}
          >
            <option value="EMPLEADO">Empleado</option>
            <option value="JEFE">Jefe</option>
          </select>
        </Field>
        {isEdit && (
          <Field label="Estado">
            <select
              value={active ? "1" : "0"}
              onChange={(e) => setActive(e.target.value === "1")}
              className={inputClass}
            >
              <option value="1">Activo</option>
              <option value="0">Inactivo</option>
            </select>
          </Field>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex items-center justify-between border-t border-zinc-200 pt-4 dark:border-zinc-800">
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-50"
        >
          {loading ? "Guardando..." : "Guardar"}
        </button>
        {isEdit && (
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
