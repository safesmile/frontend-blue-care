import { peopleMessages } from "@/lib/session-messages";
import { SessionControls } from "@/components/shared/session-controls";
import { canOpenRoute } from "@/lib/access-context";
import { useAuth } from "@/hooks/use-auth";
import { getInitials } from "@/utils/get-initials";
import { LogoutButton } from "@/components/shared/logout-button";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";
import ThemeToggleButton from "@/components/shared/header/theme-toggler";
import { BellIcon, MenuTwoIcon, SearchIcon, ChevronDownIcon } from "@/icons";
const destinations = [
  ["Resumen", "/"],
  ["Pacientes", "/pacientes"],
  ["Membresías", "/membresias"],
  ["Planes y versiones", "/planes"],
  ["Beneficios y consumos", "/beneficios"],
  ["Prevención dental", "/prevencion"],
  ["Clínicas", "/clinicas"],
  [peopleMessages().collaborators, "/colaboradores"],
  [peopleMessages().history, "/colaboradores/invitaciones"],
  ["Auditoría", "/auditoria"],
];
export default function AppHeader() {
  const { user } = useAuth();
  const { toggleSidebar } = useSidebar();
  const [panel, setPanel] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const close = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setPanel(null);
    };
    const escape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPanel(null);
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", escape);
    };
  }, []);
  const toggle = (name: string) => setPanel(panel === name ? null : name);
  return (
    <header
      ref={ref}
      className="relative z-50 mx-4 mt-4 flex flex-wrap items-center gap-3 rounded-xl bg-white p-4 md:mx-6 md:mt-6 dark:bg-[#142539]"
    >
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleSidebar}
        aria-label="Abrir o cerrar menú"
      >
        <MenuTwoIcon />
      </Button>
      <SessionControls />
      <div className="relative order-last w-full sm:order-none sm:w-auto sm:flex-1">
        <label className="flex items-center gap-2 rounded-lg bg-blue-50 px-3 dark:bg-[#1b3046]">
          <SearchIcon className="size-5" />
          <input
            className="w-full border-0 bg-transparent py-3 text-sm outline-none focus:ring-0 dark:text-gray-200"
            aria-label="Búsqueda global"
            placeholder="Buscar usuarios o apartados…"
            value={query}
            onFocus={() => setPanel("search")}
            onChange={(e) => {
              setQuery(e.target.value);
              setPanel("search");
            }}
          />
        </label>
        {panel === "search" && (
          <section className="bc-popover right-0 left-0 mt-2">
            <h2 className="mb-3 font-medium">
              {query ? `Resultados para «${query}»` : "Accesos rápidos"}
            </h2>
            {destinations
              .filter(
                ([name, to]) =>
                  canOpenRoute(user, to) &&
                  name.toLowerCase().includes(query.toLowerCase()),
              )
              .map(([name, to]) => (
                <Link
                  onClick={() => setPanel(null)}
                  className="bc-menu-link"
                  key={to}
                  to={to}
                >
                  {name}
                </Link>
              ))}
            {!destinations.some(
              ([name, to]) =>
                canOpenRoute(user, to) &&
                name.toLowerCase().includes(query.toLowerCase()),
            ) && <p>No se encontraron resultados.</p>}
          </section>
        )}
      </div>
      <ThemeToggleButton />
      <div className="relative">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Notificaciones"
          aria-expanded={panel === "notifications"}
          onClick={() => toggle("notifications")}
        >
          <BellIcon />
        </Button>
        {panel === "notifications" && (
          <section className="bc-popover right-0 mt-3 w-76">
            <h2 className="mb-3 font-medium">Notificaciones · 3 nuevas</h2>
            {[
              ["32 membresías próximas a vencer", "/membresias"],
              ["Limpieza de Santiago · 15 nov", "/prevencion"],
              ["Nuevo acceso pendiente de verificar", "/usuarios"],
            ].map(([name, to]) => (
              <Link
                className="bc-menu-link"
                to={to}
                key={to}
                onClick={() => setPanel(null)}
              >
                {name}
              </Link>
            ))}
          </section>
        )}
      </div>
      <div className="relative">
        <Button
          variant="ghost"
          aria-expanded={panel === "user"}
          onClick={() => toggle("user")}
        >
          <span className="flex size-9 items-center justify-center rounded-full bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200">
            {getInitials(user?.name || "")}
          </span>
          <span className="hidden md:inline">{user?.name}</span>
          <ChevronDownIcon />
        </Button>
        {panel === "user" && (
          <section className="bc-popover right-0 mt-3 w-60">
            <h2 className="font-medium">{user?.name}</h2>
            <p className="my-2 text-xs text-gray-500 dark:text-gray-400">
              {user?.roles.join(", ")}
            </p>
            <Link
              to="/mi-cuenta"
              className="bc-menu-link"
              onClick={() => setPanel(null)}
            >
              Mi cuenta y seguridad
            </Link>
            <LogoutButton />
          </section>
        )}
      </div>
    </header>
  );
}
