import { peopleMessages } from "@/lib/session-messages";
import { BackLink } from "@/components/shared/navigation-actions";
import { PageMeta } from "@/components/shared/page-meta";
export default function NotFoundPage() {
  return (
    <>
      <PageMeta
        title="Página no encontrada | BlueCare"
        description="Página no encontrada"
      />
      <section className="bc-panel text-center">
        <h1 className="bc-title">404 · Página no encontrada</h1>
        <BackLink to="/">{peopleMessages().backToSummary}</BackLink>
      </section>
    </>
  );
}
