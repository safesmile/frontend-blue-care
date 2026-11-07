import { useRef, useState, type ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertIcon, MailIcon } from "@/icons";
import { peopleMessages } from "@/lib/session-messages";

export function ConfirmationDialog({
  open,
  title,
  description,
  confirmLabel,
  destructive = false,
  children,
  onClose,
  onConfirm,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  destructive?: boolean;
  children?: ReactNode;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}) {
  const t = peopleMessages();
  const [busy, setBusy] = useState(false);
  const running = useRef(false);
  async function confirm() {
    if (running.current) return;
    running.current = true;
    setBusy(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      running.current = false;
      setBusy(false);
    }
  }
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && !running.current) onClose();
      }}
    >
      <DialogContent showCloseButton={!busy} aria-busy={busy}>
        <div
          className={`flex size-12 items-center justify-center rounded-full ${destructive ? "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-300" : "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300"}`}
        >
          {destructive ? (
            <AlertIcon aria-hidden="true" className="size-6" />
          ) : (
            <MailIcon aria-hidden="true" className="size-6" />
          )}
        </div>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
        {children}
        <DialogFooter>
          <Button variant="outline" disabled={busy} onClick={onClose}>
            {t.cancel}
          </Button>
          <Button
            variant={destructive ? "destructive" : "default"}
            disabled={busy}
            onClick={() => void confirm()}
          >
            {busy ? t.processing : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
