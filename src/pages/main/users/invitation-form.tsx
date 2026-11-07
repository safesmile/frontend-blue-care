import { sessionMessages } from "@/lib/session-messages";
import { useEffect, useState } from "react";
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
  const text = sessionMessages();
  const [clinics, setClinics] = useState<{ id: string; name: string }[]>([]);
  const [clinicError, setClinicError] = useState(false);
  const [loadingClinics, setLoadingClinics] = useState(true);
  const [retry, setRetry] = useState(0);
  const [failure, setFailure] = useState("");
  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<InvitationFields>({
    resolver: zodResolver(invitationSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      roles: ["customer"],
      staff: false,
      clinicAssignments: [],
    },
  });
  const selectedRoles = useWatch({ control, name: "roles" });
  const staff = useWatch({ control, name: "staff" });
  const assignments = useWatch({ control, name: "clinicAssignments" }) ?? [];
  useEffect(() => {
    let active = true;
    const global = actor.globalPermissions ?? actor.permissions;
    const request =
      global.includes("clinics:staff-manage") && global.includes("clinics:all")
        ? usersApi.clinics()
        : Promise.resolve(actor.clinics ?? []);
    void request
      .then((items) => {
        if (active) {
          setClinics(items);
          setClinicError(false);
        }
      })
      .catch(() => {
        if (active) setClinicError(true);
      })
      .finally(() => {
        if (active) setLoadingClinics(false);
      });
    return () => {
      active = false;
    };
  }, [actor, retry]);
  return (
    <form
      className="mt-5 space-y-5"
      noValidate
      onSubmit={handleSubmit(async (values) => {
        onBusy(true);
        setFailure("");
        try {
          await usersApi.invite({
            ...values,
            clinicAssignments: values.staff
              ? (values.clinicAssignments ?? [])
              : [],
          });
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
        <p className="text-sm font-medium">{text.accountRoles}</p>
        <RolesField
          actor={actor}
          value={selectedRoles}
          onChange={(roles) =>
            setValue("roles", roles, { shouldValidate: true })
          }
        />
        <label className="flex items-center gap-3 text-sm">
          <input
            type="checkbox"
            {...register("staff")}
            onChange={(event) => {
              setValue("staff", event.target.checked);
              if (!event.target.checked) setValue("clinicAssignments", []);
            }}
          />
          {text.staffInvite}
        </label>
        {staff && (
          <section className="space-y-4 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
            <h3 className="font-medium">{text.clinicAssignments}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {text.noAssignments}
            </p>
            {loadingClinics ? (
              <p role="status">{text.loadingClinics}</p>
            ) : clinicError ? (
              <div>
                <p role="alert">{text.clinicError}</p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setLoadingClinics(true);
                    setRetry((value) => value + 1);
                  }}
                >
                  {text.retry}
                </Button>
              </div>
            ) : (
              <>
                {!clinics.length && <p>{text.noClinicOptions}</p>}
                {!!clinics.length && (
                  <label className="block text-sm">
                    {text.addClinic}
                    <select
                      className="bc-input mt-2"
                      value=""
                      onChange={(event) => {
                        if (event.target.value)
                          setValue(
                            "clinicAssignments",
                            [
                              ...assignments,
                              { clinicId: event.target.value, roles: [] },
                            ],
                            { shouldValidate: true },
                          );
                      }}
                    >
                      <option value="">{text.chooseClinic}</option>
                      {clinics
                        .filter(
                          (clinic) =>
                            !assignments.some(
                              (item) => item.clinicId === clinic.id,
                            ),
                        )
                        .map((clinic) => (
                          <option key={clinic.id} value={clinic.id}>
                            {clinic.name}
                          </option>
                        ))}
                    </select>
                  </label>
                )}
              </>
            )}
            {assignments.map((assignment, index) => (
              <div
                key={assignment.clinicId}
                className="space-y-3 border-t border-gray-200 pt-3 dark:border-gray-700"
              >
                <div className="flex items-center justify-between gap-3">
                  <h4>
                    {
                      clinics.find(
                        (clinic) => clinic.id === assignment.clinicId,
                      )?.name
                    }
                  </h4>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() =>
                      setValue(
                        "clinicAssignments",
                        assignments.filter(
                          (item) => item.clinicId !== assignment.clinicId,
                        ),
                        { shouldValidate: true },
                      )
                    }
                  >
                    {text.remove}
                  </Button>
                </div>
                <p className="text-sm">{text.localRoles}</p>
                <RolesField
                  actor={actor}
                  clinicId={assignment.clinicId}
                  value={assignment.roles}
                  onChange={(roles) =>
                    setValue(
                      "clinicAssignments",
                      assignments.map((item) =>
                        item.clinicId === assignment.clinicId
                          ? { ...item, roles }
                          : item,
                      ),
                      { shouldValidate: true },
                    )
                  }
                />
                {errors.clinicAssignments?.[index]?.roles && (
                  <p
                    role="alert"
                    className="text-sm text-red-600 dark:text-red-400"
                  >
                    {errors.clinicAssignments[index]?.roles?.message}
                  </p>
                )}
              </div>
            ))}
          </section>
        )}
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
