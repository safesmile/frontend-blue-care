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
  if (path === "/clinicas/nueva")
    return has("clinics:create") && has("clinics:all");
  if (path === "/clinicas") return has("clinics:list");
  const clinicRoute = /^\/clinicas\/([^/]+)(\/editar)?$/.exec(path);
  if (clinicRoute) {
    const [, id, edit] = clinicRoute;
    const clinic = user.clinics?.find((item) => item.id === id);
    if (!clinic || (user.clinicId && user.clinicId !== id)) return false;
    const granted = (code: string) =>
      has(code) &&
      (user.globalPermissions?.includes(code) ||
        clinic.permissions.includes(code));
    return granted("clinics:read") && (!edit || granted("clinics:update"));
  }
  if (path === "/planes") return has("plans:list");
  if (path === "/planes/nuevo") return has("plans:create") && has("plans:read");
  if (path === "/planes/blue-care/beneficios") return has("benefits:list");
  if (path === "/planes/vista-previa") return has("plans:list");
  if (/^\/planes\/[^/]+\/vista-previa$/.test(path)) return has("plans:read");
  if (/^\/planes\/[^/]+\/versiones\/nueva$/.test(path))
    return has("plans:read") && has("plans:version");
  if (/^\/planes\/[^/]+$/.test(path)) return has("plans:read");
  if (path === "/beneficios") return has("benefits:list");
  if (path === "/beneficios/nuevo")
    return (
      has("benefits:create") && has("benefits:read") && has("benefits:version")
    );
  if (/^\/beneficios\/[^/]+\/versiones\/nueva$/.test(path))
    return has("benefits:read") && has("benefits:version");
  if (
    /^\/beneficios\/[^/]+$/.test(path) &&
    path !== "/beneficios/registrar-consumo"
  )
    return has("benefits:read");
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
  if (path === "/membresias") return has("memberships:list");
  if (path === "/membresias/asignar")
    return (
      has("memberships:create") && has("patients:list") && has("plans:catalog")
    );
  if (/^\/membresias\/[^/]+$/.test(path)) return has("memberships:read");
  if (path === "/beneficios/registrar-consumo") return has("benefits:consume");
  if (path.startsWith("/prevencion"))
    return has("prevention:list", "prevention:read");
  return false;
}
