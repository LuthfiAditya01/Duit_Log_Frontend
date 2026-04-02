"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { useLocale } from "@/providers/LocaleProvider";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", key: "dashboard" },
  { href: "/transactions", key: "transactions" },
  { href: "/wallets", key: "wallets" },
  { href: "/categories", key: "categories" },
  { href: "/bills", key: "bills" },
  { href: "/profile", key: "profile" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { t } = useLocale();

  const onLogout = () => {
    logout();
    router.replace("/login");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div>
            <div className="flex items-center gap-3">
              <Image
                src="/logo.png"
                alt="Duit Log logo"
                width={32}
                height={32}
                className="h-8 w-8 rounded-lg object-cover"
              />
              <div>
                <p className="text-sm text-muted">{t("appName")}</p>
                <h1 className="text-base font-semibold text-foreground">
                  {t("welcome")}, {user?.name ?? "User"}
                </h1>
              </div>
            </div>
          </div>

          <button
            type="button"
            className="rounded-md bg-danger px-3 py-1.5 text-sm font-medium text-white"
            onClick={onLogout}
          >
            {t("logout")}
          </button>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 sm:grid-cols-[220px_1fr] sm:px-6">
        <aside className="rounded-lg border border-border bg-card p-3">
          <nav className="flex flex-wrap gap-2 sm:flex-col">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-md px-3 py-2 text-sm capitalize",
                  pathname === item.href
                    ? "bg-primary text-white"
                    : "text-foreground hover:bg-slate-100 dark:hover:bg-slate-800"
                )}
              >
                {item.key}
              </Link>
            ))}
          </nav>
        </aside>

        <main className="rounded-lg border border-border bg-card p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
