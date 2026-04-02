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

const profileSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password confirmation is required"),
});

const passwordSchema = z
  .object({
    oldPassword: z.string().min(6, "Current password is required"),
    newPassword: z.string().min(6, "Min 6 characters"),
    confirmPassword: z.string().min(6, "Min 6 characters"),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "Password mismatch",
  });

type ProfileFormValues = z.infer<typeof profileSchema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;

export function ProfileManager() {
  const router = useRouter();
  const { logout, refreshProfile } = useAuth();
  const { locale, setLocale } = useLocale();
  const { mode, setMode } = useTheme();
  const [user, setUser] = useState<User | null>(null);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
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
    setProfileMessage("Profile updated successfully");
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
        <h2 className="text-lg font-semibold">Preferences</h2>
        <p className="text-sm text-muted">
          Language and theme are saved automatically in local storage.
        </p>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="block space-y-1 text-sm font-medium">
            <span>Language</span>
            <select
              className="w-full rounded-md border bg-background px-3 py-2"
              value={locale}
              onChange={(event) => setLocale(event.target.value as "id" | "en")}
            >
              <option value="id">Indonesia</option>
              <option value="en">English</option>
            </select>
          </label>

          <label className="block space-y-1 text-sm font-medium">
            <span>Theme</span>
            <select
              className="w-full rounded-md border bg-background px-3 py-2"
              value={mode}
              onChange={(event) =>
                setMode(event.target.value as "light" | "dark" | "system")
              }
            >
              <option value="system">System</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </label>
        </div>
      </section>

      <section className="rounded-xl border border-border p-4">
        <h2 className="text-lg font-semibold">Profile</h2>
        <p className="text-sm text-muted">
          Update your account info with password confirmation
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
            <Field label="Name" error={profileForm.formState.errors.name?.message}>
              <input
                type="text"
                className="w-full rounded-md border bg-background px-3 py-2"
                {...profileForm.register("name")}
              />
            </Field>

            <Field label="Email" error={profileForm.formState.errors.email?.message}>
              <input
                type="email"
                className="w-full rounded-md border bg-background px-3 py-2"
                {...profileForm.register("email")}
              />
            </Field>

            <Field
              label="Confirm password"
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
                {profileForm.formState.isSubmitting ? "Saving..." : "Save Profile"}
              </button>
              {profileMessage && (
                <p className="mt-2 text-sm text-success">{profileMessage}</p>
              )}
            </div>
          </form>
        </div>
      </section>

      <section className="rounded-xl border border-border p-4">
        <h2 className="text-lg font-semibold">Change Password</h2>
        <p className="text-sm text-muted">
          You will be logged out after a successful password change
        </p>

        <form
          className="mt-4 grid gap-4 md:grid-cols-2"
          onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
        >
          <Field
            label="Current password"
            error={passwordForm.formState.errors.oldPassword?.message}
          >
            <input
              type="password"
              className="w-full rounded-md border bg-background px-3 py-2"
              {...passwordForm.register("oldPassword")}
            />
          </Field>

          <Field
            label="New password"
            error={passwordForm.formState.errors.newPassword?.message}
          >
            <input
              type="password"
              className="w-full rounded-md border bg-background px-3 py-2"
              {...passwordForm.register("newPassword")}
            />
          </Field>

          <Field
            label="Confirm new password"
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
                ? "Updating..."
                : "Change Password"}
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
