import { useCallback, useState, type FormEvent, type ReactNode } from "react";
import { Link, type To } from "react-router";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  ChevronUpDownIcon,
  FilterIcon,
  XIcon,
} from "@/icons";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Table } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { usePagedRecords } from "@/hooks/use-paged-records";
import type { ColumnFilter, ListQuery, Page } from "@/lib/list-page";
import { peopleMessages } from "@/lib/session-messages";
import { TablePagination, TableTotal } from "./table-pagination";
import { PaginationSkeleton } from "./loading-skeletons";

type Value = string | number | boolean | Date | null | undefined;
type Filter =
  | { type: "contains" | "dateRange" }
  | { type: "in"; options: readonly { label: string; value: string }[] };
export interface TableColumn<T> {
  id: string;
  label: string;
  value?: (row: T) => Value;
  render?: (row: T) => ReactNode;
  type?: "text" | "number" | "boolean" | "date" | "datetime" | "currency";
  currency?: string;
  sortable?: boolean;
  hidden?: boolean;
  filter?: Filter;
}

export interface TableAction<T> {
  label: string;
  tooltip?: string | ((row: T) => string);
  icon: ReactNode;
  visible?: (row: T) => boolean;
  disabled?: (row: T) => boolean;
  to?: (row: T) => To;
  onClick?: (row: T) => void;
  destructive?: boolean;
}

type Loader<T> = (
  offset: number,
  limit: number,
  query: ListQuery,
) => Promise<Page<T>>;
interface ManualPage<T> {
  page: Page<T>;
  offset: number;
  limit: number;
  onOffset: (offset: number) => void;
  onLimit: (limit: number) => void;
}
type Source<T> =
  | { rows: readonly T[]; load?: never; manual?: never }
  | { load: Loader<T>; rows?: never; manual?: never }
  | { manual: ManualPage<T>; load?: never; rows?: never };

type TableProps<T> = Source<T> & {
  title?: string;
  subtitle?: string;
  description?: string;
  columns: readonly TableColumn<T>[];
  actions?: readonly TableAction<T>[];
  rowKey: (row: T, index: number) => string | number;
  toolbar?: ReactNode;
  scope?: string;
  refreshKey?: number;
  busy?: boolean;
};

const dayFormat = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Guatemala",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
function calendarDay(value: Value) {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value))
    return value;
  const date = value instanceof Date ? value : new Date(String(value));
  if (!Number.isFinite(date.getTime())) return "";
  const parts = dayFormat.formatToParts(date);
  return ["year", "month", "day"]
    .map((type) => parts.find((part) => part.type === type)?.value)
    .join("-");
}

function localRows<T>(
  rows: readonly T[],
  columns: readonly TableColumn<T>[],
  query: ListQuery,
) {
  const columnById = new Map(columns.map((column) => [column.id, column]));
  const filtered = rows.filter((row) =>
    (query.filters ?? []).every((filter) => {
      const value = columnById.get(filter.field)?.value?.(row);
      if (filter.operator === "contains")
        return String(value ?? "")
          .toLowerCase()
          .includes(filter.value.toLowerCase());
      if (filter.operator === "in") return filter.value.includes(String(value));
      const day = calendarDay(value);
      return (
        !!day &&
        (!filter.value.from || day >= filter.value.from) &&
        (!filter.value.to || day <= filter.value.to)
      );
    }),
  );
  const sortedColumn = query.sortBy ? columnById.get(query.sortBy) : undefined;
  const read = sortedColumn?.value;
  if (!read) return filtered;
  const collator = new Intl.Collator(document.documentElement.lang || "es", {
    numeric: true,
    sensitivity: "base",
  });
  return filtered.sort((left, right) => {
    const a = read(left),
      b = read(right);
    if (a == null) return b == null ? 0 : 1;
    if (b == null) return -1;
    const comparison =
      typeof a === "number" && typeof b === "number"
        ? a - b
        : sortedColumn?.type === "date" ||
            sortedColumn?.type === "datetime" ||
            (a instanceof Date && b instanceof Date)
          ? new Date(String(a)).getTime() - new Date(String(b)).getTime()
          : collator.compare(String(a), String(b));
    return query.sortOrder === "desc" ? -comparison : comparison;
  });
}

