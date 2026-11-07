import { useEffect, useState } from "react";
import type { AuthUser } from "@/lib/api-client";
import { authErrorMessage } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { usersApi } from "./service";
import { assignableRoles, has, roleLabel } from "./policies";
import type { Role } from "./api";
export default function RolesField({
  actor,
  clinicId,
  value,
  onChange,
}: {
  actor: AuthUser;
  clinicId?: string;
  value: string[];
  onChange: (value: string[]) => void;
}) {
  const [text, setText] = useState(value.join(", "));
  const [result, setResult] = useState<{ roles: Role[]; error: string } | null>(
    null,
  );
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!has(actor, "roles:list")) return;
    let active = true;
    void usersApi
      .roles()
      .then((roles) => {
        if (active) setResult({ roles, error: "" });
      })
      .catch((error) => {
        if (active) setResult({ roles: [], error: authErrorMessage(error) });
      });
    return () => {
      active = false;
    };
  }, [actor, retry]);
  if (!has(actor, "roles:list"))
    return (
      <label className="block text-sm">
        Roles existentes (separados por comas)
        <input
          className="bc-input mt-2"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            onChange(
              e.target.value
                .split(",")
                .map((v) => v.trim())
                .filter(Boolean),
            );
          }}
        />
        <span className="mt-2 block text-xs text-gray-500 dark:text-gray-400">
          Tu cuenta no puede consultar el catálogo. Ingresa los identificadores
          de roles existentes; el servidor verificará tu permiso para
          asignarlos.
        </span>
      </label>
    );
  if (!result) return <p role="status">Cargando roles…</p>;
  if (result.error)
    return (
      <div>
        <p role="alert" className="text-sm text-red-500">
          {result.error}
        </p>
        <Button
          variant="outline"
          onClick={() => {
            setResult(null);
            setRetry((r) => r + 1);
          }}
        >
          Reintentar roles
        </Button>
      </div>
    );
  const allowed = assignableRoles(actor, result.roles, clinicId);
  return (
    <fieldset className="space-y-2">
      <legend className="mb-2 text-sm font-medium">Roles</legend>
      {allowed.map((role) => (
        <label
          className="flex items-start gap-3 rounded-lg border border-gray-200 p-3 text-sm dark:border-gray-700"
          key={role.id}
        >
          <input
            className="mt-1"
            type="checkbox"
            aria-label={roleLabel(role.name)}
            checked={value.includes(role.name)}
            onChange={(e) =>
              onChange(
                e.target.checked
                  ? [...value, role.name]
                  : value.filter((name) => name !== role.name),
              )
            }
          />
          <span>
            {roleLabel(role.name)}
            {!["superadmin", "admin", "customer"].includes(role.name) &&
              role.description && (
                <span className="mt-1 block text-xs text-gray-500 dark:text-gray-400">
                  {role.description}
                </span>
              )}
          </span>
        </label>
      ))}
      {!allowed.length && (
        <p className="text-sm text-gray-500">
          No hay roles que puedas asignar.
        </p>
      )}
      {value
        .filter((name) => !allowed.some((r) => r.name === name))
        .map((name) => (
          <p className="text-xs text-gray-500" key={name}>
            Rol actual conservado: {name}{" "}
            <button
              type="button"
              className="bc-link"
              onClick={() => onChange(value.filter((v) => v !== name))}
            >
              Quitar
            </button>
          </p>
        ))}
    </fieldset>
  );
}
