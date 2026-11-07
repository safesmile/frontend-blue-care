import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/lib/api";
import { canOpenRoute } from "@/lib/access-context";
import { Navigate, useLocation } from "react-router";
import AppHeader from "./header";
import AppSidebar from "./sidebar";
import { ScrollToTop } from "@/components/shared/scroll-to-top";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Outlet } from "react-router";

export default function AppLayout() {
  const { user, switching, contextVersion } = useAuth();
  const location = useLocation();
  useEffect(() => {
    const refresh = () => {
      void api.reloadProfile().catch(() => {
        /* Explicit refresh remains available. */
      });
    };
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, []);
  return (
    <SidebarProvider className="text-gray-700 dark:text-gray-200">
      <AppSidebar />
      <SidebarInset>
        <AppHeader />
        <main className="mx-auto w-full max-w-(--breakpoint-2xl) p-4 md:p-6">
          {!canOpenRoute(user, location.pathname) ? (
            <Navigate to="/mi-cuenta" replace />
          ) : (
            !switching && <Outlet key={contextVersion} />
          )}
        </main>
      </SidebarInset>
      <ScrollToTop />
    </SidebarProvider>
  );
}
