import { notify } from "@/lib/notify";
import { peopleMessages } from "@/lib/session-messages";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/lib/api";
import { canOpenRoute, sessionHome } from "@/lib/access-context";
import { sessionMessages } from "@/lib/session-messages";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BoxIcon, LayerIcon } from "@/icons";
export function SessionControls() {
  const { user, switching } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [failure, setFailure] = useState("");
  const [checking, setChecking] = useState(false);
  const text = sessionMessages();
  if (!user) return null;
  const clinics = user.clinics ?? [];
  const selection =
    clinics.length &&
    (!user.clinicId || clinics.some((c) => c.id === user.clinicId))
      ? (user.clinicId ?? "all")
      : "";
  const change = async (operation: () => Promise<void>) => {
    setFailure("");
    try {
      await operation();
      const currentUser = api.getSnapshot().user;
      if (!canOpenRoute(currentUser, location.pathname))
        void navigate(sessionHome(currentUser), { replace: true });
    } catch {
      setFailure(text.failed);
      notify.error(text.failed);
    }
  };
  return (
    <div className="flex flex-wrap items-center gap-2">
      {user.mode === "staff" && (
        <>
          <Select
            value={selection || null}
            disabled={switching || checking || !clinics.length}
            onValueChange={(value) => {
              if (value && value !== selection)
                void change(() =>
                  api.switchClinic(value === "all" ? null : value),
                );
            }}
          >
            <SelectTrigger
              aria-label={text.clinic}
              className="h-14! w-64 rounded-xl! border-gray-200 bg-gray-50/70 ps-2.5! pe-3! shadow-none hover:border-teal-300 hover:bg-teal-50/40 focus-visible:ring-teal-500/20 data-popup-open:border-teal-400 sm:w-72 dark:border-gray-700 dark:bg-[#1b3046] dark:hover:border-teal-600 dark:hover:bg-[#20394e]"
            >
              <span
                aria-hidden="true"
                className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300"
              >
                <BoxIcon className="size-5" />
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-0.5 text-start">
                <span className="text-[10px] font-medium tracking-wide text-gray-500 dark:text-gray-400">
                  {text.clinic}
                </span>
                <SelectValue
                  placeholder={text.none}
                  className="block truncate text-xs font-semibold text-gray-800 dark:text-gray-100"
                >
                  {clinics.find((clinic) => clinic.id === selection)?.name ??
                    (selection === "all" ? text.all : text.none)}
                </SelectValue>
              </span>
            </SelectTrigger>
            <SelectContent
              align="start"
              className="min-w-72 rounded-xl p-2 shadow-xl dark:bg-[#142539]"
            >
              <SelectGroup>
                <SelectLabel className="px-3 pt-1 pb-2 text-[11px]">
                  {text.clinic}
                </SelectLabel>
                <SelectItem
                  value="all"
                  className="rounded-lg data-selected:bg-teal-50 dark:data-selected:bg-teal-950/50"
                >
                  <LayerIcon className="size-4" />
                  <span className="text-xs">{text.all}</span>
                </SelectItem>
                {clinics.map((clinic) => (
                  <SelectItem
                    key={clinic.id}
                    value={clinic.id}
                    className="rounded-lg data-selected:bg-teal-50 dark:data-selected:bg-teal-950/50"
                  >
                    <BoxIcon className="size-4" />
                    <span className="max-w-64 truncate text-xs">
                      {clinic.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <Button
            size="sm"
            variant="ghost"
            disabled={switching || checking}
            onClick={async () => {
              setChecking(true);
              setFailure("");
              try {
                await api.reloadProfile();
                notify.success(peopleMessages().accessRefreshed);
              } catch {
                setFailure(text.reloadFailed);
                notify.error(text.reloadFailed);
              } finally {
                setChecking(false);
              }
            }}
          >
            {checking ? text.refreshing : text.refresh}
          </Button>
        </>
      )}
      {switching && (
        <span role="status" className="text-xs">
          {text.changing}
        </span>
      )}
      {failure && (
        <p
          role="alert"
          className="w-full text-sm text-red-600 dark:text-red-400"
        >
          {failure}
        </p>
      )}
    </div>
  );
}
