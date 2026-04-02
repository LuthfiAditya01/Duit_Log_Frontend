"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  createCategory,
  deleteCategory,
  fetchCategories,
  updateCategory,
} from "@/lib/api/finance";
import type { Category } from "@/lib/types";

const categorySchema = z.object({
  name: z.string().min(2, "Name is required"),
  type: z.enum(["expense", "income"]),
  color: z.string().min(1, "Color is required"),
  isVisible: z.boolean(),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

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

export function CategoriesManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [filter, setFilter] = useState<"all" | "expense" | "income">("all");
  const [editing, setEditing] = useState<Category | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      type: "expense",
      color: presetColors[0],
      isVisible: true,
    },
  });

  const selectedColor = watch("color");

  const loadCategories = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      setCategories(await fetchCategories());
    } catch {
      setError("Failed to load categories");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  const visibleCategories = useMemo(() => {
    if (filter === "expense") {
      return categories.filter((item) => item.type === "expense");
    }
    if (filter === "income") {
      return categories.filter((item) => item.type === "income");
    }
    return categories;
  }, [categories, filter]);

  useEffect(() => {
    if (editing) {
      reset({
        name: editing.name,
        type: editing.type,
        color: editing.color ?? presetColors[0],
        isVisible: editing.isVisible,
      });
    } else {
      reset({
        name: "",
        type: "expense",
        color: presetColors[0],
        isVisible: true,
      });
    }
  }, [editing, reset]);

  const onSubmit = async (values: CategoryFormValues) => {
    const payload = {
      name: values.name,
      type: values.type,
      color: values.color,
      isVisible: values.isVisible,
    };

    if (editing) {
      await updateCategory(editing._id, payload);
    } else {
      await createCategory(payload);
    }

    setEditing(null);
    await loadCategories();
  };

  const onDelete = async (id: string) => {
    await deleteCategory(id);
    if (editing?._id === id) {
      setEditing(null);
    }
    await loadCategories();
  };

  if (isLoading) {
    return <p className="text-sm text-muted">Loading categories...</p>;
  }

  if (error) {
    return <p className="text-sm text-danger">{error}</p>;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-border p-4">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Categories</h2>
            <p className="text-sm text-muted">Manage income and expense labels</p>
          </div>

          <select
            className="rounded-md border bg-background px-3 py-2 text-sm"
            value={filter}
            onChange={(event) => setFilter(event.target.value as typeof filter)}
          >
            <option value="all">All</option>
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {visibleCategories.length === 0 ? (
            <p className="text-sm text-muted">No categories found.</p>
          ) : (
            visibleCategories.map((category) => (
              <article
                key={category._id}
                className="rounded-xl border border-border p-4"
              >
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-flex h-3 w-3 rounded-full"
                        style={{ backgroundColor: category.color ?? presetColors[0] }}
                      />
                      <h3 className="font-semibold">{category.name}</h3>
                    </div>
                    <p className="text-sm text-muted capitalize">
                      {category.type} · {category.isVisible ? "Visible" : "Hidden"}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="rounded-md border px-3 py-1 text-sm"
                    onClick={() => setEditing(category)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="rounded-md border border-danger px-3 py-1 text-sm text-danger"
                    onClick={() => onDelete(category._id)}
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
              {editing ? "Edit Category" : "Add Category"}
            </h2>
            <p className="text-sm text-muted">
              Choose a preset color or a custom hex value
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
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
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
            <input type="checkbox" {...register("isVisible")} />
            Visible category
          </label>

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {isSubmitting
                ? "Saving..."
                : editing
                  ? "Update Category"
                  : "Create Category"}
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
