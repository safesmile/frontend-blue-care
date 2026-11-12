import { Link, useParams } from "react-router";
import { ClinicMark } from "@/components/shared/clinic-mark";
import { buttonVariants } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { PencilIcon } from "@/icons";
import { canOpenRoute } from "@/lib/access-context";
import { clinicMessages, peopleMessages } from "@/lib/session-messages";
import { ClinicPageHeading, ClinicRecord, ClinicStatus } from "./clinic-record";
import { ClinicStaffTable } from "./staff-table";

export default function ClinicDetailPage() {
  const { id = "" } = useParams();
  const { user } = useAuth();
  const t = clinicMessages();
  const common = peopleMessages();
  const edit = "/clinicas/" + id + "/editar";
  const canListStaff =
    user?.permissions.includes("clinics:staff-list") &&
    user.clinics?.some(
      (clinic) =>
        clinic.id === id && clinic.permissions.includes("clinics:staff-list"),
    );
  const date = new Intl.DateTimeFormat(
    document.documentElement.lang || "es-GT",
    {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "America/Guatemala",
    },
  );
  return (
    <>
      <ClinicPageHeading title={t.detail} />
      <ClinicRecord key={id} id={id}>
        {(clinic) => (
          <div className="space-y-5">
            <section className="bc-panel max-w-3xl">
              <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <h2 className="inline-flex items-center gap-3 text-xl font-semibold">
                  <ClinicMark icon={clinic.icon} color={clinic.color} />
                  {clinic.name}
                </h2>
                {canOpenRoute(user, edit) && (
                  <Link
                    to={edit}
                    className={buttonVariants({ variant: "outline" })}
                  >
                    <PencilIcon aria-hidden="true" className="size-4" />
                    {t.edit}
                  </Link>
                )}
              </header>
              <dl className="grid gap-5 text-sm sm:grid-cols-2">
                {[
                  [t.code, clinic.code],
                  [t.location, clinic.address],
                  [
                    common.status,
                    <ClinicStatus key="status" enabled={clinic.enabled} />,
                  ],
                  [common.phone, clinic.phone],
                  [common.email, clinic.email],
                  [
                    common.tableCreated,
                    date.format(new Date(clinic.createdAt)),
                  ],
                  [t.createdBy, clinic.createdBy ?? t.unknown],
                  [t.updatedAt, date.format(new Date(clinic.updatedAt))],
                ].map(([label, value], index) => (
                  <div key={index} className="min-w-0">
                    <dt className="font-medium text-gray-500 dark:text-gray-400">
                      {label}
                    </dt>
                    <dd className="mt-1 break-words">{value ?? "—"}</dd>
                  </div>
                ))}
              </dl>
            </section>
            {canListStaff && <ClinicStaffTable id={id} />}
          </div>
        )}
      </ClinicRecord>
    </>
  );
}