function cell<T>(column: TableColumn<T>, row: T): ReactNode {
  if (column.render) return column.render(row);
  const value = column.value?.(row);
  if (value == null || value === "") return "—";
  const t = peopleMessages();
  const locale = document.documentElement.lang || "es-GT";
  if (typeof value === "boolean") return value ? t.tableYes : t.tableNo;
  if (
    column.type === "date" ||
    column.type === "datetime" ||
    value instanceof Date
  ) {
    const civil =
      typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
    const date =
      value instanceof Date
        ? value
        : new Date(civil ? value + "T12:00:00Z" : String(value));
    return Number.isFinite(date.getTime())
      ? new Intl.DateTimeFormat(locale, {
          dateStyle: "medium",
          ...(column.type === "datetime" ? { timeStyle: "short" } : {}),
          timeZone: "America/Guatemala",
        }).format(date)
      : "—";
  }
  if (typeof value === "number")
    return new Intl.NumberFormat(
      locale,
      column.type === "currency"
        ? { style: "currency", currency: column.currency ?? "GTQ" }
        : {},
    ).format(value);
  return value;
}

function RowAction<T>({
  action,
  row,
  busy,
}: {
  action: TableAction<T>;
  row: T;
  busy?: boolean;
}) {
  if (action.visible && !action.visible(row)) return null;
  const disabled = busy || action.disabled?.(row);
  const tooltip =
    typeof action.tooltip === "function"
      ? action.tooltip(row)
      : (action.tooltip ?? action.label);
  const variant = action.destructive ? "destructive" : "outline";
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          action.to && !disabled ? (
            <Link
              to={action.to(row)}
              aria-label={action.label}
              className={buttonVariants({ variant, size: "icon-sm" })}
            />
          ) : (
            <Button
              type="button"
              variant={variant}
              size="icon-sm"
              aria-label={action.label}
              disabled={disabled}
              onClick={() => action.onClick?.(row)}
            />
          )
        }
      >
        {action.icon}
      </TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  );
}

function filterSummary(current: ColumnFilter, filter?: Filter) {
  if (current.operator === "contains") return current.value;
  if (current.operator === "in") {
    return current.value
      .map((value) =>
        filter?.type === "in"
          ? (filter.options.find((option) => option.value === value)?.label ??
            value)
          : value,
      )
      .join(", ");
  }
  const t = peopleMessages();
  const { from, to } = current.value;
  const format = new Intl.DateTimeFormat(
    document.documentElement.lang || "es-GT",
    {
      dateStyle: "medium",
      timeZone: "UTC",
    },
  );
  const start = from ? format.format(new Date(from)) : "";
  const end = to ? format.format(new Date(to)) : "";
  if (start && end) return start + " – " + end;
  return start ? t.tableFrom + " " + start : t.tableTo + " " + end;
}

function ColumnFilterPopover({
  field,
  label,
  filter,
  current,
  onApply,
  showLabel,
}: {
  field: string;
  label: string;
  filter: Filter;
  current?: ColumnFilter;
  onApply: (filter?: ColumnFilter) => void;
  showLabel?: boolean;
}) {
  const t = peopleMessages();
  const [open, setOpen] = useState(false);
  const [dateError, setDateError] = useState(false);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = new FormData(event.currentTarget);
    const read = (name: string) => {
      const value = input.get(name);
      return typeof value === "string" ? value : "";
    };
    let next: ColumnFilter | undefined;
    if (filter.type === "contains") {
      const value = read("value").trim();
      if (value) next = { field, operator: "contains", value };
    } else if (filter.type === "in") {
      const value = input
        .getAll("value")
        .filter((item) => typeof item === "string");
      if (value.length) next = { field, operator: "in", value };
    } else {
      const from = read("from");
      const to = read("to");
      if (from && to && from > to) {
        setDateError(true);
        return;
      }
      if (from || to)
        next = {
          field,
          operator: "dateRange",
          value: { from: from || undefined, to: to || undefined },
        };
    }
    onApply(next);
    setOpen(false);
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        setDateError(false);
      }}
    >
      <PopoverTrigger
        render={
          <Button
            type="button"
            size={showLabel ? "sm" : "icon-sm"}
            variant={showLabel ? "outline" : "ghost"}
            className={
              current
                ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100"
                : undefined
            }
            aria-label={t.tableFilterColumn + " · " + label}
            title={t.tableFilterColumn + " · " + label}
          />
        }
      >
        <FilterIcon aria-hidden="true" className="size-4" />
        {showLabel && label}
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-72 max-w-[calc(100vw-2rem)] border border-gray-200 p-4 dark:border-gray-700"
      >
        <PopoverTitle className="mb-3 text-sm">{label}</PopoverTitle>
        {open && (
          <form onSubmit={submit} className="space-y-3">
            {filter.type === "contains" && (
              <input
                name="value"
                aria-label={label}
                className="bc-input"
                maxLength={100}
                defaultValue={
                  current?.operator === "contains" ? current.value : ""
                }
              />
            )}
            {filter.type === "in" && (
              <fieldset
                aria-label={label}
                className="max-h-48 space-y-2 overflow-y-auto text-sm"
              >
                {filter.options.map((option) => (
                  <label key={option.value} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="value"
                      value={option.value}
                      defaultChecked={
                        current?.operator === "in" &&
                        current.value.includes(option.value)
                      }
                    />
                    {option.label}
                  </label>
                ))}
              </fieldset>
            )}
            {filter.type === "dateRange" && (
              <fieldset
                aria-label={label}
                className="space-y-2 text-sm"
                onChange={() => setDateError(false)}
              >
                <label className="block">
                  {t.tableFrom}
                  <input
                    type="date"
                    name="from"
                    className="bc-input mt-1"
                    defaultValue={
                      current?.operator === "dateRange"
                        ? current.value.from
                        : undefined
                    }
                  />
                </label>
                <label className="block">
                  {t.tableTo}
                  <input
                    type="date"
                    name="to"
                    className="bc-input mt-1"
                    aria-invalid={dateError || undefined}
                    defaultValue={
                      current?.operator === "dateRange"
                        ? current.value.to
                        : undefined
                    }
                  />
                </label>
                {dateError && (
                  <p
                    role="alert"
                    className="text-error-600 dark:text-error-400"
                  >
                    {t.tableDateError}
                  </p>
                )}
              </fieldset>
            )}
            <div className="flex justify-end">
              <Button type="submit" size="sm">
                {t.tableFilterColumn}
              </Button>
            </div>
          </form>
        )}
      </PopoverContent>
    </Popover>
  );
}

