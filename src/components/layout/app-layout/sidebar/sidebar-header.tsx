import { SidebarHeader } from "@/components/ui/sidebar";
import { BrandLogo } from "@/components/shared/brand-logo";
import { Link } from "react-router";
export default function AppSidebarHeader({
  showContent,
}: {
  showContent: boolean;
}) {
  return (
    <SidebarHeader className="px-5 py-6">
      <Link to="/" aria-label="BlueCare, inicio">
        <BrandLogo className={showContent ? "mx-auto w-40" : "w-10"} />
      </Link>
    </SidebarHeader>
  );
}
