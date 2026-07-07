import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";
import { useAuth } from "../auth/AuthContext";
import { useI18n } from "../i18n";
import { PageHeader } from "../components/PageHeader";

type LocationState = {
  from?: {
    pathname?: string;
  };
};

function getErrorMessage(error: unknown, fallback: string) {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response;
    return response?.data?.message ?? fallback;
  }

  return fallback;
}

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { t } = useI18n();
  const [serverError, setServerError] = useState<string | null>(null);
  const loginSchema = z.object({
    email: z.string().trim().email(t("common.invalidEmail")),
    password: z.string().min(1, t("common.passwordRequired")),
  });
  type LoginFormValues = z.infer<typeof loginSchema>;

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const redirectTo = (location.state as LocationState | null)?.from?.pathname ?? "/dashboard";

  async function onSubmit(values: LoginFormValues) {
    setServerError(null);
    const parsedValues = loginSchema.safeParse(values);

    if (!parsedValues.success) {
      for (const issue of parsedValues.error.issues) {
        const fieldName = issue.path[0] as keyof LoginFormValues;
        setError(fieldName, { message: issue.message });
      }
      return;
    }

    try {
      await login(parsedValues.data.email, parsedValues.data.password);
      navigate(redirectTo, { replace: true });
    } catch (error) {
      setServerError(getErrorMessage(error, t("common.loginFailed")));
    }
  }

  return (
    <section className="mx-auto max-w-md space-y-6">
      <PageHeader eyebrow={t("auth.access")} title={t("auth.loginTitle")} description={t("auth.loginDescription")} />
      <form className="surface-card space-y-4 p-5 sm:p-6" onSubmit={handleSubmit(onSubmit)}>
        {serverError ? <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{serverError}</p> : null}
        <label className="block text-sm font-medium">
          {t("auth.email")}
          <input className="form-input mt-1.5" type="email" placeholder="you@example.com" autoComplete="email" {...register("email")} />
          {errors.email ? <span className="mt-1.5 block text-sm text-red-600">{errors.email.message}</span> : null}
        </label>
        <label className="block text-sm font-medium">
          {t("auth.password")}
          <input className="form-input mt-1.5" type="password" placeholder="********" autoComplete="current-password" {...register("password")} />
          {errors.password ? <span className="mt-1.5 block text-sm text-red-600">{errors.password.message}</span> : null}
        </label>
        <button className="button-primary pressable w-full active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-60" type="submit" disabled={isSubmitting}>
          {isSubmitting ? t("auth.loggingIn") : t("auth.loginButton")}
        </button>
      </form>
      <Link className="inline-flex text-sm font-medium text-coast underline-offset-4 hover:underline" to="/signup">
        {t("auth.createAnAccount")}
      </Link>
    </section>
  );
}
