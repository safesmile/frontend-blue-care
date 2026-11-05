import { useState } from "react";
import { Link } from "react-router";
import { PageMeta } from "@/components/shared/page-meta";
import { PageBreadcrumb } from "@/components/shared/page-breadcrumb";
import { Button } from "@/components/ui/button";
export default function MembershipAssignmentPage() {
  const [saved, setSaved] = useState(false);
  return (
    <>
      <PageMeta
        title="Asignar o renovar membresía | BlueCare"
        description="Asignación de membresía"
      />
      <PageBreadcrumb pageTitle="Asignar o renovar membresía" />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setSaved(true);
        }}
      >
        <div className="mb-6 flex gap-3">
          <Button type="submit">Guardar membresía</Button>
          <Link className="bc-link self-center" to="/membresias">
            Volver
          </Link>
        </div>
        <section className="bc-panel">
          <div className="bc-form-grid">
            <label>
              Paciente
              <select className="bc-input mt-2" required>
                <option>Santiago Izquierdo</option>
                <option>María García</option>
                <option>Carlos Pérez</option>
              </select>
            </label>
            <label>
              Plan publicado
              <select className="bc-input mt-2">
                <option>Blue Care+ · versión 1</option>
              </select>
            </label>
            <label>
              Fecha de inicio
              <input
                required
                className="bc-input mt-2"
                type="date"
                defaultValue="2027-05-30"
              />
            </label>
            <label>
              Fecha de fin
              <input
                required
                min="2027-05-31"
                className="bc-input mt-2"
                type="date"
                defaultValue="2028-05-30"
              />
            </label>
            <label>
              Clínica de origen
              <select className="bc-input mt-2">
                <option>Sede Central</option>
                <option>Sede Norte</option>
              </select>
            </label>
            <label>
              Estado inicial
              <input className="bc-input mt-2" readOnly value="Pendiente" />
            </label>
          </div>
        </section>
      </form>
      <p className="my-5 text-sm">
        La renovación conserva el contrato y los consumos anteriores. Cobro y
        reglas de vigencia pendientes de validación.
      </p>
      {saved && (
        <p className="bc-notice" role="status">
          Membresía preparada en vista previa. Pendiente de guardar mediante la
          API.
        </p>
      )}
    </>
  );
}
