import { useState, type ReactNode } from "react";
import { useNavigate } from "react-router";
import { api } from "@/lib/api";
import { authErrorMessage } from "@/lib/api-client";
export function LogoutButton({
  className = "bc-menu-link w-full text-left text-red-500",
  children = "Cerrar sesión",
}: {
  className?: string;
  children?: ReactNode;
}) {
  const navigate = useNavigate();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  return (
    <>
      <button
        type="button"
        className={className}
        disabled={pending}
        aria-label="Cerrar sesión"
        onClick={async () => {
          setPending(true);
          setError("");
          try {
            await api.logout();
            void navigate("/iniciar-sesion", { replace: true });
          } catch (error) {
            setError(authErrorMessage(error));
          } finally {
            setPending(false);
          }
        }}
      >
        {pending ? "Cerrando sesión…" : children}
      </button>
      {error && (
        <p role="alert" className="mt-2 text-xs text-red-500">
          {error} Vuelve a intentar cerrar sesión.
        </p>
      )}
    </>
  );
}
