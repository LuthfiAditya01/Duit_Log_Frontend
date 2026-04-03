"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useAuth } from "@/providers/AuthProvider";
import { useLocale } from "@/providers/LocaleProvider";

const schema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Min 6 characters"),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { t } = useLocale();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      await login(values);
      const nextParam =
        typeof window !== "undefined"
          ? new URLSearchParams(window.location.search).get("next")
          : null;
      router.replace(nextParam || "/dashboard");
    } catch {
      setError("root", { message: t("authFailed") });
    }
  };

  return (
    <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-6 flex justify-center">
        <Image
          src="/logo.png"
          alt="Duit Log logo"
          width={88}
          height={88}
          priority
          className="h-20 w-20 rounded-2xl object-cover shadow-sm"
        />
      </div>

      <h1 className="mb-1 text-2xl font-semibold">{t("login")}</h1>
      <p className="mb-6 text-sm text-muted">{t("appName")}</p>

      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <div>
          <label className="mb-1 block text-sm font-medium">{t("email")}</label>
          <input
            type="email"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            {...register("email")}
          />
          {errors.email && (
            <p className="mt-1 text-xs text-danger">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">{t("password")}</label>
          <input
            type="password"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            {...register("password")}
          />
          {errors.password && (
            <p className="mt-1 text-xs text-danger">{errors.password.message}</p>
          )}
        </div>

        {errors.root && (
          <p className="text-sm text-danger">{errors.root.message}</p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full cursor-pointer disabled:cursor-not-allowed rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {isSubmitting ? t("loading") : t("login")}
        </button>
      </form>

      <p className="mt-4 text-sm text-muted">
        {t("noAccount")} {" "}
        <Link href="/register" className="font-medium text-primary">
          {t("signUpNow")}
        </Link>
      </p>
    </div>
  );
}
