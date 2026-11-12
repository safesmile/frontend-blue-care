import { listSearchParams, type ListQuery, type Page } from "@/lib/list-page";
import type { Invitation, Role } from "../users/api";
export type Audience = "patients" | "collaborators";
export interface Contact {
  firstName: string;
  lastName: string;
  email: string;
}
export interface Patient extends Omit<Contact, "email"> {
  email: string | null;
  id: string;
  userId: string | null;
  enabled: boolean;
  phone?: string | null;
  dpi?: string | null;
  birthDate?: string | null;
  address?: string | null;
}
export interface Collaborator extends Contact {
  id: string;
  name: string;
  enabled: boolean;
  verified: boolean;
  roles: string[];
  clinics: { id: string; name: string; roles: string[] }[];
}
interface Client {
  authorized<T>(
    path: string,
    options?: { method?: string; body?: unknown },
  ): Promise<T>;
}
export function createPeopleApi(client: Client) {
  const page = (offset: number, limit: number, query?: ListQuery) =>
    listSearchParams(Math.max(1, Math.min(25, limit)), offset, query);
  return {
    collaborators: (offset = 0, limit = 10, query?: ListQuery) =>
      client.authorized<Page<Collaborator>>(
        `/users/collaborators?${page(offset, limit, query)}`,
      ),
    collaborator: (id: string) =>
      client.authorized<Collaborator>(
        `/users/collaborators/${encodeURIComponent(id)}`,
      ),
    patients: (offset = 0, limit = 10, query?: ListQuery) =>
      client.authorized<Page<Patient>>(
        `/patients?${page(offset, limit, query)}`,
      ),
    patient: (id: string) =>
      client.authorized<Patient>(`/patients/${encodeURIComponent(id)}`),
    updatePatient: (id: string, body: Partial<Patient>) =>
      client.authorized<Patient>(`/patients/${encodeURIComponent(id)}`, {
        method: "PATCH",
        body,
      }),
    updateAccount: (
      id: string,
      body: { firstName: string; lastName: string; enabled: boolean },
    ) =>
      client.authorized(`/users/${encodeURIComponent(id)}`, {
        method: "PATCH",
        body,
      }),
    invitePatient: ({
      firstName,
      lastName,
      email,
      patientId,
    }: Contact & { patientId?: string }) =>
      client.authorized<Invitation>("/auth/invitations/patients", {
        method: "POST",
        body: {
          firstName,
          lastName,
          email,
          ...(patientId ? { patientId } : {}),
        },
      }),
    inviteCollaborator: ({
      firstName,
      lastName,
      email,
      clinicId,
      role,
    }: Contact & { clinicId: string; role: string }) =>
      client.authorized<Invitation>("/auth/invitations/collaborators", {
        method: "POST",
        body: { firstName, lastName, email, clinicId, role },
      }),
    roles: (clinicId: string) =>
      client.authorized<Role[]>(
        `/auth/invitations/collaborators/roles?${new URLSearchParams({ clinicId })}`,
      ),
    invitations: (
      audience: Audience,
      offset = 0,
      limit = 10,
      query?: ListQuery,
    ) =>
      client.authorized<Page<Invitation>>(
        `/auth/invitations?${page(offset, limit, query)}&kind=${audience === "patients" ? "patient" : "collaborator"}`,
      ),
    resend: (id: string) =>
      client.authorized(`/auth/invitations/${encodeURIComponent(id)}/resend`, {
        method: "POST",
        body: {},
      }),
    revoke: (id: string, reason: string) =>
      client.authorized(`/auth/invitations/${encodeURIComponent(id)}/revoke`, {
        method: "POST",
        body: reason ? { reason } : {},
      }),
    assign: (id: string, clinicId: string, role: string) =>
      client.authorized<void>(
        `/clinics/${encodeURIComponent(clinicId)}/staff/${encodeURIComponent(id)}`,
        { method: "PUT", body: { roles: [role] } },
      ),
    unassign: (id: string, clinicId: string) =>
      client.authorized<void>(
        `/clinics/${encodeURIComponent(clinicId)}/staff/${encodeURIComponent(id)}`,
        { method: "DELETE" },
      ),
  };
}
