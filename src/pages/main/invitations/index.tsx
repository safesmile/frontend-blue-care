import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";
import {
  DynamicTable,
  type TableAction,
  type TableColumn,
} from "@/components/shared/dynamic-table";
import { SendIcon, TrashBinIcon } from "@/icons";
import type { ListQuery } from "@/lib/list-page";
import { notify } from "@/lib/notify";
import type { Invitation } from "../users/api";
import { BackLink } from "@/components/shared/navigation-actions";
import { peopleApi } from "./service";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import { useAuth } from "@/hooks/use-auth";
import { peopleMessages } from "@/lib/session-messages";
import { PageMeta } from "@/components/shared/page-meta";
import { type Audience } from "./api";
import { canOpenRoute } from "@/lib/access-context";
export default function InvitationHistoryPage({
  audience,
}: {
  audience: Audience;
}) {
  const { user } = useAuth();
  const t = peopleMessages();
  const base = audience === "patients" ? "/pacientes" : "/colaboradores",
    title = `${t.history} · ${audience === "patients" ? t.patients : t.collaborators}`;
  const [confirmation, setConfirmation] = useState<{
      invite: Invitation;
      revoke: boolean;
    } | null>(null),
    [busy, setBusy] = useState(false),
    [reason, setReason] = useState(""),
    [now, setNow] = useState(Date.now);
  const [refreshKey, setRefreshKey] = useState(0);
  const load = useCallback(
    (offset: number, limit: number, query: ListQuery) =>
      peopleApi.invitations(audience, offset, limit, query),
    [audience],
  );
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const labels = {
      pending: t.pendingInvitation,
      accepted: t.accepted,
      revoked: t.revoked,
      expired: t.expired,
    },
    delivery = {
      pending: t.mailPending,
      sent: t.mailSent,
      failed: t.mailFailed,
    };
  async function perform() {
    if (!confirmation) return;
    const { invite, revoke } = confirmation;
    const id = invite.id;
    setBusy(true);

    try {
      if (revoke) await peopleApi.revoke(id, reason);
      else await peopleApi.resend(id);
      notify.success(revoke ? t.invitationRevoked : t.invitationResent);
      setReason("");
      setRefreshKey((value) => value + 1);
    } catch {
      notify.error(t.uncertain);
      setRefreshKey((value) => value + 1);
    } finally {
      setBusy(false);
    }
  }
  const status = (row: Invitation) =>
    row.status === "pending" && Date.parse(row.expiresAt) <= now
      ? "expired"
      : row.status;
  const open = (row: Invitation) =>
    ["pending", "expired"].includes(status(row));
  const columns: TableColumn<Invitation>[] = [
    {
      id: "name",
      label: t.firstName,
      value: (row) => `${row.firstName} ${row.lastName}`,
      sortable: true,
      filter: { type: "contains" },
    },
    {
      id: "email",
      label: t.email,
      value: (row) => row.email,
      sortable: true,
      filter: { type: "contains" },
    },
    {
      id: "status",
      label: t.status,
      render: (row) => labels[status(row)],
      sortable: true,
      filter: {
        type: "in",
        options: Object.entries(labels).map(([value, label]) => ({
          value,
          label,
        })),
      },
    },
    {
      id: "deliveryStatus",
      label: t.delivery,
      render: (row) => delivery[row.deliveryStatus],
      sortable: true,
      filter: {
        type: "in",
        options: Object.entries(delivery).map(([value, label]) => ({
          value,
          label,
        })),
      },
    },
    {
      id: "createdAt",
      label: t.tableCreated,
      value: (row) => row.createdAt,
      type: "datetime",
      sortable: true,
      filter: { type: "dateRange" },
    },
  ];
  const actions: TableAction<Invitation>[] = [
    {
      label: t.resend,
      icon: <SendIcon aria-hidden="true" className="size-4" />,
      visible: (row) =>
        open(row) && !!user?.permissions.includes("invitations:resend"),
      disabled: (row) =>
        !!row.lastSendAttemptAt &&
        Date.parse(row.lastSendAttemptAt) + 60000 > now,
      onClick: (invite) => {
        setReason("");
        setConfirmation({ invite, revoke: false });
      },
    },
    {
      label: t.revoke,
      icon: <TrashBinIcon aria-hidden="true" className="size-4" />,
      destructive: true,
      visible: (row) =>
        open(row) && !!user?.permissions.includes("invitations:revoke"),
      onClick: (invite) => {
        setReason("");
        setConfirmation({ invite, revoke: true });
      },
    },
  ];
  return (
    <>
      <PageMeta title={`${title} | BlueCare`} description={title} />
      <BackLink to={base} className="mb-5">
        {t.back}
      </BackLink>
      <DynamicTable
        title={title}
        columns={columns}
        actions={actions}
        rowKey={(row) => row.id}
        load={load}
        scope={JSON.stringify([audience, user?.id, user?.clinicId])}
        busy={busy}
        refreshKey={refreshKey}
        toolbar={
          canOpenRoute(user, `${base}/invitar`) && (
            <Link className="bc-primary" to={`${base}/invitar`}>
              {audience === "patients" ? t.invitePatient : t.inviteCollaborator}
            </Link>
          )
        }
      />
      <ConfirmationDialog
        open={!!confirmation}
        onClose={() => setConfirmation(null)}
        onConfirm={perform}
        title={confirmation?.revoke ? t.confirmRevoke : t.confirmResend}
        confirmLabel={confirmation?.revoke ? t.revoke : t.resend}
        destructive={confirmation?.revoke}
        description={(confirmation?.revoke
          ? t.confirmRevokeDescription
          : t.confirmResendDescription
        ).replace("{email}", confirmation?.invite.email ?? "")}
      >
        {confirmation?.revoke && (
          <label className="block text-sm">
            {t.reason}
            <textarea
              className="bc-input mt-2"
              maxLength={500}
              rows={3}
              value={reason}
              disabled={busy}
              onChange={(event) => setReason(event.target.value)}
            />
          </label>
        )}
      </ConfirmationDialog>
    </>
  );
}
