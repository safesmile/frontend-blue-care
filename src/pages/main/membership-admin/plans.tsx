import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { DynamicTable } from "@/components/shared/dynamic-table";
import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { EyeIcon, PlusIcon } from "@/icons";
import { planSettingsMessages } from "@/lib/session-messages";
import { BenefitPicker } from "./plan-benefits";
import {
  plans,
  save,
  type Plan,
  type PlanBenefit,
  type PlanVersion,
} from "./api";
import {
  ActionLink,
  AdminForm,
  AdminPage,
  Input,
  InfoFact,
  Loading,
  TextArea,
  codePattern,
  field,
  money,
  useGrants,
  useMutation,
  useResource,
} from "./shared";
import { Revisions } from "./revisions";

export function PlansPage() {
  const has = useGrants();
  return (
    <AdminPage
      title="Planes"
      description="Define la oferta comercial, el precio y las condiciones que el paciente acepta al contratar."
    >
      <DynamicTable<Plan>
        title="Catálogo de planes"
        rowKey={(row) => row.id}
        load={plans}
        toolbar={
          <div className="flex flex-wrap gap-2">
            <ActionLink to="/planes/vista-previa">
              {planSettingsMessages().viewOffers}
            </ActionLink>
            {has("plans:create") && has("plans:read") && (
              <ActionLink to="/planes/nuevo">Nuevo plan</ActionLink>
            )}
          </div>
        }
        columns={[
          {
            id: "code",
            label: "Código",
            value: (row) => row.code,
            sortable: true,
            filter: { type: "contains" },
          },
          {
            id: "name",
            label: "Nombre vigente",
            value: (row) => row.currentVersion?.name,
          },
          {
            id: "monthly",
            label: "Mensual",
            value: (row) =>
              row.currentVersion
                ? money(row.currentVersion.monthlyPriceCents)
                : null,
          },
          {
            id: "annual",
            label: "Anual",
            value: (row) =>
              row.currentVersion
                ? money(row.currentVersion.annualPriceCents)
                : null,
          },
          {
            id: "enabled",
            label: "Contratación",
            sortable: true,
            value: (row) =>
              !row.enabled
                ? "Desactivada"
                : row.currentVersion
                  ? "Disponible"
                  : "Sin publicar",
          },
        ]}
        actions={
          has("plans:read")
            ? [
                {
                  label: "Gestionar plan",
                  icon: <EyeIcon aria-hidden="true" className="size-4" />,
                  to: (row) => "/planes/" + row.id,
                },
              ]
            : undefined
        }
      />
    </AdminPage>
  );
}

export function NewPlanPage() {
  const navigate = useNavigate();
  return (
    <AdminPage
      title="Nuevo plan"
      description="Crea el identificador del plan. Después podrás preparar y publicar su primera versión."
      back={["/planes", "Volver a planes"]}
    >
      <AdminForm
        title="Identidad comercial"
        action="Crear plan"
        success="Plan creado."
        onSave={async (values) => {
          const plan = await save<Plan>("/plans", {
            code: field(values, "code"),
          });
          void navigate("/planes/" + plan.id, { replace: true });
        }}
      >
        <Input
          label="Código único (por ejemplo, blue-care)"
          name="code"
          pattern={codePattern}
          maxLength={60}
        />
      </AdminForm>
    </AdminPage>
  );
}

