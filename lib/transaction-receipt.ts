import { jsPDF } from "jspdf";
import { formatCurrency } from "./format";
import type { TransactionListItem } from "./types";

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

function formatReceiptDate(dateValue: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(dateValue));
}

function formatGeneratedDate() {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date());
}

function createReceiptId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

async function generateTransactionReceiptPdfBlob(transaction: TransactionListItem) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a5",
  });

  const logoDataUrl = await getLogoDataUrl();

  const title = transaction.type === "income" ? "Pemasukan" : "Pengeluaran";
  const amountPrefix = transaction.type === "income" ? "+" : "-";
  const badgeFill = transaction.type === "income" ? [220, 252, 231] : [254, 226, 226];
  const badgeText = transaction.type === "income" ? [22, 101, 52] : [153, 27, 27];

  doc.setFillColor(37, 99, 235);
  doc.roundedRect(12, 12, 126, 22, 4, 4, "F");

  if (logoDataUrl) {
    doc.addImage(logoDataUrl, "PNG", 14, 14, 9, 9, undefined, "FAST");
  }

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Duit Log", 25, 21);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text("Bukti Transaksi / Transaction Receipt", 25, 27);

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(12, 38, 126, 18, 3, 3, "F");
  doc.setTextColor(71, 85, 105);
  doc.setFontSize(8);
  doc.text("Generated at", 18, 45);
  doc.text("Transaction ID", 74, 45);
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.text(formatGeneratedDate(), 18, 50);
  doc.setTextColor(100);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text(transaction._id, 74, 49.5, { maxWidth: 58 });

  if (logoDataUrl) {
    const anyDoc = doc as unknown as {
      GState?: new (options: { opacity: number }) => unknown;
      setGState?: (state: unknown) => void;
    };

    const canUseOpacity = Boolean(anyDoc.GState && anyDoc.setGState);
    if (canUseOpacity && anyDoc.GState && anyDoc.setGState) {
      anyDoc.setGState(new anyDoc.GState({ opacity: 0.06 }));
    }

    doc.addImage(logoDataUrl, "PNG", 44, 86, 60, 60, undefined, "FAST");

    if (canUseOpacity && anyDoc.GState && anyDoc.setGState) {
      anyDoc.setGState(new anyDoc.GState({ opacity: 1 }));
    }
  }

  doc.setFillColor(badgeFill[0], badgeFill[1], badgeFill[2]);
  doc.roundedRect(12, 60, 38, 10, 5, 5, "F");
  doc.setTextColor(badgeText[0], badgeText[1], badgeText[2]);
  doc.setFontSize(9.5);
  doc.setFont("helvetica", "bold");
  doc.text(title, 31, 66, { align: "center" });

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(18);
  doc.text(`${amountPrefix}${formatCurrency(transaction.amount)}`, 136, 68, { align: "right" });
  doc.setFontSize(8.5);
  doc.setTextColor(100);
  doc.text("Nominal", 136, 73, { align: "right" });

  const detailRows: Array<[string, string]> = [
    ["Tanggal", formatReceiptDate(transaction.date)],
    ["Kategori", transaction.category.name],
    ["Wallet", transaction.wallet.name],
    ["Deskripsi", transaction.description?.trim() || "-"],
    ["Tipe", transaction.type],
  ];

  let y = 82;
  for (const [label, value] of detailRows) {
    doc.setTextColor(100);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.text(label.toUpperCase(), 14, y);

    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(value, 14, y + 5, { maxWidth: 120 });

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.15);
    doc.line(12, y + 8, 138, y + 8);
    y += 13;
  }

  const finalY = y;

  doc.setDrawColor(226, 232, 240);
  doc.line(12, finalY + 6, 138, finalY + 6);
  doc.setTextColor(100);
  doc.setFontSize(6.5);
  doc.setFont("helvetica", "normal");
  const footnoteLines = doc.splitTextToSize(
    "* Dokumen ini dibuat secara otomatis oleh Duit Log. Dokumen ini sah dan dapat digunakan sebagai bukti transaksi yang valid. Simpan untuk keperluan pencatatan Anda.",
    126
  );
  doc.text(footnoteLines.slice(0, 2), 12, finalY + 11);

  return doc.output("blob");
}

export async function openTransactionReceipt(transaction: TransactionListItem) {
  const closePreviewWindow = (targetWindow: Window) => {
    try {
      targetWindow.document.open();
      targetWindow.document.write(`
        <!doctype html>
        <html>
          <head>
            <title>Closing tab...</title>
            <meta name="viewport" content="width=device-width, initial-scale=1" />
          </head>
          <body>
            <script>
              window.close();
              setTimeout(function () { window.close(); }, 150);
              setTimeout(function () { window.open('', '_self'); window.close(); }, 400);
            </script>
          </body>
        </html>
      `);
      targetWindow.document.close();
    } catch {
      // ignore close-render fallback errors
    }

    setTimeout(() => {
      if (!targetWindow.closed) {
        targetWindow.close();
      }
    }, 500);
  };

  const triggerDownload = (blob: Blob, fileName: string) => {
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
  };

  const receiptWindow = window.open("", "_blank");

  if (!receiptWindow) {
    try {
      const blob = await generateTransactionReceiptPdfBlob(transaction);
      triggerDownload(blob, `receipt-${transaction._id}.pdf`);
    } catch {
      window.alert("Gagal membuat receipt PDF. Coba lagi nanti.");
    }
    return;
  }

  receiptWindow.document.write(`
    <!doctype html>
    <html>
      <head>
        <title>Preparing Receipt...</title>
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
        <div class="shell"><div class="card"><strong>Generating receipt preview...</strong><div class="muted">Please wait a moment.</div></div></div>
      </body>
    </html>
  `);
  receiptWindow.document.close();

  try {
    const blob = await generateTransactionReceiptPdfBlob(transaction);
    const blobUrl = URL.createObjectURL(blob);
    const previewId = createReceiptId();
    const storageKey = `duitlog_pdf_preview_${previewId}`;

    try {
      window.localStorage.setItem(storageKey, blobUrl);
      receiptWindow.location.href = `/reports/preview?id=${encodeURIComponent(previewId)}`;
    } catch {
      triggerDownload(blob, `receipt-${transaction._id}.pdf`);
      closePreviewWindow(receiptWindow);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
    }
  } catch {
    receiptWindow.document.open();
    receiptWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>Receipt Failed</title>
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
            <h2>Failed to generate receipt preview</h2>
            <p>Try again in a few seconds. If it still fails, allow popup or try download fallback.</p>
            <button onclick="window.close()">Close this tab</button>
          </div>
        </body>
      </html>
    `);
    receiptWindow.document.close();
  }
}
