import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { useAuth } from "../auth/AuthContext";
import { useI18n } from "../i18n";
import { PageHeader } from "../components/PageHeader";

function getErrorMessage(error: unknown, fallback: string) {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response;
    return response?.data?.message ?? fallback;
  }

  return fallback;
}

export function SignupPage() {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const { t } = useI18n();
  const [serverError, setServerError] = useState<string | null>(null);
  const signupSchema = z
    .object({
      displayName: z.string().trim().min(2, "Tên hiển thị phải có ít nhất 2 ký tự.").max(100, "Tên hiển thị quá dài."),
      email: z.string().trim().email(t("common.invalidEmail")),
      password: z.string().min(8, "Mật khẩu phải có ít nhất 8 ký tự.").max(128, "Mật khẩu quá dài."),
      confirmPassword: z.string().min(1, "Vui lòng xác nhận mật khẩu."),
    })
    .refine((values) => values.password === values.confirmPassword, {
      path: ["confirmPassword"],
      message: "Mật khẩu không khớp.",
    });
  type SignupFormValues = z.infer<typeof signupSchema>;
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormValues>({
    defaultValues: {
      displayName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: SignupFormValues) {
    setServerError(null);
    const parsedValues = signupSchema.safeParse(values);

    if (!parsedValues.success) {
      for (const issue of parsedValues.error.issues) {
        const fieldName = issue.path[0] as keyof SignupFormValues;
        setError(fieldName, { message: issue.message });
      }
      return;
    }

    try {
      await signup(parsedValues.data.displayName, parsedValues.data.email, parsedValues.data.password);
      navigate("/dashboard", { replace: true });
    } catch (error) {
      setServerError(getErrorMessage(error, t("common.signupFailed")));
    }
  }

  return (
    <section className="mx-auto max-w-md space-y-6">
      <PageHeader eyebrow={t("auth.access")} title={t("auth.signupTitle")} description={t("auth.signupDescription")} />
      <form className="surface-card space-y-4 p-5 sm:p-6" onSubmit={handleSubmit(onSubmit)}>
        {serverError ? <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{serverError}</p> : null}
        <label className="block text-sm font-medium">
          {t("auth.displayName")}
          <input className="form-input mt-1.5" type="text" placeholder="Alex Traveler" autoComplete="name" {...register("displayName")} />
          {errors.displayName ? <span className="mt-1.5 block text-sm text-red-600">{errors.displayName.message}</span> : null}
        </label>
        <label className="block text-sm font-medium">
          {t("auth.email")}
          <input className="form-input mt-1.5" type="email" placeholder="you@example.com" autoComplete="email" {...register("email")} />
          {errors.email ? <span className="mt-1.5 block text-sm text-red-600">{errors.email.message}</span> : null}
        </label>
        <label className="block text-sm font-medium">
          {t("auth.password")}
          <input className="form-input mt-1.5" type="password" placeholder="********" autoComplete="new-password" {...register("password")} />
          {errors.password ? <span className="mt-1.5 block text-sm text-red-600">{errors.password.message}</span> : null}
        </label>
        <label className="block text-sm font-medium">
          {t("auth.confirmPassword")}
          <input className="form-input mt-1.5" type="password" placeholder="********" autoComplete="new-password" {...register("confirmPassword")} />
          {errors.confirmPassword ? <span className="mt-1.5 block text-sm text-red-600">{errors.confirmPassword.message}</span> : null}
        </label>
        <button className="button-primary pressable w-full active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-60" type="submit" disabled={isSubmitting}>
          {isSubmitting ? t("auth.creatingAccount") : t("auth.createAccount")}
        </button>
      </form>
      <Link className="inline-flex text-sm font-medium text-coast underline-offset-4 hover:underline" to="/login">
        {t("auth.alreadyHaveAccount")}
      </Link>
    </section>
  );
}
