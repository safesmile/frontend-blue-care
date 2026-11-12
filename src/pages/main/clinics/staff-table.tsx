import { useCallback } from "react";
import {
  DynamicTable,
  type TableColumn,
} from "@/components/shared/dynamic-table";
import type { ListQuery } from "@/lib/list-page";
import { clinicMessages, peopleMessages } from "@/lib/session-messages";
import { clinicsApi, type ClinicStaff } from "./api";

export function ClinicStaffTable({ id }: { id: string }) {
  const t = clinicMessages();
  const common = peopleMessages();
  const load = useCallback(
    (offset: number, limit: number, query: ListQuery) =>
      clinicsApi.staff(id, offset, limit, query),
    [id],
  );
  const columns: TableColumn<ClinicStaff>[] = [
    {
      id: "name",
      label: common.firstName,
      value: (row) => row.name,
      sortable: true,
      filter: { type: "contains" },
    },
    {
      id: "email",
      label: common.email,
      value: (row) => row.email,
      sortable: true,
      filter: { type: "contains" },
    },
    {
      id: "roles",
      label: t.clinicRoles,
      render: (row) => row.roles.join(", ") || t.noClinicRoles,
    },
    {
      id: "createdAt",
      label: t.assignedAt,
      value: (row) => row.createdAt,
      type: "datetime",
      sortable: true,
      filter: { type: "dateRange" },
    },
  ];
  return (
    <DynamicTable
      title={t.staff}
      columns={columns}
      rowKey={(row) => row.userId}
      load={load}
      scope={id}
    />
  );
}
