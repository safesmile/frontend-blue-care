import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import type { AuthUser } from "@/lib/api-client";
import { api } from "@/lib/api";
import RolesField from "./roles-field";
import { userSchema, type UserFields } from "./schema";
import { has } from "./policies";
import { usersApi } from "./service";
import { usersError } from "./errors";
export default function UserForm({
  actor,
  target,
  onComplete,
  onBusy,
}: {
  actor: AuthUser;
  target: AuthUser;
  onComplete: (message: string) => void;
  onBusy: (busy: boolean) => void;
}) {
  const [failure, setFailure] = useState("");
  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<UserFields>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      firstName: target.firstName,
      lastName: target.lastName,
      roles: target.roles,
    },
  });
  const selectedRoles = useWatch({ control, name: "roles" });
  return (
    <form
      className="mt-5 space-y-4"
      noValidate
      onSubmit={handleSubmit(async (values) => {
        onBusy(true);
        setFailure("");
        try {
          const changed =
            JSON.stringify([...(values.roles || [])].sort()) !==
            JSON.stringify([...target.roles].sort());
          await usersApi.update(target.id, {
            firstName: values.firstName,
            lastName: values.lastName,
            ...(has(actor, "roles:assign") && changed
              ? { roles: values.roles }
              : {}),
          });
          onComplete("Usuario actualizado.");
          if (actor.id === target.id) await api.initialize();
        } catch (error) {
          setFailure(usersError(error));
        } finally {
          onBusy(false);
        }
      })}
    >
      <fieldset disabled={isSubmitting} className="space-y-4">
        {(
          [
            ["firstName", "Nombre"],
            ["lastName", "Apellido"],
          ] as const
        ).map(([name, label]) => (
          <Field key={name}>
            <FieldLabel htmlFor={`edit-${name}`}>{label}</FieldLabel>
            <input
              id={`edit-${name}`}
              className="bc-input"
              aria-invalid={!!errors[name]}
              {...register(name)}
            />
            {errors[name] && <FieldError>{errors[name]?.message}</FieldError>}
          </Field>
        ))}
        {has(actor, "roles:assign") && (
          <RolesField
            actor={actor}
            value={selectedRoles || []}
            onChange={(roles) =>
              setValue("roles", roles, { shouldValidate: true })
            }
          />
        )}
        <p className="text-xs text-gray-500 dark:text-gray-400">
          El correo, la contraseña y su verificación se gestionan desde los
          flujos de seguridad de cada cuenta.
        </p>
        {failure && (
          <p role="alert" className="text-sm text-red-500">
            {failure}
          </p>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Guardando…" : "Guardar cambios"}
        </Button>
      </fieldset>
    </form>
  );
}
