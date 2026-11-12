import {
  DynamicTable,
  type TableAction,
  type TableColumn,
} from "@/components/shared/dynamic-table";
import { PageMeta } from "@/components/shared/page-meta";
import { buttonVariants } from "@/components/ui/button";
import { EyeIcon, KeyIcon, MailIcon, PencilIcon } from "@/icons";
import { canOpenRoute } from "@/lib/access-context";
import { Link } from "react-router";
import { useAuth } from "@/hooks/use-auth";
import { peopleMessages } from "@/lib/session-messages";
import { peopleApi } from "../invitations/service";
import type { Audience, Collaborator, Patient } from "../invitations/api";

type Person = Collaborator | Patient;

export default function PeopleDirectoryPage({
  audience,
}: {
  audience: Audience;
}) {
  const { user } = useAuth();
  const t = peopleMessages();
  const staff = audience === "collaborators";
  const base = staff ? "/colaboradores" : "/pacientes";
  const title = staff ? t.collaborators : t.patients;
  const canInvite =
    !!user?.permissions.includes("invitations:create") &&
    (staff
      ? user.permissions.includes("roles:assign") &&
        user.permissions.includes("clinics:staff-manage")
      : user.permissions.includes("patients:link"));
  const options = (yes: string, no: string) => [
    { value: "true", label: yes },
    { value: "false", label: no },
  ];
  const columns: TableColumn<Person>[] = [
    {
      id: "name",
      label: t.firstName,
      value: (row) => `${row.firstName} ${row.lastName}`,
      sortable: true,
      filter: { type: "contains" },
    },
    {
      id: "email",
      label: t.email,
      value: (row) => row.email,
      sortable: true,
      filter: { type: "contains" },
    },
    staff
      ? {
          id: "clinics",
          label: t.clinic,
          render: (row) => {
            const clinics = (row as Collaborator).clinics;
            return clinics.length
              ? clinics.map((clinic) => (
                  <p key={clinic.id}>
                    {clinic.name}
                    <span className="ms-2 text-xs text-gray-500 dark:text-gray-400">
                      {clinic.roles.join(", ")}
                    </span>
                  </p>
                ))
              : t.noClinics;
          },
        }
      : {
          id: "linked",
          label: t.accountStatus,
          sortable: true,
          filter: { type: "in", options: options(t.linked, t.pending) },
          render: (row) => ((row as Patient).userId ? t.linked : t.pending),
        },
    {
      id: "enabled",
      label: t.status,
      sortable: true,
      filter: { type: "in", options: options(t.enabled, t.disabled) },
      render: (row) => (
        <span
          className={`rounded-full px-2 py-1 text-xs ${row.enabled ? "bg-teal-50 text-teal-800 dark:bg-teal-950 dark:text-teal-200" : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"}`}
        >
          {row.enabled ? t.enabled : t.disabled}
        </span>
      ),
    },
  ];
  const editPath = (row: Person) => `${base}/${row.id}/editar`;
  const actions: TableAction<Person>[] = [
    staff
      ? {
          label: t.manageAccess,
          icon: <KeyIcon aria-hidden="true" className="size-4" />,
          to: (row) => `${base}/${row.id}/acceso`,
          visible: (row) => canOpenRoute(user, `${base}/${row.id}/acceso`),
        }
      : {
          label: t.viewPatient,
          icon: <EyeIcon aria-hidden="true" className="size-4" />,
          to: (row) => `${base}/${row.id}`,
          visible: (row) => canOpenRoute(user, `${base}/${row.id}`),
        },
    {
      label: staff ? t.editAccount : t.editPatient,
      icon: <PencilIcon aria-hidden="true" className="size-4" />,
      to: editPath,
      visible: (row) => canOpenRoute(user, editPath(row)),
    },
  ];
  if (!staff)
    actions.push({
      label: t.invitePatient,
      icon: <MailIcon aria-hidden="true" className="size-4" />,
      to: (row) =>
        `${base}/invitar?${new URLSearchParams({ patientId: row.id })}`,
      visible: (row) =>
        canInvite && row.enabled && !(row as Patient).userId && !!row.email,
    });
  return (
    <>
      <PageMeta title={`${title} | BlueCare`} description={title} />
      <DynamicTable<Person>
        title={title}
        description={t.scope}
        columns={columns}
        actions={actions}
        rowKey={(row) => row.id}
        scope={JSON.stringify([audience, user?.id, user?.clinicId])}
        load={staff ? peopleApi.collaborators : peopleApi.patients}
        toolbar={
          <>
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
          </>
        }
      />
    </>
  );
}
