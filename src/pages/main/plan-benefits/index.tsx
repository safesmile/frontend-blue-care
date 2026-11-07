import { peopleMessages } from "@/lib/session-messages";
import { BackLink } from "@/components/shared/navigation-actions";
import { useState } from "react";
import { PageMeta } from "@/components/shared/page-meta";
import { PageBreadcrumb } from "@/components/shared/page-breadcrumb";
import { Button } from "@/components/ui/button";
export default function PlanBenefitsPage() {
  const [saved, setSaved] = useState(false);
  return (
    <>
      <PageMeta
        title="Configurar beneficios del plan | BlueCare"
        description="Beneficios del plan"
      />
      <PageBreadcrumb pageTitle="Configurar beneficios del plan" />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setSaved(true);
        }}
      >
        <div className="mb-6 flex gap-4">
          <Button type="submit">Guardar borrador</Button>
          <BackLink className="self-center" to="/planes">
            {peopleMessages().backToPlans}
          </BackLink>
        </div>
        <section className="bc-panel">
          <div className="space-y-6">
            {["Limpieza preventiva", "Evaluación dental", "Tratamientos"].map(
              (name, i) => (
                <fieldset
                  key={name}
                  className="bc-form-grid border-b border-gray-100 pb-5 last:border-0 dark:border-gray-800"
                >
                  <legend className="mb-4 font-medium">{name}</legend>
                  <label>
                    Límite
                    <input
                      className="bc-input mt-2"
                      type="number"
                      min="0"
                      required
                      defaultValue={i === 0 ? 2 : 1}
                    />
                  </label>
                  <label>
                    Período
                    <select className="bc-input mt-2">
                      <option>Por definir</option>
                      <option>Anual</option>
                      <option>Según contrato</option>
                    </select>
                  </label>
                  <label>
                    Condición
                    <input
                      className="bc-input mt-2"
                      defaultValue={
                        i === 0
                          ? "Validar regla"
                          : i === 1
                            ? "Membresía activa"
                            : "Ver condiciones"
                      }
                    />
                  </label>
                </fieldset>
              ),
            )}
          </div>
        </section>
      </form>
      <p className="my-5 text-sm">
        Las nuevas versiones no modifican los derechos de membresías existentes.
        Cantidades ilustrativas.
      </p>
      {saved && (
        <p role="status" className="bc-notice">
          Borrador preparado en vista previa. Pendiente de guardar mediante la
          API.
        </p>
      )}
    </>
  );
}
