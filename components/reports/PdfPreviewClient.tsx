"use client";

import { useEffect, useMemo } from "react";

function safeGetStorageItem(key: string) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeRemoveStorageItem(key: string) {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore storage cleanup failures
  }
}

export function PdfPreviewClient({ id }: { id: string }) {
  const storageKey = useMemo(() => `duitlog_pdf_preview_${id}`, [id]);

  const isBrowser = typeof window !== "undefined";
  const pdfUrl = isBrowser && id ? safeGetStorageItem(storageKey) : null;
  const error = !id
    ? "Preview token is missing."
    : !pdfUrl
      ? "Preview data not found. Please export again from dashboard."
      : null;

  useEffect(() => {
    if (!id || !isBrowser) {
      return;
    }

    const cleanup = () => {
      const current = safeGetStorageItem(storageKey);
      if (current) {
        URL.revokeObjectURL(current);
      }
      safeRemoveStorageItem(storageKey);
    };

    window.addEventListener("beforeunload", cleanup);
    return () => {
      window.removeEventListener("beforeunload", cleanup);
    };
  }, [id, isBrowser, storageKey]);

  if (error) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-100 p-6">
        <div className="w-full max-w-lg rounded-2xl border border-slate-300 bg-white p-6 text-center">
          <h1 className="text-lg font-semibold text-slate-900">PDF Preview Error</h1>
          <p className="mt-2 text-sm text-slate-600">{error}</p>
          <div className="mt-5 flex items-center justify-center gap-2">
            <a
              href="/dashboard"
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-900"
            >
              Back to Dashboard
            </a>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white"
            >
              Retry Preview
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (!pdfUrl) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-100 p-6">
        <div className="w-full max-w-lg rounded-2xl border border-slate-300 bg-white p-6 text-center">
          <h1 className="text-lg font-semibold text-slate-900">Preparing PDF Preview...</h1>
          <p className="mt-2 text-sm text-slate-600">Please wait a moment.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-900">
      <div className="flex h-14 items-center justify-between border-b border-slate-300 bg-white px-4">
        <p className="text-sm font-semibold text-slate-900">Duit Log PDF Preview</p>
        <div className="flex items-center gap-2">
          <a
            className="rounded-md border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-900"
            href={pdfUrl}
            download="duit-log-report.pdf"
          >
            Download
          </a>
          <button
            type="button"
            className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white"
            onClick={() => window.print()}
          >
            Print
          </button>
        </div>
      </div>
      <iframe
        src={pdfUrl}
        title="Duit Log PDF Preview"
        className="block h-[calc(100vh-56px)] w-full"
      />
    </main>
  );
}
