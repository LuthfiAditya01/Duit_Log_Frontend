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

function formatStatementDateTime(dateValue: string) {
  const date = new Date(dateValue);
  const parts = new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "Asia/Jakarta",
  }).formatToParts(date);

  const pick = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${pick("day")} ${pick("month")} ${pick("year")} ${pick("hour")}:${pick("minute")}:${pick("second")} WIB`;
}

function formatPeriodRange(month: number, year: number) {
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  const format = new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  return `${format.format(firstDay)} - ${format.format(lastDay)}`;
}

export async function generateDashboardPdfBlob({
  user,
  month,
  year,
  transactions,
  summary,
}: {
  user: User | null;
  month: number;
  year: number;
  transactions: TransactionListItem[];
  summary: DashboardSummary;
}) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(0, 102, 204);
  doc.text("e-Statement", 14, 18);

  doc.setFontSize(18);
  doc.text("Duit Log", 196, 18, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text("Aplikasi Catatan Keuangan", 196, 23, { align: "right" });
  doc.setDrawColor(0, 102, 204);
  doc.setLineWidth(0.6);
  doc.line(14, 27, 196, 27);

  const saldoAkhir = user?.balance ?? 0;
  const saldoAwal = saldoAkhir - summary.income + summary.expense;
  const period = formatPeriodRange(month, year);
  const printDate = new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date());

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(51);
  doc.text("Nama/Name:", 14, 35);
  doc.text("Periode/Period:", 108, 35);
  doc.text("Dicetak pada/Issued on:", 14, 41);
  doc.text("Mata Uang/Currency:", 108, 41);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(0);
  doc.text((user?.name ?? "Guest").toUpperCase(), 55, 35);
  doc.text(period, 150, 35, { align: "right" });
  doc.text(printDate, 55, 41);
  doc.text("IDR", 150, 41, { align: "right" });

  doc.setDrawColor(0, 102, 204);
  doc.setLineWidth(0.4);
  doc.rect(14, 47, 182, 33);
  doc.setFillColor(248, 249, 250);
  doc.rect(14, 47, 182, 33, "F");
  doc.rect(14, 47, 182, 33);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(0, 102, 204);
  doc.text("Ringkasan Rekening / Account Summary", 18, 54);
  doc.setDrawColor(0, 102, 204);
  doc.line(18, 56, 192, 56);

  doc.setFontSize(10);
  doc.setTextColor(51);
  doc.text("Saldo Awal/Initial Balance:", 18, 62);
  doc.text("Dana Masuk/Incoming Transactions:", 18, 67);
  doc.text("Dana Keluar/Outgoing Transactions:", 18, 72);
  doc.setFontSize(11);
  doc.text("Saldo Akhir/Closing Balance:", 18, 77);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(0);
  doc.text(`${money(saldoAwal)} IDR`, 192, 62, { align: "right" });
  doc.setTextColor(3, 140, 0);
  doc.text(`+${money(summary.income)} IDR`, 192, 67, { align: "right" });
  doc.setTextColor(239, 68, 68);
  doc.text(`-${money(summary.expense)} IDR`, 192, 72, { align: "right" });
  doc.setTextColor(0, 102, 204);
  doc.setFontSize(11);
  doc.text(`${money(saldoAkhir)} IDR`, 192, 77, { align: "right" });

  const incomeBreakdownRows = transactions
    .filter((item) => item.type === "income")
    .reduce<Record<string, number>>((accumulator, item) => {
      const key = item.category?.name || "Lainnya";
      accumulator[key] = (accumulator[key] ?? 0) + item.amount;
      return accumulator;
    }, {});

  const incomeBreakdownTableRows = Object.entries(incomeBreakdownRows)
    .sort((a, b) => b[1] - a[1])
    .map(([categoryName, total]) => [categoryName, money(total)]);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(0, 102, 204);
  doc.text("Daftar Pendapatan per Kategori", 14, 86);

  if (incomeBreakdownTableRows.length > 0) {
    autoTable(doc, {
      startY: 89,
      head: [["Kategori", "Total Pendapatan"]],
      body: incomeBreakdownTableRows,
      theme: "grid",
      styles: {
        fontSize: 9,
        cellPadding: 1.8,
        lineColor: [221, 221, 221],
        lineWidth: 0.2,
      },
      headStyles: {
        fillColor: [0, 102, 204],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 9,
      },
      alternateRowStyles: {
        fillColor: [248, 249, 250],
      },
      columnStyles: {
        0: { cellWidth: 130 },
        1: { halign: "right", cellWidth: 52 },
      },
      margin: { left: 14, right: 14 },
    });
  } else {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(102);
    doc.text("Tidak ada data pendapatan pada periode ini.", 14, 92);
  }

  const incomeBreakdownEndY =
    (doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable
      ?.finalY ?? 92;

  const expenseBreakdownRows = Object.entries(summary.categoryBreakdown)
    .sort((a, b) => b[1] - a[1])
    .map(([categoryName, total]) => [categoryName, money(total)]);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(0, 102, 204);
  doc.text("Daftar Pengeluaran per Kategori", 14, incomeBreakdownEndY + 8);

  if (expenseBreakdownRows.length > 0) {
    autoTable(doc, {
      startY: incomeBreakdownEndY + 11,
      head: [["Kategori", "Total Pengeluaran"]],
      body: expenseBreakdownRows,
      theme: "grid",
      styles: {
        fontSize: 9,
        cellPadding: 1.8,
        lineColor: [221, 221, 221],
        lineWidth: 0.2,
      },
      headStyles: {
        fillColor: [0, 102, 204],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 9,
      },
      alternateRowStyles: {
        fillColor: [248, 249, 250],
      },
      columnStyles: {
        0: { cellWidth: 130 },
        1: { halign: "right", cellWidth: 52 },
      },
      margin: { left: 14, right: 14 },
    });
  } else {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(102);
    doc.text("Tidak ada data pengeluaran pada periode ini.", 14, incomeBreakdownEndY + 14);
  }

  const breakdownEndY =
    (doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable
      ?.finalY ?? 92;

  let runningBalance = saldoAwal;
  const transactionRows = transactions.map((item, index) => {
    const isIncome = item.type === "income";
    runningBalance += isIncome ? item.amount : -item.amount;
    const categoryName = item.category?.name || "Lainnya";
    const description = item.description || categoryName;

    return [
      String(index + 1),
      formatStatementDateTime(item.date),
      categoryName,
      description,
      `${isIncome ? "+" : "-"}${money(item.amount)}`,
      money(runningBalance),
    ];
  });

  autoTable(doc, {
    startY: breakdownEndY + 8,
    head: [[
      "No",
      "Tanggal (Date)",
      "Kategori",
      "Keterangan (Remarks)",
      "Nominal (IDR)",
      "Saldo (IDR)",
    ]],
    body: transactionRows.length > 0
      ? transactionRows
      : [["-", "-", "-", "Tidak ada transaksi", "-", money(saldoAwal)]],
    theme: "grid",
    styles: {
      fontSize: 9,
      cellPadding: 1.8,
      lineColor: [221, 221, 221],
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: [0, 102, 204],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 9,
    },
    alternateRowStyles: {
      fillColor: [248, 249, 250],
    },
    columnStyles: {
      0: { halign: "center", cellWidth: 10 },
      1: { cellWidth: 38 },
      2: { cellWidth: 30 },
      3: { cellWidth: 44 },
      4: { halign: "right", cellWidth: 30 },
      5: { halign: "right", cellWidth: 30 },
    },
    margin: { left: 14, right: 14 },
    didParseCell: (hookData) => {
      if (hookData.section === "body" && hookData.column.index === 4) {
        const text = String(hookData.cell.raw ?? "");
        if (text.startsWith("+")) {
          hookData.cell.styles.textColor = [3, 140, 0];
        }
        if (text.startsWith("-")) {
          hookData.cell.styles.textColor = [239, 68, 68];
        }
      }
      if (hookData.section === "body" && hookData.column.index === 5) {
        hookData.cell.styles.fontStyle = "bold";
      }
    },
  });

  const endY =
    (doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable
      ?.finalY ?? 252;
  const footerY = Math.min(282, endY + 8);

  doc.setDrawColor(221, 221, 221);
  doc.setLineWidth(0.2);
  doc.line(14, footerY, 196, footerY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(51);
  doc.text("Informasi Penting:", 14, footerY + 5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(102);
  doc.text(
    "Dokumen ini dibuat otomatis oleh Duit Log dan dapat digunakan sebagai bukti transaksi keuangan.",
    14,
    footerY + 10,
    { maxWidth: 182 }
  );

  const printedAt = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());
  doc.text(`Tanggal cetak: ${printedAt}`, 14, footerY + 16, { maxWidth: 182 });

  return doc.output("blob");
}
