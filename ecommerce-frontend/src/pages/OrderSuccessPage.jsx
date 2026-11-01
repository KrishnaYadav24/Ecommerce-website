
import { Link, useLocation, Navigate } from "react-router-dom";
import {
  CheckCircle2,
  Package,
  ArrowRight,
  ShoppingBag,
  CalendarDays,
} from "lucide-react";
import "./OrderSuccessPage.css";

export default function OrderSuccessPage() {
  const location = useLocation();
  const order = location.state?.order;

  // Direct URL access without order confirmation.
  if (!order) {
    return <Navigate to="/orders" replace />;
  }

  const orderId = order.orderId ?? order.id;
  const totalAmount = Number(order.totalAmount || 0);
  const items = Array.isArray(order.items) ? order.items : [];

  const formatPrice = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(amount);

  const formatDate = (date) => {
    if (!date) return "To be confirmed";

    const parsedDate = new Date(date);
    if (Number.isNaN(parsedDate.getTime())) return "To be confirmed";

    return parsedDate.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <main className="order-success-page">
      <div className="order-success-container">
        <div className="success-breadcrumb">
          <Link to="/">Home</Link>
          <span>/</span>
          <span>Order Confirmation</span>
        </div>

        <section className="success-hero">
          <div className="success-icon">
            <CheckCircle2 size={42} strokeWidth={1.5} />
          </div>

          <p className="success-eyebrow">THANK YOU FOR YOUR ORDER</p>

          <h1>
            Order placed
            <br />
            successfully<span>.</span>
          </h1>

          <p className="success-description">
            Your order has been received. You can track its status anytime
            from your ShopNova account.
          </p>

          <div className="success-order-number">
            <span>ORDER NUMBER</span>
            <strong>#{orderId ?? "Unavailable"}</strong>
          </div>
        </section>

        <section className="success-details-card">
          <div className="success-card-heading">
            <div>
              <p className="success-eyebrow">ORDER SUMMARY</p>
              <h2>Your purchase</h2>
            </div>

            <span className="success-status">
              {order.status || "PENDING"}
            </span>
          </div>

          {items.length > 0 && (
            <div className="success-items">
              {items.map((item, index) => (
                <div
                  className="success-item"
                  key={item.id ?? item.productId ?? index}
                >
                  <div className="success-item-icon">
                    <ShoppingBag size={22} strokeWidth={1.4} />
                  </div>

                  <div className="success-item-info">
                    <strong>
                      {item.productName ||
                        item.name ||
                        `Product ${item.productId ?? ""}`}
                    </strong>
                    <span>Quantity: {item.quantity ?? 1}</span>
                  </div>

                  <strong className="success-item-price">
                    {formatPrice(
                      Number(item.price || 0) *
                        Number(item.quantity || 1)
                    )}
                  </strong>
                </div>
              ))}
            </div>
          )}

          <div className="success-summary-row">
            <span>Order date</span>
            <strong>
              {formatDate(order.orderDate || new Date().toISOString())}
            </strong>
          </div>

          <div className="success-summary-row">
            <span>Expected delivery</span>
            <strong>{formatDate(order.expectedDeliveryDate)}</strong>
          </div>

          <div className="success-total-row">
            <span>Total amount</span>
            <strong>{formatPrice(totalAmount)}</strong>
          </div>
        </section>

        <section className="success-next-step">
          <div className="success-next-icon">
            <Package size={24} strokeWidth={1.5} />
          </div>

          <div>
            <h3>What's next?</h3>
            <p>
              Visit My Orders to check your order status and see your
              purchase history.
            </p>
          </div>

          <CalendarDays size={21} className="success-next-decoration" />
        </section>

        <div className="success-actions">
          <Link to="/orders" className="success-primary-button">
            View My Orders <ArrowRight size={17} />
          </Link>

          <Link to="/products" className="success-secondary-button">
            Continue shopping
          </Link>
        </div>

        <p className="success-footer-note">
          Thank you for choosing ShopNova.
        </p>
      </div>
    </main>
  );
}
