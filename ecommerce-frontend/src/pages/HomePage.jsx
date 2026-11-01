import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  ArrowDown,
  BadgeCheck,
  Boxes,
  RefreshCw,
  ShoppingBag,
  Sparkles,
  Truck,
} from "lucide-react";
import api from "../services/api";
import "./HomePage.css";

const fallbackCategoryImage =
  "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=900&q=85";

const categoryImages = [
  {
    keywords: ["mobile", "smartphone", "phone"],
    image:
      "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?auto=format&fit=crop&w=900&q=85",
  },
  {
    keywords: ["laptop", "computer"],
    image:
      "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=900&q=85",
  },
  {
    keywords: ["tablet"],
    image:
      "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=900&q=85",
  },
  {
    keywords: ["audio", "headphone", "speaker"],
    image:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=85",
  },
  {
    keywords: ["accessor"],
    image:
      "https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=900&q=85",
  },
  {
    keywords: ["men", "fashion", "clothing", "shirt"],
    image:
      "https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=900&q=85",
  },
  {
    keywords: ["women", "beauty", "makeup"],
    image:
      "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=900&q=85",
  },
  {
    keywords: ["shoe", "footwear", "sneaker"],
    image:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=85",
  },
  {
    keywords: ["home", "kitchen", "furniture"],
    image:
      "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=900&q=85",
  },
  {
    keywords: ["grocery", "food", "snack"],
    image:
      "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=900&q=85",
  },
  {
    keywords: ["book", "stationery"],
    image:
      "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=900&q=85",
  },
  {
    keywords: ["toy", "game"],
    image:
      "https://images.unsplash.com/photo-1558060370-d644479cb6f7?auto=format&fit=crop&w=900&q=85",
  },
  {
    keywords: ["sport", "fitness"],
    image:
      "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=900&q=85",
  },
];

function unwrapList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.content)) return data.content;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.products)) return data.products;
  if (Array.isArray(data?.categories)) return data.categories;
  return [];
}

