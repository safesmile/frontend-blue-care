import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Link } from "react-router";
import { api } from "@/lib/api";
import { ApiError } from "@/lib/api-client";
import { notify } from "@/lib/notify";
import { useAuth } from "@/hooks/use-auth";
import { PageMeta } from "@/components/shared/page-meta";
import { BackLink } from "@/components/shared/navigation-actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { FormSkeleton } from "@/components/shared/loading-skeletons";

export const money = (cents: number) =>
  new Intl.NumberFormat("es-GT", { style: "currency", currency: "GTQ" }).format(
    cents / 100,
  );
export const date = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat("es-GT", {
        dateStyle: "medium",
        timeZone: "America/Guatemala",
      }).format(new Date(value))
    : "—";
export const codePattern = "[a-z][a-z0-9\\-]{1,59}";
export const cadence = { monthly: "Mensual", annual: "Anual" };
export function useGrants() {
  const { user } = useAuth();
  return (permission: string) => !!user?.permissions.includes(permission);
}

export function AdminPage({
  title,
  description,
  back,
  actions,
  children,
}: {
  title: string;
  description: string;
  back?: [string, string];
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="space-y-5">
      <PageMeta title={title + " | BlueCare"} description={description} />
      {back && <BackLink to={back[0]}>{back[1]}</BackLink>}
      <header className="grid items-center gap-x-4 gap-y-2 sm:grid-cols-[minmax(0,1fr)_auto]">
        <h1 className="bc-title min-w-0 break-words">{title}</h1>
        {actions && (
          <div className="ms-auto flex flex-wrap justify-end gap-2">
            {actions}
          </div>
        )}
        <p className="max-w-3xl text-sm text-gray-600 sm:col-span-2 dark:text-gray-400">
          {description}
        </p>
      </header>
      {children}
    </div>
  );
}

export function ActionLink({
  to,
  children,
}: {
  to: string;
  children: ReactNode;
}) {
  return (
    <Link to={to} className={buttonVariants({ variant: "outline" })}>
      {children}
    </Link>
  );
}

export function useResource<T>(path: string | undefined, revision = 0) {
  const [result, setResult] = useState<{
    key: string;
    data?: T;
    error?: string;
  }>();
  const key = JSON.stringify([path, revision]);
  useEffect(() => {
    if (!path) return;
    let active = true;
    void api
      .authorized<T>(path)
      .then((data) => {
        if (active) setResult({ key, data });
      })
      .catch((error: unknown) => {
        if (active)
          setResult({
            key,
            error: message(error, "No se pudo cargar la información."),
          });
      });
    return () => {
      active = false;
    };
  }, [key, path]);
  return result?.key === key ? result : undefined;
}

export function Loading({
  error,
  onRetry,
}: {
  error?: string;
  onRetry: () => void;
}) {
  return (
    <section className="bc-panel" aria-busy={!error}>
      {error ? (
        <div role="alert" className="space-y-3">
          <p>{error}</p>
          <Button onClick={onRetry}>Reintentar</Button>
        </div>
      ) : (
        <FormSkeleton fields={3} />
      )}
    </section>
  );
}

function message(error: unknown, fallback: string) {
  return error instanceof ApiError &&
    error.status >= 400 &&
    error.status < 500 &&
    error.code
    ? error.code
    : fallback;
}
export function useMutation() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function run(operation: () => Promise<void>, success: string) {
    setError("");
    setBusy(true);
    try {
      await operation();
      notify.success(success);
    } catch (failure) {
      const detail = message(
        failure,
        "No se pudo completar la operación. Intenta nuevamente.",
      );
      setError(detail);
      notify.error(detail);
    } finally {
      setBusy(false);
    }
  }
  return { busy, error, run };
}

