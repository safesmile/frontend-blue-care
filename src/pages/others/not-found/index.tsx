import { Link } from "react-router";
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
        <Link className="bc-link" to="/">
          Volver al resumen
        </Link>
      </section>
    </>
  );
}
