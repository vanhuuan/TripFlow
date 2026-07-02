import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { useAuth } from "../auth/AuthContext";
import { PageHeader } from "../components/PageHeader";

const signupSchema = z
  .object({
    displayName: z.string().trim().min(2, "Display name must be at least 2 characters.").max(100, "Display name is too long."),
    email: z.string().trim().email("Enter a valid email address."),
    password: z.string().min(8, "Password must be at least 8 characters.").max(128, "Password is too long."),
    confirmPassword: z.string().min(1, "Confirm your password."),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });

type SignupFormValues = z.infer<typeof signupSchema>;

function getErrorMessage(error: unknown) {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response;
    return response?.data?.message ?? "Signup failed. Try a different email or password.";
  }

  return "Signup failed. Try a different email or password.";
}

export function SignupPage() {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
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
      setServerError(getErrorMessage(error));
    }
  }

  return (
    <section className="max-w-md space-y-6">
      <PageHeader eyebrow="Access" title="Signup" description="Create an account to start planning trips." />
      <form className="space-y-4 rounded border border-stone-200 bg-white p-5 shadow-sm" onSubmit={handleSubmit(onSubmit)}>
        {serverError ? <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{serverError}</p> : null}
        <label className="block text-sm font-medium">
          Display name
          <input
            className="mt-1 w-full rounded border border-stone-300 px-3 py-2"
            type="text"
            placeholder="Alex Traveler"
            autoComplete="name"
            {...register("displayName")}
          />
          {errors.displayName ? <span className="mt-1 block text-sm text-red-600">{errors.displayName.message}</span> : null}
        </label>
        <label className="block text-sm font-medium">
          Email
          <input
            className="mt-1 w-full rounded border border-stone-300 px-3 py-2"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            {...register("email")}
          />
          {errors.email ? <span className="mt-1 block text-sm text-red-600">{errors.email.message}</span> : null}
        </label>
        <label className="block text-sm font-medium">
          Password
          <input
            className="mt-1 w-full rounded border border-stone-300 px-3 py-2"
            type="password"
            placeholder="********"
            autoComplete="new-password"
            {...register("password")}
          />
          {errors.password ? <span className="mt-1 block text-sm text-red-600">{errors.password.message}</span> : null}
        </label>
        <label className="block text-sm font-medium">
          Confirm password
          <input
            className="mt-1 w-full rounded border border-stone-300 px-3 py-2"
            type="password"
            placeholder="********"
            autoComplete="new-password"
            {...register("confirmPassword")}
          />
          {errors.confirmPassword ? <span className="mt-1 block text-sm text-red-600">{errors.confirmPassword.message}</span> : null}
        </label>
        <button className="w-full rounded bg-ink px-4 py-2 font-semibold text-white disabled:opacity-60" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating account..." : "Signup"}
        </button>
      </form>
      <Link className="text-sm font-medium text-coast" to="/login">
        Already have an account
      </Link>
    </section>
  );
}