export function AdminForm({
  title,
  description,
  action,
  children,
  onSave,
  success,
}: {
  title: string;
  description?: string;
  action: string;
  children: ReactNode;
  onSave: (values: FormData) => Promise<void>;
  success: string;
}) {
  const mutation = useMutation();
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    void mutation.run(() => onSave(values), success);
  }
  return (
    <section className="bc-panel">
      <h2 className="text-lg font-semibold">{title}</h2>
      {description && (
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          {description}
        </p>
      )}
      <form className="mt-4" onSubmit={submit}>
        <fieldset
          disabled={mutation.busy}
          className="grid gap-4 md:grid-cols-2"
        >
          {children}
          <div className="md:col-span-2">
            <Button type="submit">
              {mutation.busy ? "Guardando…" : action}
            </Button>
          </div>
        </fieldset>
        {mutation.error && (
          <p
            role="alert"
            className="mt-3 text-sm text-red-700 dark:text-red-300"
          >
            {mutation.error}
          </p>
        )}
      </form>
    </section>
  );
}
export function Input({
  label,
  name,
  value,
  type = "text",
  min,
  max,
  step,
  maxLength,
  pattern,
}: {
  label: string;
  name: string;
  value?: string | number;
  type?: string;
  min?: number;
  max?: number;
  step?: number;
  maxLength?: number;
  pattern?: string;
}) {
  return (
    <label className="space-y-1 text-sm">
      <span>{label}</span>
      <input
        className="bc-input"
        name={name}
        defaultValue={value}
        required
        type={type}
        min={min}
        max={max}
        step={step}
        maxLength={maxLength}
        pattern={pattern}
      />
    </label>
  );
}
export function TextArea({
  label,
  name,
  value,
  required = true,
  maxLength,
}: {
  label: string;
  name: string;
  value?: string;
  required?: boolean;
  maxLength?: number;
}) {
  return (
    <label className="space-y-1 text-sm md:col-span-2">
      <span>{label}</span>
      <textarea
        className="bc-input h-auto! py-2"
        rows={3}
        name={name}
        defaultValue={value}
        required={required}
        maxLength={maxLength}
      />
    </label>
  );
}
export function SelectField({
  label,
  name,
  options,
  value,
  onChange,
  help,
  helpLabel,
}: {
  label: string;
  name: string;
  options: Record<string, string>;
  value?: string;
  onChange?: (value: string) => void;
  help?: Record<string, string>;
  helpLabel?: string;
}) {
  return (
    <div className="space-y-2 text-sm">
      <label className="block space-y-1">
        <span>{label}</span>
        <select
          className="bc-input"
          name={name}
          required
          defaultValue={value ?? ""}
          onChange={(event) => onChange?.(event.target.value)}
        >
          <option value="" disabled>
            Selecciona una opción
          </option>
          {Object.entries(options).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      {help && (
        <details className="rounded-lg border border-gray-200 px-3 py-2 dark:border-gray-700">
          <summary className="cursor-pointer font-medium text-blue-800 dark:text-blue-300">
            {helpLabel}
          </summary>
          <dl className="mt-2 space-y-2">
            {Object.entries(options).map(([key, title]) => (
              <div key={key}>
                <dt className="font-medium">{title}</dt>
                <dd className="text-gray-600 dark:text-gray-400">
                  {help[key]}
                </dd>
              </div>
            ))}
          </dl>
        </details>
      )}
    </div>
  );
}
export const field = (data: FormData, name: string) => {
  const value = data.get(name);
  return typeof value === "string" ? value.trim() : "";
};

export function InfoFact({
  label,
  value,
  price = false,
}: {
  label: string;
  value: string;
  price?: boolean;
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-900/45">
      <dt className="text-xs font-medium text-gray-600 dark:text-gray-400">
        {label}
      </dt>
      <dd
        className={
          price
            ? "mt-1 text-xl font-semibold break-words text-blue-900 dark:text-blue-200"
            : "mt-1 font-semibold break-words"
        }
      >
        {value}
      </dd>
    </div>
  );
}
