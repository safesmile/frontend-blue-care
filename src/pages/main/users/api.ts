import type { AuthUser } from "@/lib/api-client";
import type { Page } from "@/lib/list-page";
export type { Page } from "@/lib/list-page";
export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  isProtected: boolean;
}
export interface Invitation {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  patientId: string | null;
  status: "pending" | "accepted" | "revoked" | "expired";
  deliveryStatus: "pending" | "sent" | "failed";
  invitedBy: string | null;
  invitedByName: string;
  invitedByEmail: string;
  createdAt: string;
  expiresAt: string;
  acceptedAt: string | null;
  acceptedUserId: string | null;
  lastSendAttemptAt: string | null;
  lastSentAt: string | null;
}
export interface InvitationInput {
  staff?: boolean;
  clinicAssignments?: { clinicId: string; roles: string[] }[];
  firstName: string;
  lastName: string;
  email: string;
  roles: string[];
}
export interface UserUpdate {
  firstName?: string;
  lastName?: string;
  roles?: string[];
  enabled?: boolean;
  reason?: string;
}
interface Client {
  authorized<T>(
    path: string,
    options?: { method?: string; body?: unknown },
  ): Promise<T>;
}
export function createUsersApi(client: Client) {
  const page = (limit: number, offset: number) =>
    new URLSearchParams({ limit: String(limit), offset: String(offset) });
  return {
    users: (limit: number, offset: number) =>
      client.authorized<Page<AuthUser>>(`/users?${page(limit, offset)}`),
    invitations: (limit: number, offset: number) =>
      client.authorized<Page<Invitation>>(
        `/auth/invitations?${page(limit, offset)}`,
      ),
    user: (id: string) =>
      client.authorized<AuthUser>(`/users/${encodeURIComponent(id)}`),
    update: (id: string, body: UserUpdate) =>
      client.authorized<AuthUser>(`/users/${encodeURIComponent(id)}`, {
        method: "PATCH",
        body,
      }),
    invite: (body: InvitationInput) =>
      client.authorized<Invitation>("/auth/invitations", {
        method: "POST",
        body: { ...body, clinicAssignments: body.clinicAssignments ?? [] },
      }),
    resend: (id: string) =>
      client.authorized<Invitation>(
        `/auth/invitations/${encodeURIComponent(id)}/resend`,
        { method: "POST", body: {} },
      ),
    revoke: (id: string, reason?: string) =>
      client.authorized<void>(
        `/auth/invitations/${encodeURIComponent(id)}/revoke`,
        { method: "POST", body: reason ? { reason } : {} },
      ),
    async clinics() {
      const items: { id: string; name: string }[] = [];
      let total = 1;
      while (items.length < total) {
        const result = await client.authorized<
          Page<{ id: string; name: string }>
        >(`/clinics/available?${page(100, items.length)}`);
        if (!result.items.length) break;
        items.push(...result.items);
        total = result.total;
      }
      return items;
    },
    async roles() {
      const items: Role[] = [];
      let total = 1;
      while (items.length < total) {
        const result = await client.authorized<Page<Role>>(
          `/roles?${page(100, items.length)}`,
        );
        if (!result.items.length) break;
        items.push(...result.items);
        total = result.total;
      }
      return items;
    },
  };
}
