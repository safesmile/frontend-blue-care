import { Link } from "react-router";
import { PageMeta } from "@/components/shared/page-meta";
import { PageBreadcrumb } from "@/components/shared/page-breadcrumb";
import { RecordsTable } from "@/components/shared/records-table";
export default function PatientDetailPage() {
  return (
    <>
      <PageMeta
        title="Santiago Izquierdo | BlueCare"
        description="Detalle del paciente"
      />
      <PageBreadcrumb pageTitle="Santiago Izquierdo" />
      <div className="mb-6 flex flex-wrap gap-3">
        <Link className="bc-primary" to="/pacientes">
          Volver a pacientes
        </Link>
        <Link className="bc-primary" to="/membresias/asignar">
          Renovar membresía
        </Link>
        <Link className="bc-primary" to="/beneficios">
          Ver beneficios
        </Link>
      </div>
      <RecordsTable
        headers={["Dato", "Valor", "Estado"]}
        rows={[
          ["Membresía", "BC-2026-0001 · Blue Care+", "Activa"],
          ["Vigencia", "30 may 2026 – 30 may 2027", "Todas las clínicas"],
          ["Identidad digital", "Contacto verificado", "Vinculada"],
          ["Limpiezas preventivas", "1 utilizada · 1 restante", "Saldo global"],
        ]}
      />
      <section className="bc-panel mt-6">
        <h2 className="mb-5 text-lg font-medium">
          Línea temporal de prevención
        </h2>
        <ol className="space-y-5 border-l-2 border-teal-300 pl-5">
          <li>
            <strong>15 noviembre 2026</strong>
            <p className="text-sm">
              Limpieza preventiva · Programada · Sede Central
            </p>
          </li>
          <li>
            <strong>15 mayo 2026</strong>
            <p className="text-sm">
              Limpieza preventiva · Realizada · Sede Central
            </p>
          </li>
        </ol>
      </section>
    </>
  );
}
