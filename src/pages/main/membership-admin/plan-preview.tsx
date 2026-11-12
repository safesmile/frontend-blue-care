import { useState } from "react";
import { Link, useParams } from "react-router";
import { TablePagination } from "@/components/shared/table-pagination";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckIcon } from "@/icons";
import { usePagedRecords } from "@/hooks/use-paged-records";
import { planSettingsMessages } from "@/lib/session-messages";
import { plans, type Plan, type PlanBenefit } from "./api";
import { ActionLink, AdminPage, money, useGrants, useResource } from "./shared";

type Billing = "monthly" | "annual";

export function PlanPreviewPage() {
  const { id } = useParams();
  const t = planSettingsMessages();
  const [billing, setBilling] = useState<Billing>("monthly");
  const has = useGrants();
  const [revision, setRevision] = useState(0);
  const single = useResource<Plan>(
    id ? "/plans/" + encodeURIComponent(id) : undefined,
    revision,
  );
  const pager = usePagedRecords("plan-preview", id ? undefined : plans);
  const records = id
    ? single?.data
      ? [single.data]
      : undefined
    : pager.data?.items;
  const offers = records?.flatMap((plan) => {
    const version = plan.currentVersion ?? plan.latestDraft;
    if (!version) return [];
    const benefits =
      !version.publishedAt && version.benefitIds != null
        ? plan.draftBenefits
        : plan.benefits;
    return [
      {
        ...version,
        planId: plan.id,
        enabled: plan.enabled,
        benefits: (benefits ?? []).filter((item) => item.enabled),
      },
    ];
  });
  const failed = id ? !!single?.error : pager.failed;
  const retry = id ? () => setRevision((value) => value + 1) : pager.refresh;
  const first = offers?.[0];
  const shared =
    offers && offers.length > 1 && first
      ? first.benefits.filter((benefit) =>
          offers.every((plan) =>
            plan.benefits.some((item) => item.id === benefit.id),
          ),
        )
      : [];
  const common = new Set(shared.map((benefit) => benefit.id));
  const title = id && first ? first.name : t.publicTitle;

  return (
    <AdminPage
      title={t.preview}
      description={t.previewHint}
      back={
        id
          ? ["/planes/" + encodeURIComponent(id), t.backToPlan]
          : ["/planes", "Volver a planes"]
      }
      actions={
        id &&
        has("plans:list") && (
          <ActionLink to="/planes/vista-previa">{t.viewOffers}</ActionLink>
        )
      }
    >
      <section className="space-y-8 rounded-2xl border border-blue-100 bg-[#f1f7fb] px-4 py-7 sm:px-7 dark:border-gray-700 dark:bg-[#101c2b]">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-[#153575] sm:text-5xl dark:text-blue-200">
            {title}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-300">
            {id && first ? first.description : t.publicHint}
          </p>
          <div
            role="group"
            aria-label={t.billingLabel}
            className="mt-6 inline-flex gap-1 rounded-xl border border-blue-100 bg-white p-1 dark:border-gray-700 dark:bg-[#142539]"
          >
            {(["monthly", "annual"] as const).map((option) => (
              <Button
                key={option}
                type="button"
                variant={billing === option ? "default" : "ghost"}
                size="sm"
                aria-pressed={billing === option}
                onClick={() => setBilling(option)}
              >
                {option === "monthly" ? t.monthly : t.annual}
              </Button>
            ))}
          </div>
        </div>
        {failed ? (
          <div role="alert" className="bc-panel text-center">
            <p className="mb-4">{t.publicError}</p>
            <Button variant="outline" onClick={retry}>
              {t.retry}
            </Button>
          </div>
        ) : !offers ? (
          <div
            role="status"
            aria-label={t.publicLoading}
            className="grid gap-5 sm:grid-cols-2"
          >
            <Skeleton className="h-64 rounded-2xl" />
            {!id && <Skeleton className="h-64 rounded-2xl" />}
          </div>
        ) : !offers.length ? (
          <p className="bc-panel text-center">
            {id ? t.unavailableOffer : t.noOffers}
          </p>
        ) : (
          <>
            <div
              className={
                offers.length === 1
                  ? "mx-auto max-w-xl"
                  : "grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
              }
            >
              {offers.map((plan) => (
                <article
                  key={plan.planId}
                  className="flex h-full flex-col rounded-2xl border border-blue-100 bg-white p-6 shadow-sm sm:p-7 dark:border-gray-700 dark:bg-[#142539]"
                >
                  <p className="mb-2 self-start rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-900 dark:bg-blue-950 dark:text-blue-200">
                    {plan.publishedAt ? t.currentVersion : t.draftVersion} · v
                    {plan.number}
                    {!plan.enabled && " · " + t.inactive}
                  </p>
                  {!id && (
                    <>
                      <h2 className="text-xl font-semibold">{plan.name}</h2>
                      <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                        {plan.description}
                      </p>
                    </>
                  )}
                  <p
                    className="mt-5 flex flex-wrap items-baseline gap-x-2"
                    aria-live="polite"
                  >
                    <span className="text-3xl font-bold tracking-tight text-[#153575] dark:text-blue-200">
                      {money(
                        billing === "monthly"
                          ? plan.monthlyPriceCents
                          : plan.annualPriceCents,
                      )}
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      {billing === "monthly" ? t.perMonth : t.perYear}
                    </span>
                  </p>
                  <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                    {plan.taxDisclosure}
                  </p>
                  <div className="my-5 flex-1 border-t border-gray-100 pt-5 dark:border-gray-700">
                    <BenefitList
                      benefits={plan.benefits.filter(
                        (benefit) => !common.has(benefit.id),
                      )}
                    />
                  </div>
                  {!id && has("plans:read") && (
                    <Link
                      to={"/planes/" + plan.planId + "/vista-previa"}
                      className={buttonVariants({ variant: "outline" })}
                      aria-label={t.preview + " · " + plan.name}
                    >
                      {t.preview}
                    </Link>
                  )}
                </article>
              ))}
            </div>
            {shared.length > 0 && (
              <section className="rounded-2xl border border-blue-100 bg-white p-6 dark:border-gray-700 dark:bg-[#142539]">
                <h2 className="mb-4 text-lg font-semibold">
                  {t.sharedBenefits}
                </h2>
                <BenefitList benefits={shared} />
              </section>
            )}
          </>
        )}
        {!id && pager.data && pager.data.total > 10 && (
          <TablePagination
            total={pager.data.total}
            offset={pager.offset}
            limit={pager.limit}
            shown={pager.data.items.length}
            onOffset={pager.setOffset}
            onLimit={pager.setLimit}
          />
        )}
      </section>
    </AdminPage>
  );
}

function BenefitList({ benefits }: { benefits: PlanBenefit[] }) {
  const t = planSettingsMessages();
  return (
    <ul className="space-y-3">
      {benefits.map((benefit) => (
        <li key={benefit.id} className="flex gap-2.5 text-sm">
          <CheckIcon
            aria-hidden="true"
            className="mt-0.5 size-4 shrink-0 text-teal-600 dark:text-teal-300"
          />
          <div>
            <p className="font-semibold">
              {benefit.name ?? benefit.code}
              {!!benefit.discountBasisPoints && (
                <span className="ms-2 text-teal-700 dark:text-teal-300">
                  {benefit.discountBasisPoints / 100}%
                </span>
              )}
            </p>
            {benefit.description && (
              <p className="mt-0.5 text-gray-600 dark:text-gray-300">
                {benefit.description}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
              {t.audiences[benefit.audience]} · {t.periods[benefit.period]}
              {benefit.limitUnits !== null &&
                " · " +
                  t.unitsPerPerson.replace(
                    "{count}",
                    String(benefit.limitUnits),
                  )}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
