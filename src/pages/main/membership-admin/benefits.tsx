import { useCallback, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router";
import { DynamicTable } from "@/components/shared/dynamic-table";
import { EyeIcon, PlusIcon } from "@/icons";
import { buttonVariants } from "@/components/ui/button";
import { planSettingsMessages } from "@/lib/session-messages";
import type { ListQuery, Page } from "@/lib/list-page";
import {
  list,
  save,
  type Benefit,
  type BenefitVersion,
  type Plan,
} from "./api";
import {
  AdminForm,
  AdminPage,
  Input,
  InfoFact,
  Loading,
  SelectField,
  TextArea,
  codePattern,
  field,
  useGrants,
  useResource,
} from "./shared";
import { Revisions } from "./revisions";

export function BenefitsPage() {
  const t = planSettingsMessages();
  const kinds = t.kinds;
  const has = useGrants();
  const [params, setParams] = useSearchParams();
  const planId = params.get("plan") ?? "";
  const planOptions = useResource<Page<Plan>>(
    has("plans:list") ? "/plans?limit=100" : undefined,
  );
  const plan = planOptions?.data?.items.find((item) => item.id === planId);
  const load = useCallback(
    (offset: number, limit: number, query: ListQuery) => {
      const path = "/benefits";
      return list<Benefit>(
        path,
        offset,
        limit,
        query,
        planId ? { planId } : undefined,
      );
    },
    [planId],
  );
  return (
    <AdminPage
      title="Beneficios"
      description={t.catalogHint}
      actions={
        has("benefits:create") &&
        has("benefits:version") &&
        has("benefits:read") && (
          <Link className={buttonVariants()} to="/beneficios/nuevo">
            <PlusIcon aria-hidden="true" className="size-4" />
            {t.newBenefit}
          </Link>
        )
      }
    >
      <div className="flex flex-wrap items-end gap-3">
        {planOptions?.data && (
          <label className="space-y-1 text-sm">
            <span>Plan</span>
            <select
              className="bc-input"
              value={planId}
              onChange={(event) =>
                setParams(
                  event.target.value ? { plan: event.target.value } : {},
                )
              }
            >
              <option value="">Todos los planes</option>
              {planOptions.data.items.map((row) => (
                <option key={row.id} value={row.id}>
                  {row.currentVersion?.name ?? row.code}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      {has("benefits:list") && (
        <DynamicTable<Benefit>
          title={
            plan
              ? "Beneficios de " + (plan.currentVersion?.name ?? plan.code)
              : "Catálogo de beneficios"
          }
          rowKey={(row) => row.id}
          load={load}
          scope={planId}
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
              label: "Beneficio",
              value: (row) =>
                row.currentVersion?.name ?? row.latestDraft?.name ?? row.code,
            },
            {
              id: "kind",
              label: "Tipo",
              value: (row) => kinds[row.kind],
              sortable: true,
              filter: {
                type: "in",
                options: Object.entries(kinds).map(([value, label]) => ({
                  value,
                  label,
                })),
              },
            },
            {
              id: "limit",
              label: t.unitsLabel,
              value: (row) =>
                (row.currentVersion ?? row.latestDraft)?.limitUnits,
            },
            {
              id: "status",
              label: "Estado",
              value: (row) =>
                row.currentVersion
                  ? row.currentVersion.enabled
                    ? "Activo"
                    : "Inactivo"
                  : "Sin publicar",
            },
          ]}
          actions={
            has("benefits:read")
              ? [
                  {
                    label: "Gestionar beneficio",
                    icon: <EyeIcon aria-hidden="true" className="size-4" />,
                    to: (row) => "/beneficios/" + row.id,
                  },
                ]
              : undefined
          }
        />
      )}
    </AdminPage>
  );
}

export function NewBenefitPage() {
  const t = planSettingsMessages();
  const [params] = useSearchParams();
  const returnPlan = params.get("volverPlan");
  const back: [string, string] = returnPlan
    ? ["/planes/" + encodeURIComponent(returnPlan), t.backToPlan]
    : ["/beneficios", t.backToBenefits];
  return (
    <AdminPage
      title={t.newBenefit}
      description={t.benefitCreateHint}
      back={back}
    >
      <BenefitEditor returnPlan={returnPlan} />
    </AdminPage>
  );
}

export function BenefitPage() {
  const t = planSettingsMessages();
  const { id = "" } = useParams();
  const [params] = useSearchParams();
  const returnPlan = params.get("volverPlan");
  const has = useGrants();
  const [refresh, setRefresh] = useState(0);
  const changed = () => setRefresh((value) => value + 1);
  const path = "/benefits/" + encodeURIComponent(id);
  const result = useResource<Benefit>(path, refresh);
  const benefit = result?.data;
  const version = benefit?.currentVersion ?? benefit?.latestDraft;
  const suffix = returnPlan
    ? "?" + new URLSearchParams({ volverPlan: returnPlan })
    : "";
  return (
    <AdminPage
      title={version?.name ?? benefit?.code ?? t.benefitInfo}
      description={t.benefitDetailHint}
      back={
        returnPlan
          ? ["/planes/" + encodeURIComponent(returnPlan), t.backToPlan]
          : ["/beneficios", t.backToBenefits]
      }
      actions={
        benefit &&
        has("benefits:version") && (
          <Link
            className={buttonVariants()}
            to={"/beneficios/" + benefit.id + "/versiones/nueva" + suffix}
          >
            <PlusIcon aria-hidden="true" className="size-4" />
            {t.newVersion}
          </Link>
        )
      }
    >
      {!benefit ? (
        <Loading error={result?.error} onRetry={changed} />
      ) : (
        <>
          <section className="bc-panel overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">{t.benefitInfo}</h2>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="rounded-full bg-blue-50 px-3 py-1 font-medium text-blue-900 dark:bg-blue-950 dark:text-blue-200">
                  {benefit.currentVersion
                    ? benefit.currentVersion.enabled
                      ? t.active
                      : t.inactive
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
            <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <InfoFact label={t.planCode} value={benefit.code} />
              <InfoFact label={t.kindLabel} value={t.kinds[benefit.kind]} />
              <InfoFact
                label={t.audienceLabel}
                value={t.audiences[benefit.audience]}
              />
              <InfoFact
                label={t.periodLabel}
                value={t.periods[benefit.period]}
              />
              <InfoFact
                label={t.unitsLabel}
                value={version ? String(version.limitUnits) : t.unconfigured}
              />
              {benefit.kind === "discount" && (
                <InfoFact
                  label={t.discountLabel}
                  value={
                    version?.discountBasisPoints == null
                      ? t.unconfigured
                      : version.discountBasisPoints / 100 + "%"
                  }
                />
              )}
            </dl>
            <dl className="mt-5 border-t border-gray-100 pt-5 dark:border-gray-700">
              <dt className="text-sm font-semibold">{t.benefitTerms}</dt>
              <dd className="mt-1 text-sm whitespace-pre-wrap text-gray-600 dark:text-gray-300">
                {version?.description ?? t.unconfigured}
              </dd>
            </dl>
          </section>
          <Revisions<BenefitVersion>
            path={path + "/versions"}
            current={benefit.currentVersion?.id}
            refresh={refresh}
            onChange={changed}
            canPublish={has("benefits:publish")}
            preview={(item) => (
              <p className="text-sm">
                {t.unitsLabel} · {item.limitUnits} ·{" "}
                {item.enabled ? t.active : t.inactive}
                {item.discountBasisPoints
                  ? " · " + item.discountBasisPoints / 100 + " %"
                  : ""}
              </p>
            )}
            effect={t.benefitPublishHint}
            extra={[
              {
                id: "units",
                label: t.unitsLabel,
                value: (item) => item.limitUnits,
              },
              {
                id: "enabled",
                label: t.status,
                value: (item) => (item.enabled ? t.active : t.inactive),
              },
            ]}
          />
        </>
      )}
    </AdminPage>
  );
}

export function NewBenefitVersionPage() {
  const t = planSettingsMessages();
  const { id = "" } = useParams();
  const [params] = useSearchParams();
  const returnPlan = params.get("volverPlan");
  const [retry, setRetry] = useState(0);
  const result = useResource<Benefit>(
    "/benefits/" + encodeURIComponent(id),
    retry,
  );
  const suffix = returnPlan
    ? "?" + new URLSearchParams({ volverPlan: returnPlan })
    : "";
  return (
    <AdminPage
      title={t.newVersion}
      description={t.benefitVersionHint}
      back={["/beneficios/" + encodeURIComponent(id) + suffix, t.backToBenefit]}
    >
      {result?.data ? (
        <BenefitEditor key={id} benefit={result.data} returnPlan={returnPlan} />
      ) : (
        <Loading
          error={result?.error}
          onRetry={() => setRetry((value) => value + 1)}
        />
      )}
    </AdminPage>
  );
}

function BenefitEditor({
  benefit,
  returnPlan,
}: {
  benefit?: Benefit;
  returnPlan: string | null;
}) {
  const t = planSettingsMessages();
  const navigate = useNavigate();
  const source = benefit?.currentVersion ?? benefit?.latestDraft;
  const [kind, setKind] = useState<string>(benefit?.kind ?? "");
  return (
    <AdminForm
      title={source?.name ?? benefit?.code ?? t.benefitInfo}
      action={t.saveBenefitDraft}
      success={benefit ? t.benefitDraftSaved : t.benefitCreated}
      onSave={async (values) => {
        const version = {
          name: field(values, "name"),
          description: field(values, "description"),
          limitUnits: Number(field(values, "units")),
          discountBasisPoints:
            kind === "discount"
              ? Math.round(Number(field(values, "discount")) * 100)
              : null,
          enabled: values.has("enabled"),
        };
        let id = benefit?.id;
        if (benefit) {
          await save(
            "/benefits/" + encodeURIComponent(benefit.id) + "/versions",
            version,
          );
        } else {
          const created = await save<Benefit>("/benefits", {
            code: field(values, "code"),
            kind: field(values, "kind"),
            period: field(values, "period"),
            audience: field(values, "audience"),
            initialVersion: version,
          });
          id = created.id;
        }
        const suffix = returnPlan
          ? "?" + new URLSearchParams({ volverPlan: returnPlan })
          : "";
        void navigate("/beneficios/" + id + suffix, { replace: true });
      }}
    >
      <div className="md:col-span-2">
        <h3 className="font-semibold">{t.benefitIdentity}</h3>
        {benefit && (
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {t.stableBenefitHint}
          </p>
        )}
      </div>
      <Input
        label={t.benefitName}
        name="name"
        value={source?.name}
        maxLength={120}
      />
      {benefit ? (
        <dl className="grid gap-2 sm:grid-cols-2 md:col-span-2 xl:grid-cols-4">
          <InfoFact label={t.planCode} value={benefit.code} />
          <InfoFact label={t.kindLabel} value={t.kinds[benefit.kind]} />
          <InfoFact label={t.periodLabel} value={t.periods[benefit.period]} />
          <InfoFact
            label={t.audienceLabel}
            value={t.audiences[benefit.audience]}
          />
        </dl>
      ) : (
        <>
          <Input
            label={t.benefitCode}
            name="code"
            maxLength={60}
            pattern={codePattern}
          />
          <SelectField
            label={t.kindLabel}
            name="kind"
            options={t.kinds}
            help={t.kindHelp}
            helpLabel={t.helpLabel}
            onChange={setKind}
          />
          <SelectField
            label={t.periodLabel}
            name="period"
            options={t.periods}
            help={t.periodHelp}
            helpLabel={t.helpLabel}
          />
          <SelectField
            label={t.audienceLabel}
            name="audience"
            options={t.audiences}
            help={t.audienceHelp}
            helpLabel={t.helpLabel}
          />
        </>
      )}
      <div className="mt-2 border-t border-gray-200 pt-4 md:col-span-2 dark:border-gray-700">
        <h3 className="font-semibold">{t.benefitRules}</h3>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          {t.unitsHint}
        </p>
      </div>
      <Input
        label={t.unitsLabel}
        name="units"
        type="number"
        min={1}
        max={100000}
        step={1}
        value={source?.limitUnits}
      />
      {kind === "discount" && (
        <Input
          label={t.discountLabel}
          name="discount"
          type="number"
          min={0.01}
          max={100}
          step={0.01}
          value={
            source?.discountBasisPoints == null
              ? undefined
              : source.discountBasisPoints / 100
          }
        />
      )}
      <TextArea
        label={t.benefitTerms}
        name="description"
        value={source?.description}
        maxLength={1500}
      />
      <label className="flex items-center gap-2 text-sm md:col-span-2">
        <input
          type="checkbox"
          name="enabled"
          defaultChecked={source?.enabled ?? true}
        />
        {t.activeOnPublish}
      </label>
    </AdminForm>
  );
}
