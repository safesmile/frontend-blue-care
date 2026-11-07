import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";
import {
  TableSkeleton,
  PaginationSkeleton,
} from "@/components/shared/loading-skeletons";
import { notify } from "@/lib/notify";
import type { Invitation } from "../users/api";
import { BackLink } from "@/components/shared/navigation-actions";
import { peopleApi } from "./service";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import { useAuth } from "@/hooks/use-auth";
import { peopleMessages } from "@/lib/session-messages";
import { Button } from "@/components/ui/button";
import { PageMeta } from "@/components/shared/page-meta";
import { type Audience } from "./api";
import { usePagedRecords } from "@/hooks/use-paged-records";
import {
  TablePagination,
  TableTotal,
} from "@/components/shared/table-pagination";
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
  const load = useCallback(
    (offset: number, limit: number) =>
      peopleApi.invitations(audience, offset, limit),
    [audience],
  );
  const { data, failed, total, offset, limit, setOffset, setLimit, refresh } =
    usePagedRecords(JSON.stringify([audience, user?.id, user?.clinicId]), load);
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
      refresh();
    } catch {
      notify.error(t.uncertain);
      refresh();
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageMeta title={`${title} | BlueCare`} description={title} />
      <BackLink to={base}>{t.back}</BackLink>
      <div className="my-5 flex flex-wrap items-center justify-between gap-4">
        <h1 className="bc-title">{title}</h1>
        {canOpenRoute(user, `${base}/invitar`) && (
          <Link className="bc-primary" to={`${base}/invitar`}>
            {audience === "patients" ? t.invitePatient : t.inviteCollaborator}
          </Link>
        )}
      </div>
      <section className="bc-panel">
        <div className="mb-4">
          <TableTotal total={total} />
        </div>
        <div className="mb-5 flex flex-wrap items-end gap-4">
          <Button variant="outline" disabled={busy} onClick={() => refresh()}>
            {t.refresh}
          </Button>
        </div>
        {failed ? (
          <p role="alert">{t.loadError}</p>
        ) : !data ? (
          <TableSkeleton
            headers={[t.firstName, t.email, t.status, t.delivery, t.actions]}
            rows={Math.min(
              limit,
              total === undefined ? limit : Math.max(0, total - offset),
            )}
          />
        ) : !data.items.length ? (
          <p>{t.empty}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-fixed text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">
                  {[t.firstName, t.email, t.status, t.delivery, t.actions].map(
                    (label) => (
                      <th key={label} className="p-3 text-start">
                        {label}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {data.items.map((invite) => {
                  const expired = Date.parse(invite.expiresAt) <= now,
                    status =
                      invite.status === "pending" && expired
                        ? "expired"
                        : invite.status,
                    open = ["pending", "expired"].includes(status),
                    cooldown =
                      !!invite.lastSendAttemptAt &&
                      Date.parse(invite.lastSendAttemptAt) + 60000 > now;
                  return (
                    <tr
                      key={invite.id}
                      className="h-16 border-b border-gray-100 break-words dark:border-gray-800"
                    >
                      <td className="p-3">
                        {invite.firstName} {invite.lastName}
                      </td>
                      <td className="p-3">{invite.email}</td>
                      <td className="p-3">{labels[status]}</td>
                      <td className="p-3">{delivery[invite.deliveryStatus]}</td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-2">
                          {user?.permissions.includes("invitations:resend") &&
                            open && (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={busy || cooldown}
                                onClick={() => {
                                  setReason("");
                                  setConfirmation({ invite, revoke: false });
                                }}
                              >
                                {t.resend}
                              </Button>
                            )}
                          {user?.permissions.includes("invitations:revoke") &&
                            open && (
                              <Button
                                size="sm"
                                variant="ghost"
                                disabled={busy}
                                onClick={() => {
                                  setReason("");
                                  setConfirmation({ invite, revoke: true });
                                }}
                              >
                                {t.revoke}
                              </Button>
                            )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {total === undefined && !failed && <PaginationSkeleton />}
        {total !== undefined && (
          <TablePagination
            total={total}
            offset={offset}
            limit={limit}
            shown={data?.items.length ?? 0}
            disabled={busy || !data}
            onOffset={setOffset}
            onLimit={setLimit}
          />
        )}
      </section>
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
