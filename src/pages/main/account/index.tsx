import { Link } from "react-router";
import { useAuth } from "@/hooks/use-auth";
import { PageMeta } from "@/components/shared/page-meta";
import { LogoutButton } from "@/components/shared/logout-button";
export default function AccountPage() {
  const { user } = useAuth();
  if (!user) return null;
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
              Roles asignados
            </dt>
            <dd>{user.roles.join(", ")}</dd>
          </div>
        </dl>
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
