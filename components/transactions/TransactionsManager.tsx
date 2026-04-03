"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import {
  createTransaction,
  deleteTransaction,
  fetchCategories,
  fetchTransactions,
  fetchWallets,
} from "@/lib/api/finance";
import { formatCurrency, formatDate } from "@/lib/format";
import { useLocale } from "@/providers/LocaleProvider";
import { openTransactionReceipt } from "../../lib/transaction-receipt";
import type { Category, TransactionListItem, Wallet } from "@/lib/types";

function buildSchema(t: (key: string) => string) {
  return z.object({
    amount: z.number().positive(t("amountMustBeGreaterThanZero")),
    type: z.enum(["income", "expense"]),
    category: z.string().min(1, t("selectCategory")),
    wallet: z.string().min(1, t("selectWallet")),
    description: z.string().optional(),
    date: z.string().min(1, t("selectDate")),
  });
}

type FormValues = z.infer<ReturnType<typeof buildSchema>>;

function currentPeriod() {
  const now = new Date();
  return { month: now.getMonth() + 1, year: now.getFullYear() };
}

function formatAmountInput(value: number) {
  if (!value || Number.isNaN(value)) {
    return "";
  }

  return new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 0,
  }).format(value);
}

export function TransactionsManager() {
  const { month: initialMonth, year: initialYear } = currentPeriod();
  const { t } = useLocale();
  const [month, setMonth] = useState(initialMonth);
  const [year, setYear] = useState(initialYear);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [transactions, setTransactions] = useState<TransactionListItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(buildSchema(t)),
    defaultValues: {
      amount: 0,
      type: "expense",
      category: "",
      wallet: "",
      description: "",
      date: new Date().toISOString().slice(0, 10),
    },
  });

  const watchedType = watch("type");

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [transactionList, categoryList, walletList] = await Promise.all([
        fetchTransactions(month, year),
        fetchCategories(),
        fetchWallets(),
      ]);
      setTransactions(transactionList);
      setCategories(categoryList);
      setWallets(walletList);
    } catch {
      setError(t("failedToLoadTransactionsModule"));
    } finally {
      setIsLoading(false);
    }
  }, [month, t, year]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const filteredCategories = useMemo(
    () =>
      (Array.isArray(categories) ? categories : []).filter(
        (item) => item.type === watchedType
      ),
    [categories, watchedType]
  );

  const onSubmit = async (values: FormValues) => {
    await createTransaction({
      amount: values.amount,
      type: values.type,
      category: values.category,
      wallet: values.wallet,
      description: values.description?.trim() || undefined,
      date: values.date,
    });
    reset({
      amount: 0,
      type: values.type,
      category: "",
      wallet: "",
      description: "",
      date: values.date,
    });
    setIsAddOpen(false);
    await loadData();
  };

  const onDelete = async (id: string) => {
    const shouldDelete = window.confirm(t("confirmDeletePrompt"));
    if (!shouldDelete) {
      return;
    }

    await deleteTransaction(id);
    await loadData();
  };

  if (isLoading) {
    return <p className="text-sm text-muted">{t("loadingTransactions")}</p>;
  }

  if (error) {
    return <p className="text-sm text-danger">{error}</p>;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-border p-4">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">{t("transactionList")}</h2>
            <p className="text-sm text-muted">{t("filterByMonthAndYear")}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded-md bg-primary cursor-pointer px-3 py-1.5 text-sm font-semibold text-white"
              onClick={() => setIsAddOpen(true)}
            >
              + {t("addTransaction")}
            </button>
          </div>
        </div>

        <div className="mb-4 flex gap-2 text-sm">
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

        <div className="space-y-3">
          {transactions.length === 0 ? (
            <p className="text-sm text-muted">{t("noTransactionsFound")}</p>
          ) : (
            transactions.map((item) => (
              <div
                key={item._id}
                className="flex flex-col gap-3 rounded-lg border border-border p-3 sm:flex-row sm:items-center sm:justify-between"
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
                <div className="flex items-center gap-4">
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
                    className="rounded-md cursor-pointer border border-border px-3 py-1 text-sm"
                    onClick={() => openTransactionReceipt(item)}
                  >
                    {t("printReceipt")}
                  </button>
                  <button
                    type="button"
                    className="rounded-md cursor-pointer border border-danger px-3 py-1 text-sm text-danger"
                    onClick={() => onDelete(item._id)}
                  >
                    {t("delete")}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {isAddOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4">
          <div className="w-full max-w-2xl rounded-xl border border-border bg-card p-4 sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">{t("addTransaction")}</h2>
              <button
                type="button"
                className="rounded-md border border-border px-3 py-1 text-sm"
                onClick={() => setIsAddOpen(false)}
              >
                {t("close")}
              </button>
            </div>

            <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
              <Field label={t("type")} error={errors.type?.message}>
                <select className="w-full rounded-md border bg-background px-3 py-2" {...register("type")}>
                  <option value="expense">{t("expenseOption")}</option>
                  <option value="income">{t("incomeOption")}</option>
                </select>
              </Field>

              <Field label={t("amount")} error={errors.amount?.message}>
                <Controller
                  control={control}
                  name="amount"
                  render={({ field }) => (
                    <div className="relative">
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">
                        Rp
                      </span>
                      <input
                        type="text"
                        inputMode="numeric"
                        className="w-full rounded-md border bg-background py-2 pl-10 pr-3"
                        value={formatAmountInput(field.value)}
                        onBlur={field.onBlur}
                        onChange={(event) => {
                          const numericOnly = event.target.value.replace(/\D/g, "");
                          const nextValue = numericOnly ? Number(numericOnly) : 0;
                          field.onChange(nextValue);
                        }}
                      />
                    </div>
                  )}
                />
              </Field>

              <Field label={t("category")} error={errors.category?.message}>
                <select className="w-full rounded-md border bg-background px-3 py-2" {...register("category")}>
                  <option value="">{t("selectCategory")}</option>
                  {filteredCategories.map((item) => (
                    <option key={item._id} value={item._id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label={t("wallet")} error={errors.wallet?.message}>
                <select className="w-full rounded-md border bg-background px-3 py-2" {...register("wallet")}>
                  <option value="">{t("selectWallet")}</option>
                  {wallets.map((item) => (
                    <option key={item._id} value={item._id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label={t("date")} error={errors.date?.message}>
                <input
                  type="date"
                  className="w-full rounded-md border bg-background px-3 py-2"
                  {...register("date")}
                />
              </Field>

              <Field label={t("description")} error={errors.description?.message}>
                <input
                  type="text"
                  className="w-full rounded-md border bg-background px-3 py-2"
                  {...register("description")}
                />
              </Field>

              <div className="flex items-center justify-end gap-2 md:col-span-2">
                <button
                  type="button"
                  className="rounded-md border border-border cursor-pointer px-4 py-2 text-sm"
                  onClick={() => setIsAddOpen(false)}
                >
                  {t("cancel")}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? t("saving") : t("saveTransaction")}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1 text-sm font-medium">
      <span>{label}</span>
      {children}
      {error && <p className="text-xs text-danger">{error}</p>}
    </label>
  );
}
