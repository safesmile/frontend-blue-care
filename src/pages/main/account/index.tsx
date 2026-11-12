import { useSearchParams } from "react-router";
import { useAuth } from "@/hooks/use-auth";
import { accountMessages, sessionMessages } from "@/lib/session-messages";
import { PageMeta } from "@/components/shared/page-meta";
import { LogoutButton } from "@/components/shared/logout-button";
import { ClinicMark } from "@/components/shared/clinic-mark";
import { Button } from "@/components/ui/button";
import { ChevronDownIcon, KeyIcon, MailIcon, UserCircleIcon } from "@/icons";
import { getInitials } from "@/utils/get-initials";
import { AccountSecurityForm } from "./security-form";

const caption = "text-xs font-medium text-gray-500 dark:text-gray-400";

export default function AccountPage() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  if (!user) return null;
  const t = accountMessages();
  const text = sessionMessages();
  const clinics = user.clinics ?? [];
  const selected = clinics.find((clinic) => clinic.id === user.clinicId);
  const staff = user.mode === "staff";
  const active = params.get("seguridad");
  const security = [
    {
      id: "contrasena",
      mode: "change-password",
      permission: "auth:password-change",
      title: t.changePassword,
      description: t.passwordDescription,
      icon: KeyIcon,
    },
    {
      id: "correo",
      mode: "change-email",
      permission: "auth:email-change",
      title: t.changeEmail,
      description: t.emailDescription,
      icon: MailIcon,
    },
  ] as const;
  const options = security.filter((option) =>
    user.permissions.includes(option.permission),
  );
  function selectForm(id?: string) {
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        if (id) next.set("seguridad", id);
        else next.delete("seguridad");
        return next;
      },
      { replace: true, preventScrollReset: true },
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      <PageMeta title={t.title + " | BlueCare"} description={t.description} />
      <header className="mb-6">
        <h1 className="bc-title">{t.title}</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          {t.description}
        </p>
      </header>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <section className="bc-panel min-w-0" aria-labelledby="account-profile">
          <h2
            id="account-profile"
            className="mb-5 flex items-center gap-2 text-lg font-semibold"
          >
            <UserCircleIcon
              aria-hidden="true"
              className="size-5 text-teal-600 dark:text-teal-300"
            />
            {t.profile}
          </h2>
          <div className="flex items-center gap-4">
            <span
              aria-hidden="true"
              className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-teal-100 text-lg font-semibold text-teal-800 dark:bg-teal-950 dark:text-teal-200"
            >
              {getInitials(user.name)}
            </span>
            <div className="min-w-0">
              <p className="text-lg font-semibold break-words">{user.name}</p>
              <p className="text-sm break-all text-gray-600 dark:text-gray-400">
                {user.email}
              </p>
            </div>
          </div>
          <dl className="mt-5 grid gap-4 border-t border-gray-200 pt-4 text-sm dark:border-gray-700">
            <div>
              <dt className={caption}>{t.emailStatus}</dt>
              <dd
                className={
                  user.verified
                    ? "mt-1 font-medium text-teal-800 dark:text-teal-200"
                    : "mt-1 font-medium text-amber-800 dark:text-amber-200"
                }
              >
                {user.verified ? t.verified : t.unverified}
              </dd>
            </div>
            <div>
              <dt className={caption}>{text.globalRoles}</dt>
              <dd className="mt-1 break-words">
                {(user.globalRoles ?? user.roles).join(", ") || "—"}
              </dd>
            </div>
          </dl>
        </section>

        {options.length > 0 && (
          <section
            className="bc-panel min-w-0 lg:row-span-2"
            aria-labelledby="account-security"
          >
            <h2 id="account-security" className="text-lg font-semibold">
              {t.security}
            </h2>
            <p className="mt-1 mb-5 text-sm text-gray-600 dark:text-gray-400">
              {t.securityDescription}
            </p>
            <div className="space-y-3">
              {options.map(({ id, mode, title, description, icon: Icon }) => {
                const open = active === id;
                return (
                  <div
                    key={id}
                    className="rounded-xl border border-gray-200 dark:border-gray-700"
                  >
                    <h3>
                      <Button
                        id={"account-action-" + id}
                        type="button"
                        variant="ghost"
                        className="h-auto w-full justify-start gap-3 rounded-xl p-3 text-start whitespace-normal sm:p-4"
                        aria-expanded={open}
                        aria-controls={"account-form-" + id}
                        onClick={() => selectForm(open ? undefined : id)}
                      >
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-200">
                          <Icon aria-hidden="true" className="size-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block font-semibold">{title}</span>
                          <span className="mt-1 block text-xs font-normal text-gray-600 dark:text-gray-400">
                            {description}
                          </span>
                        </span>
                        <ChevronDownIcon
                          aria-hidden="true"
                          className={
                            "size-4 shrink-0 transition-transform " +
                            (open ? "rotate-180" : "")
                          }
                        />
                      </Button>
                    </h3>
                    <div
                      id={"account-form-" + id}
                      hidden={!open}
                      className="border-t border-gray-200 p-4 dark:border-gray-700"
                    >
                      {open && (
                        <AccountSecurityForm
                          mode={mode}
                          onCancel={() => {
                            selectForm();
                            document
                              .getElementById("account-action-" + id)
                              ?.focus();
                          }}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <section className="bc-panel min-w-0" aria-labelledby="account-access">
          <h2 id="account-access" className="text-lg font-semibold">
            {text.access}
          </h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {staff ? text.working : text.own}
          </p>
          {staff ? (
            <>
              <h3 className={"mt-4 " + caption}>{text.selected}</h3>
              <p className="mt-1 font-medium">
                {selected?.name ??
                  (clinics.length && !user.clinicId ? text.all : text.none)}
              </p>
              {!clinics.length && (
                <p role="status" className="bc-notice mt-3 text-sm">
                  {text.unassigned}
                </p>
              )}
              {clinics.length > 0 && (
                <>
                  <h3 className={"mt-4 mb-2 " + caption}>{text.clinics}</h3>
                  <ul className="space-y-2">
                    {clinics.map((clinic) => (
                      <li
                        key={clinic.id}
                        className="flex items-center gap-3 rounded-lg border border-gray-200 p-2.5 dark:border-gray-700"
                      >
                        <ClinicMark icon={clinic.icon} color={clinic.color} />
                        <div className="min-w-0 text-sm break-words">
                          <p className="font-medium">{clinic.name}</p>
                          <p className="text-gray-600 dark:text-gray-400">
                            {clinic.roles.join(", ") || text.noRoles}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </>
          ) : (
            <p className="mt-3 text-sm">{text.personal}</p>
          )}
          <div className="mt-5 border-t border-gray-200 pt-4 dark:border-gray-700">
            <LogoutButton />
          </div>
        </section>
      </div>
    </div>
  );
}
