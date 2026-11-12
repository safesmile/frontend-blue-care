import { useEffect, useState, type ReactNode } from "react";
import { FormSkeleton } from "@/components/shared/loading-skeletons";
import { BackLink } from "@/components/shared/navigation-actions";
import { PageMeta } from "@/components/shared/page-meta";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { canOpenRoute } from "@/lib/access-context";
import { ApiError } from "@/lib/api-client";
import { clinicMessages, peopleMessages } from "@/lib/session-messages";
import { clinicsApi, type Clinic } from "./api";

export function ClinicPageHeading({ title }: { title: string }) {
  const { user } = useAuth();
  const t = clinicMessages();
  const canList = canOpenRoute(user, "/clinicas");
  return (
    <>
      <PageMeta title={title + " | BlueCare"} description={title} />
      <BackLink to={canList ? "/clinicas" : "/mi-cuenta"}>
        {canList ? t.back : peopleMessages().backToAccount}
      </BackLink>
      <h1 className="bc-title my-5">{title}</h1>
    </>
  );
}

export function ClinicStatus({ enabled }: { enabled: boolean }) {
  const t = clinicMessages();
  return (
    <span
      className={
        enabled
          ? "inline-flex rounded-full bg-teal-50 px-2 py-1 text-xs font-medium text-teal-800 dark:bg-teal-950 dark:text-teal-200"
          : "inline-flex rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300"
      }
    >
      {t[enabled ? "active" : "inactive"]}
    </span>
  );
}

export function ClinicRecord({
  id,
  children,
}: {
  id: string;
  children: (clinic: Clinic) => ReactNode;
}) {
  const t = clinicMessages();
  const [result, setResult] = useState<Clinic | "unavailable" | "error">();
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    void clinicsApi
      .read(id)
      .then((clinic) => {
        if (active) setResult(clinic);
      })
      .catch((error: unknown) => {
        if (active)
          setResult(
            error instanceof ApiError && [403, 404].includes(error.status)
              ? "unavailable"
              : "error",
          );
      });
    return () => {
      active = false;
    };
  }, [id, attempt]);

  if (result && typeof result !== "string") return children(result);
  return (
    <section className="bc-panel max-w-3xl" aria-busy={!result}>
      {!result ? (
        <FormSkeleton fields={6} />
      ) : (
        <>
          <p role="alert">
            {t[result === "error" ? "loadError" : "unavailable"]}
          </p>
          {result === "error" && (
            <Button
              type="button"
              variant="outline"
              className="mt-4"
              onClick={() => {
                setResult(undefined);
                setAttempt((value) => value + 1);
              }}
            >
              {peopleMessages().retry}
            </Button>
          )}
        </>
      )}
    </section>
  );
}
