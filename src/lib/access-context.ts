import type { AuthUser } from "./api-client";
export function sessionHome(user: AuthUser | null) {
  return user?.mode === "staff" &&
    !!user.clinics?.length &&
    user.permissions.includes("dashboard:read")
    ? "/"
    : "/mi-cuenta";
}
export function canOpenRoute(user: AuthUser | null, path: string) {
  if (!user) return false;
  if (
    path === "/mi-cuenta" ||
    path.startsWith("/mi-cuenta/") ||
    path === "/iniciar-sesion"
  )
    return true;
  if (user.mode !== "staff") return false;
  const has = (...codes: string[]) =>
    codes.some((code) => user.permissions.includes(code));
  if (path === "/colaboradores/invitar")
    return (
      has("invitations:create") &&
      has("roles:assign") &&
      has("clinics:staff-manage")
    );
  if (
    path === "/colaboradores/invitaciones" ||
    path === "/pacientes/invitaciones"
  )
    return has("invitations:list");
  if (path.startsWith("/colaboradores/") && path.endsWith("/acceso"))
    return (
      has("clinics:staff-list") &&
      has("clinics:staff-manage") &&
      has("roles:assign")
    );
  if (path.startsWith("/colaboradores/") && path.endsWith("/editar"))
    return has("users:update") && has("users:manage");
  if (path === "/colaboradores") return has("clinics:staff-list");
  if (path === "/pacientes/invitar")
    return has("invitations:create") && has("patients:link");
  if (path.startsWith("/usuarios/invitaciones"))
    return has("invitations:list", "invitations:create");
  if (path.startsWith("/usuarios"))
    return has("users:list", "invitations:list", "invitations:create");
  if (path.startsWith("/clinicas"))
    return has("clinics:list", "clinics:staff-manage");
  if (path.startsWith("/planes")) return has("plans:list", "plans:read");
  if (path.startsWith("/auditoria")) return has("audit:list");
  if (
    !user.clinics?.length ||
    (user.clinicId && !user.clinics.some((c) => c.id === user.clinicId))
  )
    return false;
  if (path === "/") return has("dashboard:read");
  if (path.startsWith("/pacientes/") && path.endsWith("/editar"))
    return has("patients:update") && has("patients:read");
  if (path === "/pacientes") return has("patients:list");
  if (/^\/pacientes\/[^/]+$/.test(path)) return has("patients:read");
  if (path.startsWith("/membresias"))
    return has("memberships:list", "memberships:read");
  if (path.startsWith("/beneficios"))
    return has("benefits:balances", "benefits:history", "benefits:consume");
  if (path.startsWith("/prevencion"))
    return has("prevention:list", "prevention:read");
  return false;
}
