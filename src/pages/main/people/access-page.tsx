import { notify } from "@/lib/notify";
import { FormSkeleton } from "@/components/shared/loading-skeletons";
import { BackLink } from "@/components/shared/navigation-actions";
import { peopleApi } from "../invitations/service";
import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/lib/api";
import { peopleMessages } from "@/lib/session-messages";
import { Button } from "@/components/ui/button";
import { PageMeta } from "@/components/shared/page-meta";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { type Collaborator } from "../invitations/api";
import { usersApi } from "../users/service";
import type { Role } from "../users/api";
export default function CollaboratorAccessPage() {
  const { id = "" } = useParams();
  const { user } = useAuth();
  const t = peopleMessages();
  const [target, setTarget] = useState<Collaborator | null>(null),
    [clinics, setClinics] = useState<{ id: string; name: string }[]>([]),
    [roles, setRoles] = useState<Role[]>([]);
  const [clinicId, setClinicId] = useState(""),
    [role, setRole] = useState(""),
    [rolesFor, setRolesFor] = useState("");
  const [failure, setFailure] = useState(""),
    [busy, setBusy] = useState(false),
    [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!user) return;
    let active = true;
    const grants = user.globalPermissions ?? user.permissions;
    void Promise.all([
      peopleApi.collaborator(id),
      grants.includes("clinics:all") && grants.includes("clinics:staff-manage")
        ? usersApi.clinics()
        : Promise.resolve(user.clinics ?? []),
    ])
      .then(([person, items]) => {
        if (active) {
          setTarget(person);
          setClinics(items);
        }
      })
      .catch(() => {
        if (active) {
          setFailure(t.loadError);
          notify.error(t.loadError);
        }
      });
    return () => {
      active = false;
    };
  }, [id, user, retry, t.loadError]);
  useEffect(() => {
    if (!clinicId) return;
    let active = true;
    void peopleApi
      .roles(clinicId)
      .then((items) => {
        if (active) {
          setRoles(items);
          setRolesFor(clinicId);
        }
      })
      .catch(() => {
        if (active) {
          setFailure(t.loadError);
          notify.error(t.loadError);
        }
      });
    return () => {
      active = false;
    };
  }, [clinicId, retry, t.loadError]);
  const existing = target?.clinics.find((clinic) => clinic.id === clinicId);
  const canManage =
    !!user?.permissions.includes("clinics:staff-manage") &&
    user.permissions.includes("roles:assign");
  async function perform(remove = false) {
    if (!target) return;
    setBusy(true);
    setFailure("");
    try {
      if (remove) await peopleApi.unassign(id, clinicId);
      else await peopleApi.assign(id, clinicId, role);
      notify.success(t.updated);
      setRetry((v) => v + 1);
      if (id === user?.id) await api.reloadProfile();
    } catch {
      setFailure(t.unknownChanges);
      notify.error(t.unknownChanges);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageMeta
        title={`${t.manageAccess} | BlueCare`}
        description={t.manageAccess}
      />
      <BackLink to="/colaboradores">{t.back}</BackLink>
      <h1 className="bc-title my-5">{t.manageAccess}</h1>
      <section className="bc-panel max-w-2xl">
        {target ? (
          <>
            <h2 className="text-lg font-medium">{target.name}</h2>
            <p className="mt-1 mb-6 text-sm text-gray-500 dark:text-gray-400">
              {target.email}
            </p>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void perform();
              }}
            >
              <fieldset disabled={busy || !canManage} className="space-y-5">
                <label className="block text-sm">
                  {t.clinic}
                  <Select
                    value={clinicId || null}
                    onValueChange={(value) => {
                      setClinicId(value ?? "");
                      setRole("");
                    }}
                  >
                    <SelectTrigger aria-label={t.clinic} className="mt-2">
                      <SelectValue placeholder={t.chooseClinic}>
                        {clinics.find((c) => c.id === clinicId)?.name ??
                          t.chooseClinic}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {clinics.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </label>
                <label className="block text-sm">
                  {t.role}
                  <Select
                    disabled={!clinicId || rolesFor !== clinicId}
                    value={role || null}
                    onValueChange={(value) => setRole(value ?? "")}
                  >
                    <SelectTrigger aria-label={t.role} className="mt-2">
                      <SelectValue placeholder={t.chooseRole}>
                        {role || t.chooseRole}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {rolesFor === clinicId &&
                        roles.map((r) => (
                          <SelectItem key={r.id} value={r.name}>
                            {r.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </label>
                {existing && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {existing.roles.join(", ")}
                  </p>
                )}
                <div className="flex flex-wrap gap-3">
                  <Button type="submit" disabled={!clinicId || !role}>
                    {t.save}
                  </Button>
                  {existing && (
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => void perform(true)}
                    >
                      {t.removeAccess}
                    </Button>
                  )}
                </div>
              </fieldset>
            </form>
          </>
        ) : (
          <FormSkeleton fields={2} intro />
        )}
        {failure && (
          <div role="alert" className="mt-4">
            <p className="text-sm text-red-600 dark:text-red-400">{failure}</p>
            <Button variant="ghost" onClick={() => setRetry((v) => v + 1)}>
              {t.retry}
            </Button>
          </div>
        )}
      </section>
    </>
  );
}
