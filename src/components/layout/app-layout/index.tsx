import AppHeader from "./header";
import AppSidebar from "./sidebar";
import { ScrollToTop } from "@/components/shared/scroll-to-top";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Outlet } from "react-router";

export default function AppLayout() {
  return (
    <SidebarProvider className="text-gray-700 dark:text-gray-200">
      <AppSidebar />
      <SidebarInset>
        <AppHeader />
        <main className="mx-auto w-full max-w-(--breakpoint-2xl) p-4 md:p-6">
          <Outlet />
        </main>
      </SidebarInset>
      <ScrollToTop />
    </SidebarProvider>
  );
}
