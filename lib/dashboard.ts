import type { TransactionListItem, User } from "./types";

export interface DashboardSummary {
  income: number;
  expense: number;
  net: number;
  categoryBreakdown: Record<string, number>;
}

export function calculateDashboardSummary(
  transactions: TransactionListItem[] | unknown
): DashboardSummary {
  const safeTransactions = Array.isArray(transactions)
    ? (transactions as TransactionListItem[])
    : [];

  const income = safeTransactions
    .filter((item) => item.type === "income")
    .reduce((total, item) => total + item.amount, 0);
  const expense = safeTransactions
    .filter((item) => item.type === "expense")
    .reduce((total, item) => total + item.amount, 0);
  const net = income - expense;

  const categoryBreakdown = safeTransactions
    .filter((item) => item.type === "expense")
    .reduce<Record<string, number>>((accumulator, item) => {
      const key = item.category.name;
      accumulator[key] = (accumulator[key] ?? 0) + item.amount;
      return accumulator;
    }, {});

  return {
    income,
    expense,
    net,
    categoryBreakdown,
  };
}

export function buildPrintableReportHtml({
  user,
  periodLabel,
  transactions,
  summary,
}: {
  user: User | null;
  periodLabel: string;
  transactions: TransactionListItem[];
  summary: DashboardSummary;
}) {
  const rows = transactions
    .map(
      (item) => `
        <tr>
          <td>${item.category.name}</td>
          <td>${item.wallet.name}</td>
          <td>${item.description ?? "-"}</td>
          <td>${new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(
            new Date(item.date)
          )}</td>
          <td style="text-align:right">${item.type === "income" ? "+" : "-"}${new Intl.NumberFormat(
            "id-ID",
            {
              style: "currency",
              currency: "IDR",
              maximumFractionDigits: 0,
            }
          ).format(item.amount)}</td>
        </tr>`
    )
    .join("");

  const categories = Object.entries(summary.categoryBreakdown)
    .map(
      ([name, amount]) => `<li><strong>${name}</strong>: ${new Intl.NumberFormat(
        "id-ID",
        {
          style: "currency",
          currency: "IDR",
          maximumFractionDigits: 0,
        }
      ).format(amount)}</li>`
    )
    .join("");

  return `<!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>Duit Log Report</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 24px; color: #0f172a; }
        h1, h2 { margin: 0 0 12px; }
        .muted { color: #64748b; }
        .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 20px 0; }
        .card { border: 1px solid #cbd5e1; border-radius: 12px; padding: 12px; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        th, td { border-bottom: 1px solid #e2e8f0; text-align: left; padding: 10px 6px; font-size: 14px; }
        th { background: #f8fafc; }
        @media print { body { padding: 0; } }
      </style>
    </head>
    <body>
      <h1>Duit Log Report</h1>
      <p class="muted">${periodLabel}</p>
      <p><strong>User:</strong> ${user?.name ?? "Guest"} (${user?.email ?? "-"})</p>
      <div class="grid">
        <div class="card"><div class="muted">Balance</div><div>${new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(user?.balance ?? 0)}</div></div>
        <div class="card"><div class="muted">Income</div><div>${new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(summary.income)}</div></div>
        <div class="card"><div class="muted">Expense</div><div>${new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(summary.expense)}</div></div>
        <div class="card"><div class="muted">Net</div><div>${new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(summary.net)}</div></div>
      </div>
      <h2>Expense Breakdown</h2>
      <ul>${categories || "<li>No expense data.</li>"}</ul>
      <h2>Transactions</h2>
      <table>
        <thead>
          <tr>
            <th>Category</th>
            <th>Wallet</th>
            <th>Description</th>
            <th>Date</th>
            <th style="text-align:right">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${rows || "<tr><td colspan=5>No transactions.</td></tr>"}
        </tbody>
      </table>
    </body>
  </html>`;
}
