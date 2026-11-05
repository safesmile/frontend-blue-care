import { useEffect, useState } from "react";
import { Link } from "react-router";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/lib/api";
import type { AuthUser } from "@/lib/api-client";
import { ApiError } from "@/lib/api-client";
import { PageMeta } from "@/components/shared/page-meta";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { usersApi } from "./service";
import type { Invitation } from "./api";
import {
  has,
  canEdit,
  canResend,
  canRevoke,
  resendWait,
  invitationState,
  roleLabel,
} from "./policies";
import { usersError } from "./errors";
import InvitationForm from "./invitation-form";
import UserForm from "./user-form";
const statusLabels = {
  pending: "Pendiente",
  accepted: "Aceptada",
  revoked: "Revocada",
  expired: "Vencida",
};
const deliveryLabels = {
  pending: "Pendiente de envío",
  sent: "Enviado",
  failed: "Falló el envío",
};
const date = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat("es-GT", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "America/Guatemala",
      }).format(new Date(value))
    : "—";
type Modal =
  | { kind: "invite" }
  | { [K in "edit" | "status" | "user"]: { kind: K; user: AuthUser } }[
      "edit" | "status" | "user"]
  | {
      [K in "resend" | "revoke" | "invitation"]: {
        kind: K;
        invitation: Invitation;
      };
    }["resend" | "revoke" | "invitation"];
