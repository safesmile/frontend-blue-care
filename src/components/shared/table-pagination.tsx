import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeftIcon, ChevronRightIcon } from "@/icons";
import { peopleMessages } from "@/lib/session-messages";

import { PAGE_SIZES } from "@/lib/list-page";

export function TableTotal({ total }: { total?: number }) {
  const t = peopleMessages();
  return (
    <p className="text-sm text-gray-500 dark:text-gray-400">
      {t.tableTotal}:{" "}
      <strong className="text-gray-800 dark:text-gray-100">
        {total ?? "—"}
      </strong>
    </p>
  );
}

export function TablePagination({
  total,
  offset,
  limit,
  shown,
  disabled,
  onOffset,
  onLimit,
}: {
  total: number;
  offset: number;
  limit: number;
  shown: number;
  disabled?: boolean;
  onOffset: (offset: number) => void;
  onLimit: (limit: number) => void;
}) {
  const t = peopleMessages();
  const pages = Math.max(1, Math.ceil(total / limit));
  const page = Math.min(pages, Math.floor(offset / limit) + 1);
  return (
    <nav
      aria-label={t.pagination}
      className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-gray-200 pt-4 text-sm dark:border-gray-800"
    >
      <p aria-live="polite" className="text-gray-600 dark:text-gray-300">
        {t.pageSummary
          .replace("{page}", String(page))
          .replace("{pages}", String(pages))
          .replace("{shown}", String(shown))}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <span>{t.rowsPerPage}</span>
        <Select
          value={String(limit)}
          disabled={disabled}
          onValueChange={(value) => {
            if (value) onLimit(Number(value));
          }}
        >
          <SelectTrigger aria-label={t.rowsPerPage} className="w-20" size="sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PAGE_SIZES.map((size) => (
              <SelectItem key={size} value={String(size)}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="icon-sm"
          aria-label={t.prev}
          disabled={disabled || offset === 0}
          onClick={() => onOffset(Math.max(0, offset - limit))}
        >
          <ChevronLeftIcon
            aria-hidden="true"
            className="size-4 rtl:rotate-180"
          />
        </Button>
        <Button
          variant="outline"
          size="icon-sm"
          aria-label={t.next}
          disabled={disabled || offset + limit >= total}
          onClick={() => onOffset(offset + limit)}
        >
          <ChevronRightIcon
            aria-hidden="true"
            className="size-4 rtl:rotate-180"
          />
        </Button>
      </div>
    </nav>
  );
}
