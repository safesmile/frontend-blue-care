import { notify } from "@/lib/notify";
import { FormSkeleton } from "@/components/shared/loading-skeletons";
import { BackLink } from "@/components/shared/navigation-actions";
import { peopleApi } from "../invitations/service";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { peopleMessages } from "@/lib/session-messages";
import { PageMeta } from "@/components/shared/page-meta";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import {
  type Patient,
  type Collaborator,
  type Audience,
} from "../invitations/api";
const schema = z.object({
  firstName: z.string().trim().min(1).max(60),
  lastName: z.string().trim().min(1).max(60),
  email: z.union([z.literal(""), z.string().trim().email().max(254)]),
  phone: z.union([z.literal(""), z.string().regex(/^[+0-9() .-]{5,30}$/)]),
  dpi: z.union([z.literal(""), z.string().regex(/^\d{13}$/)]),
  birthDate: z.union([z.literal(""), z.string().regex(/^\d{4}-\d{2}-\d{2}$/)]),
  address: z.string().trim().max(500),
  enabled: z.boolean(),
});
type Fields = z.infer<typeof schema>;
export default function PeopleEditPage({ audience }: { audience: Audience }) {
  const { id = "" } = useParams();
  const t = peopleMessages();
  const [record, setRecord] = useState<Patient | Collaborator | null>(null),
    [failure, setFailure] = useState(""),
    [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    const request =
      audience === "patients"
        ? peopleApi.patient(id)
        : peopleApi.collaborator(id);
    void request
      .then((value) => {
        if (active) setRecord(value);
      })
      .catch(() => {
        if (active) {
          setFailure(t.loadError);
          notify.error(t.loadError);
        }
      });
    return () => {
      active = false;
    };
  }, [id, audience, retry, t.loadError]);
  if (!record)
    return (
      <>
        <PageMeta
          title={`${audience === "patients" ? t.editPatient : t.editAccount} | BlueCare`}
          description={t.loading}
        />
        <BackLink
          to={audience === "patients" ? "/pacientes" : "/colaboradores"}
        >
          {t.back}
        </BackLink>
        <h1 className="bc-title my-5">
          {audience === "patients" ? t.editPatient : t.editAccount}
        </h1>
        <section className="bc-panel max-w-2xl">
          {failure ? (
            <div role="alert">
              <p>{failure}</p>
              <Button
                className="mt-4"
                onClick={() => {
                  setFailure("");
                  setRetry((value) => value + 1);
                }}
              >
                {t.retry}
              </Button>
            </div>
          ) : (
            <FormSkeleton fields={audience === "patients" ? 8 : 3} />
          )}
        </section>
      </>
    );
  return <EditForm key={id} record={record} audience={audience} />;
}
function EditForm({
  record,
  audience,
}: {
  record: Patient | Collaborator;
  audience: Audience;
}) {
  const t = peopleMessages();
  const navigate = useNavigate();
  const [failure, setFailure] = useState("");
  const patient = audience === "patients",
    base = patient ? "/pacientes" : "/colaboradores",
    title = patient ? t.editPatient : t.editAccount;
  const p = record as Patient;
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Fields>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: record.firstName,
      lastName: record.lastName,
      email: record.email ?? "",
      phone: p.phone ?? "",
      dpi: p.dpi ?? "",
      birthDate: p.birthDate ?? "",
      address: p.address ?? "",
      enabled: record.enabled,
    },
  });
  return (
    <>
      <PageMeta title={`${title} | BlueCare`} description={title} />
      <BackLink to={base}>{t.back}</BackLink>
      <h1 className="bc-title my-5">{title}</h1>
      <section className="bc-panel max-w-2xl">
        <form
          noValidate
          onSubmit={handleSubmit(async (values) => {
            setFailure("");
            try {
              if (patient)
                await peopleApi.updatePatient(record.id, {
                  firstName: values.firstName,
                  lastName: values.lastName,
                  ...(!p.userId ? { email: values.email || null } : {}),
                  phone: values.phone || null,
                  dpi: values.dpi || null,
                  birthDate: values.birthDate || null,
                  address: values.address || null,
                  enabled: values.enabled,
                });
              else
                await peopleApi.updateAccount(record.id, {
                  firstName: values.firstName,
                  lastName: values.lastName,
                  enabled: values.enabled,
                });
              notify.success(t.updated);
              void navigate(base, { replace: true });
            } catch {
              setFailure(t.unknownChanges);
              notify.error(t.unknownChanges);
            }
          })}
        >
          <fieldset disabled={isSubmitting} className="space-y-5">
            {(
              [
                ["firstName", t.firstName],
                ["lastName", t.lastName],
                ...(patient
                  ? ([
                      ["email", t.email],
                      ["phone", t.phone],
                      ["dpi", t.dpi],
                      ["birthDate", t.birthDate],
                      ["address", t.address],
                    ] as const)
                  : []),
              ] as const
            ).map(([name, label]) => (
              <Field key={name}>
                <FieldLabel htmlFor={`edit-${name}`}>{label}</FieldLabel>
                <input
                  id={`edit-${name}`}
                  className="bc-input"
                  type={
                    name === "email"
                      ? "email"
                      : name === "birthDate"
                        ? "date"
                        : "text"
                  }
                  readOnly={name === "email" && !!p.userId}
                  aria-invalid={!!errors[name]}
                  {...register(name)}
                />
                {errors[name] && <FieldError>{t.required}</FieldError>}
              </Field>
            ))}
            <label className="flex items-center gap-3 text-sm">
              <input type="checkbox" {...register("enabled")} />
              {t.enabled}
            </label>
            <Button type="submit">{t.save}</Button>
          </fieldset>
          {failure && (
            <p
              role="alert"
              className="mt-4 text-sm text-red-600 dark:text-red-400"
            >
              {failure}
            </p>
          )}
        </form>
      </section>
    </>
  );
}
