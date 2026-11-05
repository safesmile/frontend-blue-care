import type { AuthUser } from "@/lib/api-client";
import type { Invitation, Role } from "./api";
export function has(user: AuthUser | null, ...permissions: string[]) {
  return !!user && permissions.every((p) => user.permissions.includes(p));
}
export function canEdit(actor: AuthUser | null, target: AuthUser) {
  return (
    has(actor, "users:update") &&
    (actor?.id === target.id || has(actor, "users:manage")) &&
    (!target.roles.includes("superadmin") ||
      !!actor?.roles.includes("superadmin"))
  );
}
export function assignableRoles(actor: AuthUser, roles: Role[]) {
  return roles.filter(
    (role) =>
      !role.name.startsWith("legacy-") &&
      (role.name !== "superadmin" || actor.roles.includes("superadmin")) &&
      (actor.roles.includes("superadmin") ||
        role.permissions.every((p) => actor.permissions.includes(p))),
  );
}
export function invitationState(invitation: Invitation, now: number) {
  return invitation.status === "pending" &&
    Date.parse(invitation.expiresAt) <= now
    ? "expired"
    : invitation.status;
}
export function resendWait(invitation: Invitation, now: number) {
  return invitation.lastSendAttemptAt
    ? Math.max(
        0,
        Math.ceil(
          (Date.parse(invitation.lastSendAttemptAt) + 60000 - now) / 1000,
        ),
      )
    : 0;
}
export function canResend(
  actor: AuthUser | null,
  invitation: Invitation,
  now: number,
) {
  return (
    has(actor, "invitations:resend", "roles:assign") &&
    ["pending", "expired"].includes(invitationState(invitation, now)) &&
    (!invitation.roles.includes("superadmin") ||
      !!actor?.roles.includes("superadmin")) &&
    resendWait(invitation, now) === 0
  );
}
export function canRevoke(
  actor: AuthUser | null,
  invitation: Invitation,
  now: number,
) {
  return (
    has(actor, "invitations:revoke") &&
    ["pending", "expired"].includes(invitationState(invitation, now))
  );
}

export function roleLabel(name: string) {
  return (
    (
      {
        superadmin: "Superadministrador",
        admin: "Administrador",
        customer: "Paciente",
      } as Record<string, string>
    )[name] || name
  );
}