export function DynamicTable<T>({
  title,
  subtitle,
  description,
  columns,
  actions,
  rowKey,
  toolbar,
  scope = "",
  refreshKey,
  busy,
  rows,
  load,
  manual,
}: TableProps<T>) {
  const t = peopleMessages();
  const [query, setQuery] = useState<ListQuery>({});
  const fetchPage = useCallback(
    (offset: number, limit: number) => load!(offset, limit, query),
    [load, query],
  );
  const pager = usePagedRecords(
    JSON.stringify([scope, query]),
    load ? fetchPage : undefined,
    refreshKey,
  );
  const limit = manual?.limit ?? pager.limit;
  const local = rows ? localRows(rows, columns, query) : undefined;
  const total = manual?.page.total ?? local?.length ?? pager.total;
  const offset =
    manual?.offset ??
    (local
      ? Math.min(
          pager.offset,
          Math.max(0, Math.ceil(local.length / limit) - 1) * limit,
        )
      : pager.offset);
  const items =
    manual?.page.items ??
    (local ? local.slice(offset, offset + limit) : pager.data?.items);
  const activeFilters = query.filters ?? [];
  const hiddenFilters = manual
    ? []
    : columns.filter((column) => column.hidden && column.filter);
  const loading = !!load && !items && !pager.failed;
  const visibleColumns = columns.filter((column) => !column.hidden);
  const columnCount = visibleColumns.length + (actions?.length ? 1 : 0);

  function updateFilter(field: string, filter?: ColumnFilter) {
    pager.setOffset(0);
    setQuery((previous) => ({
      ...previous,
      filters: [
        ...(previous.filters ?? []).filter((item) => item.field !== field),
        ...(filter ? [filter] : []),
      ],
    }));
  }

  function filterControl(column: TableColumn<T>) {
    if (manual || !column.filter) return null;
    return (
      <ColumnFilterPopover
        key={column.id}
        label={column.label}
        field={column.id}
        filter={column.filter}
        current={activeFilters.find((item) => item.field === column.id)}
        onApply={(filter) => updateFilter(column.id, filter)}
        showLabel={column.hidden}
      />
    );
  }

  return (
    <section className="bc-panel" aria-busy={loading}>
      {(title || subtitle || description || toolbar) && (
        <header className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            {title && (
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {title}
              </h2>
            )}
            {subtitle && <p className="text-sm font-medium">{subtitle}</p>}
            {description && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {description}
              </p>
            )}
          </div>
          {toolbar && (
            <div className="flex flex-wrap items-center gap-2">{toolbar}</div>
          )}
        </header>
      )}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <TableTotal total={total} />
        <div className="flex flex-wrap items-center gap-2">
          {hiddenFilters.map(filterControl)}
          {load && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={busy || loading}
              onClick={pager.refresh}
            >
              {t.refresh}
            </Button>
          )}
        </div>
      </div>
      {!!activeFilters.length && (
        <ul
          aria-label={t.tableActiveFilters}
          className="mb-4 flex flex-wrap gap-2"
        >
          {activeFilters.map((filter) => {
            const column = columns.find((item) => item.id === filter.field);
            const label = column?.label ?? filter.field;
            return (
              <li
                key={filter.field}
                className="inline-flex max-w-full items-center gap-1 rounded-full bg-blue-50 ps-3 pe-1 text-sm text-blue-800 dark:bg-blue-950 dark:text-blue-200"
              >
                <span className="min-w-0 truncate">
                  <strong>{label}</strong>
                  {" · "}
                  {filterSummary(filter, column?.filter)}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="shrink-0 rounded-full"
                  aria-label={t.tableRemoveFilter + " · " + label}
                  onClick={() => updateFilter(filter.field)}
                >
                  <XIcon aria-hidden="true" className="size-3.5" />
                </Button>
              </li>
            );
          })}
        </ul>
      )}
      {loading && (
        <p role="status" className="sr-only">
          {t.loading}
        </p>
      )}
      <div className="overflow-x-auto">
        <Table
          aria-label={title}
          className="w-full min-w-140 text-start text-sm"
        >
          <thead className="bg-blue-50 text-xs text-gray-700 dark:bg-[#1b3046] dark:text-gray-200">
            <tr>
              {visibleColumns.map((column) => {
                const direction =
                  query.sortBy === column.id ? query.sortOrder : undefined;
                const Icon =
                  direction === "asc"
                    ? ChevronUpIcon
                    : direction === "desc"
                      ? ChevronDownIcon
                      : ChevronUpDownIcon;
                return (
                  <th
                    key={column.id}
                    scope="col"
                    aria-sort={
                      direction === "asc"
                        ? "ascending"
                        : direction === "desc"
                          ? "descending"
                          : undefined
                    }
                    className="px-3 py-3 text-start font-semibold"
                  >
                    <div className="flex items-center gap-1">
                      {column.sortable && !manual ? (
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 rounded focus-visible:ring-2 focus-visible:ring-brand-500"
                          onClick={() => {
                            pager.setOffset(0);
                            setQuery({
                              ...query,
                              sortBy: column.id,
                              sortOrder: direction === "asc" ? "desc" : "asc",
                            });
                          }}
                        >
                          {column.label}
                          <Icon aria-hidden="true" className="size-4" />
                        </button>
                      ) : (
                        column.label
                      )}
                      {filterControl(column)}
                    </div>
                  </th>
                );
              })}
              {!!actions?.length && (
                <th scope="col" className="px-3 py-3 text-start font-semibold">
                  {t.actions}
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from(
                {
                  length: Math.min(
                    limit,
                    total === undefined ? limit : Math.max(0, total - offset),
                  ),
                },
                (_, index) => (
                  <tr
                    key={index}
                    aria-hidden="true"
                    className="h-16 border-b border-gray-100 dark:border-gray-800"
                  >
                    {Array.from({ length: columnCount }, (_, i) => (
                      <td key={i} className="p-3">
                        <Skeleton className="h-5 w-4/5" />
                      </td>
                    ))}
                  </tr>
                ),
              )
            ) : items?.length ? (
              items.map((row, index) => (
                <tr
                  key={rowKey(row, offset + index)}
                  className="h-16 border-b border-gray-100 break-words dark:border-gray-800"
                >
                  {visibleColumns.map((column) => (
                    <td key={column.id} className="p-3">
                      {cell(column, row)}
                    </td>
                  ))}
                  {!!actions?.length && (
                    <td className="p-3">
                      <div className="flex flex-wrap gap-2">
                        {actions.map((action, actionIndex) => (
                          <RowAction
                            key={actionIndex}
                            action={action}
                            row={row}
                            busy={busy}
                          />
                        ))}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columnCount}
                  className="p-8 text-center text-gray-500 dark:text-gray-400"
                >
                  {pager.failed ? (
                    <div role="alert">
                      {t.loadError}{" "}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={pager.refresh}
                      >
                        {t.retry}
                      </Button>
                    </div>
                  ) : (
                    t.empty
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>
      {total === undefined && loading && <PaginationSkeleton />}
      {total !== undefined && (
        <TablePagination
          total={total}
          offset={offset}
          limit={limit}
          shown={items?.length ?? 0}
          disabled={busy || loading}
          onOffset={manual?.onOffset ?? pager.setOffset}
          onLimit={manual?.onLimit ?? pager.setLimit}
        />
      )}
    </section>
  );
}
