import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Search,
  SlidersHorizontal,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
  Package,
  ShoppingBag,
  RotateCcw,
  ArrowUpRight,
  Check,
  AlertCircle,
} from "lucide-react";
import api from "../services/api";
import "./ProductsPage.css";

const PAGE_SIZE = 12;

function unwrapList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.content)) return data.content;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.products)) return data.products;
  if (Array.isArray(data?.categories)) return data.categories;
  return [];
}

function getProductName(product) {
  return product?.name || product?.productName || "Untitled product";
}

function getCategoryName(product) {
  const category =
    product?.category ||
    product?.categoryName ||
    product?.categoryResponseDTO ||
    product?.categoryResponseDto;

  if (typeof category === "string") return category;

  return (
    category?.name ||
    category?.categoryName ||
    product?.categoryName ||
    "General"
  );
}

function getStock(product) {
  const value = product?.stock ?? product?.quantity;

  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function getPrice(product) {
  return Number(product?.price ?? product?.sellingPrice ?? 0);
}

function getImageUrl(product) {
  return (
    product?.imageUrl ||
    product?.imageURL ||
    product?.productImageUrl ||
    product?.productImage ||
    product?.image ||
    ""
  );
}

function formatPrice(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

function ProductImage({ product }) {
  const [imageFailed, setImageFailed] = useState(false);
  const imageUrl = getImageUrl(product);

  useEffect(() => {
    setImageFailed(false);
  }, [imageUrl]);

  return (
    <div className="products-card-image">
      {imageUrl && !imageFailed ? (
        <img
          src={imageUrl}
          alt={getProductName(product)}
          loading="lazy"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <div className="products-no-image products-no-image-visible">
          <Package size={32} strokeWidth={1.4} />
          <span>SHOPNOVA</span>
          <small>Product image unavailable</small>
        </div>
      )}
    </div>
  );
}

function ProductCard({ product }) {
  const name = getProductName(product);
  const category = getCategoryName(product);
  const price = getPrice(product);
  const stock = getStock(product);
  const outOfStock = stock !== null && stock <= 0;

  return (
    <Link
      to={`/products/${product.id}`}
      className="products-card"
      aria-label={`View ${name}`}
    >
      <div className="products-card-visual">
        <ProductImage product={product} />

        <span className="products-card-arrow">
          <ArrowUpRight size={19} />
        </span>

        {outOfStock && (
          <span className="products-stock-badge">Out of stock</span>
        )}
      </div>

      <div className="products-card-content">
        <p className="products-card-category">{category}</p>

        <h2>{name}</h2>

        {product?.description && (
          <p className="products-card-description">
            {product.description}
          </p>
        )}

        <div className="products-card-bottom">
          <strong>{formatPrice(price)}</strong>

          {stock !== null && (
            <span
              className={
                stock > 0
                  ? "products-stock-available"
                  : "products-stock-unavailable"
              }
            >
              {stock > 0 ? "In stock" : "Sold out"}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

function FilterGroup({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="products-filter-group">
      <button
        type="button"
        className="products-filter-heading"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
      >
        <span>{title}</span>
        <ChevronDown
          size={16}
          className={open ? "products-filter-chevron-open" : ""}
        />
      </button>

      {open && <div className="products-filter-options">{children}</div>}
    </section>
  );
}

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const urlSearch = searchParams.get("search") || "";
  const selectedCategory = searchParams.get("category") || "";

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchInput, setSearchInput] = useState(urlSearch);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [sortBy, setSortBy] = useState("featured");
  const [priceRange, setPriceRange] = useState("all");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    setSearchInput(urlSearch);
    setCurrentPage(1);
  }, [urlSearch, selectedCategory]);

  useEffect(() => {
    let active = true;

    async function loadProducts() {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/displayproduct");
        const list = unwrapList(response.data);

        if (active) {
          setProducts(
            list.filter((product) => product && product.id != null)
          );
        }
      } catch (err) {
        console.error("Failed to load products:", err);

        if (active) {
          setError(
            err.response
              ? `Backend error: ${err.response.status}. Please check your Spring Boot API.`
              : "Cannot connect to the backend. Make sure Spring Boot is running on port 8569."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    async function loadCategories() {
      try {
        const response = await api.get("/displaycategory");

        if (active) {
          setCategories(unwrapList(response.data));
        }
      } catch (err) {
        console.error("Could not load product categories:", err);
      }
    }

    loadProducts();
    loadCategories();

    return () => {
      active = false;
    };
  }, []);

  const categoryNames = useMemo(() => {
    const names = categories
      .map((category) =>
        typeof category === "string"
          ? category
          : category?.name || category?.categoryName
      )
      .filter(Boolean);

    products.forEach((product) => {
      const name = getCategoryName(product);

      if (name !== "General" && !names.includes(name)) {
        names.push(name);
      }
    });

    return [...new Set(names)].sort((a, b) => a.localeCompare(b));
  }, [categories, products]);

  const filteredProducts = useMemo(() => {
    const query = urlSearch.trim().toLowerCase();
    const categoryQuery = selectedCategory.trim().toLowerCase();

    let result = products.filter((product) => {
      const name = getProductName(product).toLowerCase();
      const description = String(product?.description || "").toLowerCase();
      const category = getCategoryName(product).toLowerCase();
      const id = String(product?.id ?? "").toLowerCase();

      const matchesSearch =
        !query ||
        name.includes(query) ||
        description.includes(query) ||
        category.includes(query) ||
        id.includes(query);

      const matchesCategory =
        !categoryQuery || category === categoryQuery;

      const stock = getStock(product);
      const matchesStock =
        !inStockOnly || (stock !== null && stock > 0);

      const price = getPrice(product);
      let matchesPrice = true;

      switch (priceRange) {
        case "under1000":
          matchesPrice = price < 1000;
          break;
        case "1000to5000":
          matchesPrice = price >= 1000 && price <= 5000;
          break;
        case "5000to20000":
          matchesPrice = price > 5000 && price <= 20000;
          break;
        case "above20000":
          matchesPrice = price > 20000;
          break;
        default:
          matchesPrice = true;
      }

      return (
        matchesSearch &&
        matchesCategory &&
        matchesStock &&
        matchesPrice
      );
    });

    result = [...result];

    if (sortBy === "price-low") {
      result.sort((a, b) => getPrice(a) - getPrice(b));
    } else if (sortBy === "price-high") {
      result.sort((a, b) => getPrice(b) - getPrice(a));
    } else if (sortBy === "name") {
      result.sort((a, b) =>
        getProductName(a).localeCompare(getProductName(b))
      );
    } else if (sortBy === "newest") {
      result.sort((a, b) => Number(b.id) - Number(a.id));
    }

    return result;
  }, [
    products,
    urlSearch,
    selectedCategory,
    sortBy,
    priceRange,
    inStockOnly,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredProducts.length / PAGE_SIZE)
  );

  const visibleProducts = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredProducts.slice(start, start + PAGE_SIZE);
  }, [filteredProducts, currentPage]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  function submitSearch(event) {
    event.preventDefault();

    const next = new URLSearchParams(searchParams);
    const query = searchInput.trim();

    if (query) {
      next.set("search", query);
    } else {
      next.delete("search");
    }

    setSearchParams(next);
    setCurrentPage(1);
  }

  function chooseCategory(category) {
    const next = new URLSearchParams(searchParams);

    if (category) {
      next.set("category", category);
    } else {
      next.delete("category");
    }

    setSearchParams(next);
    setCurrentPage(1);
    setFiltersOpen(false);
  }

  function resetFilters() {
    const next = new URLSearchParams(searchParams);
    next.delete("search");
    next.delete("category");

    setSearchInput("");
    setSortBy("featured");
    setPriceRange("all");
    setInStockOnly(false);
    setCurrentPage(1);
    setSearchParams(next);
  }

  function clearSearch() {
    const next = new URLSearchParams(searchParams);
    next.delete("search");

    setSearchInput("");
    setSearchParams(next);
    setCurrentPage(1);
  }

  const filtersApplied =
    Boolean(urlSearch) ||
    Boolean(selectedCategory) ||
    priceRange !== "all" ||
    inStockOnly;

  const rangeStart =
    filteredProducts.length === 0
      ? 0
      : (currentPage - 1) * PAGE_SIZE + 1;

  const rangeEnd = Math.min(
    currentPage * PAGE_SIZE,
    filteredProducts.length
  );

  return (
    <main className="products-page">
      <section className="products-page-banner">
        <div className="products-banner-copy">
          <span className="products-eyebrow">THE SHOPNOVA STORE</span>

          <h1>
            Find your
            <br />
            <span>everyday favourite.</span>
          </h1>

          <p>
            Discover everyday essentials for the way you live, work and move.
          </p>

          <div className="products-banner-meta">
            <span><Check size={15} /> Explore the collection</span>
            <span><Check size={15} /> Shop your way</span>
          </div>
        </div>

        <div className="products-banner-art" aria-hidden="true">
          <div className="products-banner-shape products-banner-shape-one" />
          <div className="products-banner-shape products-banner-shape-two" />

          <div className="products-banner-art-card">
            <ShoppingBag size={45} strokeWidth={1.2} />
            <span>SHOPNOVA</span>
            <strong>Everyday, elevated.</strong>
          </div>

          <span className="products-banner-art-note">
            DISCOVER SOMETHING GOOD ↗
          </span>
        </div>
      </section>

      <div className="products-breadcrumb">
        <Link to="/">Home</Link>
        <ChevronRight size={14} />
        <span>Shop All</span>

        {selectedCategory && (
          <>
            <ChevronRight size={14} />
            <span>{selectedCategory}</span>
          </>
        )}
      </div>

      <section className="products-main">
        <div className="products-title-row">
          <div>
            <span className="products-eyebrow">YOUR NEXT GREAT FIND</span>

            <h2>
              {urlSearch
                ? "Search results"
                : selectedCategory || "Shop all products"}
              <span>.</span>
            </h2>

            <p>
              Browse the collection and find something made for you.
            </p>
          </div>

          <form className="products-page-search" onSubmit={submitSearch}>
            <Search size={18} aria-hidden="true" />

            <input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search products..."
              aria-label="Search products"
            />

            {searchInput && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={clearSearch}
              >
                <X size={16} />
              </button>
            )}

            <button type="submit" className="products-search-submit">
              Search
            </button>
          </form>
        </div>

        <div className="products-toolbar">
          <div className="products-toolbar-left">
            <button
              type="button"
              className={`products-mobile-filter-button ${
                filtersOpen ? "is-active" : ""
              }`}
              onClick={() => setFiltersOpen((open) => !open)}
              aria-expanded={filtersOpen}
            >
              <SlidersHorizontal size={16} />
              Filters
              <ChevronDown
                size={15}
                className={filtersOpen ? "toolbar-chevron-open" : ""}
              />
            </button>

            <span className="products-results-count">
              {loading
                ? "Loading products..."
                : `${filteredProducts.length} ${
                    filteredProducts.length === 1 ? "product" : "products"
                  }`}
            </span>
          </div>

          <label className="products-sort-label">
            <span>Sort by</span>

            <span className="products-sort-select-wrap">
              <select
                value={sortBy}
                onChange={(event) => {
                  setSortBy(event.target.value);
                  setCurrentPage(1);
                }}
                aria-label="Sort products"
              >
                <option value="featured">Featured</option>
                <option value="newest">Latest added</option>
                <option value="price-low">Price: Low to high</option>
                <option value="price-high">Price: High to low</option>
                <option value="name">Name: A to Z</option>
              </select>
              <ChevronDown size={15} />
            </span>
          </label>
        </div>

        <div className="products-layout">
          <aside
            className={`products-sidebar ${
              filtersOpen ? "products-sidebar-open" : ""
            }`}
          >
            <div className="products-sidebar-heading">
              <h3>Filters</h3>

              <button
                type="button"
                onClick={resetFilters}
                className="products-reset-button"
              >
                <RotateCcw size={13} />
                Reset
              </button>
            </div>

            <FilterGroup title="Categories">
              <button
                type="button"
                className={`products-category-option ${
                  !selectedCategory ? "is-selected" : ""
                }`}
                onClick={() => chooseCategory("")}
              >
                <span className="products-option-radio">
                  {!selectedCategory && <span />}
                </span>
                <span>All categories</span>
              </button>

              {categoryNames.map((category) => {
                const selected =
                  selectedCategory.toLowerCase() ===
                  category.toLowerCase();

                return (
                  <button
                    type="button"
                    className={`products-category-option ${
                      selected ? "is-selected" : ""
                    }`}
                    key={category}
                    onClick={() => chooseCategory(category)}
                  >
                    <span className="products-option-radio">
                      {selected && <span />}
                    </span>
                    <span>{category}</span>
                  </button>
                );
              })}
            </FilterGroup>

            <FilterGroup title="Price range">
              {[
                { value: "all", label: "All prices" },
                { value: "under1000", label: "Under ₹1,000" },
                { value: "1000to5000", label: "₹1,000 – ₹5,000" },
                { value: "5000to20000", label: "₹5,001 – ₹20,000" },
                { value: "above20000", label: "Above ₹20,000" },
              ].map((option) => (
                <label className="products-radio-row" key={option.value}>
                  <input
                    type="radio"
                    name="priceRange"
                    value={option.value}
                    checked={priceRange === option.value}
                    onChange={() => {
                      setPriceRange(option.value);
                      setCurrentPage(1);
                    }}
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </FilterGroup>

            <FilterGroup title="Availability">
              <label className="products-checkbox-row">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(event) => {
                    setInStockOnly(event.target.checked);
                    setCurrentPage(1);
                  }}
                />
                <span>In-stock products only</span>
              </label>
            </FilterGroup>

            {filtersApplied && (
              <button
                type="button"
                className="products-clear-all"
                onClick={resetFilters}
              >
                <X size={15} />
                Clear all filters
              </button>
            )}
          </aside>

          <div className="products-results-area">
            {selectedCategory && (
              <div className="products-active-filter">
                <span>Category: {selectedCategory}</span>
                <button
                  type="button"
                  aria-label="Clear category filter"
                  onClick={() => chooseCategory("")}
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {urlSearch && (
              <div className="products-active-filter">
                <span>Search: {urlSearch}</span>
                <button
                  type="button"
                  aria-label="Clear search filter"
                  onClick={clearSearch}
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {loading ? (
              <div className="products-loading" role="status">
                <span className="products-loader" />
                <h3>Finding your next favourite</h3>
                <p>Loading the ShopNova collection...</p>
              </div>
            ) : error ? (
              <div className="products-message" role="alert">
                <AlertCircle size={30} />
                <h3>Collection unavailable</h3>
                <p>{error}</p>
                <button
                  type="button"
                  className="products-primary-button"
                  onClick={() => window.location.reload()}
                >
                  Try again
                </button>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="products-empty">
                <div className="products-empty-icon">
                  <ShoppingBag size={30} />
                </div>

                <span className="products-eyebrow">NO MATCHES FOUND</span>
                <h3>Nothing here just yet.</h3>

                <p>
                  Try another search or clear the filters to explore all
                  available products.
                </p>

                <button
                  type="button"
                  className="products-primary-button"
                  onClick={resetFilters}
                >
                  View all products <ArrowUpRight size={17} />
                </button>
              </div>
            ) : (
              <>
                <div className="products-grid" aria-label="Product collection">
                  {visibleProducts.map((product) => (
                    <ProductCard product={product} key={product.id} />
                  ))}
                </div>

                <div className="products-pagination">
                  <span>
                    Showing <strong>{rangeStart}–{rangeEnd}</strong> of{" "}
                    <strong>{filteredProducts.length}</strong>
                  </span>

                  {totalPages > 1 && (
                    <div className="products-page-controls">
                      <button
                        type="button"
                        aria-label="Previous page"
                        disabled={currentPage === 1}
                        onClick={() =>
                          setCurrentPage((page) => Math.max(1, page - 1))
                        }
                      >
                        <ChevronLeft size={17} />
                      </button>

                      {Array.from(
                        { length: totalPages },
                        (_, index) => index + 1
                      ).map((page) => (
                        <button
                          type="button"
                          key={page}
                          className={
                            page === currentPage ? "is-current" : ""
                          }
                          aria-label={`Page ${page}`}
                          aria-current={
                            page === currentPage ? "page" : undefined
                          }
                          onClick={() => {
                            setCurrentPage(page);
                            window.scrollTo({
                              top: 0,
                              behavior: "smooth",
                            });
                          }}
                        >
                          {page}
                        </button>
                      ))}

                      <button
                        type="button"
                        aria-label="Next page"
                        disabled={currentPage === totalPages}
                        onClick={() =>
                          setCurrentPage((page) =>
                            Math.min(totalPages, page + 1)
                          )
                        }
                      >
                        <ChevronRight size={17} />
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}