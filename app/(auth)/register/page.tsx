"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useAuth } from "@/providers/AuthProvider";
import { useLocale } from "@/providers/LocaleProvider";

const schema = z
  .object({
    name: z.string().min(2, "Min 2 characters"),
    email: z.string().email("Invalid email"),
    password: z.string().min(6, "Min 6 characters"),
    confirmPassword: z.string().min(6, "Min 6 characters"),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "Password mismatch",
  });

type FormValues = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerUser } = useAuth();
  const { t } = useLocale();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      await registerUser({
        name: values.name,
        email: values.email,
        password: values.password,
      });
      router.replace("/login");
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

      <h1 className="mb-1 text-2xl font-semibold">{t("register")}</h1>
      <p className="mb-6 text-sm text-muted">{t("appName")}</p>

      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <div>
          <label className="mb-1 block text-sm font-medium">{t("fullName")}</label>
          <input
            type="text"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            {...register("name")}
          />
          {errors.name && (
            <p className="mt-1 text-xs text-danger">{errors.name.message}</p>
          )}
        </div>

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

        <div>
          <label className="mb-1 block text-sm font-medium">
            {t("confirmPassword")}
          </label>
          <input
            type="password"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            {...register("confirmPassword")}
          />
          {errors.confirmPassword && (
            <p className="mt-1 text-xs text-danger">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        {errors.root && (
          <p className="text-sm text-danger">{errors.root.message}</p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {isSubmitting ? t("loading") : t("register")}
        </button>
      </form>

      <p className="mt-4 text-sm text-muted">
        {t("alreadyHaveAccount")} {" "}
        <Link href="/login" className="font-medium text-primary">
          {t("signInNow")}
        </Link>
      </p>
    </div>
  );
}
