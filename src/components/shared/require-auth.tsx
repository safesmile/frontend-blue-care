import { useEffect } from "react";
import { Link, Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
export default function RequireAuth() {
  const auth = useAuth();
  const location = useLocation();
  useEffect(() => {
    void api.initialize();
  }, []);
  if (auth.status === "loading")
    return (
      <main className="flex min-h-svh items-center justify-center text-gray-600 dark:text-gray-300">
        <p role="status">Comprobando tu sesión…</p>
      </main>
    );
  if (auth.status === "error")
    return (
      <main className="mx-auto max-w-lg p-8 text-gray-700 dark:text-gray-200">
        <h1 className="bc-title">No pudimos comprobar tu sesión</h1>
        <p role="alert" className="my-5">
          {auth.error}
        </p>
        <Button onClick={() => void api.initialize()}>Reintentar</Button>
        <Link className="bc-link ml-4" to="/iniciar-sesion">
          Ir al inicio de sesión
        </Link>
      </main>
    );
  if (auth.status === "anonymous")
    return (
      <Navigate
        to="/iniciar-sesion"
        state={{ from: location.pathname + location.search }}
        replace
      />
    );
  return <Outlet />;
}
