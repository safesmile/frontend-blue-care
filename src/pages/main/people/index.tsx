import {
  TableSkeleton,
  PaginationSkeleton,
} from "@/components/shared/loading-skeletons";
import { peopleApi } from "../invitations/service";
import { usePagedRecords } from "@/hooks/use-paged-records";
import {
  TablePagination,
  TableTotal,
} from "@/components/shared/table-pagination";
import { TableActionLink } from "@/components/shared/navigation-actions";
import { EyeIcon, KeyIcon, MailIcon, PencilIcon } from "@/icons";
import { canOpenRoute } from "@/lib/access-context";
import { Link } from "react-router";
import { useAuth } from "@/hooks/use-auth";
import { peopleMessages } from "@/lib/session-messages";
import { PageMeta } from "@/components/shared/page-meta";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  type Audience,
  type Collaborator,
  type Patient,
} from "../invitations/api";
export default function PeopleDirectoryPage({
  audience,
}: {
  audience: Audience;
}) {
  const { user } = useAuth();
  const t = peopleMessages();
  const staff = audience === "collaborators",
    base = staff ? "/colaboradores" : "/pacientes",
    title = staff ? t.collaborators : t.patients;
  const { data, failed, total, offset, limit, setOffset, setLimit, refresh } =
    usePagedRecords<Patient | Collaborator>(
      JSON.stringify([audience, user?.id, user?.clinicId]),
      staff ? peopleApi.collaborators : peopleApi.patients,
    );
  const canInvite =
    !!user?.permissions.includes("invitations:create") &&
    (staff
      ? user.permissions.includes("roles:assign") &&
        user.permissions.includes("clinics:staff-manage")
      : user.permissions.includes("patients:link"));
  return (
    <>
      <PageMeta title={`${title} | BlueCare`} description={title} />
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="bc-title">{title}</h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {t.scope}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {user?.permissions.includes("invitations:list") && (
            <Link
              className={buttonVariants({ variant: "outline" })}
              to={`${base}/invitaciones`}
            >
              <MailIcon aria-hidden="true" className="size-4" />
              {t.history}
            </Link>
          )}
          {canInvite &&
            (staff || user?.permissions.includes("patients:create")) && (
              <Link className="bc-primary" to={`${base}/invitar`}>
                {staff ? t.inviteCollaborator : t.invitePatient}
              </Link>
            )}
        </div>
      </div>
      <section className="bc-panel">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <TableTotal total={total} />
          <Button variant="ghost" onClick={refresh}>
            {t.refresh}
          </Button>
        </div>
        {failed ? (
          <div role="alert">
            <p>{t.loadError}</p>
            <Button onClick={refresh}>{t.retry}</Button>
          </div>
        ) : !data ? (
          <TableSkeleton
            headers={[
              t.firstName,
              t.email,
              staff ? t.clinic : t.accountStatus,
              t.status,
              t.actions,
            ]}
            rows={Math.min(
              limit,
              total === undefined ? limit : Math.max(0, total - offset),
            )}
          />
        ) : !data.items.length ? (
          <p>{t.empty}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-fixed text-start text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-start text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">
                  {[
                    t.firstName,
                    t.email,
                    staff ? t.clinic : t.accountStatus,
                    t.status,
                    t.actions,
                  ].map((label) => (
                    <th key={label} className="p-3 text-start font-medium">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.items.map((row) => (
                  <tr
                    key={row.id}
                    className="h-16 border-b border-gray-100 break-words dark:border-gray-800"
                  >
                    <td className="p-3 font-medium">
                      {row.firstName} {row.lastName}
                    </td>
                    <td className="p-3">{row.email || "—"}</td>
                    <td className="p-3">
                      {staff
                        ? (row as Collaborator).clinics.length
                          ? (row as Collaborator).clinics.map((clinic) => (
                              <p key={clinic.id} className="mb-1">
                                {clinic.name}
                                <span className="ms-2 text-xs text-gray-500 dark:text-gray-400">
                                  {clinic.roles.join(", ")}
                                </span>
                              </p>
                            ))
                          : t.noClinics
                        : (row as Patient).userId
                          ? t.linked
                          : t.pending}
                    </td>
                    <td className="p-3">
                      <span
                        className={`rounded-full px-2 py-1 text-xs ${row.enabled ? "bg-teal-50 text-teal-800 dark:bg-teal-950 dark:text-teal-200" : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"}`}
                      >
                        {row.enabled ? t.enabled : t.disabled}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        {staff ? (
                          <>
                            {canOpenRoute(user, `${base}/${row.id}/acceso`) && (
                              <TableActionLink
                                to={`${base}/${row.id}/acceso`}
                                label={t.manageAccess}
                                icon={
                                  <KeyIcon
                                    aria-hidden="true"
                                    className="size-4"
                                  />
                                }
                              />
                            )}
                            {canOpenRoute(user, `${base}/${row.id}/editar`) && (
                              <TableActionLink
                                to={`${base}/${row.id}/editar`}
                                label={t.editAccount}
                                icon={
                                  <PencilIcon
                                    aria-hidden="true"
                                    className="size-4"
                                  />
                                }
                              />
                            )}
                          </>
                        ) : (
                          <>
                            {canOpenRoute(user, `${base}/${row.id}`) && (
                              <TableActionLink
                                to={`${base}/${row.id}`}
                                label={t.viewPatient}
                                icon={
                                  <EyeIcon
                                    aria-hidden="true"
                                    className="size-4"
                                  />
                                }
                              />
                            )}
                            {canOpenRoute(user, `${base}/${row.id}/editar`) && (
                              <TableActionLink
                                to={`${base}/${row.id}/editar`}
                                label={t.editPatient}
                                icon={
                                  <PencilIcon
                                    aria-hidden="true"
                                    className="size-4"
                                  />
                                }
                              />
                            )}
                            {canInvite &&
                              user?.clinicId &&
                              row.enabled &&
                              !(row as Patient).userId &&
                              row.email && (
                                <TableActionLink
                                  to={`${base}/invitar?${new URLSearchParams({ patientId: row.id })}`}
                                  label={t.invitePatient}
                                  icon={
                                    <MailIcon
                                      aria-hidden="true"
                                      className="size-4"
                                    />
                                  }
                                />
                              )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {total === undefined && !failed && <PaginationSkeleton />}
        {total !== undefined && (
          <TablePagination
            total={total}
            offset={offset}
            limit={limit}
            shown={data?.items.length ?? 0}
            disabled={!data}
            onOffset={setOffset}
            onLimit={setLimit}
          />
        )}
      </section>
    </>
  );
}
