import { peopleMessages } from "@/lib/session-messages";
import { BackLink } from "@/components/shared/navigation-actions";
import { useState } from "react";
import { PageMeta } from "@/components/shared/page-meta";
import { PageBreadcrumb } from "@/components/shared/page-breadcrumb";
import { Button } from "@/components/ui/button";
export default function ConsumptionRegistrationPage() {
  const [confirmed, setConfirmed] = useState(false);
  return (
    <>
      <PageMeta
        title="Registrar consumo | BlueCare"
        description="Registro de consumo de beneficios"
      />
      <PageBreadcrumb pageTitle="Registrar consumo" />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setConfirmed(true);
        }}
      >
        <div className="mb-6 flex gap-4">
          <Button type="submit" disabled={confirmed}>
            {confirmed ? "Consumo preparado" : "Confirmar consumo"}
          </Button>
          <BackLink className="self-center" to="/beneficios">
            {peopleMessages().backToBenefits}
          </BackLink>
        </div>
        <section className="bc-panel bc-form-grid">
          <label>
            Paciente
            <input
              className="bc-input mt-2"
              readOnly
              value="Santiago Izquierdo"
            />
          </label>
          <label>
            Beneficio
            <select className="bc-input mt-2">
              <option>Limpieza preventiva</option>
              <option>Evaluación dental</option>
            </select>
          </label>
          <label>
            Saldo compartido
            <input
              className="bc-input mt-2"
              readOnly
              value={
                confirmed
                  ? "0 restantes (vista previa)"
                  : "1 → 0 después de confirmar"
              }
            />
          </label>
          <label>
            Clínica
            <select className="bc-input mt-2">
              <option>Sede Norte</option>
              <option>Sede Central</option>
            </select>
          </label>
          <label>
            Responsable
            <input className="bc-input mt-2" readOnly value="Ana López" />
          </label>
          <label>
            Fecha
            <input
              className="bc-input mt-2"
              required
              type="date"
              defaultValue="2026-10-28"
            />
          </label>
        </section>
      </form>
      <p className="my-5 text-sm">
        Se debe verificar vigencia y saldo antes de confirmar en el sistema.
      </p>
      {confirmed && (
        <p role="status" className="bc-notice">
          Consumo preparado en vista previa. No se ha descontado ningún
          beneficio real.
        </p>
      )}
    </>
  );
}
