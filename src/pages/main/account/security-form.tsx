import { useState } from "react";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { api } from "@/lib/api";
import { authErrorMessage } from "@/lib/api-client";
import { notify } from "@/lib/notify";
import { accountMessages } from "@/lib/session-messages";
import { schemaFor, type AuthFields } from "../../others/auth/schema";

export function AccountSecurityForm({
  mode,
  onCancel,
}: {
  mode: "change-password" | "change-email";
  onCancel: () => void;
}) {
  const t = accountMessages();
  const password = mode === "change-password";
  const navigate = useNavigate();
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [sentTo, setSentTo] = useState("");
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AuthFields>({ resolver: zodResolver(schemaFor(mode)) });
  const fields = password
    ? (["currentPassword", "password", "confirmPassword"] as const)
    : (["email", "currentPassword"] as const);

  if (sentTo)
    return (
      <div className="space-y-3">
        <p className="bc-notice text-sm" role="status">
          {t.emailSent} <strong className="break-all">{sentTo}</strong>.{" "}
          {t.emailPending}
        </p>
        <Button type="button" variant="outline" onClick={onCancel}>
          {t.done}
        </Button>
      </div>
    );

  return (
    <form
      noValidate
      className="space-y-4"
      onSubmit={handleSubmit(async (values) => {
        setError("");
        try {
          if (password) {
            await api.changePassword(values.currentPassword!, values.password!);
            notify.success(t.passwordChanged);
            void navigate("/iniciar-sesion", {
              replace: true,
              state: { message: t.passwordChanged, from: "/mi-cuenta" },
            });
            return;
          }
          await api.changeEmail(values.email!, values.currentPassword!);
          reset();
          setSentTo(values.email!);
          notify.success(t.verificationSent);
        } catch (failure) {
          const message = authErrorMessage(failure, "credentials");
          setError(message);
          notify.error(message);
        }
      })}
    >
      {error && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950 dark:text-red-200"
        >
          {error}
        </p>
      )}
      <fieldset
        disabled={isSubmitting}
        className="max-w-lg space-y-4 disabled:opacity-70"
      >
        {fields.map((name) => {
          const id = "account-" + name;
          const email = name === "email";
          const error = errors[name]?.message;
          const hint = name === "password" ? id + "-hint" : "";
          return (
            <Field key={name} data-invalid={!!error}>
              <FieldLabel htmlFor={id}>{t[name]}</FieldLabel>
              <input
                id={id}
                type={email ? "email" : show ? "text" : "password"}
                autoComplete={
                  email
                    ? "email"
                    : name === "currentPassword"
                      ? "current-password"
                      : "new-password"
                }
                className="bc-input"
                aria-invalid={!!error}
                aria-describedby={
                  [hint, error ? id + "-error" : ""]
                    .filter(Boolean)
                    .join(" ") || undefined
                }
                {...register(name)}
              />
              {hint && (
                <p
                  id={hint}
                  className="text-xs text-gray-500 dark:text-gray-400"
                >
                  {t.passwordRules}
                </p>
              )}
              {error && <FieldError id={id + "-error"}>{error}</FieldError>}
            </Field>
          );
        })}
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={show}
            onChange={(event) => setShow(event.target.checked)}
          />
          {t.showPasswords}
        </label>
        <div className="flex flex-wrap gap-2">
          <Button type="submit">
            {isSubmitting
              ? t.processing
              : password
                ? t.savePassword
                : t.sendVerification}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            {t.cancel}
          </Button>
        </div>
      </fieldset>
    </form>
  );
}
