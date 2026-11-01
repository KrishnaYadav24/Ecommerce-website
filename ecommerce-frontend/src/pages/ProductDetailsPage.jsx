import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Minus,
  Plus,
  ShoppingBag,
  Zap,
  Truck,
  ShieldCheck,
  RefreshCw,
  PackageCheck,
  CheckCircle2,
  CalendarDays,
  AlertCircle,
  Package,
} from "lucide-react";
import api from "../services/api";
import "./ProductDetailsPage.css";

function money(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

function getProductImage(product) {
  return (
    product?.imageUrl ||
    product?.imageURL ||
    product?.productImageUrl ||
    product?.productImage ||
    product?.image ||
    ""
  );
}

function getCategoryName(product) {
  const category = product?.category || product?.categoryName;

  if (typeof category === "string") return category;

  return category?.name || category?.categoryName || "ShopNova Collection";
}

function ProductImage({ product }) {
  const [imageFailed, setImageFailed] = useState(false);
  const imageUrl = getProductImage(product);

  useEffect(() => {
    setImageFailed(false);
  }, [imageUrl]);

  return (
    <div className="detail-image-panel">
      {imageUrl && !imageFailed ? (
        <img
          className="detail-product-image"
          src={imageUrl}
          alt={product?.name || "ShopNova product"}
          onError={() => setImageFailed(true)}
        />
      ) : (
        <div className="detail-image-fallback detail-fallback-visible">
          <Package size={44} strokeWidth={1.3} />
          <span>SHOPNOVA</span>
          <small>Product image unavailable</small>
        </div>
      )}

      <span className="detail-image-label">
        SHOPNOVA <span>SELECT</span>
      </span>

      <span className="detail-image-id">
        PRODUCT #{product?.id}
      </span>
    </div>
  );
}

function Benefit({ icon: Icon, title, description }) {
  return (
    <div className="detail-benefit">
      <div className="detail-benefit-icon">
        <Icon size={19} strokeWidth={1.7} />
      </div>

      <div>
        <strong>{title}</strong>
        <p>{description}</p>
      </div>

      <ArrowUpRight className="detail-benefit-arrow" size={15} />
    </div>
  );
}

export default function ProductDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [addingToCart, setAddingToCart] = useState(false);
  const [buyingNow, setBuyingNow] = useState(false);
  const [message, setMessage] = useState("");
  const [orderId, setOrderId] = useState(null);
  const [orderSuccess, setOrderSuccess] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadProduct() {
      try {
        setLoading(true);
        setError("");
        setMessage("");
        setOrderId(null);
        setOrderSuccess(false);
        setProduct(null);
        setQuantity(1);

        const response = await api.get(
          `/displayproductbyid/${encodeURIComponent(id)}`
        );

        const data = response.data;
        const item = data?.data ?? data?.product ?? data;

        if (!item || item.id == null) {
          throw new Error("Product not found.");
        }

        if (active) {
          setProduct(item);
        }
      } catch (err) {
        if (active) {
          setError(
            err.message === "Product not found."
              ? err.message
              : err.response
                ? `Unable to load this product (HTTP ${err.response.status}).`
                : "Cannot connect to the backend. Make sure Spring Boot is running."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadProduct();

    return () => {
      active = false;
    };
  }, [id]);

  const stockValue = Number(product?.stock);
  const stock = Number.isFinite(stockValue)
    ? Math.max(0, stockValue)
    : 0;

  const available = stock > 0;
  const price = Number(product?.price ?? product?.sellingPrice ?? 0);
  const totalPrice = price * quantity;

  function decreaseQuantity() {
    setQuantity((current) => Math.max(1, current - 1));
  }

  function increaseQuantity() {
    setQuantity((current) => Math.min(stock, current + 1));
  }

  async function handleAddToCart() {
    setMessage("");
    setOrderId(null);
    setOrderSuccess(false);

    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");

    if (!token || !userId) {
      navigate("/login", {
        state: { from: `/products/${id}` },
      });
      return;
    }

    if (!available || quantity < 1 || quantity > stock) {
      setMessage("The selected quantity is not available.");
      return;
    }

    try {
      setAddingToCart(true);

      await api.post(
        "/addtocart",
        {
          userId: Number(userId),
          productId: Number(product.id),
          quantity: Number(quantity),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setMessage("Product added to your cart successfully.");
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        setMessage("Your session may have expired. Please log in again.");
      } else {
        setMessage(
          err.response?.data?.message ||
            (err.response
              ? `Could not add this product (HTTP ${err.response.status}).`
              : "Unable to connect to the server. Please try again.")
        );
      }
    } finally {
      setAddingToCart(false);
    }
  }

  async function handleBuyNow() {
    setMessage("");
    setOrderId(null);
    setOrderSuccess(false);

    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login", {
        state: { from: `/products/${id}` },
      });
      return;
    }

    if (!available || quantity < 1 || quantity > stock) {
      setMessage("The selected quantity is not available.");
      return;
    }

    try {
      setBuyingNow(true);

      const response = await api.post(
        "/orders/buy-now",
        {
          productId: Number(product.id),
          quantity: Number(quantity),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const createdOrderId =
        response.data?.orderId ?? response.data?.id ?? null;

      setOrderId(createdOrderId);
      setOrderSuccess(true);
      setMessage(
        createdOrderId != null
          ? `Your order was placed successfully. Order ID: ${createdOrderId}`
          : "Your order was placed successfully."
      );
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        setMessage("Your session may have expired. Please log in again.");
      } else {
        setMessage(
          err.response?.data?.message ||
            (err.response
              ? `Could not place your order (HTTP ${err.response.status}).`
              : "Unable to connect to the server. Please try again.")
        );
      }
    } finally {
      setBuyingNow(false);
    }
  }

  if (loading) {
    return (
      <main className="product-detail-page">
        <div className="detail-state" role="status">
          <div className="detail-loader" />
          <h1>Preparing your discovery</h1>
          <p>Loading product details...</p>
        </div>
      </main>
    );
  }

  if (error || !product) {
    return (
      <main className="product-detail-page">
        <div className="detail-state">
          <div className="detail-state-icon">
            <AlertCircle size={27} />
          </div>

          <span className="detail-eyebrow">SHOPNOVA COLLECTION</span>
          <h1>Product unavailable.</h1>
          <p>{error || "This product could not be found."}</p>

          <Link to="/products" className="detail-primary-button">
            <ArrowLeft size={16} />
            Back to Shop
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="product-detail-page">
      <div className="detail-breadcrumb">
        <Link to="/">Home</Link>
        <span>/</span>
        <Link to="/products">Shop All</Link>
        <span>/</span>
        <span className="detail-breadcrumb-current">
          {product.name}
        </span>
      </div>

      <Link to="/products" className="detail-back-link">
        <ArrowLeft size={16} />
        Back to collection
      </Link>

      <section className="product-detail-layout">
        {/* Product image */}

        <div className="detail-gallery">
          <ProductImage product={product} />

          <div className="detail-gallery-caption">
            <span>YOUR EVERYDAY, UPGRADED.</span>
            <span>NO. {product.id}</span>
          </div>
        </div>

        {/* Product information */}

        <div className="detail-product-info">
          <div className="detail-product-kicker">
            <span className="detail-category">
              {getCategoryName(product)}
            </span>

            <span className="detail-product-code">
              SKU #{product.id}
            </span>
          </div>

          <h1>{product.name || "ShopNova product"}</h1>

          <div className="detail-price-row">
            <p className="detail-price">{money(price)}</p>
            <span className="detail-price-tag">INR</span>
          </div>

          <p className="detail-tax-note">
            Inclusive of all applicable taxes.
          </p>

          <div className="detail-divider" />

          <div className="detail-stock">
            <span
              className={`detail-stock-dot ${
                available ? "is-available" : "is-unavailable"
              }`}
            />

            <div>
              <strong>
                {available
                  ? stock <= 5
                    ? `Only ${stock} left in stock`
                    : "Available for purchase"
                  : "Currently out of stock"}
              </strong>

              <span>
                {available
                  ? "Ready to be part of your everyday."
                  : "This product cannot be purchased right now."}
              </span>
            </div>
          </div>

          <div className="detail-description">
            <h2>About this product</h2>
            <p>
              {product.description ||
                "Discover this item from the ShopNova collection."}
            </p>
          </div>

          {product.mfd && (
            <div className="detail-mfd">
              <span>
                <CalendarDays size={15} />
                Manufacturing date
              </span>

              <strong>{String(product.mfd).slice(0, 10)}</strong>
            </div>
          )}

          {/* Quantity selector and add-to-cart */}

          <div className="detail-purchase">
            <div className="detail-quantity-label">
              <span>Quantity</span>
              <span>Max {stock}</span>
            </div>

            <div className="detail-quantity">
              <button
                type="button"
                onClick={decreaseQuantity}
                disabled={!available || quantity <= 1 || buyingNow}
                aria-label="Decrease quantity"
              >
                <Minus size={16} />
              </button>

              <span aria-live="polite">{quantity}</span>

              <button
                type="button"
                onClick={increaseQuantity}
                disabled={!available || quantity >= stock || buyingNow}
                aria-label="Increase quantity"
              >
                <Plus size={16} />
              </button>
            </div>

            <div className="detail-subtotal">
              <span>Subtotal</span>
              <strong>{money(totalPrice)}</strong>
            </div>

            <button
              type="button"
              className="detail-add-button"
              onClick={handleAddToCart}
              disabled={!available || addingToCart || buyingNow}
            >
              <ShoppingBag size={18} />
              {addingToCart
                ? "Adding to cart..."
                : available
                  ? "Add to Cart"
                  : "Out of Stock"}
            </button>
          </div>

          <button
            type="button"
            className="detail-buy-now-button"
            onClick={handleBuyNow}
            disabled={!available || buyingNow || addingToCart}
          >
            <Zap size={18} />
            {buyingNow
              ? "Placing order..."
              : available
                ? `Buy Now · ${money(totalPrice)}`
                : "Out of Stock"}
            {!buyingNow && available && <ArrowUpRight size={17} />}
          </button>

          {message && (
            <div
              className={`detail-feedback ${
                orderSuccess
                  ? "detail-feedback-success"
                  : "detail-feedback-error"
              }`}
              role="status"
            >
              <span className="detail-feedback-icon">
                {orderSuccess ? (
                  <CheckCircle2 size={18} />
                ) : (
                  <AlertCircle size={18} />
                )}
              </span>

              <div className="detail-feedback-content">
                <p>{message}</p>

                {orderSuccess && orderId != null && (
                  <p className="detail-order-reference">
                    Keep this reference: #{orderId}
                  </p>
                )}

                {orderSuccess && (
                  <div className="detail-feedback-links">
                    <Link to="/orders">
                      View my orders <ArrowRight size={14} />
                    </Link>

                    <Link to="/products">
                      Continue shopping <ArrowRight size={14} />
                    </Link>
                  </div>
                )}

                {!orderSuccess &&
                  message.includes("added to your cart") && (
                    <Link to="/cart" className="detail-feedback-link">
                      View cart <ArrowRight size={14} />
                    </Link>
                  )}

                {!orderSuccess &&
                  message.includes("log in again") && (
                    <Link to="/login" className="detail-feedback-link">
                      Log in <ArrowRight size={14} />
                    </Link>
                  )}
              </div>
            </div>
          )}

          {/* Purchase reassurance */}

          <div className="detail-benefits">
            <Benefit
              icon={Truck}
              title="Delivery information"
              description="Delivery dates are shown in your order details."
            />

            <Benefit
              icon={ShieldCheck}
              title="A straightforward shopping experience"
              description="Order information stays connected to your account."
            />

            <Benefit
              icon={RefreshCw}
              title="Returns information"
              description="Check the applicable return policy before ordering."
            />
          </div>

          <div className="detail-footer-note">
            <PackageCheck size={16} />
            <span>Thank you for shopping with ShopNova.</span>
          </div>
        </div>
      </section>
    </main>
  );
}