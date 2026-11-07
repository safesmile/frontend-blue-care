import { useState, type ReactNode } from "react";
import { TableTotal, TablePagination } from "./table-pagination";
import { DEFAULT_PAGE_SIZE } from "@/lib/list-page";
import { peopleMessages } from "@/lib/session-messages";
export function RecordsTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: ReactNode[][];
}) {
  const [limit, setLimit] = useState<number>(DEFAULT_PAGE_SIZE);
  const [position, setPosition] = useState(0);
  const offset = Math.min(
    position,
    Math.max(0, Math.ceil(rows.length / limit) - 1) * limit,
  );
  const visible = rows.slice(offset, offset + limit);
  return (
    <div className="bc-panel">
      <div className="mb-4">
        <TableTotal total={rows.length} />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-140 text-left text-sm">
          <thead className="bg-blue-50 text-xs font-medium text-blue-600 dark:bg-[#1b3046] dark:text-blue-300">
            <tr>
              {headers.map((h) => (
                <th className="px-4 py-5 font-medium" key={h} scope="col">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((row, i) => (
              <tr
                className="border-b border-gray-100 last:border-0 dark:border-gray-800"
                key={i}
              >
                {row.map((cell, j) => (
                  <td className="px-4 py-6" key={j}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!rows.length && (
        <p className="p-8 text-center text-gray-500">
          {peopleMessages().empty}
        </p>
      )}
      <TablePagination
        total={rows.length}
        offset={offset}
        limit={limit}
        shown={visible.length}
        onOffset={setPosition}
        onLimit={(size) => {
          setLimit(size);
          setPosition(0);
        }}
      />
    </div>
  );
}
