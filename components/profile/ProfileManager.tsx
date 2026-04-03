"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  changePassword,
  me,
  updateMe,
} from "@/lib/api/auth";
import type { User } from "@/lib/types";
import { useAuth } from "@/providers/AuthProvider";
import { useLocale } from "@/providers/LocaleProvider";
import { useTheme } from "@/providers/ThemeProvider";

function buildProfileSchema(t: (key: string) => string) {
  return z.object({
    name: z.string().min(2, t("nameIsRequired")),
    email: z.string().email(t("invalidEmail")),
    password: z.string().min(6, t("passwordConfirmationIsRequired")),
  });
}

function buildPasswordSchema(t: (key: string) => string) {
  return z
    .object({
      oldPassword: z.string().min(6, t("currentPasswordIsRequired")),
      newPassword: z.string().min(6, t("min6Characters")),
      confirmPassword: z.string().min(6, t("min6Characters")),
    })
    .refine((value) => value.newPassword === value.confirmPassword, {
      path: ["confirmPassword"],
      message: t("passwordMismatch"),
    });
}

type ProfileFormValues = z.infer<ReturnType<typeof buildProfileSchema>>;
type PasswordFormValues = z.infer<ReturnType<typeof buildPasswordSchema>>;

export function ProfileManager() {
  const router = useRouter();
  const { logout, refreshProfile } = useAuth();
  const { locale, setLocale } = useLocale();
  const { mode, setMode } = useTheme();
  const { t } = useLocale();
  const [user, setUser] = useState<User | null>(null);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(buildProfileSchema(t)),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(buildPasswordSchema(t)),
    defaultValues: {
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    const bootstrap = async () => {
      const profile = await me();
      setUser(profile);
      profileForm.reset({
        name: profile.name,
        email: profile.email,
        password: "",
      });
    };

    void bootstrap();
  }, [profileForm]);

  const onProfileSubmit = async (values: ProfileFormValues) => {
    setProfileMessage(null);
    await updateMe({
      name: values.name,
      email: values.email,
      password: values.password,
    });
    await refreshProfile();
    setUser(await me());
    setProfileMessage(t("profileUpdatedSuccessfully"));
  };

  const onPasswordSubmit = async (values: PasswordFormValues) => {
    await changePassword({
      oldPassword: values.oldPassword,
      newPassword: values.newPassword,
    });
    logout();
    router.replace("/login");
  };

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-border p-4">
        <h2 className="text-lg font-semibold">{t("preferences")}</h2>
        <p className="text-sm text-muted">
          {t("languageAndThemeSavedAutomatically")}
        </p>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="block space-y-1 text-sm font-medium">
            <span>{t("language")}</span>
            <select
              className="w-full rounded-md border bg-background px-3 py-2"
              value={locale}
              onChange={(event) => setLocale(event.target.value as "id" | "en")}
            >
              <option value="id">{t("indonesia")}</option>
              <option value="en">{t("english")}</option>
            </select>
          </label>

          <label className="block space-y-1 text-sm font-medium">
            <span>{t("theme")}</span>
            <select
              className="w-full rounded-md border bg-background px-3 py-2"
              value={mode}
              onChange={(event) =>
                setMode(event.target.value as "light" | "dark" | "system")
              }
            >
              <option value="system">{t("system")}</option>
              <option value="light">{t("light")}</option>
              <option value="dark">{t("dark")}</option>
            </select>
          </label>
        </div>
      </section>

      <section className="rounded-xl border border-border p-4">
        <h2 className="text-lg font-semibold">{t("profileSection")}</h2>
        <p className="text-sm text-muted">
          {t("updateAccountInfoWithPasswordConfirmation")}
        </p>

        <div className="mt-4 rounded-lg border border-border bg-background p-4">
          <div className="mb-4 flex items-center gap-4">
            <div className="grid h-14 w-14 place-items-center rounded-full bg-primary text-lg font-semibold text-white">
              {user?.name?.slice(0, 1).toUpperCase() ?? "U"}
            </div>
            <div>
              <p className="font-semibold">{user?.name ?? "User"}</p>
              <p className="text-sm text-muted">{user?.email ?? "-"}</p>
            </div>
          </div>

          <form
            className="grid gap-4 md:grid-cols-2"
            onSubmit={profileForm.handleSubmit(onProfileSubmit)}
          >
            <Field label={t("name")} error={profileForm.formState.errors.name?.message}>
              <input
                type="text"
                className="w-full rounded-md border bg-background px-3 py-2"
                {...profileForm.register("name")}
              />
            </Field>

            <Field label={t("email")} error={profileForm.formState.errors.email?.message}>
              <input
                type="email"
                className="w-full rounded-md border bg-background px-3 py-2"
                {...profileForm.register("email")}
              />
            </Field>

            <Field
              label={t("confirmPassword")}
              error={profileForm.formState.errors.password?.message}
            >
              <input
                type="password"
                className="w-full rounded-md border bg-background px-3 py-2"
                {...profileForm.register("password")}
              />
            </Field>

            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={profileForm.formState.isSubmitting}
                className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {profileForm.formState.isSubmitting ? t("savingProfile") : t("saveProfile")}
              </button>
              {profileMessage && (
                <p className="mt-2 text-sm text-success">{profileMessage}</p>
              )}
            </div>
          </form>
        </div>
      </section>

      <section className="rounded-xl border border-border p-4">
        <h2 className="text-lg font-semibold">{t("changePassword")}</h2>
        <p className="text-sm text-muted">{t("youWillBeLoggedOutAfterPasswordChange")}</p>

        <form
          className="mt-4 grid gap-4 md:grid-cols-2"
          onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
        >
          <Field
            label={t("currentPassword")}
            error={passwordForm.formState.errors.oldPassword?.message}
          >
            <input
              type="password"
              className="w-full rounded-md border bg-background px-3 py-2"
              {...passwordForm.register("oldPassword")}
            />
          </Field>

          <Field
            label={t("newPassword")}
            error={passwordForm.formState.errors.newPassword?.message}
          >
            <input
              type="password"
              className="w-full rounded-md border bg-background px-3 py-2"
              {...passwordForm.register("newPassword")}
            />
          </Field>

          <Field
            label={t("confirmNewPassword")}
            error={passwordForm.formState.errors.confirmPassword?.message}
          >
            <input
              type="password"
              className="w-full rounded-md border bg-background px-3 py-2"
              {...passwordForm.register("confirmPassword")}
            />
          </Field>

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={passwordForm.formState.isSubmitting}
              className="rounded-md bg-danger px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {passwordForm.formState.isSubmitting
                ? t("updatingPassword")
                : t("changePassword")}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1 text-sm font-medium">
      <span>{label}</span>
      {children}
      {error && <p className="text-xs text-danger">{error}</p>}
    </label>
  );
}
