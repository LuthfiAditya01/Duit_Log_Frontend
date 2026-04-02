"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { createBill, deleteBill, fetchBills, updateBill } from "@/lib/api/finance";
import { formatCurrency } from "@/lib/format";
import type { Bill } from "@/lib/types";

const billSchema = z.object({
  name: z.string().min(2, "Name is required"),
  amount: z.number().positive("Amount must be greater than 0"),
  dueDay: z.number().int().min(1).max(31),
  frequency: z.enum(["MONTHLY", "YEARLY"]),
  dueMonth: z.number().int().min(0).max(11).optional(),
});

type BillFormValues = z.infer<typeof billSchema>;

const monthOptions = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function BillsManager() {
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
    resolver: zodResolver(billSchema),
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
      setError("Failed to load bills");
    } finally {
      setIsLoading(false);
    }
  }, []);

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
    return <p className="text-sm text-muted">Loading bills...</p>;
  }

  if (error) {
    return <p className="text-sm text-danger">{error}</p>;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-border p-4">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Bills</h2>
            <p className="text-sm text-muted">
              Manage recurring bills with monthly or yearly frequency
            </p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {visibleBills.length === 0 ? (
            <p className="text-sm text-muted">No bills found.</p>
          ) : (
            visibleBills.map((bill) => (
              <article key={bill._id} className="rounded-xl border border-border p-4">
                <div className="mb-3 space-y-1">
                  <h3 className="font-semibold">{bill.name}</h3>
                  <p className="text-sm text-muted">
                    {formatCurrency(bill.amount)} · Day {bill.dueDay} · {bill.frequency}
                  </p>
                  {bill.frequency === "YEARLY" && typeof bill.dueMonth === "number" && (
                    <p className="text-sm text-muted">
                      Month: {monthOptions[bill.dueMonth]}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="rounded-md border px-3 py-1 text-sm"
                    onClick={() => setEditing(bill)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="rounded-md border border-danger px-3 py-1 text-sm text-danger"
                    onClick={() => onDelete(bill._id)}
                  >
                    Delete
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
              {editing ? "Edit Bill" : "Add Bill"}
            </h2>
            <p className="text-sm text-muted">
              Yearly bills require a specific month selection
            </p>
          </div>
          {editing && (
            <button
              type="button"
              className="rounded-md border px-3 py-2 text-sm"
              onClick={() => setEditing(null)}
            >
              Cancel edit
            </button>
          )}
        </div>

        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
          <Field label="Name" error={errors.name?.message}>
            <input
              type="text"
              className="w-full rounded-md border bg-background px-3 py-2"
              {...register("name")}
            />
          </Field>

          <Field label="Amount" error={errors.amount?.message}>
            <input
              type="number"
              className="w-full rounded-md border bg-background px-3 py-2"
              {...register("amount", { valueAsNumber: true })}
            />
          </Field>

          <Field label="Due day" error={errors.dueDay?.message}>
            <input
              type="number"
              className="w-full rounded-md border bg-background px-3 py-2"
              {...register("dueDay", { valueAsNumber: true })}
            />
          </Field>

          <Field label="Frequency" error={errors.frequency?.message}>
            <select
              className="w-full rounded-md border bg-background px-3 py-2"
              {...register("frequency")}
            >
              <option value="MONTHLY">Monthly</option>
              <option value="YEARLY">Yearly</option>
            </select>
          </Field>

          {frequency === "YEARLY" && (
            <Field label="Due month" error={errors.dueMonth?.message}>
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
              {isSubmitting ? "Saving..." : editing ? "Update Bill" : "Create Bill"}
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
