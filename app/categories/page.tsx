"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { FiEdit2, FiStar, FiTrash2 } from "react-icons/fi";
import AdminShell from "../../components/AdminShell";
import ProtectedRoute from "../../components/ProtectedRoute";
import { deleteCategoryApi, getCategoriesApi, setCategoryFeaturedApi } from "../../lib/api";
import { Category } from "../../lib/types";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState("");

  const loadCategories = async () => {
    const data = await getCategoriesApi();
    setCategories(data);
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const deleteCategory = async (id: string) => {
    try {
      await deleteCategoryApi(id);
      loadCategories();
    } catch (_error) {
      setError("Could not delete category (it may be linked with videos)");
    }
  };

  const toggleFeatured = async (category: Category) => {
    setError("");
    try {
      await setCategoryFeaturedApi(category._id, {
        name: category.name,
        slug: category.slug,
        imageUrl: category.imageUrl || "",
        featured: !category.featured,
      });
      loadCategories();
    } catch (apiError) {
      setError(apiError instanceof Error ? apiError.message : "Could not update featured status");
    }
  };

  return (
    <ProtectedRoute>
      <AdminShell title="Category List" actionLabel="Add Category" actionHref="/categories/add">
        {error ? <p className="mb-4 text-sm text-red-600">{error}</p> : null}

        <div className="admin-card overflow-x-auto p-3">
          <table className="admin-table w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--admin-border)]">
                <th className="px-3 py-3 font-semibold">Image</th>
                <th className="px-3 py-3 font-semibold">Category Name</th>
                <th className="px-3 py-3 font-semibold">Featured</th>
                <th className="px-3 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category._id} className="border-b border-[var(--admin-border)] last:border-b-0">
                  <td className="px-3 py-3">
                    {category.imageUrl ? (
                      <Image
                        src={category.imageUrl}
                        alt={category.name}
                        width={80}
                        height={48}
                        unoptimized
                        className="h-12 w-20 rounded object-cover"
                      />
                    ) : (
                      <span className="admin-muted text-xs">No image</span>
                    )}
                  </td>
                  <td className="px-3 py-3 font-medium">{category.name}</td>
                  <td className="px-3 py-3">
                    {category.featured ? (
                      <span className="admin-chip rounded px-2 py-1 text-xs">Yes</span>
                    ) : (
                      <span className="admin-muted text-xs">No</span>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex gap-2">
                      <Link
                        href={`/categories/${category._id}/edit`}
                        className="admin-btn bg-blue-600 text-white"
                        aria-label="Edit category"
                        title="Edit"
                      >
                        <FiEdit2 aria-hidden />
                      </Link>
                      <button
                        onClick={() => deleteCategory(category._id)}
                        className="admin-btn bg-red-600 text-white"
                        aria-label="Delete category"
                        title="Delete"
                      >
                        <FiTrash2 aria-hidden />
                      </button>
                      <button
                        onClick={() => toggleFeatured(category)}
                        className={`admin-btn text-white ${category.featured ? "bg-yellow-600" : "bg-emerald-600"}`}
                        aria-label={category.featured ? "Unfeature category" : "Feature category"}
                        title={category.featured ? "Unfeature" : "Feature"}
                      >
                        <FiStar aria-hidden />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminShell>
    </ProtectedRoute>
  );
}
