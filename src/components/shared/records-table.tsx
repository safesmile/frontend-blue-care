import type { ReactNode } from "react";
export function RecordsTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: ReactNode[][];
}) {
  return (
    <div className="bc-panel overflow-x-auto">
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
          {rows.map((row, i) => (
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
      {!rows.length && (
        <p className="p-8 text-center text-gray-500">
          No hay resultados para los filtros seleccionados.
        </p>
      )}
    </div>
  );
}
