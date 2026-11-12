import { Skeleton } from "@/components/ui/skeleton";
import { peopleMessages } from "@/lib/session-messages";

export function FormSkeleton({
  fields,
  intro = false,
}: {
  fields: number;
  intro?: boolean;
}) {
  const t = peopleMessages();
  return (
    <div role="status" aria-label={t.loading} className="space-y-5">
      <span className="sr-only">{t.loading}</span>
      {intro && <Skeleton className="mb-6 h-20 w-full" />}
      {Array.from({ length: fields }, (_, index) => (
        <div key={index} className="space-y-2">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-11 w-full rounded-lg" />
        </div>
      ))}
      <Skeleton className="h-10 w-40 rounded-lg" />
    </div>
  );
}

export function DetailSkeleton() {
  const t = peopleMessages();
  return (
    <div
      role="status"
      aria-label={t.loading}
      className="grid gap-x-8 gap-y-5 sm:grid-cols-2"
    >
      <span className="sr-only">{t.loading}</span>
      {Array.from({ length: 7 }, (_, index) => (
        <div key={index} className="space-y-2">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-5 w-3/4" />
        </div>
      ))}
    </div>
  );
}

export function PaginationSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="mt-5 flex min-h-[53px] items-center justify-between gap-4 border-t border-gray-200 pt-4 dark:border-gray-800"
    >
      <Skeleton className="h-5 w-48" />
      <Skeleton className="h-9 w-48" />
    </div>
  );
}
