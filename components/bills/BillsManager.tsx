"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { createBill, deleteBill, fetchBills, updateBill } from "@/lib/api/finance";
import { formatCurrency } from "@/lib/format";
import { useLocale } from "@/providers/LocaleProvider";
import type { Bill } from "@/lib/types";

function buildSchema(t: (key: string) => string) {
  return z.object({
    name: z.string().min(2, t("nameIsRequired")),
    amount: z.number().positive(t("amountMustBeGreaterThanZero")),
    dueDay: z.number().int().min(1).max(31),
    frequency: z.enum(["MONTHLY", "YEARLY"]),
    dueMonth: z.number().int().min(0).max(11).optional(),
  });
}

type BillFormValues = z.infer<ReturnType<typeof buildSchema>>;

export function BillsManager() {
  const { t, locale } = useLocale();
  const [bills, setBills] = useState<Bill[]>([]);
  const [editing, setEditing] = useState<Bill | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<BillFormValues>({
    resolver: zodResolver(buildSchema(t)),
    defaultValues: {
      name: "",
      amount: 0,
      dueDay: 1,
      frequency: "MONTHLY",
      dueMonth: 0,
    },
  });

  const frequency = watch("frequency");

  const loadBills = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      setBills(await fetchBills());
    } catch {
      setError(t("failedToLoadBills"));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadBills();
  }, [loadBills]);

  useEffect(() => {
    if (editing) {
      reset({
        name: editing.name,
        amount: editing.amount,
        dueDay: editing.dueDay,
        frequency: editing.frequency,
        dueMonth: editing.dueMonth ?? 0,
      });
    } else {
      reset({
        name: "",
        amount: 0,
        dueDay: 1,
        frequency: "MONTHLY",
        dueMonth: 0,
      });
    }
  }, [editing, reset]);

  useEffect(() => {
    if (frequency === "MONTHLY") {
      setValue("dueMonth", 0);
    }
  }, [frequency, setValue]);

  const monthOptions = useMemo(
    () =>
      Array.from({ length: 12 }, (_, index) =>
        new Intl.DateTimeFormat(locale, { month: "long" }).format(
          new Date(2020, index, 1)
        )
      ),
    [locale]
  );

  const visibleBills = useMemo(() => (Array.isArray(bills) ? bills : []), [bills]);

  const onSubmit = async (values: BillFormValues) => {
    const payload = {
      name: values.name,
      amount: values.amount,
      dueDay: values.dueDay,
      frequency: values.frequency,
      ...(values.frequency === "YEARLY" ? { dueMonth: values.dueMonth ?? 0 } : {}),
    };

    if (editing) {
      await updateBill(editing._id, payload);
    } else {
      await createBill(payload);
    }

    setEditing(null);
    await loadBills();
  };

  const onDelete = async (id: string) => {
    await deleteBill(id);
    if (editing?._id === id) {
      setEditing(null);
    }
    await loadBills();
  };

  if (isLoading) {
    return <p className="text-sm text-muted">{t("billsLoading")}</p>;
  }

  if (error) {
    return <p className="text-sm text-danger">{error}</p>;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-border p-4">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">{t("billsPage")}</h2>
            <p className="text-sm text-muted">
              {t("manageRecurringBillsWithMonthlyOrYearlyFrequency")}
            </p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {visibleBills.length === 0 ? (
            <p className="text-sm text-muted">{t("noBillsFound")}</p>
          ) : (
            visibleBills.map((bill) => (
              <article key={bill._id} className="rounded-xl border border-border p-4">
                <div className="mb-3 space-y-1">
                  <h3 className="font-semibold">{bill.name}</h3>
                  <p className="text-sm text-muted">
                    {formatCurrency(bill.amount)} · {t("day")} {bill.dueDay} · {t(
                      bill.frequency.toLowerCase()
                    )}
                  </p>
                  {bill.frequency === "YEARLY" && typeof bill.dueMonth === "number" && (
                    <p className="text-sm text-muted">
                      {t("month")}: {monthOptions[bill.dueMonth]}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="rounded-md border px-3 py-1 text-sm"
                    onClick={() => setEditing(bill)}
                  >
                    {t("edit")}
                  </button>
                  <button
                    type="button"
                    className="rounded-md border border-danger px-3 py-1 text-sm text-danger"
                    onClick={() => onDelete(bill._id)}
                  >
                    {t("delete")}
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      <section className="rounded-xl border border-border p-4">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">
              {editing ? t("editBill") : t("addBill")}
            </h2>
            <p className="text-sm text-muted">{t("yearlyBillsRequireASpecificMonthSelection")}</p>
          </div>
          {editing && (
            <button
              type="button"
              className="rounded-md border px-3 py-2 text-sm"
              onClick={() => setEditing(null)}
            >
              {t("cancelEditBill")}
            </button>
          )}
        </div>

        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
          <Field label={t("name")} error={errors.name?.message}>
            <input
              type="text"
              className="w-full rounded-md border bg-background px-3 py-2"
              {...register("name")}
            />
          </Field>

          <Field label={t("amount")} error={errors.amount?.message}>
            <input
              type="number"
              className="w-full rounded-md border bg-background px-3 py-2"
              {...register("amount", { valueAsNumber: true })}
            />
          </Field>

          <Field label={t("dueDay")} error={errors.dueDay?.message}>
            <input
              type="number"
              className="w-full rounded-md border bg-background px-3 py-2"
              {...register("dueDay", { valueAsNumber: true })}
            />
          </Field>

          <Field label={t("frequency")} error={errors.frequency?.message}>
            <select
              className="w-full rounded-md border bg-background px-3 py-2"
              {...register("frequency")}
            >
              <option value="MONTHLY">{t("monthly")}</option>
              <option value="YEARLY">{t("yearly")}</option>
            </select>
          </Field>

          {frequency === "YEARLY" && (
            <Field label={t("dueMonth")} error={errors.dueMonth?.message}>
              <select
                className="w-full rounded-md border bg-background px-3 py-2"
                {...register("dueMonth", { valueAsNumber: true })}
              >
                {monthOptions.map((monthName, index) => (
                  <option key={monthName} value={index}>
                    {monthName}
                  </option>
                ))}
              </select>
            </Field>
          )}

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {isSubmitting ? t("saving") : editing ? t("updateBill") : t("createBill")}
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
