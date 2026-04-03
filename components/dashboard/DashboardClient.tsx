"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { me } from "@/lib/api/auth";
import { fetchTransactions } from "@/lib/api/finance";
import { generateDashboardPdfBlob } from "@/lib/dashboard-pdf";
import { calculateDashboardSummary } from "@/lib/dashboard";
import { formatCurrency, formatDate } from "@/lib/format";
import { useLocale } from "@/providers/LocaleProvider";
import { openTransactionReceipt } from "../../lib/transaction-receipt";
import type { TransactionListItem, User } from "@/lib/types";

function currentPeriod() {
  const now = new Date();
  return { month: now.getMonth() + 1, year: now.getFullYear() };
}

export function DashboardClient() {
  const { month: initialMonth, year: initialYear } = currentPeriod();
  const { t } = useLocale();
  const [user, setUser] = useState<User | null>(null);
  const [transactions, setTransactions] = useState<TransactionListItem[]>([]);
  const [month, setMonth] = useState(initialMonth);
  const [year, setYear] = useState(initialYear);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [profile, list] = await Promise.all([
        me(),
        fetchTransactions(month, year),
      ]);
      setUser(profile);
      setTransactions(list);
    } catch {
      setError(t("failedToLoadDashboardData"));
    } finally {
      setIsLoading(false);
    }
  }, [month, t, year]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const summary = useMemo(() => calculateDashboardSummary(transactions), [transactions]);

  const handleExportPdf = useCallback(async () => {
    const previewWindow = window.open("", "_blank", "noopener,noreferrer");

    if (!previewWindow) {
      try {
        const blob = await generateDashboardPdfBlob({
          user,
          month,
          year,
          transactions,
          summary,
        });
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = "duit-log-report.pdf";
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
      } catch {
        window.alert(t("failedToLoadDashboardData"));
      }
      return;
    }

    previewWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>${t("exportPdf")}</title>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <style>
            body {
              margin: 0;
              font-family: Arial, sans-serif;
              background: #f8fafc;
              color: #0f172a;
            }
            .shell {
              height: 100vh;
              display: grid;
              place-items: center;
              gap: 12px;
            }
            .card {
              background: white;
              border: 1px solid #cbd5e1;
              border-radius: 16px;
              padding: 20px 24px;
              box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
              text-align: center;
            }
            .muted { color: #64748b; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="shell"><div class="card"><strong>${t("exportPdf")}</strong><div class="muted">${t("loading")}</div></div></div>
        </body>
      </html>
    `);
    previewWindow.document.close();

    try {
      const blob = await generateDashboardPdfBlob({
        user,
        month,
        year,
        transactions,
        summary,
      });

      const blobUrl = URL.createObjectURL(blob);
      const previewId =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

      const storageKey = `duitlog_pdf_preview_${previewId}`;

      try {
        window.localStorage.setItem(storageKey, blobUrl);
        previewWindow.location.href = `/reports/preview?id=${encodeURIComponent(previewId)}`;
      } catch {
        previewWindow.location.href = blobUrl;
      }
    } catch {
      previewWindow.document.open();
      previewWindow.document.write(`
        <!doctype html>
        <html>
          <head>
            <title>${t("exportPdf")}</title>
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <style>
              body {
                margin: 0;
                min-height: 100vh;
                display: grid;
                place-items: center;
                font-family: Arial, sans-serif;
                background: #f8fafc;
                color: #0f172a;
              }
              .card {
                width: min(520px, 92vw);
                background: white;
                border: 1px solid #cbd5e1;
                border-radius: 16px;
                padding: 22px;
                box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
              }
              p { color: #475569; line-height: 1.5; }
              button {
                margin-top: 12px;
                border: 1px solid #cbd5e1;
                background: white;
                border-radius: 8px;
                padding: 8px 12px;
                cursor: pointer;
              }
            </style>
          </head>
          <body>
            <div class="card">
              <h2>${t("failedToLoadDashboardData")}</h2>
              <p>${t("loading")}</p>
              <button onclick="window.close()">${t("close")}</button>
            </div>
          </body>
        </html>
      `);
      previewWindow.document.close();
    }
  }, [month, summary, transactions, user, year]);

  if (isLoading) {
    return <p className="text-sm text-muted">{t("loadingDashboard")}</p>;
  }

  if (error) {
    return <p className="text-sm text-danger">{error}</p>;
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-4">
        <StatCard label={t("balance")} value={formatCurrency(user?.balance ?? 0)} />
        <StatCard label={t("income")} value={formatCurrency(summary.income)} />
        <StatCard label={t("expense")} value={formatCurrency(summary.expense)} />
        <StatCard
          label={t("net")}
          value={formatCurrency(summary.net)}
          emphasis={summary.net >= 0 ? "positive" : "negative"}
        />
      </section>

      <div className="flex justify-end">
        <button
          type="button"
          className="rounded-md border border-border bg-background px-4 py-2 text-sm font-medium"
          onClick={handleExportPdf}
        >
          {t("exportPdf")}
        </button>
      </div>

      <section className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-xl border border-border p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">{t("recentTransactions")}</h2>
              <p className="text-sm text-muted">{t("selectedPeriod")}</p>
            </div>
            <div className="flex gap-2 text-sm">
              <select
                className="rounded-md border bg-background px-2 py-1"
                value={month}
                onChange={(event) => setMonth(Number(event.target.value))}
              >
                {Array.from({ length: 12 }, (_, index) => index + 1).map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
              <input
                className="w-24 rounded-md border bg-background px-2 py-1"
                type="number"
                value={year}
                onChange={(event) => setYear(Number(event.target.value))}
              />
            </div>
          </div>

          <div className="space-y-3">
            {transactions.length === 0 ? (
              <p className="text-sm text-muted">{t("noTransactionsFound")}</p>
            ) : (
              transactions.map((item) => (
                <article
                  key={item._id}
                  className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
                >
                  <div>
                    <p className="font-medium">
                      {item.category.name} · {item.wallet.name}
                    </p>
                    <p className="text-xs text-muted">
                      {formatDate(item.date)}
                      {item.description ? ` · ${item.description}` : ""}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span
                      className={
                        item.type === "income"
                          ? "font-semibold text-success"
                          : "font-semibold text-danger"
                      }
                    >
                      {item.type === "income" ? "+" : "-"}
                      {formatCurrency(item.amount)}
                    </span>
                    <button
                      type="button"
                      className="rounded-md border border-border px-3 py-1 text-xs font-medium text-foreground"
                      onClick={() => openTransactionReceipt(item)}
                    >
                      {t("printReceipt")}
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border p-4">
          <h2 className="mb-4 text-lg font-semibold">{t("expenseBreakdown")}</h2>
          <div className="space-y-3">
            {Object.keys(summary.categoryBreakdown).length === 0 ? (
              <p className="text-sm text-muted">{t("noExpenseDataForThisPeriod")}</p>
            ) : (
              Object.entries(summary.categoryBreakdown)
                .sort((a, b) => b[1] - a[1])
                .map(([category, value]) => (
                  <div key={category}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span>{category}</span>
                      <span>{formatCurrency(value)}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${Math.min(100, (value / summary.expense) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  emphasis,
}: {
  label: string;
  value: string;
  emphasis?: "positive" | "negative";
}) {
  const { t } = useLocale();
  return (
    <div className="rounded-xl border border-border p-4">
      <p className="text-sm text-muted">{label}</p>
      <p
        className={
          emphasis === "positive"
            ? "mt-2 text-2xl font-semibold text-success"
            : emphasis === "negative" || label.toLowerCase() === t("expense").toLowerCase()
              ? "mt-2 text-2xl font-semibold text-danger"
              : "mt-2 text-2xl font-semibold"
        }
      >
        {value}
      </p>
    </div>
  );
}
