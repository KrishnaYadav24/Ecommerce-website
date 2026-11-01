
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../services/api";
import "./AdminCatalog.css";

const emptyProductForm = {
  name: "",
  description: "",
  price: "",
  stock: "",
  categoryId: "",
  mfd: "",
};

const emptyCategoryForm = {
  name: "",
  description: "",
};

const extractList = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.content)) return data.content;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.data?.content)) return data.data.content;
  return [];
};

const errorMessage = (error, fallback) => {
  const data = error?.response?.data;

  if (typeof data === "string" && data.trim()) return data;

  return (
    data?.message ||
    data?.detail ||
    data?.error ||
    error?.message ||
    fallback
  );
};

const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

export default function AdminCatalog() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("products");
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");

  const [editingProductId, setEditingProductId] = useState(null);
  const [editingCategoryId, setEditingCategoryId] = useState(null);

  const [productForm, setProductForm] = useState(emptyProductForm);
  const [categoryForm, setCategoryForm] = useState(emptyCategoryForm);

  const authConfig = () => {
    const token = localStorage.getItem("token");

    if (!token) {
      throw new Error("Your session is missing. Please log in again.");
    }

    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
  };

  const loadCatalog = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);

    setError("");

    try {
      const config = authConfig();

      const [productsResult, categoriesResult] =
        await Promise.allSettled([
          api.get("/displayproduct", config),
          api.get("/displaycategory", config),
        ]);

      const problems = [];

      if (productsResult.status === "fulfilled") {
        setProducts(extractList(productsResult.value.data));
      } else {
        setProducts([]);
        problems.push(
          errorMessage(
            productsResult.reason,
            "Could not load products."
          )
        );
      }

      if (categoriesResult.status === "fulfilled") {
        setCategories(extractList(categoriesResult.value.data));
      } else {
        setCategories([]);
        problems.push(
          errorMessage(
            categoriesResult.reason,
            "Could not load categories."
          )
        );
      }

      if (problems.length > 0) {
        setError(problems.join(" "));
      }
    } catch (err) {
      setError(
        errorMessage(err, "Could not load product and category data.")
      );
      setProducts([]);
      setCategories([]);
    } finally {
      if (showLoader) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return products;

    return products.filter((product) => {
      const searchable = [
        product.id,
        product.name,
        product.description,
        product.category?.name,
        product.category?.description,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(query);
    });
  }, [products, search]);

  const filteredCategories = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return categories;

    return categories.filter((category) =>
      [
        category.id,
        category.name,
        category.description,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [categories, search]);

  const lowStockCount = products.filter(
    (product) => Number(product.stock) <= 5
  ).length;

  const resetProductForm = () => {
    setProductForm(emptyProductForm);
    setEditingProductId(null);
  };

  const resetCategoryForm = () => {
    setCategoryForm(emptyCategoryForm);
    setEditingCategoryId(null);
  };

  const handleProductEdit = (product) => {
    setError("");
    setNotice("");
    setActiveTab("products");

    setEditingProductId(product.id);

    setProductForm({
      name: product.name || "",
      description: product.description || "",
      price: String(product.price ?? ""),
      stock: String(product.stock ?? ""),
      categoryId: String(
        product.category?.id ?? product.categoryId ?? ""
      ),
      mfd: product.mfd
        ? String(product.mfd).slice(0, 10)
        : "",
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCategoryEdit = (category) => {
    setError("");
    setNotice("");
    setActiveTab("categories");

    setEditingCategoryId(category.id);

    setCategoryForm({
      name: category.name || "",
      description: category.description || "",
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleProductSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");

    const price = Number(productForm.price);
    const stock = Number(productForm.stock);
    const categoryId = Number(productForm.categoryId);

    if (!productForm.name.trim()) {
      setError("Product name is required.");
      return;
    }

    if (!Number.isFinite(price) || price <= 0) {
      setError("Enter a valid price greater than zero.");
      return;
    }

    if (!Number.isInteger(stock) || stock < 0) {
      setError("Stock must be a whole number and cannot be negative.");
      return;
    }

    if (!Number.isInteger(categoryId) || categoryId <= 0) {
      setError("Please select a valid category.");
      return;
    }

    const payload = {
      name: productForm.name.trim(),
      description: productForm.description.trim(),
      price,
      stock,
      categoryId,
      mfd: productForm.mfd || null,
    };

    setSaving(true);

    try {
      const config = authConfig();

      if (editingProductId !== null) {
        await api.put(
          `/updateproductbyid/${editingProductId}`,
          payload,
          config
        );

        setNotice(`Product #${editingProductId} updated successfully.`);
      } else {
        await api.post("/products", payload, config);
        setNotice("Product added successfully.");
      }

      resetProductForm();
      await loadCatalog(false);
    } catch (err) {
      setError(
        errorMessage(
          err,
          "Unable to save product. Please verify the form and try again."
        )
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCategorySubmit = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");

    if (!categoryForm.name.trim()) {
      setError("Category name is required.");
      return;
    }

    const payload = {
      name: categoryForm.name.trim(),
      description: categoryForm.description.trim(),
    };

    setSaving(true);

    try {
      const config = authConfig();

      if (editingCategoryId !== null) {
        await api.put(
          `/updatecategory/${editingCategoryId}`,
          payload,
          config
        );

        setNotice(
          `Category #${editingCategoryId} updated successfully.`
        );
      } else {
        await api.post("/addcategory", payload, config);
        setNotice("Category added successfully.");
      }

      resetCategoryForm();
      await loadCatalog(false);
    } catch (err) {
      setError(
        errorMessage(
          err,
          "Unable to save category. It may already exist or be invalid."
        )
      );
    } finally {
      setSaving(false);
    }
  };

  const handleProductDelete = async (product) => {
    const confirmed = window.confirm(
      `Delete product "${product.name}" (ID ${product.id})? This may fail if the product is already referenced by an order.`
    );

    if (!confirmed) return;

    setError("");
    setNotice("");
    setDeletingId(`product-${product.id}`);

    try {
      await api.delete(
        `/deletemapping/${product.id}`,
        authConfig()
      );

      setNotice(`Product "${product.name}" deleted.`);
      if (editingProductId === product.id) resetProductForm();

      await loadCatalog(false);
    } catch (err) {
      setError(
        errorMessage(
          err,
          "Unable to delete this product. Check whether it is referenced by an order."
        )
      );
    } finally {
      setDeletingId(null);
    }
  };

  const handleCategoryDelete = async (category) => {
    const confirmed = window.confirm(
      `Delete category "${category.name}" (ID ${category.id})? If products use this category, the backend may reject the deletion.`
    );

    if (!confirmed) return;

    setError("");
    setNotice("");
    setDeletingId(`category-${category.id}`);

    try {
      await api.delete(
        `/deletecategory/${category.id}`,
        authConfig()
      );

      setNotice(`Category "${category.name}" deleted.`);
      if (editingCategoryId === category.id) resetCategoryForm();

      await loadCatalog(false);
    } catch (err) {
      setError(
        errorMessage(
          err,
          "Unable to delete category. Make sure no products depend on it."
        )
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <main className="admin-catalog-page">
      <header className="catalog-header">
        <div>
          <span className="catalog-eyebrow">SHOPNOVA ADMINISTRATION</span>
          <h1>Product & Category Management</h1>
          <p>
            Manage your catalogue, pricing, stock levels and product groups.
          </p>
        </div>

        <div className="catalog-header-actions">
          <button
            type="button"
            className="catalog-button catalog-button-secondary"
            onClick={() => navigate("/admin")}
          >
            Back to Dashboard
          </button>

          <button
            type="button"
            className="catalog-button catalog-button-primary"
            onClick={() => loadCatalog()}
            disabled={loading}
          >
            {loading ? "Refreshing..." : "Refresh Data"}
          </button>
        </div>
      </header>

      <section className="catalog-stats">
        <article className="catalog-stat-card">
          <span>Total Products</span>
          <strong>{products.length}</strong>
        </article>

        <article className="catalog-stat-card">
          <span>Categories</span>
          <strong>{categories.length}</strong>
        </article>

        <article className="catalog-stat-card">
          <span>Low Stock (5 or less)</span>
          <strong>{lowStockCount}</strong>
        </article>
      </section>

      {error && (
        <div className="catalog-alert catalog-alert-error" role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => loadCatalog()}>
            Retry
          </button>
        </div>
      )}

      {notice && (
        <div className="catalog-alert catalog-alert-success" role="status">
          {notice}
        </div>
      )}

      <div className="catalog-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "products"}
          className={activeTab === "products" ? "active" : ""}
          onClick={() => {
            setActiveTab("products");
            setSearch("");
            setError("");
            setNotice("");
          }}
        >
          Products
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "categories"}
          className={activeTab === "categories" ? "active" : ""}
          onClick={() => {
            setActiveTab("categories");
            setSearch("");
            setError("");
            setNotice("");
          }}
        >
          Categories
        </button>
      </div>

      {activeTab === "products" ? (
        <section className="catalog-workspace">
          <form
            className="catalog-form-card"
            onSubmit={handleProductSubmit}
          >
            <div className="catalog-form-heading">
              <div>
                <span className="catalog-eyebrow">
                  {editingProductId !== null
                    ? `EDIT PRODUCT #${editingProductId}`
                    : "NEW INVENTORY ITEM"}
                </span>
                <h2>
                  {editingProductId !== null
                    ? "Update Product"
                    : "Add Product"}
                </h2>
              </div>

              {editingProductId !== null && (
                <button
                  type="button"
                  className="catalog-text-button"
                  onClick={resetProductForm}
                >
                  Cancel edit
                </button>
              )}
            </div>

            <label>
              Product Name *
              <input
                type="text"
                value={productForm.name}
                onChange={(event) =>
                  setProductForm({
                    ...productForm,
                    name: event.target.value,
                  })
                }
                maxLength={180}
                placeholder="Enter product name"
                required
              />
            </label>

            <label>
              Description
              <textarea
                value={productForm.description}
                onChange={(event) =>
                  setProductForm({
                    ...productForm,
                    description: event.target.value,
                  })
                }
                rows={3}
                placeholder="Describe the product"
              />
            </label>

            <div className="catalog-form-grid">
              <label>
                Price (₹) *
                <input
                  type="number"
                  value={productForm.price}
                  onChange={(event) =>
                    setProductForm({
                      ...productForm,
                      price: event.target.value,
                    })
                  }
                  min="0.01"
                  step="0.01"
                  required
                />
              </label>

              <label>
                Stock Quantity *
                <input
                  type="number"
                  value={productForm.stock}
                  onChange={(event) =>
                    setProductForm({
                      ...productForm,
                      stock: event.target.value,
                    })
                  }
                  min="0"
                  step="1"
                  required
                />
              </label>
            </div>

            <label>
              Category *
              <select
                value={productForm.categoryId}
                onChange={(event) =>
                  setProductForm({
                    ...productForm,
                    categoryId: event.target.value,
                  })
                }
                required
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option
                    key={category.id}
                    value={category.id}
                  >
                    {category.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Manufacturing Date
              <input
                type="date"
                value={productForm.mfd}
                onChange={(event) =>
                  setProductForm({
                    ...productForm,
                    mfd: event.target.value,
                  })
                }
              />
            </label>

            <button
              type="submit"
              className="catalog-button catalog-button-primary catalog-submit"
              disabled={saving || categories.length === 0}
            >
              {saving
                ? "Saving..."
                : editingProductId !== null
                  ? "Save Product Changes"
                  : "Add Product"}
            </button>

            {categories.length === 0 && (
              <p className="catalog-field-note">
                Add a category before creating a product.
              </p>
            )}
          </form>

          <section className="catalog-list-card">
            <div className="catalog-list-heading">
              <div>
                <h2>Product Inventory</h2>
                <p>{filteredProducts.length} product(s)</p>
              </div>

              <input
                className="catalog-search"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search products..."
                aria-label="Search products"
              />
            </div>

            {loading ? (
              <div className="catalog-empty">Loading products...</div>
            ) : filteredProducts.length === 0 ? (
              <div className="catalog-empty">
                <h3>No products found</h3>
                <p>Try another search or add a new product.</p>
              </div>
            ) : (
              <div className="catalog-table-wrap">
                <table className="catalog-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Stock</th>
                      <th>Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredProducts.map((product) => (
                      <tr key={product.id}>
                        <td>
                          <div className="catalog-product-cell">
                            {product.imageUrl ? (
                              <img
                                src={product.imageUrl}
                                alt={product.name || "Product"}
                                loading="lazy"
                                onError={(event) => {
                                  event.currentTarget.style.display = "none";
                                }}
                              />
                            ) : (
                              <div className="catalog-product-placeholder">
                                {(product.name || "P")
                                  .slice(0, 1)
                                  .toUpperCase()}
                              </div>
                            )}

                            <div>
                              <strong>{product.name}</strong>
                              <span>Product ID: {product.id}</span>
                            </div>
                          </div>
                        </td>

                        <td>{product.category?.name || "—"}</td>

                        <td className="catalog-price">
                          {money(product.price)}
                        </td>

                        <td>
                          <span
                            className={`catalog-stock ${
                              Number(product.stock) <= 5
                                ? "catalog-stock-low"
                                : "catalog-stock-ok"
                            }`}
                          >
                            {product.stock ?? 0} units
                          </span>
                        </td>

                        <td>
                          <div className="catalog-row-actions">
                            <button
                              type="button"
                              className="catalog-action-edit"
                              onClick={() => handleProductEdit(product)}
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              className="catalog-action-delete"
                              onClick={() => handleProductDelete(product)}
                              disabled={
                                deletingId === `product-${product.id}`
                              }
                            >
                              {deletingId === `product-${product.id}`
                                ? "Deleting..."
                                : "Delete"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </section>
      ) : (
        <section className="catalog-workspace">
          <form
            className="catalog-form-card"
            onSubmit={handleCategorySubmit}
          >
            <div className="catalog-form-heading">
              <div>
                <span className="catalog-eyebrow">
                  {editingCategoryId !== null
                    ? `EDIT CATEGORY #${editingCategoryId}`
                    : "ORGANIZE YOUR STORE"}
                </span>
                <h2>
                  {editingCategoryId !== null
                    ? "Update Category"
                    : "Add Category"}
                </h2>
              </div>

              {editingCategoryId !== null && (
                <button
                  type="button"
                  className="catalog-text-button"
                  onClick={resetCategoryForm}
                >
                  Cancel edit
                </button>
              )}
            </div>

            <label>
              Category Name *
              <input
                type="text"
                value={categoryForm.name}
                onChange={(event) =>
                  setCategoryForm({
                    ...categoryForm,
                    name: event.target.value,
                  })
                }
                maxLength={120}
                placeholder="e.g. Mobiles"
                required
              />
            </label>

            <label>
              Description
              <textarea
                value={categoryForm.description}
                onChange={(event) =>
                  setCategoryForm({
                    ...categoryForm,
                    description: event.target.value,
                  })
                }
                rows={4}
                placeholder="Describe this category"
              />
            </label>

            <button
              type="submit"
              className="catalog-button catalog-button-primary catalog-submit"
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : editingCategoryId !== null
                  ? "Save Category Changes"
                  : "Add Category"}
            </button>
          </form>

          <section className="catalog-list-card">
            <div className="catalog-list-heading">
              <div>
                <h2>Store Categories</h2>
                <p>{filteredCategories.length} categor(ies)</p>
              </div>

              <input
                className="catalog-search"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search categories..."
                aria-label="Search categories"
              />
            </div>

            {loading ? (
              <div className="catalog-empty">Loading categories...</div>
            ) : filteredCategories.length === 0 ? (
              <div className="catalog-empty">
                <h3>No categories found</h3>
                <p>Add a category to organize your product catalogue.</p>
              </div>
            ) : (
              <div className="catalog-table-wrap">
                <table className="catalog-table">
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th>Description</th>
                      <th>Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredCategories.map((category) => (
                      <tr key={category.id}>
                        <td>
                          <div className="catalog-category-cell">
                            <span className="catalog-category-icon">
                              {category.name?.slice(0, 1).toUpperCase() || "C"}
                            </span>
                            <div>
                              <strong>{category.name}</strong>
                              <span>Category ID: {category.id}</span>
                            </div>
                          </div>
                        </td>

                        <td>
                          {category.description || "No description"}
                        </td>

                        <td>
                          <div className="catalog-row-actions">
                            <button
                              type="button"
                              className="catalog-action-edit"
                              onClick={() => handleCategoryEdit(category)}
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              className="catalog-action-delete"
                              onClick={() => handleCategoryDelete(category)}
                              disabled={
                                deletingId === `category-${category.id}`
                              }
                            >
                              {deletingId === `category-${category.id}`
                                ? "Deleting..."
                                : "Delete"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </section>
      )}
    </main>
  );
}
