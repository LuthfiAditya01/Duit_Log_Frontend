import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { DashboardSummary } from "./dashboard";
import type { TransactionListItem, User } from "./types";

function money(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatReportDate(dateValue: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
  }).format(new Date(dateValue));
}

export async function generateDashboardPdfBlob({
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
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Duit Log Report", 14, 18);

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(periodLabel, 14, 25);
  doc.text(`User: ${user?.name ?? "Guest"} (${user?.email ?? "-"})`, 14, 31);

  const summaryCards = [
    ["Balance", money(user?.balance ?? 0)],
    ["Income", money(summary.income)],
    ["Expense", money(summary.expense)],
    ["Net", money(summary.net)],
  ];

  let x = 14;
  summaryCards.forEach(([label, value]) => {
    doc.setDrawColor(203, 213, 225);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(x, 38, 45, 20, 3, 3, "FD");
    doc.setTextColor(71, 85, 105);
    doc.setFontSize(9);
    doc.text(label, x + 3, 45);
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(value, x + 3, 51);
    x += 48;
  });

  const breakdownRows = Object.entries(summary.categoryBreakdown).map(
    ([name, amount]) => [name, money(amount)]
  );

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Expense Breakdown", 14, 68);

  if (breakdownRows.length > 0) {
    autoTable(doc, {
      startY: 72,
      head: [["Category", "Amount"]],
      body: breakdownRows,
      theme: "grid",
      styles: { fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: [37, 99, 235] },
      margin: { left: 14, right: 14 },
    });
  } else {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("No expense data for this period.", 14, 76);
  }

  const transactionRows = transactions.map((item) => [
    item.category.name,
    item.wallet.name,
    item.description ?? "-",
    formatReportDate(item.date),
    `${item.type === "income" ? "+" : "-"}${money(item.amount)}`,
  ]);

  const tableStartY = breakdownRows.length > 0
    ? (doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable
        ?.finalY ?? 84
    : 82;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Transactions", 14, tableStartY + 10);

  if (transactionRows.length > 0) {
    autoTable(doc, {
      startY: tableStartY + 14,
      head: [["Category", "Wallet", "Description", "Date", "Amount"]],
      body: transactionRows,
      theme: "grid",
      styles: { fontSize: 8, cellPadding: 1.8 },
      headStyles: { fillColor: [37, 99, 235] },
      margin: { left: 14, right: 14 },
    });
  } else {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("No transactions found.", 14, tableStartY + 16);
  }

  return doc.output("blob");
}
