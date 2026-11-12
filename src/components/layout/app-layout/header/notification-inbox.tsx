import { useState } from "react";
import { Button } from "@/components/ui/button";
import { TablePagination } from "@/components/shared/table-pagination";
import { usePagedRecords } from "@/hooks/use-paged-records";
import { api } from "@/lib/api";
import type { Page } from "@/lib/list-page";
import { notify } from "@/lib/notify";
import { inboxMessages, peopleMessages } from "@/lib/session-messages";

interface Notice {
  id: string;
  title: string;
  body: string;
  readAt: string | null;
}
const load = (offset: number, limit: number) =>
  api.authorized<Page<Notice>>(
    `/notifications?limit=${limit}&offset=${offset}`,
  );

export function NotificationInbox({
  userId,
  canMarkRead,
}: {
  userId: string;
  canMarkRead: boolean;
}) {
  const t = inboxMessages();
  const common = peopleMessages();
  const pager = usePagedRecords("inbox-" + userId, load);
  const [marked, setMarked] = useState<string[]>([]);
  const [pending, setPending] = useState<string | null>(null);
  const items = pager.data?.items;

  async function markRead(id: string) {
    setPending(id);
    try {
      await api.authorized(
        "/notifications/" + encodeURIComponent(id) + "/read",
        { method: "PATCH" },
      );
      setMarked((current) => [...current, id]);
    } catch {
      notify.error(t.markError);
    } finally {
      setPending(null);
    }
  }

  return (
    <section
      className="bc-popover end-0 mt-3 w-[min(23rem,calc(100vw-2rem))]"
      aria-label={t.title}
    >
      <h2 className="mb-3 font-medium">{t.title}</h2>
      {pager.failed ? (
        <Button variant="outline" size="sm" onClick={pager.refresh}>
          {common.retry}
        </Button>
      ) : !items ? (
        <p role="status" className="text-sm">
          {common.loading}
        </p>
      ) : !items.length ? (
        <p className="text-sm">{t.empty}</p>
      ) : (
        <ul className="max-h-72 space-y-2 overflow-y-auto">
          {items.map((item) => {
            const unread = !item.readAt && !marked.includes(item.id);
            return (
              <li
                key={item.id}
                className={
                  unread
                    ? "rounded-lg bg-blue-50 p-3 text-sm dark:bg-blue-950"
                    : "rounded-lg p-3 text-sm"
                }
              >
                <p className="font-semibold">{item.title}</p>
                <p className="mt-1">{item.body}</p>
                {unread && canMarkRead && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-1"
                    disabled={pending !== null}
                    onClick={() => void markRead(item.id)}
                  >
                    {t.markRead}
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {pager.total !== undefined && pager.total > 10 && (
        <TablePagination
          total={pager.total}
          shown={items?.length ?? 0}
          limit={pager.limit}
          offset={pager.offset}
          disabled={!items}
          onLimit={pager.setLimit}
          onOffset={pager.setOffset}
        />
      )}
    </section>
  );
}
