import { useCallback, useState, type ReactNode } from "react";
import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";
import {
  DynamicTable,
  type TableColumn,
} from "@/components/shared/dynamic-table";
import { CheckIcon, EyeIcon } from "@/icons";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { list, save, type Revision } from "./api";
import { useMutation } from "./shared";

export function Revisions<T extends Revision>({
  path,
  current,
  refresh,
  onChange,
  canPublish,
  effect,
  extra,
  preview,
}: {
  path: string;
  current?: string;
  refresh: number;
  onChange: () => void;
  canPublish: boolean;
  effect: string;
  extra: TableColumn<T>[];
  preview?: (item: T) => ReactNode;
}) {
  const [pending, setPending] = useState<T>();
  const [inspected, setInspected] = useState<T>();
  const mutation = useMutation();
  const load = useCallback(
    (offset: number, limit: number) => list<T>(path, offset, limit),
    [path],
  );
  return (
    <>
      <DynamicTable<T>
        title="Historial de versiones"
        description="Las versiones publicadas se conservan como historial."
        rowKey={(item) => item.id}
        load={load}
        refreshKey={refresh}
        columns={[
          { id: "number", label: "Versión", value: (item) => item.number },
          { id: "name", label: "Nombre", value: (item) => item.name },
          ...extra,
          {
            id: "status",
            label: "Publicación",
            value: (item) =>
              item.id === current
                ? "Vigente"
                : item.publishedAt
                  ? "Histórica"
                  : "Borrador",
          },
          {
            id: "publishedAt",
            label: "Publicada el",
            value: (item) => item.publishedAt,
            type: "datetime",
          },
        ]}
        actions={[
          {
            label: "Ver versión",
            icon: <EyeIcon aria-hidden="true" className="size-4" />,
            onClick: setInspected,
          },
          {
            label: "Publicar versión",
            icon: <CheckIcon aria-hidden="true" className="size-4" />,
            visible: (item) => canPublish && !item.publishedAt,
            onClick: setPending,
          },
        ]}
      />
      <Dialog
        open={!!inspected}
        onOpenChange={(open) => {
          if (!open) setInspected(undefined);
        }}
      >
        <DialogContent>
          <DialogTitle>
            {inspected?.name} · v{inspected?.number}
          </DialogTitle>
          <DialogDescription className="whitespace-pre-wrap">
            {inspected?.description}
          </DialogDescription>
          {inspected && preview?.(inspected)}
        </DialogContent>
      </Dialog>
      <ConfirmationDialog
        open={!!pending}
        title={"Publicar versión " + (pending?.number ?? "")}
        description={effect}
        confirmLabel="Publicar"
        onClose={() => setPending(undefined)}
        onConfirm={async () => {
          if (!pending) return;
          await mutation.run(async () => {
            await save(path + "/" + pending.id + "/publish");
            onChange();
          }, "Versión publicada.");
        }}
      />
    </>
  );
}