function money(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

function categoryName(category) {
  if (typeof category === "string") return category;
  return category?.name || category?.categoryName || "Everyday essentials";
}

function productImage(product) {
  return (
    product?.imageUrl ||
    product?.imageURL ||
    product?.image ||
    product?.productImageUrl ||
    product?.productImage ||
    fallbackCategoryImage
  );
}

function getCategoryImage(name = "") {
  const normalized = name.toLowerCase();

  return (
    categoryImages.find((item) =>
      item.keywords.some((keyword) => normalized.includes(keyword))
    )?.image || fallbackCategoryImage
  );
}

function getCategorySubtitle(name = "") {
  const value = name.toLowerCase();

  if (value.includes("mobile") || value.includes("phone")) {
    return "Find a phone that fits your world";
  }

  if (value.includes("laptop") || value.includes("computer")) {
    return "Power your work and your ideas";
  }

  if (value.includes("tablet")) {
    return "Big ideas, beautifully portable";
  }

  if (value.includes("audio") || value.includes("headphone")) {
    return "Sound made for your everyday";
  }

  if (value.includes("accessor")) {
    return "Small details, big difference";
  }

  if (value.includes("fashion") || value.includes("clothing")) {
    return "Bring your everyday style together";
  }

  if (value.includes("footwear") || value.includes("shoe")) {
    return "Find your everyday stride";
  }

  if (value.includes("home") || value.includes("kitchen")) {
    return "Make your space feel like you";
  }

  if (value.includes("book")) {
    return "Ideas worth making time for";
  }

  if (value.includes("sport") || value.includes("fitness")) {
    return "Move a little better every day";
  }

  return "Discover something made for you";
}

function ProductCard({ product }) {
  const image = productImage(product);
  const name = product?.name || product?.productName || "ShopNova pick";
  const price = product?.price ?? product?.sellingPrice ?? 0;
  const stock = product?.stock ?? product?.quantity;
  const category = categoryName(
    product?.category || product?.categoryName
  );

  return (
    <Link
      to={`/products/${product.id}`}
      className="home-product-card"
    >
      <div className="home-product-image">
        <img
          src={image}
          alt={name}
          loading="lazy"
          onError={(event) => {
            event.currentTarget.onerror = null;
            event.currentTarget.src = fallbackCategoryImage;
          }}
        />

        <span className="home-product-open" aria-hidden="true">
          <ArrowUpRight size={18} />
        </span>

        {typeof stock === "number" && stock <= 0 && (
          <span className="home-product-stock">Out of stock</span>
        )}
      </div>

      <div className="home-product-category">{category}</div>

      <h3>{name}</h3>

      <div className="home-product-meta">
        <strong>{money(price)}</strong>

        {typeof stock === "number" && stock > 0 && stock <= 5 && (
          <span className="home-product-low-stock">
            Only {stock} left
          </span>
        )}
      </div>
    </Link>
  );
}

export default function HomePage() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);

  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(true);

  const [categoriesError, setCategoriesError] = useState(false);
  const [productsError, setProductsError] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadCategories() {
      try {
        setCategoriesLoading(true);
        setCategoriesError(false);

        const response = await api.get("/displaycategory");

        if (active) {
          setCategories(unwrapList(response.data));
        }
      } catch (error) {
        console.error("Could not load home categories:", error);

        if (active) {
          setCategoriesError(true);
        }
      } finally {
        if (active) {
          setCategoriesLoading(false);
        }
      }
    }

    async function loadProducts() {
      try {
        setProductsLoading(true);
        setProductsError(false);

        const response = await api.get("/displayproduct");
        const list = unwrapList(response.data);

        if (active) {
          setProducts(
            list
              .filter((product) => product && product.id != null)
              .slice(0, 8)
          );
        }
      } catch (error) {
        console.error("Could not load home products:", error);

        if (active) {
          setProductsError(true);
        }
      } finally {
        if (active) {
          setProductsLoading(false);
        }
      }
    }

    loadCategories();
    loadProducts();

    return () => {
      active = false;
    };
  }, []);

  const categoryCount = useMemo(
    () => categories.length,
    [categories]
  );

  return (
    <main className="home-page" id="home-top">
      {/* HERO SECTION */}

      <section className="home-hero">
        <div className="home-hero-copy">
          <span className="home-eyebrow">
            <span className="home-eyebrow-line" />
            THE SHOPNOVA EDIT · 2026
          </span>

          <h1>
            Good finds.
            <br />
            <em>Better everyday.</em>
          </h1>

          <p>
            From the tech you rely on to the little things that make life
            easier — discover everyday essentials, all in one place.
          </p>

          <div className="home-hero-actions">
            <Link to="/products" className="home-primary-button">
              Explore the collection
              <ArrowUpRight size={18} />
            </Link>

            <a href="#explore-categories" className="home-secondary-link">
              Browse categories
              <ArrowDown size={15} />
            </a>
          </div>

          <div className="home-hero-footnote">
            <span>01 / YOUR EVERYDAY STORE</span>
            <span>DESIGNED FOR REAL LIFE</span>
          </div>
        </div>

        <div className="home-hero-image">
          <img
            src="https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=1400&q=90"
            alt="Everyday technology and electronics"
            fetchPriority="high"
          />

          <div className="home-image-shade" />

          <div className="home-image-caption">
            <span>THE EVERYDAY EDIT</span>
            <span>SHOPNOVA SELECTS ↗</span>
          </div>

          <div className="home-floating-card">
            <span>MADE FOR YOUR EVERYDAY</span>
            <strong>Find your next favourite.</strong>
            <ArrowUpRight size={20} />
          </div>
        </div>
      </section>

      {/* BENEFITS STRIP */}

      <div className="home-values" aria-label="ShopNova benefits">
        <span>
          <Truck size={15} />
          Complimentary shipping over ₹1,999
        </span>

        <span className="home-values-star">✳</span>

        <span>
          <BadgeCheck size={15} />
          Carefully selected essentials
        </span>

        <span className="home-values-star">✳</span>

        <span>
          <RefreshCw size={14} />
          Simple, convenient shopping
        </span>
      </div>

      {/* CATEGORIES */}

      <section
        className="home-category-section"
        id="explore-categories"
      >
        <div className="home-section-heading">
          <div>
            <span className="home-eyebrow">FIND YOUR SOMETHING</span>

            <h2>
              Explore categories<span>.</span>
            </h2>

            <p>
              Start with what you need. Discover something you didn't know
              you wanted.
            </p>
          </div>

          <Link to="/products" className="home-text-link">
            View everything <ArrowRight size={16} />
          </Link>
        </div>

        {categoriesLoading ? (
          <div className="home-category-status">
            <span className="home-category-loader" />
            <p>Discovering our collections...</p>
          </div>
        ) : categoriesError ? (
          <div className="home-category-status">
            <h3>Categories could not load.</h3>
            <p>Please check the backend connection and refresh.</p>
          </div>
        ) : categories.length === 0 ? (
          <div className="home-category-status">
            <h3>No categories available yet.</h3>
            <p>New collections will appear here when they are available.</p>
          </div>
        ) : (
          <div className="home-category-grid">
            {categories.map((category, index) => {
              const name = categoryName(category);

              return (
                <Link
                  to={`/products?category=${encodeURIComponent(name)}`}
                  className="home-category-card"
                  key={category.id ?? name}
                >
                  <div className="home-category-image">
                    <img
                      src={
                        category.imageUrl ||
                        category.imageURL ||
                        getCategoryImage(name)
                      }
                      alt={name}
                      loading="lazy"
                      onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src = getCategoryImage(name);
                      }}
                    />

                    <span className="home-category-number">
                      {String(index + 1).padStart(2, "0")}
                    </span>

                    <span className="home-category-arrow">
                      <ArrowUpRight size={19} />
                    </span>
                  </div>

                  <div className="home-category-info">
                    <div>
                      <h3>{name}</h3>

                      <p>
                        {category.description ||
                          getCategorySubtitle(name)}
                      </p>
                    </div>

                    <ArrowRight size={17} />
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {!categoriesLoading &&
          !categoriesError &&
          categoryCount > 0 && (
            <p className="home-section-footnote">
              Showing {categoryCount}{" "}
              {categoryCount === 1 ? "collection" : "collections"} from
              ShopNova.
            </p>
          )}
      </section>

      {/* FEATURED PRODUCTS FROM BACKEND */}

      <section
        className="home-featured-section"
        id="featured-products"
      >
        <div className="home-section-heading">
          <div>
            <span className="home-eyebrow">
              THE PIECES YOU COME BACK TO
            </span>

            <h2>
              Picked for you<span>.</span>
            </h2>

            <p>
              Explore products currently available in the ShopNova
              catalogue.
            </p>
          </div>

          <Link to="/products" className="home-text-link">
            Shop all products <ArrowRight size={16} />
          </Link>
        </div>

        {productsLoading ? (
          <div className="home-product-status">
            <span className="home-category-loader" />
            <p>Finding your next favourite...</p>
          </div>
        ) : productsError ? (
          <div className="home-product-status">
            <h3>Products could not load.</h3>
            <p>
              Check the backend connection and try refreshing the page.
            </p>

            <Link to="/products" className="home-text-link">
              Open shop <ArrowRight size={15} />
            </Link>
          </div>
        ) : products.length === 0 ? (
          <div className="home-product-status">
            <Boxes size={28} />
            <h3>Your catalogue is waiting.</h3>
            <p>Products added to ShopNova will appear here.</p>

            <Link to="/products" className="home-text-link">
              Explore the shop <ArrowRight size={15} />
            </Link>
          </div>
        ) : (
          <div className="home-featured-grid">
            {products.map((product) => (
              <ProductCard product={product} key={product.id} />
            ))}
          </div>
        )}
      </section>

      {/* EDITORIAL BANNER */}

      <section className="home-editorial">
        <div className="home-editorial-image">
          <img
            src="https://images.unsplash.com/photo-1491637639811-60e2756cc1c7?auto=format&fit=crop&w=1200&q=85"
            alt="Everyday essentials ready to go"
            loading="lazy"
          />
        </div>

        <div className="home-editorial-copy">
          <span className="home-eyebrow">
            <Sparkles size={14} />
            OUR POINT OF VIEW
          </span>

          <h2>
            Useful things.
            <br />
            <em>Thoughtful choices.</em>
          </h2>

          <p>
            Shopping should feel simple. Find reliable essentials, explore
            new discoveries and bring the things you love into everyday
            life.
          </p>

          <Link to="/products" className="home-primary-button">
            Discover our edit <ArrowUpRight size={18} />
          </Link>
        </div>
      </section>

      {/* NEWSLETTER PLACEHOLDER */}

      <section className="home-newsletter">
        <span className="home-eyebrow">A NOTE FROM SHOPNOVA</span>

        <h2>Good things, occasionally.</h2>

        <p>
          New arrivals, useful finds and a little inspiration for everyday
          life.
        </p>

        <form
          className="home-newsletter-form"
          onSubmit={(event) => {
            event.preventDefault();
            window.alert(
              "Newsletter signup is not connected to the backend yet."
            );
          }}
        >
          <input
            type="email"
            aria-label="Email address"
            placeholder="Your email address"
            required
          />

          <button type="submit">
            Join us <ArrowUpRight size={17} />
          </button>
        </form>

        <span className="home-newsletter-note">
          Thoughtful updates, never noise.
        </span>
      </section>

      {/* BACK TO TOP */}

      <button
        type="button"
        className="home-back-top"
        onClick={() =>
          window.scrollTo({ top: 0, behavior: "smooth" })
        }
      >
        <ArrowDown size={15} className="home-back-top-icon" />
        BACK TO TOP
      </button>
    </main>
  );
}