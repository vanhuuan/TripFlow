import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";
import { useAuth } from "../auth/AuthContext";
import { PageHeader } from "../components/PageHeader";

const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(1, "Password is required."),
});

type LoginFormValues = z.infer<typeof loginSchema>;

type LocationState = {
  from?: {
    pathname?: string;
  };
};

function getErrorMessage(error: unknown) {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response;
    return response?.data?.message ?? "Login failed. Check your email and password.";
  }

  return "Login failed. Check your email and password.";
}

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
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
      setServerError(getErrorMessage(error));
    }
  }

  return (
    <section className="max-w-md space-y-6">
      <PageHeader eyebrow="Access" title="Login" description="Sign in to manage your trips and itinerary steps." />
      <form className="space-y-4 rounded border border-stone-200 bg-white p-5 shadow-sm" onSubmit={handleSubmit(onSubmit)}>
        {serverError ? <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{serverError}</p> : null}
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
            autoComplete="current-password"
            {...register("password")}
          />
          {errors.password ? <span className="mt-1 block text-sm text-red-600">{errors.password.message}</span> : null}
        </label>
        <button className="w-full rounded bg-coast px-4 py-2 font-semibold text-white disabled:opacity-60" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Logging in..." : "Login"}
        </button>
      </form>
      <Link className="text-sm font-medium text-coast" to="/signup">
        Create an account
      </Link>
    </section>
  );
}
