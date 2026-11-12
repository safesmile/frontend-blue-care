import { useCallback, useState } from "react";
import { DynamicTable } from "@/components/shared/dynamic-table";
import { Button } from "@/components/ui/button";
import { PlusIcon, TrashBinIcon } from "@/icons";
import { planSettingsMessages } from "@/lib/session-messages";
import { list, type Benefit, type PlanBenefit } from "./api";

export function BenefitPicker({
  selected,
  onChange,
}: {
  selected: PlanBenefit[];
  onChange: (benefits: PlanBenefit[]) => void;
}) {
  const t = planSettingsMessages();
  const [term, setTerm] = useState("");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const load = useCallback(
    (offset: number, limit: number) =>
      list<Benefit>(
        "/benefits",
        offset,
        limit,
        search
          ? {
              filters: [
                { field: "search", operator: "contains", value: search },
              ],
            }
          : undefined,
      ),
    [search],
  );
  return (
    <div className="space-y-3 md:col-span-2">
      <section className="space-y-3 rounded-xl border border-gray-200 p-4 dark:border-gray-700">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold">{t.assignedTitle}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t.draftBenefitHint}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            <PlusIcon aria-hidden="true" className="size-4" />
            {open ? t.closeCatalog : t.openCatalog}
          </Button>
        </div>
        {selected.length ? (
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {selected.map((row) => (
              <li
                key={row.id}
                className="flex items-center justify-between gap-3 py-2"
              >
                <span className="text-sm">{row.name ?? row.code}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  title={t.remove}
                  aria-label={t.remove + " · " + (row.name ?? row.code)}
                  onClick={() =>
                    onChange(selected.filter((item) => item.id !== row.id))
                  }
                >
                  <TrashBinIcon aria-hidden="true" className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">{t.noAssigned}</p>
        )}
      </section>
      {open && (
        <DynamicTable<Benefit>
          title={t.availableTitle}
          rowKey={(row) => row.id}
          load={load}
          scope={search}
          toolbar={
            <div className="flex flex-wrap items-end gap-2">
              <label className="text-sm">
                <span className="mb-1 block">{t.searchLabel}</span>
                <input
                  name="benefitSearch"
                  type="search"
                  className="bc-input"
                  maxLength={100}
                  value={term}
                  onChange={(event) => setTerm(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      setSearch(term.trim());
                    }
                  }}
                />
              </label>
              <Button
                type="button"
                variant="outline"
                onClick={() => setSearch(term.trim())}
              >
                {t.search}
              </Button>
            </div>
          }
          columns={[
            {
              id: "name",
              label: t.benefit,
              value: (row) =>
                row.currentVersion?.name ?? row.latestDraft?.name ?? row.code,
            },
            {
              id: "kind",
              label: t.kindLabel,
              value: (row) => t.kinds[row.kind],
            },
            {
              id: "status",
              label: t.status,
              value: (row) =>
                row.currentVersion
                  ? row.currentVersion.enabled
                    ? t.active
                    : t.inactive
                  : t.draft,
            },
          ]}
          actions={[
            {
              label: t.assign,
              icon: <PlusIcon aria-hidden="true" className="size-4" />,
              disabled: (row) => selected.some((item) => item.id === row.id),
              onClick: (row) =>
                onChange([
                  ...selected,
                  {
                    id: row.id,
                    code: row.code,
                    kind: row.kind,
                    period: row.period,
                    audience: row.audience,
                    name:
                      row.currentVersion?.name ?? row.latestDraft?.name ?? null,
                    description: row.currentVersion?.description ?? null,
                    enabled: row.currentVersion?.enabled ?? null,
                    limitUnits: row.currentVersion?.limitUnits ?? null,
                    discountBasisPoints:
                      row.currentVersion?.discountBasisPoints ?? null,
                  },
                ]),
            },
          ]}
        />
      )}
    </div>
  );
}
