import { peopleMessages } from "@/lib/session-messages";
import { useRef, useState } from "react";
import { Link } from "react-router";
import { PageMeta } from "@/components/shared/page-meta";
import { PageBreadcrumb } from "@/components/shared/page-breadcrumb";
import {
  DynamicTable,
  type TableColumn,
} from "@/components/shared/dynamic-table";
import { EyeIcon } from "@/icons";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { modules, type RecordRow } from "./data";
export default function AdministrationPage({ module }: { module: string }) {
  const config = modules[module];
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState(config.rows);
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<RecordRow | null>(null);
  const [notice, setNotice] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const filtered = rows.filter((row) =>
    row.cells.join(" ").toLowerCase().includes(query.toLowerCase()),
  );
  const last = config.headers.length - 1;
  const hasActionLabel = ["Acción", "Detalle"].includes(config.headers[last]);
  const columns: TableColumn<RecordRow>[] = config.headers
    .slice(0, hasActionLabel ? last : undefined)
    .map((label, index) => ({
      id: `column${index}`,
      label,
      value: (row) => row.cells[index],
      sortable: true,
      filter: ["Estado", "Publicación"].includes(label)
        ? {
            type: "in",
            options: [...new Set(rows.map((row) => row.cells[index]))].map(
              (value) => ({ value, label: value }),
            ),
          }
        : { type: "contains" },
    }));
  if (!config.headers.includes("Estado")) {
    columns.push({
      id: "recordStatus",
      label: peopleMessages().status,
      hidden: true,
      value: (row) => row.status,
      filter: {
        type: "in",
        options: [...new Set(rows.map((row) => row.status))].map((value) => ({
          value,
          label: value,
        })),
      },
    });
  }
  columns.push({
    id: "clinicScope",
    label: peopleMessages().clinic,
    hidden: true,
    value: (row) => row.clinic,
    filter: {
      type: "in",
      options: [...new Set(rows.map((row) => row.clinic))]
        .filter(Boolean)
        .map((value) => ({ value, label: value })),
    },
  });
  const actionLabel = (row: RecordRow) =>
    hasActionLabel ? row.cells[last] : peopleMessages().tableDetails;
  return (
    <>
      <PageMeta
        title={`${config.title} | BlueCare`}
        description={config.title}
      />
      <PageBreadcrumb pageTitle={config.title} />
      {config.href ? (
        <Link className="bc-primary inline-flex" to={config.href}>
          {config.action}
        </Link>
      ) : (
        <Button
          className="mb-2"
          onClick={() =>
            config.fields.length
              ? (setDetail(null), setOpen(true))
              : searchRef.current?.focus()
          }
        >
          {config.action}
        </Button>
      )}
      <div className="my-5 flex flex-wrap gap-3">
        <input
          ref={searchRef}
          className="bc-input max-w-64"
          aria-label="Buscar registros"
          placeholder="Buscar…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      {notice && (
        <p role="status" className="bc-notice mb-4">
          {notice}
        </p>
      )}
      <DynamicTable
        columns={columns}
        rows={filtered}
        rowKey={(_row, index) => index}
        scope={query}
        actions={[
          {
            label: peopleMessages().tableDetails,
            tooltip: actionLabel,
            icon: <EyeIcon aria-hidden="true" className="size-4" />,
            visible: (row) => !!row.href,
            to: (row) => row.href!,
          },
          {
            label: peopleMessages().tableDetails,
            tooltip: actionLabel,
            icon: <EyeIcon aria-hidden="true" className="size-4" />,
            visible: (row) => !row.href,
            onClick: (row) => {
              setDetail(row);
              setOpen(true);
            },
          },
        ]}
      />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogTitle>{detail ? detail.cells[0] : config.action}</DialogTitle>
          <DialogDescription>
            Vista previa con datos ilustrativos. Los cambios solo se conservan
            mientras esta pantalla esté abierta.
          </DialogDescription>
          {config.fields.length ? (
            <form
              className="mt-5 space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                const data = new FormData(e.currentTarget);
                const values = config.fields.map((_, i) =>
                  typeof data.get(`field${i}`) === "string"
                    ? (data.get(`field${i}`) as string)
                    : "",
                );
                if (detail) {
                  setRows(
                    rows.map((r) =>
                      r === detail
                        ? {
                            ...r,
                            cells: r.cells.map((c, i) =>
                              i < values.length ? values[i] : c,
                            ),
                          }
                        : r,
                    ),
                  );
                } else {
                  setRows([
                    ...rows,
                    {
                      cells: config.headers.map(
                        (_, i) =>
                          values[i] ||
                          (i === config.headers.length - 1
                            ? "Pendiente"
                            : "Por definir"),
                      ),
                      clinic: "Sede Central",
                      status: "Pendiente",
                    },
                  ]);
                }
                setOpen(false);
                setNotice("Cambios aplicados en esta vista previa.");
              }}
            >
              {config.fields.map((field, i) => (
                <label className="block text-sm" key={field}>
                  {field}
                  <input
                    name={`field${i}`}
                    defaultValue={detail?.cells[i] || ""}
                    required
                    type={
                      field.includes("Correo")
                        ? "email"
                        : field === "Fecha"
                          ? "date"
                          : "text"
                    }
                    className="bc-input mt-2"
                  />
                </label>
              ))}
              <Button type="submit">Guardar en vista previa</Button>
            </form>
          ) : (
            <dl className="mt-4 space-y-3">
              {detail?.cells.map((c, i) => (
                <div key={i}>
                  <dt className="text-xs text-gray-500">{config.headers[i]}</dt>
                  <dd>{c}</dd>
                </div>
              ))}
            </dl>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
