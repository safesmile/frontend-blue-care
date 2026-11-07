import { useState } from "react";
import { Link } from "react-router";
import { PageMeta } from "@/components/shared/page-meta";
import { RecordsTable } from "@/components/shared/records-table";
export default function DashboardPage() {
  const [today] = useState(() => new Date());
  const date = new Intl.DateTimeFormat("es-GT", {
    dateStyle: "full",
    timeZone: "America/Guatemala",
  }).format(today);
  return (
    <>
      <PageMeta
        title="Blue Care hoy | BlueCare"
        description="Resumen de membresías y prevención dental"
      />
      <h1 className="bc-title">Blue Care hoy</h1>
      <p className="mt-3 mb-6 text-sm">
        {date} · El cuidado continúa en todas nuestras clínicas.
      </p>
      <div className="mb-6 grid gap-5 sm:grid-cols-3">
        {[
          ["Miembros activos", "1,248"],
          ["Por vencer · 30 días", "32"],
          ["Próximas limpiezas", "47"],
        ].map(([label, value]) => (
          <section className="bc-panel" key={label}>
            <p className="text-sm">{label}</p>
            <p className="my-3 text-4xl font-medium text-blue-600 dark:text-blue-300">
              {value}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Datos de demostración
            </p>
          </section>
        ))}
      </div>
      <section className="bc-notice mb-6">
        <h2 className="text-lg font-medium">
          32 membresías necesitan seguimiento
        </h2>
        <p className="my-3 text-sm">
          Revisa las vigencias y conserva la continuidad de cada miembro.
        </p>
        <Link className="bc-primary inline-flex" to="/membresias">
          Revisar membresías
        </Link>
      </section>
      <RecordsTable
        headers={["Paciente", "Próximo cuidado", "Clínica", "Estado"]}
        rows={[
          [
            <Link key="santiago" className="bc-link" to="/pacientes">
              Santiago Izquierdo
            </Link>,
            "15 nov · Limpieza",
            "Sede Central",
            "Programado",
          ],
          ["María García", "16 nov · Evaluación", "Sede Norte", "Programado"],
          ["Carlos Pérez", "18 nov · Limpieza", "Sede Central", "Disponible"],
        ]}
      />
    </>
  );
}
