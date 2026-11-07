export interface Page<T> {
  items: T[];
  total: number;
}

export const PAGE_SIZES = [10, 25] as const;
export const DEFAULT_PAGE_SIZE = PAGE_SIZES[0];
