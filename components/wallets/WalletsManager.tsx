"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  createWallet,
  deleteWallet,
  fetchWallets,
  updateWallet,
} from "@/lib/api/finance";
import { formatCurrency } from "@/lib/format";
import type { Wallet } from "@/lib/types";

const walletSchema = z.object({
  name: z.string().min(2, "Name is required"),
  type: z.enum(["bank", "e-wallet", "cash", "other"]),
  balance: z.number().min(0, "Balance cannot be negative"),
  color: z.string().min(1, "Color is required"),
  isActive: z.boolean(),
});

type WalletFormValues = z.infer<typeof walletSchema>;

const presetColors = [
  "#2563eb",
  "#7c3aed",
  "#db2777",
  "#dc2626",
  "#ea580c",
  "#ca8a04",
  "#16a34a",
  "#0f766e",
  "#0891b2",
  "#4f46e5",
  "#6366f1",
  "#475569",
  "#1d4ed8",
  "#9333ea",
  "#14b8a6",
];

export function WalletsManager() {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");
  const [editing, setEditing] = useState<Wallet | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<WalletFormValues>({
    resolver: zodResolver(walletSchema),
    defaultValues: {
      name: "",
      type: "bank",
      balance: 0,
      color: presetColors[0],
      isActive: true,
    },
  });

  const selectedColor = watch("color");

  const loadWallets = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      setWallets(await fetchWallets());
    } catch {
      setError("Failed to load wallets");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadWallets();
  }, [loadWallets]);

  const visibleWallets = useMemo(() => {
    if (filter === "active") {
      return wallets.filter((item) => item.isActive);
    }
    if (filter === "inactive") {
      return wallets.filter((item) => !item.isActive);
    }
    return wallets;
  }, [filter, wallets]);

  useEffect(() => {
    if (editing) {
      reset({
        name: editing.name,
        type: editing.type,
        balance: editing.balance,
        color: editing.color ?? presetColors[0],
        isActive: editing.isActive,
      });
    } else {
      reset({
        name: "",
        type: "bank",
        balance: 0,
        color: presetColors[0],
        isActive: true,
      });
    }
  }, [editing, reset]);

  const onSubmit = async (values: WalletFormValues) => {
    const payload = {
      name: values.name,
      type: values.type,
      balance: values.balance,
      color: values.color,
      isActive: values.isActive,
    };

    if (editing) {
      await updateWallet(editing._id, payload);
    } else {
      await createWallet(payload);
    }

    setEditing(null);
    await loadWallets();
  };

  const onDelete = async (id: string) => {
    await deleteWallet(id);
    if (editing?._id === id) {
      setEditing(null);
    }
    await loadWallets();
  };

  if (isLoading) {
    return <p className="text-sm text-muted">Loading wallets...</p>;
  }

  if (error) {
    return <p className="text-sm text-danger">{error}</p>;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-border p-4">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Wallets</h2>
            <p className="text-sm text-muted">Manage active and inactive wallets</p>
          </div>

          <select
            className="rounded-md border bg-background px-3 py-2 text-sm"
            value={filter}
            onChange={(event) => setFilter(event.target.value as typeof filter)}
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {visibleWallets.length === 0 ? (
            <p className="text-sm text-muted">No wallets found.</p>
          ) : (
            visibleWallets.map((wallet) => (
              <article
                key={wallet._id}
                className="rounded-xl border border-border p-4"
              >
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-flex h-3 w-3 rounded-full"
                        style={{ backgroundColor: wallet.color ?? presetColors[0] }}
                      />
                      <h3 className="font-semibold">{wallet.name}</h3>
                    </div>
                    <p className="text-sm text-muted capitalize">
                      {wallet.type} · {wallet.isActive ? "Active" : "Inactive"}
                    </p>
                  </div>
                  <p className="text-sm font-semibold">
                    {formatCurrency(wallet.balance)}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="rounded-md border px-3 py-1 text-sm"
                    onClick={() => setEditing(wallet)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="rounded-md border border-danger px-3 py-1 text-sm text-danger"
                    onClick={() => onDelete(wallet._id)}
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
              {editing ? "Edit Wallet" : "Add Wallet"}
            </h2>
            <p className="text-sm text-muted">
              Choose a preset color or keep the custom hex picker
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

          <Field label="Type" error={errors.type?.message}>
            <select
              className="w-full rounded-md border bg-background px-3 py-2"
              {...register("type")}
            >
              <option value="bank">Bank</option>
              <option value="e-wallet">E-wallet</option>
              <option value="cash">Cash</option>
              <option value="other">Other</option>
            </select>
          </Field>

          <Field label="Balance" error={errors.balance?.message}>
            <input
              type="number"
              className="w-full rounded-md border bg-background px-3 py-2"
              {...register("balance", { valueAsNumber: true })}
            />
          </Field>

          <Field label="Custom color" error={errors.color?.message}>
            <div className="flex items-center gap-3">
              <input
                type="color"
                className="h-10 w-14 rounded border bg-background p-1"
                {...register("color")}
              />
              <input
                type="text"
                className="w-full rounded-md border bg-background px-3 py-2 font-mono text-sm"
                {...register("color")}
              />
            </div>
          </Field>

          <div className="md:col-span-2">
            <p className="mb-2 text-sm font-medium">Preset colors</p>
            <div className="flex flex-wrap gap-2">
              {presetColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={
                    selectedColor === color
                      ? "h-8 w-8 rounded-full ring-2 ring-offset-2"
                      : "h-8 w-8 rounded-full"
                  }
                  style={{ backgroundColor: color }}
                  onClick={() => setValue("color", color, { shouldValidate: true })}
                  aria-label={`Select ${color}`}
                />
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm md:col-span-2">
            <input type="checkbox" {...register("isActive")} />
            Active wallet
          </label>

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {isSubmitting ? "Saving..." : editing ? "Update Wallet" : "Create Wallet"}
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