export function PlanPage() {
  const t = planSettingsMessages();
  const { id } = useParams();
  const has = useGrants();
  const [refresh, setRefresh] = useState(0);
  const [changing, setChanging] = useState(false);
  const mutation = useMutation();
  const changed = () => setRefresh((value) => value + 1);
  const path = "/plans/" + encodeURIComponent(id ?? "");
  const result = useResource<Plan>(path, refresh);
  const plan = result?.data;
  const version = plan?.currentVersion ?? plan?.latestDraft;
  const benefits =
    version && !version.publishedAt && version.benefitIds != null
      ? (plan?.draftBenefits ?? [])
      : (plan?.benefits ?? []);
  return (
    <AdminPage
      title={version?.name ?? plan?.code ?? "Gestionar plan"}
      description={t.detailHint}
      back={["/planes", "Volver a planes"]}
      actions={
        plan && (
          <>
            {has("plans:update") && (
              <Button variant="outline" onClick={() => setChanging(true)}>
                {plan.enabled
                  ? "Desactivar contratación"
                  : "Habilitar contratación"}
              </Button>
            )}
            <ActionLink to={"/planes/" + plan.id + "/vista-previa"}>
              <EyeIcon aria-hidden="true" className="size-4" /> {t.preview}
            </ActionLink>
            {has("plans:version") && (
              <Link
                to={"/planes/" + plan.id + "/versiones/nueva"}
                className={buttonVariants()}
              >
                <PlusIcon aria-hidden="true" className="size-4" />{" "}
                {t.newVersion}
              </Link>
            )}
          </>
        )
      }
    >
      {!plan ? (
        <Loading error={result?.error} onRetry={changed} />
      ) : (
        <>
          <section className="bc-panel overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">{t.planInfo}</h2>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="rounded-full bg-blue-50 px-3 py-1 font-medium text-blue-900 dark:bg-blue-950 dark:text-blue-200">
                  {!plan.enabled
                    ? "Contratación desactivada"
                    : plan.currentVersion
                      ? "Disponible"
                      : t.draft}
                </span>
                {version && (
                  <span className="text-gray-600 dark:text-gray-400">
                    {t.versionLabel} {version.number} ·{" "}
                    {version.publishedAt ? t.currentVersion : t.draftVersion}
                  </span>
                )}
              </div>
            </div>
            <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <InfoFact
                label={t.monthlyPrice}
                value={
                  version ? money(version.monthlyPriceCents) : t.unconfigured
                }
                price
              />
              <InfoFact
                label={t.annualPrice}
                value={
                  version ? money(version.annualPriceCents) : t.unconfigured
                }
                price
              />
              <InfoFact
                label={t.familyLabel}
                value={String(
                  !plan.currentVersion && version?.maxBeneficiaries != null
                    ? version.maxBeneficiaries
                    : (plan.maxBeneficiaries ?? 4),
                )}
              />
              <InfoFact label={t.planCode} value={plan.code} />
            </dl>
            <dl className="mt-5 grid gap-4 border-t border-gray-100 pt-5 md:grid-cols-2 dark:border-gray-700">
              <div>
                <dt className="text-sm font-semibold">{t.planName}</dt>
                <dd className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                  {version?.name ?? t.unconfigured}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-semibold">{t.taxTerms}</dt>
                <dd className="mt-1 text-sm whitespace-pre-wrap text-gray-600 dark:text-gray-300">
                  {version?.taxDisclosure ?? t.unconfigured}
                </dd>
              </div>
              <div className="md:col-span-2">
                <dt className="text-sm font-semibold">{t.planDescription}</dt>
                <dd className="mt-1 text-sm whitespace-pre-wrap text-gray-600 dark:text-gray-300">
                  {version?.description ?? t.unconfigured}
                </dd>
              </div>
            </dl>
          </section>
          <DynamicTable<PlanBenefit>
            title={t.assignedTitle}
            rows={benefits}
            rowKey={(benefit) => benefit.id}
            columns={[
              {
                id: "name",
                label: t.benefit,
                value: (row) => row.name ?? row.code,
                sortable: true,
                filter: { type: "contains" },
              },
              {
                id: "kind",
                label: t.kindLabel,
                value: (row) => t.kinds[row.kind],
                sortable: true,
              },
              {
                id: "audience",
                label: t.audienceLabel,
                value: (row) => t.audiences[row.audience],
              },
              {
                id: "period",
                label: t.periodLabel,
                value: (row) => t.periods[row.period],
              },
              {
                id: "units",
                label: t.unitsLabel,
                value: (row) => row.limitUnits,
              },
              {
                id: "status",
                label: t.status,
                value: (row) =>
                  row.enabled === null
                    ? t.draft
                    : row.enabled
                      ? t.active
                      : t.inactive,
              },
            ]}
          />
          <Revisions<PlanVersion>
            path={path + "/versions"}
            current={version?.id}
            refresh={refresh}
            onChange={changed}
            canPublish={has("plans:publish")}
            preview={(item) => (
              <div className="space-y-2 text-sm">
                <p>
                  {money(item.monthlyPriceCents)} mensual ·{" "}
                  {money(item.annualPriceCents)} anual
                </p>
                <p>{item.taxDisclosure}</p>
                {item.maxBeneficiaries != null && (
                  <p>
                    {t.familyLabel} · {item.maxBeneficiaries}
                  </p>
                )}
                {item.benefitIds && (
                  <p>
                    {t.assignedTitle} · {item.benefitIds.length}
                  </p>
                )}
                <ul className="list-disc ps-5">
                  {item.benefitDescriptions.map((description, index) => (
                    <li key={index}>{description}</li>
                  ))}
                </ul>
              </div>
            )}
            effect={t.publishEffect}
            extra={[
              {
                id: "monthly",
                label: "Mensual",
                value: (item) => money(item.monthlyPriceCents),
              },
              {
                id: "annual",
                label: "Anual",
                value: (item) => money(item.annualPriceCents),
              },
            ]}
          />
          <ConfirmationDialog
            open={changing}
            title={
              plan.enabled
                ? "Desactivar contratación"
                : "Habilitar contratación"
            }
            description="Este cambio afecta la disponibilidad para nuevas contrataciones. Las membresías existentes mantienen su vigencia y sus condiciones."
            confirmLabel="Confirmar"
            destructive={plan.enabled}
            onClose={() => setChanging(false)}
            onConfirm={() =>
              mutation.run(async () => {
                await save(path, { enabled: !plan.enabled }, "PATCH");
                changed();
              }, "Disponibilidad actualizada.")
            }
          />
        </>
      )}
    </AdminPage>
  );
}

