import { DetailSkeleton } from "@/components/shared/loading-skeletons";
import { notify } from "@/lib/notify";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { Button, buttonVariants } from "@/components/ui/button";
import { BackLink } from "@/components/shared/navigation-actions";
import { PageMeta } from "@/components/shared/page-meta";
import { useAuth } from "@/hooks/use-auth";
import { canOpenRoute } from "@/lib/access-context";
import { peopleMessages } from "@/lib/session-messages";
import { PencilIcon } from "@/icons";
import { peopleApi } from "../invitations/service";
import type { Patient } from "../invitations/api";

export default function PatientDetailPage() {
  const { id = "" } = useParams();
  const { user } = useAuth();
  const t = peopleMessages();
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState<{ key: string; patient?: Patient }>();
  const key = JSON.stringify([id, user?.id, user?.clinicId, revision]);
  useEffect(() => {
    let active = true;
    void peopleApi
      .patient(id)
      .then((patient) => {
        if (active) setResult({ key, patient });
      })
      .catch(() => {
        if (active) {
          setResult({ key });
          notify.error(t.loadError);
        }
      });
    return () => {
      active = false;
    };
  }, [id, key, t.loadError]);
  const current = result?.key === key ? result : undefined;
  const patient = current?.patient;
  const title = patient
    ? [patient.firstName, patient.lastName].filter(Boolean).join(" ")
    : t.patientRecord;
  const editPath = `/pacientes/${id}/editar`;
  return (
    <>
      <PageMeta title={`${title} | BlueCare`} description={t.patientRecord} />
      <BackLink
        to={canOpenRoute(user, "/pacientes") ? "/pacientes" : "/mi-cuenta"}
      >
        {canOpenRoute(user, "/pacientes") ? t.backToPatients : t.backToAccount}
      </BackLink>
      <div className="my-5 flex flex-wrap items-center justify-between gap-4">
        <h1 className="bc-title">{title}</h1>
        {patient && canOpenRoute(user, editPath) && (
          <Link
            className={buttonVariants({ variant: "outline" })}
            to={editPath}
          >
            <PencilIcon aria-hidden="true" className="size-4" />
            {t.editPatient}
          </Link>
        )}
      </div>
      <section className="bc-panel max-w-3xl">
        {!current ? (
          <DetailSkeleton />
        ) : !patient ? (
          <div role="alert" className="space-y-4">
            <p>{t.loadError}</p>
            <Button onClick={() => setRevision((value) => value + 1)}>
              {t.retry}
            </Button>
          </div>
        ) : (
          <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
            {[
              [t.email, patient.email],
              [t.phone, patient.phone],
              [t.dpi, patient.dpi],
              [t.birthDate, patient.birthDate],
              [t.address, patient.address],
              [t.accountStatus, patient.userId ? t.linked : t.pending],
              [t.status, patient.enabled ? t.enabled : t.disabled],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-sm text-gray-500 dark:text-gray-400">
                  {label}
                </dt>
                <dd className="mt-1 text-sm font-medium break-words text-gray-900 dark:text-gray-100">
                  {value || "—"}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </section>
    </>
  );
}
