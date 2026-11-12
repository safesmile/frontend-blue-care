import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { ClinicMark } from "@/components/shared/clinic-mark";
import {
  clinicColors,
  clinicIcons,
  type ClinicColor,
  type ClinicIcon,
} from "@/components/shared/clinic-appearance";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { useAuth } from "@/hooks/use-auth";
import { canOpenRoute } from "@/lib/access-context";
import { ApiError } from "@/lib/api-client";
import { api } from "@/lib/api";
import { notify } from "@/lib/notify";
import { clinicMessages, peopleMessages } from "@/lib/session-messages";
import { clinicsApi, type Clinic } from "./api";
import { ClinicPageHeading, ClinicRecord } from "./clinic-record";

const icons = Object.keys(clinicIcons) as [ClinicIcon, ...ClinicIcon[]];
const colors = Object.keys(clinicColors) as [ClinicColor, ...ClinicColor[]];

const schema = z.object({
  name: z.string().trim().min(1).max(120),
  code: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9][A-Za-z0-9-]{0,29}$/)
    .toLowerCase(),
  address: z.string().trim().max(500),
  phone: z
    .string()
    .trim()
    .regex(/^(?:[+0-9() .-]{5,30})?$/),
  email: z
    .string()
    .trim()
    .max(254)
    .pipe(z.union([z.literal(""), z.string().email()])),
  enabled: z.boolean(),
  icon: z.enum(icons),
  color: z.enum(colors),
});

export default function ClinicFormPage() {
  const { id } = useParams();
  const t = clinicMessages();
  return (
    <>
      <ClinicPageHeading title={t[id ? "edit" : "create"]} />
      {id ? (
        <ClinicRecord key={id} id={id}>
          {(clinic) => <ClinicForm clinic={clinic} />}
        </ClinicRecord>
      ) : (
        <ClinicForm />
      )}
    </>
  );
}

function ClinicForm({ clinic }: { clinic?: Clinic }) {
  const t = clinicMessages();
  const common = peopleMessages();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [failure, setFailure] = useState("");
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: clinic?.name ?? "",
      code: clinic?.code ?? "",
      address: clinic?.address ?? "",
      phone: clinic?.phone ?? "",
      email: clinic?.email ?? "",
      enabled: clinic?.enabled ?? true,
      icon: clinic?.icon ?? "clinic",
      color: clinic?.color ?? "teal",
    },
  });

  return (
    <section className="bc-panel max-w-3xl">
      <form
        noValidate
        onSubmit={handleSubmit(async ({ enabled, ...values }) => {
          setFailure("");
          const body = {
            ...values,
            address: values.address || null,
            phone: values.phone || null,
            email: values.email || null,
          };
          try {
            const saved = clinic
              ? await clinicsApi.update(clinic.id, { ...body, enabled })
              : await clinicsApi.create(body);
            notify.success(t[clinic ? "saved" : "created"]);
            try {
              if (!clinic && user?.clinicId) await api.switchClinic(saved.id);
              else if (!saved.enabled && user?.clinicId === saved.id)
                await api.switchClinic(null);
              else await api.reloadProfile();
            } catch {
              notify.error(t.refreshError);
            }
            const current = api.getSnapshot().user;
            const detail = "/clinicas/" + saved.id;
            const list = canOpenRoute(current, "/clinicas")
              ? "/clinicas"
              : "/mi-cuenta";
            void navigate(canOpenRoute(current, detail) ? detail : list, {
              replace: true,
            });
          } catch (error) {
            if (
              error instanceof ApiError &&
              error.status === 409 &&
              error.code === "El código de la clínica ya existe"
            ) {
              setError("code", { message: t.duplicate });
              notify.error(t.duplicate);
            } else {
              setFailure(common.unknownChanges);
              notify.error(common.unknownChanges);
            }
          }
        })}
      >
        <fieldset disabled={isSubmitting} className="grid gap-5 sm:grid-cols-2">
          {(
            [
              { name: "name", label: common.firstName, type: "text", max: 120 },
              { name: "code", label: t.code, type: "text", max: 30 },
              { name: "address", label: t.location, type: "text", max: 500 },
              { name: "phone", label: common.phone, type: "tel", max: 30 },
              { name: "email", label: common.email, type: "email", max: 254 },
            ] as const
          ).map(({ name, label, type, max }) => (
            <Field
              key={name}
              className={name === "address" ? "sm:col-span-2" : undefined}
            >
              <FieldLabel htmlFor={"clinic-" + name}>{label}</FieldLabel>
              <input
                id={"clinic-" + name}
                type={type}
                className="bc-input"
                maxLength={max}
                required={name === "name" || name === "code"}
                aria-invalid={!!errors[name]}
                aria-describedby={
                  name === "code" ? "clinic-code-hint" : undefined
                }
                {...register(name)}
              />
              {name === "code" && (
                <p
                  id="clinic-code-hint"
                  className="text-xs text-gray-500 dark:text-gray-400"
                >
                  {t.codeHint}
                </p>
              )}
              {errors[name] && (
                <FieldError>
                  {errors[name].type === "manual"
                    ? errors[name].message
                    : t.invalid}
                </FieldError>
              )}
            </Field>
          ))}
          <fieldset className="space-y-2 sm:col-span-2">
            <legend className="mb-2 text-sm font-medium">{t.icon}</legend>
            <div className="flex flex-wrap gap-2">
              {icons.map((icon) => (
                <label key={icon} className="cursor-pointer">
                  <input
                    type="radio"
                    value={icon}
                    className="peer sr-only"
                    {...register("icon")}
                  />
                  <span className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2 py-1 text-xs peer-checked:border-brand-500 peer-checked:bg-blue-50 peer-focus-visible:ring-2 peer-focus-visible:ring-brand-500 dark:border-gray-700 dark:peer-checked:border-brand-400 dark:peer-checked:bg-blue-950">
                    <ClinicMark icon={icon} className="size-7" />
                    {t.icons[icon]}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset className="space-y-2 sm:col-span-2">
            <legend className="mb-2 text-sm font-medium">{t.color}</legend>
            <div className="flex flex-wrap gap-2">
              {colors.map((color) => (
                <label key={color} className="cursor-pointer">
                  <input
                    type="radio"
                    value={color}
                    className="peer sr-only"
                    {...register("color")}
                  />
                  <span className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs peer-checked:border-brand-500 peer-checked:bg-blue-50 peer-focus-visible:ring-2 peer-focus-visible:ring-brand-500 dark:border-gray-700 dark:peer-checked:border-brand-400 dark:peer-checked:bg-blue-950">
                    <span
                      aria-hidden="true"
                      className={
                        "size-4 rounded-full border border-current " +
                        clinicColors[color]
                      }
                    />
                    {t.colors[color]}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          {clinic && (
            <label className="flex items-center gap-2 self-end pb-2 text-sm">
              <input type="checkbox" {...register("enabled")} />
              {t.active}
            </label>
          )}
          <div className="sm:col-span-2">
            <Button type="submit">{clinic ? common.save : t.create}</Button>
          </div>
        </fieldset>
        {failure && (
          <p
            role="alert"
            className="text-error-600 dark:text-error-400 mt-4 text-sm"
          >
            {failure}
          </p>
        )}
      </form>
    </section>
  );
}
