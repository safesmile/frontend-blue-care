export interface Page<T> {
  items: T[];
  total: number;
}

export const PAGE_SIZES = [10, 25] as const;
export const DEFAULT_PAGE_SIZE = PAGE_SIZES[0];

export type ColumnFilter =
  | { field: string; operator: "contains"; value: string }
  | { field: string; operator: "in"; value: string[] }
  | {
      field: string;
      operator: "dateRange";
      value: { from?: string; to?: string };
    };

export interface ListQuery {
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  filters?: ColumnFilter[];
}

export function listSearchParams(
  limit: number,
  offset: number,
  query?: ListQuery,
) {
  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });
  if (query?.sortBy) params.set("sortBy", query.sortBy);
  if (query?.sortOrder) params.set("sortOrder", query.sortOrder);
  if (query?.filters?.length)
    params.set("filters", JSON.stringify(query.filters));
  return params;
}
