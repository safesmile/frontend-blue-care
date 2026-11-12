import { api } from "@/lib/api";
import { listSearchParams, type ListQuery, type Page } from "@/lib/list-page";
import type { ClinicIcon, ClinicColor } from "@/components/shared/clinic-appearance";

export interface ClinicInput {
  name: string;
  code: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  icon: ClinicIcon;
  color: ClinicColor;
}

export interface Clinic extends ClinicInput {
  id: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
}

const path = (id: string) => "/clinics/" + encodeURIComponent(id);
export interface ClinicStaff {
  userId: string;
  name: string;
  email: string;
  roles: string[];
  createdAt: string;
}

export const clinicsApi = {
  list: (offset: number, limit: number, query: ListQuery) =>
    api.authorized<Page<Clinic>>(
      "/clinics?" + listSearchParams(limit, offset, query),
    ),
  read: (id: string) => api.authorized<Clinic>(path(id)),
  staff: (id: string, offset: number, limit: number, query: ListQuery) =>
    api.authorized<Page<ClinicStaff>>(
      path(id) + "/staff?" + listSearchParams(limit, offset, query),
    ),
  create: (body: ClinicInput) =>
    api.authorized<Clinic>("/clinics", { method: "POST", body }),
  update: (id: string, body: ClinicInput & { enabled: boolean }) =>
    api.authorized<Clinic>(path(id), { method: "PATCH", body }),
};
