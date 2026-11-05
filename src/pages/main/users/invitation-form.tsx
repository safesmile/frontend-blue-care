import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { AuthUser } from "@/lib/api-client";
import { ApiError } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { invitationSchema, type InvitationFields } from "./schema";
import RolesField from "./roles-field";
import { usersApi } from "./service";
import { usersError } from "./errors";
export default function InvitationForm({
  actor,
  onComplete,
  onBusy,
}: {
  actor: AuthUser;
  onComplete: (message: string, warning?: boolean) => void;
  onBusy: (busy: boolean) => void;
}) {
  const [failure, setFailure] = useState("");
  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<InvitationFields>({
    resolver: zodResolver(invitationSchema),
    defaultValues: { firstName: "", lastName: "", email: "", roles: [] },
  });
  const selectedRoles = useWatch({ control, name: "roles" });
  return (
    <form
      className="mt-5 space-y-5"
      noValidate
      onSubmit={handleSubmit(async (values) => {
        onBusy(true);
        setFailure("");
        try {
          await usersApi.invite(values);
          onComplete(
            "Invitación enviada. La persona recibirá un enlace para configurar su contraseña.",
          );
        } catch (error) {
          if (error instanceof ApiError && error.status === 503) {
            onComplete(
              "No se confirmó la entrega del correo. La invitación puede haber quedado guardada; revisa el historial y reenvíala desde allí.",
              true,
            );
          } else if (error instanceof ApiError && error.status === 0) {
            onComplete(
              "Se perdió la conexión y no podemos confirmar el envío. Revisa el historial antes de enviar otra invitación.",
              true,
            );
          } else setFailure(usersError(error));
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
            ["email", "Correo electrónico"],
          ] as const
        ).map(([name, label]) => (
          <Field key={name}>
            <FieldLabel htmlFor={`invite-${name}`}>{label}</FieldLabel>
            <input
              id={`invite-${name}`}
              className="bc-input"
              autoComplete={
                name === "email"
                  ? "email"
                  : name === "firstName"
                    ? "given-name"
                    : "family-name"
              }
              type={name === "email" ? "email" : "text"}
              aria-invalid={!!errors[name]}
              {...register(name)}
            />
            {errors[name] && <FieldError>{errors[name]?.message}</FieldError>}
          </Field>
        ))}
        <RolesField
          actor={actor}
          value={selectedRoles}
          onChange={(roles) =>
            setValue("roles", roles, { shouldValidate: true })
          }
        />
        {errors.roles && (
          <p role="alert" className="text-sm text-red-500">
            {errors.roles.message || "Revisa los roles seleccionados."}
          </p>
        )}
        {failure && (
          <p role="alert" className="text-sm text-red-500">
            {failure}
          </p>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Enviando…" : "Enviar invitación"}
        </Button>
      </fieldset>
    </form>
  );
}
