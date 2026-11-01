import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  Truck,
} from "lucide-react";
import api from "../services/api";
import "./CartPage.css";

function unwrapProducts(payload) {
  const data = payload?.data ?? payload;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.products)) return data.products;
  if (Array.isArray(data?.content)) return data.content;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.data?.products)) return data.data.products;

  return [];
}

function getProductImage(product) {
  const image =
    product?.imageUrl ??
    product?.imageURL ??
    product?.productImageUrl ??
    product?.productImage ??
    product?.image;

  return typeof image === "string" ? image.trim() : "";
}

function formatPrice(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);
}

function CartPage() {
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [productLookup, setProductLookup] = useState({});
  const [failedImages, setFailedImages] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyProductId, setBusyProductId] = useState(null);
  const [placingOrder, setPlacingOrder] = useState(false);

  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");

  const authConfig = useMemo(
    () => ({
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }),
    [token]
  );

  const redirectToLogin = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("user");

    navigate("/login", {
      replace: true,
      state: { from: "/cart" },
    });
  }, [navigate]);

  const loadCart = useCallback(
    async ({ silent = false } = {}) => {
      if (!token || !userId) {
        navigate("/login", {
          replace: true,
          state: { from: "/cart" },
        });
        return;
      }

      try {
        if (!silent) setLoading(true);
        setError("");

        const response = await api.get(
          `/getcart/${encodeURIComponent(userId)}`,
          authConfig
        );

        const payload = response.data;

        const cartItems =
          payload?.items ??
          payload?.data?.items ??
          payload?.cartItems ??
          [];

        setItems(Array.isArray(cartItems) ? cartItems : []);

        // Load the product catalogue for product images.
        // The cart can still work if the catalogue request fails.
        try {
          const productResponse = await api.get(
            "/displayproduct",
            authConfig
          );

          const products = unwrapProducts(productResponse.data);
          const lookup = {};

          products.forEach((product) => {
            if (product?.id != null) {
              lookup[String(product.id)] = product;
            }
          });

          setProductLookup(lookup);
        } catch {
          setProductLookup({});
        }
      } catch (err) {
        const status = err.response?.status;

        if (status === 401 || status === 403) {
          redirectToLogin();
          return;
        }

        if (status === 404) {
          setItems([]);
          setProductLookup({});
        } else {
          setError(
            err.response?.data?.message ||
              "We couldn't load your shopping bag. Please try again."
          );
        }
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [authConfig, navigate, redirectToLogin, token, userId]
  );

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  async function changeQuantity(item, change) {
    const currentQuantity = Number(item.quantity) || 1;
    const nextQuantity = currentQuantity + change;

    if (nextQuantity < 1) return;

    try {
      setBusyProductId(item.productId);
      setError("");

      await api.put(
        `/updatecart/${userId}/${item.productId}/${nextQuantity}`,
        {},
        authConfig
      );

      await loadCart({ silent: true });
    } catch (err) {
      if (
        err.response?.status === 401 ||
        err.response?.status === 403
      ) {
        redirectToLogin();
        return;
      }

      setError(
        err.response?.data?.message ||
          "Unable to update quantity. Please try again."
      );
    } finally {
      setBusyProductId(null);
    }
  }

  async function removeItem(productId) {
    try {
      setBusyProductId(productId);
      setError("");

      await api.delete(
        `/removefromcart/${userId}/${productId}`,
        authConfig
      );

      setFailedImages((previous) => {
        const next = { ...previous };
        delete next[String(productId)];
        return next;
      });

      await loadCart({ silent: true });
    } catch (err) {
      if (
        err.response?.status === 401 ||
        err.response?.status === 403
      ) {
        redirectToLogin();
        return;
      }

      setError(
        err.response?.data?.message ||
          "Unable to remove this product. Please try again."
      );
    } finally {
      setBusyProductId(null);
    }
  }

  // IMPORTANT:
  // Do not call POST /orders from the cart.
  // The user must select or save a delivery address first.
  function handlePlaceOrder() {
    if (!token || !userId) {
      navigate("/login", {
        replace: true,
        state: { from: "/checkout" },
      });
      return;
    }

    if (items.length === 0) {
      setError("Your shopping bag is empty.");
      return;
    }

    setError("");
    setPlacingOrder(true);

    navigate("/checkout");
  }

  const subtotal = useMemo(
    () =>
      items.reduce(
        (total, item) =>
          total +
          (Number(item.price) || 0) *
            (Number(item.quantity) || 0),
        0
      ),
    [items]
  );

  const totalUnits = useMemo(
    () =>
      items.reduce(
        (total, item) => total + (Number(item.quantity) || 0),
        0
      ),
    [items]
  );

  if (loading) {
    return (
      <main className="cart-page">
        <div className="cart-loading">
          <span className="cart-loading-spinner" />
          <p>Loading your shopping bag...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="cart-page">
      <div className="cart-container">
        <nav className="cart-breadcrumb" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <span>/</span>
          <span aria-current="page">Shopping Cart</span>
        </nav>

        <header className="cart-heading">
          <div className="cart-heading-copy">
            <span className="cart-eyebrow">YOUR SHOPNOVA BAG</span>

            <h1>
              Shopping Cart<span>.</span>
            </h1>

            <p>
              {totalUnits} {totalUnits === 1 ? "item" : "items"} in your bag
            </p>
          </div>

          <Link to="/products" className="cart-continue-link">
            <ArrowLeft size={17} />
            Continue shopping
          </Link>
        </header>

        <div className="cart-benefit-strip">
          <div className="cart-benefit">
            <span className="cart-benefit-icon">
              <ShieldCheck size={18} />
            </span>

            <div>
              <strong>Checkout before ordering</strong>
              <span>Add or select your delivery address first</span>
            </div>
          </div>

          <div className="cart-benefit">
            <span className="cart-benefit-icon">
              <Truck size={18} />
            </span>

            <div>
              <strong>Delivery information</strong>
              <span>Choose your delivery address at checkout</span>
            </div>
          </div>

          <div className="cart-benefit">
            <span className="cart-benefit-icon">
              <CheckCircle2 size={18} />
            </span>

            <div>
              <strong>Order confirmation</strong>
              <span>Shown after successful order placement</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="cart-error" role="alert">
            <span>{error}</span>

            <button type="button" onClick={() => loadCart()}>
              Retry
            </button>
          </div>
        )}

        {items.length === 0 ? (
          <section className="cart-empty">
            <div className="cart-empty-icon">
              <ShoppingBag size={36} strokeWidth={1.6} />
            </div>

            <span className="cart-eyebrow">YOUR BAG IS EMPTY</span>

            <h2>Nothing in your cart yet.</h2>

            <p>
              Explore the collection and find something you love.
              Your next favourite item could be waiting for you.
            </p>

            <Link to="/products" className="cart-primary-button">
              Explore products
              <ArrowRight size={17} />
            </Link>

            <Link to="/" className="cart-back-home">
              Back to home
            </Link>
          </section>
        ) : (
          <div className="cart-layout">
            <section className="cart-items-panel">
              <div className="cart-panel-heading">
                <div>
                  <h2>Your items</h2>
                  <p>Review your products before checkout.</p>
                </div>

                <span className="cart-item-count">
                  {items.length}{" "}
                  {items.length === 1 ? "product" : "products"}
                </span>
              </div>

              <div className="cart-list-heading">
                <span>PRODUCT</span>
                <span>PRICE</span>
                <span>QUANTITY</span>
                <span>SUBTOTAL</span>
              </div>

              <div className="cart-item-list">
                {items.map((item) => {
                  const quantity = Number(item.quantity) || 0;
                  const price = Number(item.price) || 0;
                  const productId = String(item.productId);
                  const product = productLookup[productId];
                  const imageUrl = getProductImage(product);
                  const imageFailed = failedImages[productId];
                  const busy = busyProductId === item.productId;

                  return (
                    <article className="cart-item" key={productId}>
                      <div className="cart-product">
                        <Link
                          to={`/products/${item.productId}`}
                          className="cart-product-image"
                          aria-label={`View ${item.productName}`}
                        >
                          {imageUrl && !imageFailed ? (
                            <img
                              src={imageUrl}
                              alt={item.productName || "Product"}
                              loading="lazy"
                              onError={() =>
                                setFailedImages((previous) => ({
                                  ...previous,
                                  [productId]: true,
                                }))
                              }
                            />
                          ) : (
                            <ShoppingBag
                              size={30}
                              strokeWidth={1.4}
                              aria-hidden="true"
                            />
                          )}
                        </Link>

                        <div className="cart-product-details">
                          <Link
                            to={`/products/${item.productId}`}
                            className="cart-product-name"
                          >
                            {item.productName || "Product"}
                          </Link>

                          <span className="cart-product-id">
                            Product ID: {item.productId}
                          </span>

                          <span className="cart-product-status">
                            <CheckCircle2 size={13} />
                            Added to your bag
                          </span>

                          <button
                            type="button"
                            className="cart-remove-mobile"
                            disabled={busy || placingOrder}
                            onClick={() => removeItem(item.productId)}
                          >
                            <Trash2 size={14} />
                            Remove
                          </button>
                        </div>
                      </div>

                      <div className="cart-price">
                        <span className="cart-mobile-label">Price</span>
                        <span>{formatPrice(price)}</span>
                      </div>

                      <div className="cart-quantity">
                        <button
                          type="button"
                          aria-label={`Decrease ${item.productName} quantity`}
                          disabled={
                            busy || placingOrder || quantity <= 1
                          }
                          onClick={() => changeQuantity(item, -1)}
                        >
                          <Minus size={15} />
                        </button>

                        <span aria-live="polite">
                          {busy ? "…" : quantity}
                        </span>

                        <button
                          type="button"
                          aria-label={`Increase ${item.productName} quantity`}
                          disabled={busy || placingOrder}
                          onClick={() => changeQuantity(item, 1)}
                        >
                          <Plus size={15} />
                        </button>
                      </div>

                      <div className="cart-line-total">
                        <span className="cart-mobile-label">Subtotal</span>

                        <strong>{formatPrice(price * quantity)}</strong>

                        <button
                          type="button"
                          className="cart-remove-desktop"
                          aria-label={`Remove ${item.productName}`}
                          title="Remove product"
                          disabled={busy || placingOrder}
                          onClick={() => removeItem(item.productId)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>

              <Link to="/products" className="cart-bottom-continue">
                <ArrowLeft size={16} />
                Add more products
              </Link>
            </section>

            <aside className="cart-summary">
              <div className="cart-summary-header">
                <span className="cart-eyebrow">ORDER DETAILS</span>
                <h2>Price summary</h2>
              </div>

              <div className="cart-summary-row">
                <span>Products</span>
                <span>{items.length}</span>
              </div>

              <div className="cart-summary-row">
                <span>Quantity</span>
                <span>{totalUnits}</span>
              </div>

              <div className="cart-summary-row">
                <span>Subtotal</span>
                <strong>{formatPrice(subtotal)}</strong>
              </div>

              <div className="cart-summary-row cart-shipping-row">
                <span>Shipping</span>
                <span>Confirmed at checkout</span>
              </div>

              <div className="cart-summary-divider" />

              <div className="cart-summary-total">
                <div>
                  <span>Estimated total</span>
                  <small>Before any server-side adjustments</small>
                </div>

                <strong>{formatPrice(subtotal)}</strong>
              </div>

              <button
                type="button"
                className="cart-checkout-button"
                onClick={handlePlaceOrder}
                disabled={
                  placingOrder ||
                  items.length === 0 ||
                  busyProductId !== null
                }
              >
                {placingOrder ? (
                  <>
                    <span className="cart-button-spinner" />
                    Opening checkout...
                  </>
                ) : (
                  <>
                    Place Order
                    <ArrowRight size={18} />
                  </>
                )}
              </button>

              <p className="cart-summary-note">
                Your order is not placed from this page. Next, confirm your
                delivery address.
              </p>

              <div className="cart-summary-secure">
                <ShieldCheck size={17} />
                <span>Order details handled securely</span>
              </div>

              <div className="cart-summary-help">
                Need something else?
                <Link to="/products">Continue shopping</Link>
              </div>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}

export default CartPage;