import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";
import { FormSkeleton } from "@/components/shared/loading-skeletons";
import { notify } from "@/lib/notify";
import { BackLink } from "@/components/shared/navigation-actions";
import { peopleApi } from "./service";
import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { ApiError } from "@/lib/api-client";
import { peopleMessages } from "@/lib/session-messages";
import { PageMeta } from "@/components/shared/page-meta";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { usersApi } from "../users/service";
import { type Audience, type Patient } from "./api";
import type { Role } from "../users/api";
const schema = z
  .object({
    firstName: z.string().trim().min(1).max(60),
    lastName: z.string().trim().min(1).max(60),
    email: z.string().trim().toLowerCase().email().max(254),
  })
  .refine((v) => v.firstName.length + v.lastName.length + 1 <= 120, {
    path: ["lastName"],
  });
type ContactFields = z.infer<typeof schema>;
export default function CreateInvitationPage({
  audience,
}: {
  audience: Audience;
}) {
  const { user } = useAuth();
  const t = peopleMessages();
  const [params] = useSearchParams();
  const patientId = audience === "patients" ? params.get("patientId") : null;
  const [patient, setPatient] = useState<Patient | null>(null);
  const [failure, setFailure] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!patientId) return;
    let active = true;
    void peopleApi
      .patient(patientId)
      .then((value) => {
        if (active) setPatient(value);
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
  }, [patientId, retry, t.loadError]);
  if (!user) return null;
  if (patientId && !patient)
    return (
      <>
        <PageMeta
          title={`${t.invitePatient} | BlueCare`}
          description={t.invitePatient}
        />
        <BackLink to="/pacientes">{t.back}</BackLink>
        <h1 className="bc-title my-5">{t.invitePatient}</h1>
        <section className="bc-panel max-w-2xl">
          <p className="mb-5 text-sm text-gray-600 dark:text-gray-300">
            {t.patientContact}
          </p>
          <p className="mb-6 rounded-xl bg-teal-50 p-4 text-sm text-teal-900 dark:bg-teal-950/60 dark:text-teal-100">
            {t.patientHint}
          </p>
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
            <FormSkeleton fields={3} />
          )}
        </section>
      </>
    );
  return (
    <ContactInvitation
      key={patientId ?? audience}
      audience={audience}
      patient={patient}
    />
  );
}
function ContactInvitation({
  audience,
  patient,
}: {
  audience: Audience;
  patient: Patient | null;
}) {
  const { user } = useAuth();
  const t = peopleMessages();
  const navigate = useNavigate();
  const collaborator = audience === "collaborators";
  const [pending, setPending] = useState<ContactFields | null>(null);
  const [clinics, setClinics] = useState<{ id: string; name: string }[]>([]);
  const [clinicId, setClinicId] = useState("");
  const [roles, setRoles] = useState<Role[]>([]);
  const [role, setRole] = useState("");
  const [rolesFor, setRolesFor] = useState("");
  const [failure, setFailure] = useState("");
  const [retry, setRetry] = useState(0);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ContactFields>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: patient?.firstName ?? "",
      lastName: patient?.lastName ?? "",
      email: patient?.email ?? "",
    },
  });
  useEffect(() => {
    if (!collaborator || !user) return;
    let active = true;
    const grants = user.globalPermissions ?? user.permissions;
    const request =
      grants.includes("clinics:all") && grants.includes("clinics:staff-manage")
        ? usersApi.clinics()
        : Promise.resolve(user.clinics ?? []);
    void request
      .then((items) => {
        if (active) setClinics(items);
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
  }, [collaborator, user, retry, t.loadError]);
  useEffect(() => {
    if (!clinicId) return;
    let active = true;
    void peopleApi
      .roles(clinicId)
      .then((items) => {
        if (active) {
          setRoles(items);
          setRolesFor(clinicId);
        }
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
  }, [clinicId, retry, t.loadError]);
  async function sendInvitation() {
    if (!pending) return;
    setFailure("");
    try {
      if (collaborator)
        await peopleApi.inviteCollaborator({ ...pending, clinicId, role });
      else
        await peopleApi.invitePatient({
          ...pending,
          ...(patient ? { patientId: patient.id } : {}),
        });
      notify.success(t.sent);
      void navigate(
        `/${collaborator ? "colaboradores" : "pacientes"}/invitaciones`,
        { replace: true },
      );
    } catch (error) {
      const message =
        error instanceof ApiError && [0, 503].includes(error.status)
          ? t.uncertain
          : t.error;
      setFailure(message);
      notify.error(message);
    }
  }
  if (!user) return null;
  const canInvite =
    user.permissions.includes("invitations:create") &&
    (collaborator
      ? user.permissions.includes("roles:assign") &&
        user.permissions.includes("clinics:staff-manage")
      : user.permissions.includes("patients:link") &&
        (!!patient || user.permissions.includes("patients:create")));
  const title = collaborator ? t.inviteCollaborator : t.invitePatient;
  return (
    <>
      <PageMeta title={`${title} | BlueCare`} description={title} />
      <BackLink
        to={`/${audience === "collaborators" ? "colaboradores" : "pacientes"}`}
      >
        {t.back}
      </BackLink>
      <h1 className="bc-title my-5">{title}</h1>
      <section className="bc-panel max-w-2xl">
        <p className="mb-5 text-sm text-gray-600 dark:text-gray-300">
          {collaborator ? t.collaboratorContact : t.patientContact}
        </p>
        <p className="mb-6 rounded-xl bg-teal-50 p-4 text-sm text-teal-900 dark:bg-teal-950/60 dark:text-teal-100">
          {collaborator ? t.staffHint : t.patientHint}
        </p>
        {patient?.userId ? (
          <p role="status">{t.alreadyLinked}</p>
        ) : (
          <form
            noValidate
            onSubmit={handleSubmit((values) => {
              if (collaborator && (!clinicId || !role)) {
                setFailure(t.required);
                return;
              }
              setPending(values);
            })}
          >
            <fieldset
              disabled={!canInvite || isSubmitting || !!pending}
              className="space-y-5"
            >
              {(
                [
                  ["firstName", t.firstName],
                  ["lastName", t.lastName],
                  ["email", t.email],
                ] as const
              ).map(([name, label]) => (
                <Field key={name}>
                  <FieldLabel htmlFor={`invite-${name}`}>{label}</FieldLabel>
                  <input
                    id={`invite-${name}`}
                    className="bc-input"
                    type={name === "email" ? "email" : "text"}
                    readOnly={!!patient}
                    aria-invalid={!!errors[name]}
                    {...register(name)}
                  />
                  {errors[name] && <FieldError>{t.required}</FieldError>}
                </Field>
              ))}
              {collaborator ? (
                <>
                  <Field>
                    <FieldLabel>{t.clinic}</FieldLabel>
                    <Select
                      value={clinicId || null}
                      onValueChange={(value) => {
                        setClinicId(value ?? "");
                        setRole("");
                      }}
                    >
                      <SelectTrigger aria-label={t.clinic}>
                        <SelectValue placeholder={t.chooseClinic}>
                          {clinics.find((c) => c.id === clinicId)?.name ??
                            t.chooseClinic}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {clinics.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field>
                    <FieldLabel>{t.role}</FieldLabel>
                    <Select
                      disabled={!clinicId || rolesFor !== clinicId}
                      value={role || null}
                      onValueChange={(value) => setRole(value ?? "")}
                    >
                      <SelectTrigger aria-label={t.role}>
                        <SelectValue placeholder={t.chooseRole}>
                          {roles.find((r) => r.name === role)?.name ??
                            t.chooseRole}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {rolesFor === clinicId &&
                          roles.map((r) => (
                            <SelectItem key={r.id} value={r.name}>
                              {r.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    {!!clinicId && rolesFor === clinicId && !roles.length && (
                      <p className="text-sm">{t.noRoles}</p>
                    )}
                  </Field>
                </>
              ) : null}
              <Button
                type="submit"
                disabled={
                  isSubmitting || (collaborator && (!clinicId || !role))
                }
              >
                {isSubmitting ? t.sending : t.submit}
              </Button>
            </fieldset>
          </form>
        )}
        {!canInvite && (
          <p
            role="alert"
            className="mt-4 text-sm text-red-600 dark:text-red-400"
          >
            {t.error}
          </p>
        )}
        {failure && (
          <div
            role="alert"
            className="mt-5 space-y-3 text-sm text-red-600 dark:text-red-400"
          >
            <p>{failure}</p>
            <Link
              className="bc-link"
              to={`/${collaborator ? "colaboradores" : "pacientes"}/invitaciones`}
            >
              {t.history}
            </Link>
            <Button
              variant="ghost"
              onClick={() => {
                setFailure("");
                setRetry((v) => v + 1);
              }}
            >
              {t.retry}
            </Button>
          </div>
        )}
      </section>
      <ConfirmationDialog
        open={!!pending}
        onClose={() => setPending(null)}
        onConfirm={sendInvitation}
        title={t.confirmSend}
        confirmLabel={t.submit}
        description={t.confirmSendDescription.replace(
          "{email}",
          pending?.email ?? "",
        )}
      />
    </>
  );
}
