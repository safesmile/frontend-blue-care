import { Link } from "react-router";
import { ClinicMark } from "@/components/shared/clinic-mark";
import {
  DynamicTable,
  type TableColumn,
} from "@/components/shared/dynamic-table";
import { PageMeta } from "@/components/shared/page-meta";
import { buttonVariants } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { EyeIcon, PencilIcon, PlusIcon } from "@/icons";
import { canOpenRoute } from "@/lib/access-context";
import { clinicMessages, peopleMessages } from "@/lib/session-messages";
import { clinicsApi, type Clinic } from "./api";
import { ClinicStatus } from "./clinic-record";

export default function ClinicsPage() {
  const { user } = useAuth();
  const t = clinicMessages();
  const common = peopleMessages();
  const columns: TableColumn<Clinic>[] = [
    {
      id: "name",
      label: common.firstName,
      value: (clinic) => clinic.name,
      render: (clinic) => (
        <span className="inline-flex items-center gap-2">
          <ClinicMark
            icon={clinic.icon}
            color={clinic.color}
            className="size-7"
          />
          {clinic.name}
        </span>
      ),
      sortable: true,
      filter: { type: "contains" },
    },
    {
      id: "code",
      label: t.code,
      value: (clinic) => clinic.code,
      sortable: true,
      filter: { type: "contains" },
    },
    {
      id: "address",
      label: t.location,
      value: (clinic) => clinic.address,
      sortable: true,
      filter: { type: "contains" },
    },
    {
      id: "enabled",
      label: common.status,
      sortable: true,
      filter: {
        type: "in",
        options: [
          { value: "true", label: t.active },
          { value: "false", label: t.inactive },
        ],
      },
      render: (clinic) => <ClinicStatus enabled={clinic.enabled} />,
    },
    {
      id: "createdAt",
      label: common.tableCreated,
      value: (clinic) => clinic.createdAt,
      type: "datetime",
      sortable: true,
      filter: { type: "dateRange" },
    },
    {
      id: "createdBy",
      label: t.createdBy,
      render: (clinic) => clinic.createdBy ?? t.unknown,
      sortable: true,
      filter: { type: "contains" },
    },
  ];
  const detail = (clinic: Clinic) => "/clinicas/" + clinic.id;
  const edit = (clinic: Clinic) => detail(clinic) + "/editar";
  return (
    <>
      <PageMeta title={t.title + " | BlueCare"} description={t.description} />
      <DynamicTable
        title={t.title}
        description={t.description}
        toolbar={
          canOpenRoute(user, "/clinicas/nueva") && (
            <Link to="/clinicas/nueva" className={buttonVariants()}>
              <PlusIcon aria-hidden="true" className="size-4" />
              {t.create}
            </Link>
          )
        }
        columns={columns}
        actions={[
          {
            label: t.detail,
            icon: <EyeIcon aria-hidden="true" className="size-4" />,
            to: detail,
            visible: (clinic) => canOpenRoute(user, detail(clinic)),
          },
          {
            label: t.edit,
            icon: <PencilIcon aria-hidden="true" className="size-4" />,
            to: edit,
            visible: (clinic) => canOpenRoute(user, edit(clinic)),
          },
        ]}
        rowKey={(clinic) => clinic.id}
        load={clinicsApi.list}
      />
    </>
  );
}
