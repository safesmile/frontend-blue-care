import { sessionMessages } from "@/lib/session-messages";
import { Link } from "react-router";
import { useAuth } from "@/hooks/use-auth";
import { PageMeta } from "@/components/shared/page-meta";
import { LogoutButton } from "@/components/shared/logout-button";
export default function AccountPage() {
  const { user } = useAuth();
  if (!user) return null;
  const text = sessionMessages();
  const clinics = user.clinics ?? [];
  const selected = clinics.find((clinic) => clinic.id === user.clinicId);
  return (
    <>
      <PageMeta
        title="Mi cuenta | BlueCare"
        description="Perfil y seguridad de tu cuenta"
      />
      <h1 className="bc-title mb-6">Mi cuenta</h1>
      <section className="bc-panel max-w-2xl">
        <h2 className="text-xl font-medium">{user.name}</h2>
        <p className="mt-2 break-all">{user.email}</p>
        <dl className="my-6 space-y-4">
          <div>
            <dt className="text-xs text-gray-500 dark:text-gray-400">Estado</dt>
            <dd>
              {user.verified
                ? "Correo verificado"
                : "Pendiente de verificación"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500 dark:text-gray-400">
              {text.globalRoles}
            </dt>
            <dd>{(user.globalRoles ?? user.roles).join(", ")}</dd>
          </div>
        </dl>
        <section className="mb-6 border-t border-gray-200 pt-5 dark:border-gray-700">
          <h2 className="text-lg font-medium">{text.access}</h2>
          <p className="mt-2">
            {user.mode === "staff" ? text.working : text.own}
          </p>
          {user.mode === "staff" ? (
            <>
              <h3 className="mt-4 font-medium">{text.selected}</h3>
              <p className="mt-1">
                {selected?.name ??
                  (clinics.length && !user.clinicId ? text.all : text.none)}
              </p>
              {!clinics.length && (
                <p
                  role="status"
                  className="mt-3 rounded-lg bg-blue-50 p-4 text-sm text-blue-900 dark:bg-blue-950 dark:text-blue-100"
                >
                  {text.unassigned}
                </p>
              )}
              {!!clinics.length && (
                <>
                  <h3 className="mt-4 font-medium">{text.clinics}</h3>
                  <ul className="mt-2 space-y-2">
                    {clinics.map((clinic) => (
                      <li
                        key={clinic.id}
                        className="rounded-lg border border-gray-200 p-3 dark:border-gray-700"
                      >
                        <strong className="font-medium">{clinic.name}</strong>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                          {clinic.roles.join(", ") || text.noRoles}
                        </p>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </>
          ) : (
            <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
              {text.personal}
            </p>
          )}
        </section>
        <div className="flex flex-col items-start gap-4">
          {user.permissions.includes("auth:password-change") && (
            <Link className="bc-link" to="/mi-cuenta/cambiar-contrasena">
              Cambiar contraseña
            </Link>
          )}
          {user.permissions.includes("auth:email-change") && (
            <Link className="bc-link" to="/mi-cuenta/cambiar-correo">
              Cambiar correo electrónico
            </Link>
          )}
          <LogoutButton />
        </div>
      </section>
    </>
  );
}
