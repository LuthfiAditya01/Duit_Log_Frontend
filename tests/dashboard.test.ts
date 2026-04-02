import { describe, expect, it } from "vitest";
import { buildPrintableReportHtml, calculateDashboardSummary } from "../lib/dashboard";
import { formatCurrency } from "../lib/format";
import type { TransactionListItem } from "../lib/types";

const sampleTransactions: TransactionListItem[] = [
  {
    _id: "1",
    amount: 5000000,
    type: "income",
    category: { _id: "c1", name: "Salary", color: "#2563eb" },
    wallet: { _id: "w1", name: "Bank" },
    description: "Monthly salary",
    date: "2026-04-01T00:00:00.000Z",
  },
  {
    _id: "2",
    amount: 150000,
    type: "expense",
    category: { _id: "c2", name: "Food", color: "#ef4444" },
    wallet: { _id: "w1", name: "Bank" },
    description: "Lunch",
    date: "2026-04-02T00:00:00.000Z",
  },
  {
    _id: "3",
    amount: 50000,
    type: "expense",
    category: { _id: "c2", name: "Food", color: "#ef4444" },
    wallet: { _id: "w1", name: "Bank" },
    description: null,
    date: "2026-04-03T00:00:00.000Z",
  },
];

describe("calculateDashboardSummary", () => {
  it("aggregates income, expense, net, and breakdown correctly", () => {
    const summary = calculateDashboardSummary(sampleTransactions);

    expect(summary.income).toBe(5000000);
    expect(summary.expense).toBe(200000);
    expect(summary.net).toBe(4800000);
    expect(summary.categoryBreakdown).toEqual({ Food: 200000 });
  });
});

describe("buildPrintableReportHtml", () => {
  it("renders a printable HTML report containing summary and transactions", () => {
    const summary = calculateDashboardSummary(sampleTransactions);
    const html = buildPrintableReportHtml({
      user: {
        _id: "u1",
        name: "Ayu",
        email: "ayu@example.com",
        balance: 1000000,
      },
      periodLabel: "April 2026",
      transactions: sampleTransactions,
      summary,
    });

    expect(html).toContain("Duit Log Report");
    expect(html).toContain("Ayu");
    expect(html).toContain("April 2026");
    expect(html).toContain("Salary");
    expect(html).toContain("Food");
    expect(html).toContain(formatCurrency(5000000));
  });
});