type Resource = {
  key: string;
  users: AuthUser[];
  invitations: Invitation[];
  total: number;
  error: string;
};
export default function UsersPage({
  tab = "users",
}: {
  tab?: "users" | "invitations";
}) {
  const { user: actor } = useAuth();
  const isInvitations = tab === "invitations";
  const [offset, setOffset] = useState(0);
  const [limit, setLimit] = useState(25);
  const [revision, setRevision] = useState(0);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("");
  const [resource, setResource] = useState<Resource | null>(null);
  const [modal, setModal] = useState<Modal | null>(null);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState("");
  const [notice, setNotice] = useState("");
  const [warning, setWarning] = useState(false);
  const [reason, setReason] = useState("");
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const canList = isInvitations
    ? has(actor, "invitations:list")
    : has(actor, "users:list", "users:manage");
  const key = `${actor?.id}:${actor?.permissions.join(",")}:${tab}:${offset}:${limit}:${revision}`;
  useEffect(() => {
    if (!canList) return;
    let active = true;
    const load = async () => {
      try {
        const result = isInvitations
          ? await usersApi.invitations(limit, offset)
          : await usersApi.users(limit, offset);
        if (!active) return;
        if (offset > 0 && offset >= result.total) {
          setOffset(
            Math.max(0, Math.floor((result.total - 1) / limit) * limit),
          );
          return;
        }
        setResource({
          key,
          users: isInvitations ? [] : (result.items as AuthUser[]),
          invitations: isInvitations ? (result.items as Invitation[]) : [],
          total: result.total,
          error: "",
        });
      } catch (error) {
        if (active)
          setResource({
            key,
            users: [],
            invitations: [],
            total: 0,
            error: usersError(error),
          });
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [canList, isInvitations, key, limit, offset]);
  const loading = !resource || resource.key !== key;
  const refresh = () => setRevision((r) => r + 1);
  const open = (value: Modal) => {
    setFailure("");
    setReason("");
    setModal(value);
  };
  const complete = (message: string, isWarning = false) => {
    setModal(null);
    setNotice(message);
    setWarning(isWarning);
    refresh();
  };
  const matches = (text: string) =>
    text.toLocaleLowerCase("es").includes(query.toLocaleLowerCase("es"));
  const users = (resource?.users || []).filter(
    (user) =>
      matches(`${user.name} ${user.email} ${user.roles.join(" ")}`) &&
      (!filter ||
        (filter === "enabled"
          ? user.enabled
          : filter === "disabled"
            ? !user.enabled
            : !user.verified)),
  );
  const invitations = (resource?.invitations || []).filter(
    (invitation) =>
      matches(
        `${invitation.firstName} ${invitation.lastName} ${invitation.email} ${invitation.roles.join(" ")}`,
      ) &&
      (!filter || invitationState(invitation, now) === filter),
  );
  const perform = async () => {
    if (
      !modal ||
      modal.kind === "invite" ||
      modal.kind === "edit" ||
      modal.kind === "user" ||
      modal.kind === "invitation"
    )
      return;
    setBusy(true);
    setFailure("");
    try {
      if (modal.kind === "resend") {
        await usersApi.resend(modal.invitation.id);
        complete(
          "Invitación reenviada. El enlace anterior dejó de funcionar; el nuevo vence en 24 horas.",
        );
      } else if (modal.kind === "revoke") {
        await usersApi.revoke(modal.invitation.id, reason.trim() || undefined);
        complete("Invitación revocada. Se conserva en el historial.");
      } else {
        await usersApi.update(modal.user.id, {
          enabled: !modal.user.enabled,
          ...(reason.trim() ? { reason: reason.trim() } : {}),
        });
        complete(
          modal.user.enabled
            ? "Acceso del usuario deshabilitado."
            : "Acceso del usuario habilitado.",
        );
        if (actor?.id === modal.user.id) await api.initialize();
      }
    } catch (error) {
      if (
        modal.kind === "resend" &&
        error instanceof ApiError &&
        [0, 503].includes(error.status)
      ) {
        complete(
          "No se confirmó la entrega del correo. Revisa el estado de la invitación antes de volver a reenviarla; el enlace anterior puede haberse invalidado.",
          true,
        );
      } else if (
        error instanceof ApiError &&
        [404, 409].includes(error.status)
      ) {
        complete(usersError(error), true);
      } else {
        setFailure(usersError(error));
        refresh();
      }
    } finally {
      setBusy(false);
    }
  };
  if (!actor) return null;
  const title =
    modal?.kind === "invite"
      ? "Enviar invitación"
      : modal?.kind === "edit"
        ? "Editar usuario"
        : modal?.kind === "status"
          ? modal.user.enabled
            ? "Deshabilitar acceso"
            : "Habilitar acceso"
          : modal?.kind === "resend"
            ? "Reenviar invitación"
            : modal?.kind === "revoke"
              ? "Revocar invitación"
              : modal?.kind === "user"
                ? "Detalle del usuario"
                : "Detalle de la invitación";
  return (
    <>
      <PageMeta
        title="Usuarios e invitaciones | BlueCare"
        description="Administración de usuarios e invitaciones"
      />
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="bc-title">Usuarios y permisos</h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Administra las cuentas y el acceso de tu equipo.
          </p>
        </div>
        {has(actor, "invitations:create", "roles:assign") && (
          <Button onClick={() => open({ kind: "invite" })}>
            Invitar usuario
          </Button>
        )}
      </div>
      <nav
        aria-label="Administración de accesos"
        className="mb-6 flex gap-2 border-b border-gray-200 pb-3 dark:border-gray-800"
      >
        <Link
          className={isInvitations ? "bc-menu-link" : "bc-primary"}
          to="/usuarios"
          aria-current={!isInvitations ? "page" : undefined}
        >
          Usuarios
        </Link>
        <Link
          className={isInvitations ? "bc-primary" : "bc-menu-link"}
          to="/usuarios/invitaciones"
          aria-current={isInvitations ? "page" : undefined}
        >
          Invitaciones
        </Link>
      </nav>
      {notice && (
        <p
          role="status"
          className={`mb-5 rounded-xl p-5 text-sm ${warning ? "bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-100" : "bc-notice"}`}
        >
          {notice}
        </p>
      )}
      {!canList ? (
        <section className="bc-panel">
          <h2 className="font-medium">
            No tienes permiso para consultar este listado
          </h2>
          <p className="mt-2 text-sm">
            Solicita a un administrador el acceso necesario.
          </p>
        </section>
      ) : (
        <>
          <div className="mb-5 flex flex-wrap gap-3">
            <input
              className="bc-input max-w-80"
              placeholder="Buscar en esta página…"
              aria-label="Buscar en esta página"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <select
              className="bc-input w-auto"
              aria-label="Filtrar estado en esta página"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="">Todos los estados</option>
              {isInvitations ? (
                Object.entries(statusLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))
              ) : (
                <>
                  <option value="enabled">Habilitado</option>
                  <option value="disabled">Deshabilitado</option>
                  <option value="unverified">Sin verificar</option>
                </>
              )}
            </select>
            <Button
              variant="outline"
              disabled={loading || busy}
              onClick={refresh}
            >
              Actualizar
            </Button>
          </div>
          {loading ? (
            <section className="bc-panel" role="status">
              Cargando {isInvitations ? "invitaciones" : "usuarios"}…
            </section>
          ) : resource.error ? (
            <section className="bc-panel">
              <p role="alert" className="mb-4 text-red-500">
                {resource.error}
              </p>
              <Button variant="outline" onClick={refresh}>
                Reintentar listado
              </Button>
            </section>
          ) : (
            <>
              <div className="bc-panel overflow-x-auto">
                <table className="w-full min-w-200 text-left text-sm">
                  <thead className="bg-blue-50 text-xs text-blue-600 dark:bg-[#1b3046] dark:text-blue-300">
                    <tr>
                      {(isInvitations
                        ? [
                            "Persona invitada",
                            "Roles",
                            "Estado",
                            "Correo / vigencia",
                            "Acciones",
                          ]
                        : [
                            "Usuario",
                            "Roles",
                            "Acceso",
                            "Verificación",
                            "Acciones",
                          ]
                      ).map((label) => (
                        <th
                          key={label}
                          className="px-4 py-4 font-medium"
                          scope="col"
                        >
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {isInvitations
                      ? invitations.map((invitation) => (
                          <tr
                            key={invitation.id}
                            className="border-b border-gray-100 dark:border-gray-800"
                          >
                            <td className="px-4 py-5">
                              <p className="font-medium">
                                {invitation.firstName} {invitation.lastName}
                              </p>
                              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                {invitation.email}
                              </p>
                            </td>
                            <td className="px-4 py-5">
                              {invitation.roles.map(roleLabel).join(", ")}
                            </td>
                            <td className="px-4 py-5">
                              {statusLabels[invitationState(invitation, now)]}
                            </td>
                            <td className="px-4 py-5">
                              <p
                                className={
                                  invitation.deliveryStatus === "failed"
                                    ? "text-red-500"
                                    : ""
                                }
                              >
                                {deliveryLabels[invitation.deliveryStatus]}
                              </p>
                              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                Vence: {date(invitation.expiresAt)}
                              </p>
                            </td>
                            <td className="px-4 py-5">
                              <div className="flex flex-wrap gap-3">
                                <button
                                  className="bc-link"
                                  onClick={() =>
                                    open({ kind: "invitation", invitation })
                                  }
                                >
                                  Ver detalle
                                </button>
                                {has(
                                  actor,
                                  "invitations:resend",
                                  "roles:assign",
                                ) &&
                                  ["pending", "expired"].includes(
                                    invitationState(invitation, now),
                                  ) && (
                                    <button
                                      disabled={
                                        busy ||
                                        !canResend(actor, invitation, now)
                                      }
                                      className="bc-link disabled:cursor-default disabled:opacity-50"
                                      onClick={() =>
                                        open({ kind: "resend", invitation })
                                      }
                                    >
                                      {resendWait(invitation, now) > 0
                                        ? `Reenviar en ${resendWait(invitation, now)} s`
                                        : "Reenviar"}
                                    </button>
                                  )}
                                {canRevoke(actor, invitation, now) && (
                                  <button
                                    className="bc-link text-red-500"
                                    disabled={busy}
                                    onClick={() =>
                                      open({ kind: "revoke", invitation })
                                    }
                                  >
                                    Revocar
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      : users.map((user) => (
                          <tr
                            key={user.id}
                            className="border-b border-gray-100 dark:border-gray-800"
                          >
                            <td className="px-4 py-5">
                              <p className="font-medium">
                                {user.name}
                                {user.id === actor.id ? " (tú)" : ""}
                              </p>
                              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                {user.email}
                              </p>
                            </td>
                            <td className="px-4 py-5">
                              {user.roles.map(roleLabel).join(", ") ||
                                "Sin roles"}
                            </td>
                            <td className="px-4 py-5">
                              {user.enabled ? "Habilitado" : "Deshabilitado"}
                            </td>
                            <td className="px-4 py-5">
                              {user.verified
                                ? "Correo verificado"
                                : "Sin verificar"}
                            </td>
                            <td className="px-4 py-5">
                              <div className="flex flex-wrap gap-3">
                                <button
                                  className="bc-link"
                                  onClick={() => open({ kind: "user", user })}
                                >
                                  Ver detalle
                                </button>
                                {canEdit(actor, user) && (
                                  <>
                                    <button
                                      className="bc-link"
                                      disabled={busy}
                                      onClick={() =>
                                        open({ kind: "edit", user })
                                      }
                                    >
                                      Editar
                                    </button>
                                    <button
                                      className="bc-link"
                                      disabled={busy}
                                      onClick={() =>
                                        open({ kind: "status", user })
                                      }
                                    >
                                      {user.enabled
                                        ? "Deshabilitar"
                                        : "Habilitar"}
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                  </tbody>
                </table>
                {!(isInvitations ? invitations : users).length && (
                  <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                    {query || filter
                      ? "No hay coincidencias en esta página."
                      : isInvitations
                        ? "Todavía no hay invitaciones."
                        : "No hay usuarios para mostrar."}
                  </p>
                )}
              </div>
              <div className="mt-5 flex flex-wrap items-center justify-between gap-4 text-sm">
                <p>
                  {isInvitations ? invitations.length : users.length} visibles
                  en esta página · {resource.total} en total
                </p>
                <div className="flex items-center gap-3">
                  <label>
                    Por página{" "}
                    <select
                      aria-label="Registros por página"
                      className="ml-2 rounded-lg border border-gray-200 bg-white px-2 py-2 dark:border-gray-700 dark:bg-gray-900"
                      value={limit}
                      onChange={(e) => {
                        setLimit(Number(e.target.value));
                        setOffset(0);
                      }}
                    >
                      {[10, 25, 50].map((size) => (
                        <option key={size}>{size}</option>
                      ))}
                    </select>
                  </label>
                  <Button
                    variant="outline"
                    disabled={offset === 0 || busy}
                    onClick={() => setOffset(Math.max(0, offset - limit))}
                  >
                    Anterior
                  </Button>
                  <span>
                    Página {Math.floor(offset / limit) + 1} de{" "}
                    {Math.max(1, Math.ceil(resource.total / limit))}
                  </span>
                  <Button
                    variant="outline"
                    disabled={offset + limit >= resource.total || busy}
                    onClick={() => setOffset(offset + limit)}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            </>
          )}
        </>
      )}
      <Dialog
        open={!!modal}
        onOpenChange={(value) => {
          if (!value && !busy) setModal(null);
        }}
      >
        <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-xl">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {modal?.kind === "invite"
              ? "La invitación se envía al correo indicado. El destinatario configura su propia contraseña."
              : modal?.kind === "resend"
                ? "Se invalidará el enlace anterior y se enviará uno nuevo con 24 horas de vigencia."
                : modal?.kind === "revoke"
                  ? "El enlace dejará de funcionar. La invitación se conservará en el historial."
                  : modal?.kind === "status"
                    ? modal.user.enabled
                      ? "El usuario perderá el acceso. Esta operación puede revertirse habilitando su cuenta."
                      : "El usuario podrá iniciar sesión si su correo ya está verificado."
                    : "Información de la cuenta registrada en BlueCare."}
          </DialogDescription>
          {modal?.kind === "invite" && (
            <InvitationForm
              actor={actor}
              onBusy={setBusy}
              onComplete={complete}
            />
          )}
          {modal?.kind === "edit" && (
            <UserForm
              actor={actor}
              target={modal.user}
              onBusy={setBusy}
              onComplete={complete}
            />
          )}
          {modal?.kind === "user" && (
            <dl className="mt-5 space-y-4">
              {[
                ["Nombre", modal.user.name],
                ["Correo", modal.user.email],
                ["Roles", modal.user.roles.map(roleLabel).join(", ")],
                ["Acceso", modal.user.enabled ? "Habilitado" : "Deshabilitado"],
                [
                  "Verificación",
                  modal.user.verified ? "Verificado" : "Sin verificar",
                ],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs text-gray-500 dark:text-gray-400">
                    {label}
                  </dt>
                  <dd className="break-words">{value}</dd>
                </div>
              ))}
            </dl>
          )}
          {modal?.kind === "invitation" && (
            <dl className="mt-5 space-y-4">
              {[
                [
                  "Destinatario",
                  `${modal.invitation.firstName} ${modal.invitation.lastName} · ${modal.invitation.email}`,
                ],
                [
                  "Invitado por",
                  modal.invitation.invitedByName ||
                    modal.invitation.invitedByEmail ||
                    "No disponible",
                ],
                ["Roles", modal.invitation.roles.map(roleLabel).join(", ")],
                [
                  "Estado",
                  statusLabels[invitationState(modal.invitation, now)],
                ],
                ["Entrega", deliveryLabels[modal.invitation.deliveryStatus]],
                ["Creada", date(modal.invitation.createdAt)],
                ["Vencimiento", date(modal.invitation.expiresAt)],
                ["Último intento", date(modal.invitation.lastSendAttemptAt)],
                ["Último envío", date(modal.invitation.lastSentAt)],
                ["Aceptada", date(modal.invitation.acceptedAt)],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs text-gray-500 dark:text-gray-400">
                    {label}
                  </dt>
                  <dd className="break-words">{value}</dd>
                </div>
              ))}
            </dl>
          )}
          {modal && ["resend", "revoke", "status"].includes(modal.kind) && (
            <form
              className="mt-5 space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                void perform();
              }}
            >
              <p className="text-sm font-medium">
                {"invitation" in modal
                  ? modal.invitation.email
                  : "user" in modal
                    ? modal.user.name
                    : ""}
              </p>
              {modal.kind !== "resend" && (
                <label className="block text-sm">
                  Motivo (opcional)
                  <textarea
                    className="bc-input mt-2"
                    maxLength={500}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    disabled={busy}
                  />
                </label>
              )}
              {failure && (
                <p role="alert" className="text-sm text-red-500">
                  {failure}
                </p>
              )}
              <Button
                type="submit"
                disabled={
                  busy ||
                  (modal.kind === "resend" &&
                    !canResend(actor, modal.invitation, now)) ||
                  (modal.kind === "revoke" &&
                    !canRevoke(actor, modal.invitation, now))
                }
              >
                {busy ? "Procesando…" : "Confirmar"}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
