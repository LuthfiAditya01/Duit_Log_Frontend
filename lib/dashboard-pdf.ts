import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { DashboardSummary } from "./dashboard";
import type { TransactionListItem, User } from "./types";

let logoDataUrlPromise: Promise<string | null> | null = null;

function getLogoDataUrl() {
  if (logoDataUrlPromise) {
    return logoDataUrlPromise;
  }

  logoDataUrlPromise = fetch("/logo.png")
    .then((response) => {
      if (!response.ok) {
        return null;
      }
      return response.blob();
    })
    .then((blob) => {
      if (!blob) {
        return null;
      }

      return new Promise<string | null>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          resolve(typeof reader.result === "string" ? reader.result : null);
        };
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    })
    .catch(() => null);

  return logoDataUrlPromise;
}

function drawWatermark(
  doc: jsPDF,
  logoDataUrl: string | null,
  x: number,
  y: number,
  size: number
) {
  if (!logoDataUrl) {
    return;
  }

  const anyDoc = doc as unknown as {
    GState?: new (options: { opacity: number }) => unknown;
    setGState?: (state: unknown) => void;
  };

  const canUseOpacity = Boolean(anyDoc.GState && anyDoc.setGState);
  if (canUseOpacity && anyDoc.GState && anyDoc.setGState) {
    anyDoc.setGState(new anyDoc.GState({ opacity: 0.05 }));
  }

  doc.addImage(logoDataUrl, "PNG", x, y, size, size, undefined, "FAST");

  if (canUseOpacity && anyDoc.GState && anyDoc.setGState) {
    anyDoc.setGState(new anyDoc.GState({ opacity: 1 }));
  }
}

function withOpacity(doc: jsPDF, opacity: number, draw: () => void) {
  const anyDoc = doc as unknown as {
    GState?: new (options: { opacity: number }) => unknown;
    setGState?: (state: unknown) => void;
  };

  const canUseOpacity = Boolean(anyDoc.GState && anyDoc.setGState);
  if (canUseOpacity && anyDoc.GState && anyDoc.setGState) {
    anyDoc.setGState(new anyDoc.GState({ opacity }));
  }

  draw();

  if (canUseOpacity && anyDoc.GState && anyDoc.setGState) {
    anyDoc.setGState(new anyDoc.GState({ opacity: 1 }));
  }
}

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

