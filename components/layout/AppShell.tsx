"use client";

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
    const shouldLogout = window.confirm(t("confirmLogoutPrompt"));
    if (!shouldLogout) {
      return;
    }

    logout();
    router.replace("/login");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div>
            <p className="text-sm text-muted">{t("appName")}</p>
            <h1 className="text-base font-semibold text-foreground">
              {t("welcome")}, {user?.name ?? "User"}
            </h1>
          </div>

          <button
            type="button"
            className="rounded-md cursor-pointer bg-danger px-3 py-1.5 text-sm font-medium text-white"
            onClick={onLogout}
          >
            {t("logout")}
          </button>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 sm:grid-cols-[16rem_minmax(0,1fr)] sm:px-6 sm:items-start">
        <aside className="sticky top-6 rounded-lg border border-border bg-card p-3 sm:w-64 sm:shrink-0">
          <nav className="flex flex-wrap gap-2 sm:flex-col">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-md border border-transparent px-3 py-2 text-sm capitalize transition-colors",
                  pathname === item.href
                    ? "border-primary/40 bg-primary/10 text-primary shadow-sm dark:border-primary/30 dark:bg-primary/20 dark:text-primary"
                    : "text-foreground hover:border-border hover:bg-slate-200 hover:text-white dark:hover:border-slate-600 dark:hover:bg-slate-700 dark:hover:text-white"
                )}
              >
                {t(item.key)}
              </Link>
            ))}
          </nav>
        </aside>

        <main className="min-w-0 rounded-lg border border-border bg-card p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
