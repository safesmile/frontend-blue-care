import { notify } from "@/lib/notify";
import { peopleMessages } from "@/lib/session-messages";
import { useEffect, useState } from "react";
import { DEFAULT_PAGE_SIZE, type Page } from "@/lib/list-page";

export function usePagedRecords<T>(
  scope: string,
  load?: (offset: number, limit: number) => Promise<Page<T>>,
  refreshKey = 0,
) {
  const [selection, setSelection] = useState({
    scope,
    offset: 0,
    limit: DEFAULT_PAGE_SIZE as number,
  });
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState<{
    key: string;
    scope: string;
    page?: Page<T>;
    failed?: boolean;
  }>();
  const { offset, limit } =
    selection.scope === scope
      ? selection
      : { offset: 0, limit: selection.limit };
  const key = JSON.stringify([scope, offset, limit, revision, refreshKey]);
  useEffect(() => {
    if (!load) return;
    let active = true;
    void load(offset, limit)
      .then((page) => {
        if (!active) return;
        const lastOffset =
          Math.max(0, Math.ceil(page.total / limit) - 1) * limit;
        if (offset > lastOffset)
          setSelection({ scope, offset: lastOffset, limit });
        else setResult({ key, scope, page });
      })
      .catch(() => {
        if (active) {
          setResult({ key, scope, failed: true });
          notify.error(peopleMessages().loadError, `load-${scope}`);
        }
      });
    return () => {
      active = false;
    };
  }, [key, scope, offset, limit, load]);
  return {
    offset,
    limit,
    total: result?.scope === scope ? result.page?.total : undefined,
    data: result?.key === key ? result.page : undefined,
    failed: result?.key === key && !!result.failed,
    setOffset: (next: number) => setSelection({ scope, offset: next, limit }),
    setLimit: (next: number) => setSelection({ scope, offset: 0, limit: next }),
    refresh: () => setRevision((value) => value + 1),
  };
}