function createDocumentId() {
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `DL-${Date.now()}-${random}`;
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
  const logoDataUrl = await getLogoDataUrl();
  const documentId = createDocumentId();

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const leftX = 14;
  const rightX = 196;
  const contentWidth = rightX - leftX;

  const ensureSpace = (heightNeeded: number, currentY: number) => {
    if (currentY + heightNeeded <= 284) {
      return currentY;
    }

    doc.addPage("a4", "portrait");
    drawWatermark(doc, logoDataUrl, 70, 118, 70);
    return 20;
  };

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(0, 102, 204);
  doc.text("e-Statement", leftX, 18);

  if (logoDataUrl) {
    doc.addImage(logoDataUrl, "PNG", 174, 11, 14, 14, undefined, "FAST");
  }

  doc.setFontSize(16);
  doc.text("Duit Log", rightX, 18, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.text("Aplikasi Catatan Keuangan", rightX, 23, { align: "right" });
  doc.setDrawColor(0, 102, 204);
  doc.setLineWidth(0.45);
  doc.line(leftX, 27, rightX, 27);

  const saldoAkhir = user?.balance ?? 0;
  const saldoAwal = saldoAkhir - summary.income + summary.expense;
  const period = formatPeriodRange(month, year);
  const printDate = new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date());

  const printedAt = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());

  // Header info in a 2x2 grid: [Nama|Periode], [Dicetak|Mata Uang]
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(100);
  doc.text("Nama/Name", leftX, 34);
  doc.text("Periode/Period", 108, 34);
  doc.text("Dicetak/Issued", leftX, 41);
  doc.text("Mata Uang/Currency", 108, 41);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text((user?.name ?? "Guest").toUpperCase(), leftX, 38);
  doc.text(period, 108, 38);
  doc.text(printDate, leftX, 45);
  doc.text("IDR", 108, 45);

  let y = 53;

  // Summary section
  y = ensureSpace(48, y);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11.5);
  doc.setTextColor(30, 64, 175);
  doc.text("Account Summary", leftX, y);

  const summaryBoxY = y + 4;
  withOpacity(doc, 0.42, () => {
    doc.setFillColor(249, 250, 251);
    doc.roundedRect(leftX, summaryBoxY, contentWidth, 37, 2.5, 2.5, "F");
  });
  doc.setDrawColor(209, 213, 219);
  doc.setLineWidth(0.2);
  doc.roundedRect(leftX, summaryBoxY, contentWidth, 37, 2.5, 2.5, "S");

  doc.setFont("helvetica", "normal");
  doc.setTextColor(75, 85, 99);
  doc.setFontSize(9);
  doc.text("Saldo Awal", leftX + 4, summaryBoxY + 8);
  doc.text("Pemasukan", leftX + 4, summaryBoxY + 14);
  doc.text("Pengeluaran", leftX + 4, summaryBoxY + 20);

  doc.setFont("courier", "bold");
  doc.setFontSize(9);
  doc.setTextColor(17, 24, 39);
  doc.text(money(saldoAwal), rightX - 4, summaryBoxY + 8, { align: "right" });
  doc.setTextColor(22, 163, 74);
  doc.text(`+${money(summary.income)}`, rightX - 4, summaryBoxY + 14, { align: "right" });
  doc.setTextColor(220, 38, 38);
  doc.text(`-${money(summary.expense)}`, rightX - 4, summaryBoxY + 20, { align: "right" });

  doc.setDrawColor(203, 213, 225);
  doc.line(leftX + 4, summaryBoxY + 25, rightX - 4, summaryBoxY + 25);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(30, 64, 175);
  doc.text("Saldo Akhir", leftX + 4, summaryBoxY + 32);
  doc.setFont("courier", "bold");
  doc.setFontSize(12.5);
  doc.text(money(saldoAkhir), rightX - 4, summaryBoxY + 32, { align: "right" });

  y = summaryBoxY + 43;

  // Watermark between sections
  drawWatermark(doc, logoDataUrl, 66, 108, 78);

  // Category summary section (2-column layout)
  const incomeBreakdownRows = transactions
    .filter((item) => item.type === "income")
    .reduce<Record<string, number>>((accumulator, item) => {
      const key = item.category?.name || "Lainnya";
      accumulator[key] = (accumulator[key] ?? 0) + item.amount;
      return accumulator;
    }, {});
  const expenseBreakdownRows = Object.entries(summary.categoryBreakdown)
    .sort((a, b) => b[1] - a[1])
    .map(([categoryName, total]) => [categoryName, total] as const);

  const incomeRows = Object.entries(incomeBreakdownRows)
    .sort((a, b) => b[1] - a[1])
    .map(([categoryName, total]) => [categoryName, total] as const);

  y = ensureSpace(48, y);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11.5);
  doc.setTextColor(30, 64, 175);
  doc.text("Ringkasan Kategori", leftX, y);

  const gap = 8;
  const colWidth = (contentWidth - gap) / 2;
  const leftColX = leftX;
  const rightColX = leftX + colWidth + gap;
  const maxRows = Math.max(incomeRows.length || 1, expenseBreakdownRows.length || 1, 3);
  const colHeight = 12 + maxRows * 5.2;

  withOpacity(doc, 0.42, () => {
    doc.setFillColor(249, 250, 251);
    doc.roundedRect(leftColX, y + 4, colWidth, colHeight, 2, 2, "F");
    doc.roundedRect(rightColX, y + 4, colWidth, colHeight, 2, 2, "F");
  });
  doc.setDrawColor(209, 213, 219);
  doc.roundedRect(leftColX, y + 4, colWidth, colHeight, 2, 2, "S");
  doc.roundedRect(rightColX, y + 4, colWidth, colHeight, 2, 2, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(22, 163, 74);
  doc.text("Pendapatan", leftColX + 4, y + 10);
  doc.setTextColor(220, 38, 38);
  doc.text("Pengeluaran", rightColX + 4, y + 10);

  const drawCategoryColumn = (
    rows: Array<readonly [string, number]>,
    startX: number,
    startY: number,
    amountColor: [number, number, number]
  ) => {
    if (rows.length === 0) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(120);
      doc.text("-", startX + 4, startY);
      return;
    }

    rows.slice(0, maxRows).forEach(([name, total], index) => {
      const rowY = startY + index * 5.2;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.2);
      doc.setTextColor(55);
      doc.text(name, startX + 4, rowY, { maxWidth: colWidth - 40 });

      doc.setFont("courier", "bold");
      doc.setTextColor(amountColor[0], amountColor[1], amountColor[2]);
      doc.text(money(total), startX + colWidth - 4, rowY, { align: "right" });
    });
  };

  drawCategoryColumn(incomeRows, leftColX, y + 16, [22, 163, 74]);
  drawCategoryColumn(expenseBreakdownRows, rightColX, y + 16, [220, 38, 38]);

  y = y + 4 + colHeight + 8;

  // Transaction detail as table with zebra striping
  y = ensureSpace(28, y);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11.5);
  doc.setTextColor(30, 64, 175);
  doc.text("Detail Transaksi", leftX, y);

  let runningBalance = saldoAwal;
  const transactionRows = transactions.map((item) => {
    const isIncome = item.type === "income";
    runningBalance += isIncome ? item.amount : -item.amount;

    return [
      formatStatementDateTime(item.date),
      item.category?.name || "Lainnya",
      item.description || "-",
      `${isIncome ? "+" : "-"}${money(item.amount)}`,
      money(runningBalance),
    ];
  });

  autoTable(doc, {
    startY: y + 3,
    head: [["Tanggal", "Kategori", "Keterangan", "Nominal", "Saldo"]],
    body:
      transactionRows.length > 0
        ? transactionRows
        : [["-", "-", "Tidak ada transaksi", "-", money(saldoAwal)]],
    theme: "grid",
    styles: {
      fontSize: 8.2,
      cellPadding: 2,
      lineColor: [229, 231, 235],
      lineWidth: 0.2,
      valign: "middle",
    },
    headStyles: {
      fillColor: [243, 244, 246],
      textColor: [55, 65, 81],
      fontStyle: "bold",
      fontSize: 8.5,
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251],
    },
    columnStyles: {
      0: { cellWidth: 35 },
      1: { cellWidth: 28 },
      2: { cellWidth: 57 },
      3: { cellWidth: 24, halign: "right" },
      4: { cellWidth: 24, halign: "right" },
    },
    margin: { left: leftX, right: 14 },
    didParseCell: (hookData) => {
      if (hookData.section === "body" && (hookData.column.index === 3 || hookData.column.index === 4)) {
        hookData.cell.styles.font = "courier";
        hookData.cell.styles.fontStyle = "bold";
      }

      if (hookData.section === "body" && hookData.column.index === 3) {
        const text = String(hookData.cell.raw ?? "");
        if (text.startsWith("+")) {
          hookData.cell.styles.textColor = [22, 163, 74];
        }
        if (text.startsWith("-")) {
          hookData.cell.styles.textColor = [220, 38, 38];
        }
      }

    },
  });

  const endY =
    (doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable
      ?.finalY ?? (y + 16);

  let footerY = Math.min(282, endY + 10);
  footerY = ensureSpace(16, footerY);

  doc.setDrawColor(221, 221, 221);
  doc.setLineWidth(0.2);
  doc.line(leftX, footerY, rightX, footerY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.2);
  doc.setTextColor(102);
  doc.text(
    "Dokumen ini dibuat otomatis oleh Duit Log dan dapat digunakan sebagai bukti transaksi keuangan.",
    leftX,
    footerY + 4,
    { maxWidth: contentWidth }
  );
  doc.text(`Tanggal cetak: ${printedAt}`, leftX, footerY + 8, { maxWidth: contentWidth });
  doc.setFont("courier", "bold");
  doc.setTextColor(75, 85, 99);
  doc.text(`Document ID: ${documentId}`, leftX, footerY + 12, { maxWidth: contentWidth });

  return doc.output("blob");
}
