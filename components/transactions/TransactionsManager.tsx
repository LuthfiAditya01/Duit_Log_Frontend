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
import type { Category, TransactionListItem, Wallet } from "@/lib/types";

const schema = z.object({
  amount: z.number().positive("Amount must be greater than 0"),
  type: z.enum(["income", "expense"]),
  category: z.string().min(1, "Select a category"),
  wallet: z.string().min(1, "Select a wallet"),
  description: z.string().optional(),
  date: z.string().min(1, "Select a date"),
});

type FormValues = z.infer<typeof schema>;

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
  const [month, setMonth] = useState(initialMonth);
  const [year, setYear] = useState(initialYear);
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
    resolver: zodResolver(schema),
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
      setError("Failed to load transactions module");
    } finally {
      setIsLoading(false);
    }
  }, [month, year]);

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
    await loadData();
  };

  const onDelete = async (id: string) => {
    await deleteTransaction(id);
    await loadData();
  };

  if (isLoading) {
    return <p className="text-sm text-muted">Loading transactions...</p>;
  }

  if (error) {
    return <p className="text-sm text-danger">{error}</p>;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-border p-4">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Transaction List</h2>
            <p className="text-sm text-muted">Filter by month and year</p>
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
            <p className="text-sm text-muted">No transactions found.</p>
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
                    className="rounded-md border border-danger px-3 py-1 text-sm text-danger"
                    onClick={() => onDelete(item._id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="rounded-xl border border-border p-4">
        <h2 className="mb-4 text-lg font-semibold">Add Transaction</h2>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
          <Field label="Type" error={errors.type?.message}>
            <select className="w-full rounded-md border bg-background px-3 py-2" {...register("type")}>
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </Field>

          <Field label="Amount" error={errors.amount?.message}>
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

          <Field label="Category" error={errors.category?.message}>
            <select className="w-full rounded-md border bg-background px-3 py-2" {...register("category")}>
              <option value="">Select category</option>
              {filteredCategories.map((item) => (
                <option key={item._id} value={item._id}>
                  {item.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Wallet" error={errors.wallet?.message}>
            <select className="w-full rounded-md border bg-background px-3 py-2" {...register("wallet")}>
              <option value="">Select wallet</option>
              {wallets.map((item) => (
                <option key={item._id} value={item._id}>
                  {item.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Date" error={errors.date?.message}>
            <input
              type="date"
              className="w-full rounded-md border bg-background px-3 py-2"
              {...register("date")}
            />
          </Field>

          <Field label="Description" error={errors.description?.message}>
            <input
              type="text"
              className="w-full rounded-md border bg-background px-3 py-2"
              {...register("description")}
            />
          </Field>

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {isSubmitting ? "Saving..." : "Save Transaction"}
            </button>
          </div>
        </form>
      </section>
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