export function NewPlanVersionPage() {
  const { id = "" } = useParams();
  const t = planSettingsMessages();
  const [retry, setRetry] = useState(0);
  const path = "/planes/" + encodeURIComponent(id);
  const result = useResource<Plan>("/plans/" + encodeURIComponent(id), retry);
  return (
    <AdminPage
      title={t.newVersion}
      description={t.versionHint}
      back={[path, t.backToPlan]}
    >
      {result?.data ? (
        <VersionEditor key={id} plan={result.data} />
      ) : (
        <Loading
          error={result?.error}
          onRetry={() => setRetry((value) => value + 1)}
        />
      )}
    </AdminPage>
  );
}

function VersionEditor({ plan }: { plan: Plan }) {
  const t = planSettingsMessages();
  const navigate = useNavigate();
  const has = useGrants();
  const canSelectBenefits = has("benefits:list");
  const canSetFamily = has("benefits:family-settings");
  const version = plan.currentVersion ?? plan.latestDraft;
  const [selected, setSelected] = useState<PlanBenefit[]>(
    version && !version.publishedAt && version.benefitIds != null
      ? (plan.draftBenefits ?? [])
      : (plan.benefits ?? []),
  );
  return (
    <>
      <AdminForm
        title={version?.name ?? plan.code}
        description={t.priceHint}
        action="Guardar borrador"
        success="Borrador del plan guardado."
        onSave={async (values) => {
          await save("/plans/" + encodeURIComponent(plan.id) + "/versions", {
            name: field(values, "name"),
            description: field(values, "description"),
            monthlyPriceCents: Math.round(
              Number(field(values, "monthly")) * 100,
            ),
            annualPriceCents: Math.round(Number(field(values, "annual")) * 100),
            taxDisclosure: field(values, "tax"),
            ...(canSetFamily
              ? { maxBeneficiaries: Number(field(values, "maxBeneficiaries")) }
              : {}),
            ...(canSelectBenefits
              ? { benefitIds: selected.map((benefit) => benefit.id) }
              : {}),
          });
          void navigate("/planes/" + plan.id, { replace: true });
        }}
      >
        <Input
          label="Nombre del plan"
          name="name"
          value={version?.name}
          maxLength={120}
        />
        <TextArea
          label="Descripción comercial"
          name="description"
          value={version?.description}
          maxLength={2000}
        />
        <Input
          label={t.monthlyPrice}
          name="monthly"
          type="number"
          min={5}
          max={1000000}
          step={0.01}
          value={version ? version.monthlyPriceCents / 100 : undefined}
        />
        <Input
          label={t.annualPrice}
          name="annual"
          type="number"
          min={5}
          max={10000000}
          step={0.01}
          value={version ? version.annualPriceCents / 100 : undefined}
        />
        <TextArea
          label="Condiciones fiscales del precio"
          name="tax"
          value={version?.taxDisclosure}
          maxLength={1000}
        />
        {canSetFamily && (
          <div className="space-y-1">
            <Input
              label={t.familyLabel}
              name="maxBeneficiaries"
              type="number"
              min={0}
              max={100}
              step={1}
              value={
                plan.currentVersion
                  ? (plan.maxBeneficiaries ?? 4)
                  : (version?.maxBeneficiaries ?? plan.maxBeneficiaries ?? 4)
              }
            />
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {t.familyHint}
            </p>
          </div>
        )}
        {canSelectBenefits && (
          <BenefitPicker selected={selected} onChange={setSelected} />
        )}
      </AdminForm>
    </>
  );
}
