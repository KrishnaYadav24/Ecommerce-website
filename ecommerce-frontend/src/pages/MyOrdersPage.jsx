
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock3,
  CreditCard,
  LoaderCircle,
  MapPin,
  Package,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  ShoppingBag,
  Truck,
  XCircle,
} from "lucide-react";

import api from "../services/api";
import "./MyOrdersPage.css";

function formatPrice(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);
}

function getDateTimestamp(value) {
  if (!value) return 0;

  let date;

  if (Array.isArray(value)) {
    const [year, month, day, hour = 0, minute = 0, second = 0] = value;

    date = new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute),
      Number(second)
    );
  } else {
    date = new Date(value);
  }

  const timestamp = date.getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function formatDate(value) {
  const timestamp = getDateTimestamp(value);

  if (!timestamp) return "Not available";

  return new Date(timestamp).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function normalizeStatus(status) {
  const value = String(status || "PENDING")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");

  if (value === "CANCELED" || value === "CANCELLED") {
    return "cancelled";
  }

  return value.toLowerCase();
}

function displayStatus(status) {
  return String(status || "PENDING")
    .replace(/[_-]+/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function extractOrders(payload) {
  const data = payload?.data ?? payload;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.orders)) return data.orders;
  if (Array.isArray(data?.content)) return data.content;

  return [];
}

function extractReturnRequests(payload) {
  const data = payload?.data ?? payload;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.returns)) return data.returns;
  if (Array.isArray(data?.returnRequests)) return data.returnRequests;
  if (Array.isArray(data?.content)) return data.content;

  return [];
}

function getOrderId(order) {
  return order?.orderId ?? order?.id;
}

function getOrderItems(order) {
  if (Array.isArray(order?.items)) return order.items;
  if (Array.isArray(order?.orderItems)) return order.orderItems;

  return [];
}

function getItemId(item) {
  return item?.orderItemId ?? item?.orderItemID ?? null;
}

function getItemName(item) {
  return (
    item?.productName ||
    item?.name ||
    (item?.productId != null ? `Product ${item.productId}` : "Product")
  );
}

function getItemQuantity(item) {
  return Math.max(0, Number(item?.quantity) || 0);
}

function getItemPrice(item) {
  return Number(item?.price) || 0;
}

function getOrderTotal(order) {
  const total = order?.totalAmount ?? order?.totalPrice ?? order?.total;

  if (total !== undefined && total !== null) {
    return Number(total) || 0;
  }

  return getOrderItems(order).reduce(
    (sum, item) => sum + getItemPrice(item) * getItemQuantity(item),
    0
  );
}

function getStatusProgress(status) {
  const progress = {
    pending: 0,
    confirmed: 1,
    shipped: 2,
    out_for_delivery: 2,
    delivered: 3,
  };

  return progress[normalizeStatus(status)] ?? -1;
}

function getAddressText(order) {
  return [
    order?.deliveryHouseAddress,
    order?.deliveryArea,
    order?.deliveryLandmark,
    order?.deliveryCity,
    order?.deliveryState,
    order?.deliveryPincode,
  ]
    .filter(Boolean)
    .join(", ");
}

function getErrorMessage(error, fallback) {
  const data = error?.response?.data;

  if (typeof data === "string" && data.trim()) {
    return data;
  }

  return (
    data?.message ||
    data?.detail ||
    data?.error ||
    error?.message ||
    fallback
  );
}

function hasActiveReturn(item, requests) {
  const itemId = getItemId(item);

  if (itemId == null) return false;

  return requests.some((request) => {
    const sameItem =
      String(request?.orderItemId) === String(itemId);

    const status = normalizeStatus(request?.returnStatus);

    return sameItem && status !== "rejected";
  });
}

function canReturnItem(item, requests) {
  return (
    getItemId(item) != null &&
    getItemQuantity(item) > 0 &&
    !hasActiveReturn(item, requests)
  );
}

const RETURN_REASONS = [
  "Product damaged or defective",
  "Wrong product delivered",
  "Product not as described",
  "Missing item or parts",
  "Quality issue",
  "Size or fit issue",
  "Changed my mind",
  "Other",
];

export default function MyOrdersPage() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [orders, setOrders] = useState([]);
  const [returnRequests, setReturnRequests] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [returnHistoryError, setReturnHistoryError] = useState("");

  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [busyOrderId, setBusyOrderId] = useState(null);

  const [paymentsByOrderId, setPaymentsByOrderId] = useState({});
  const [paymentErrors, setPaymentErrors] = useState({});
  const [loadingPaymentOrderId, setLoadingPaymentOrderId] = useState(null);

  const [returnModalOrder, setReturnModalOrder] = useState(null);
  const [returnForm, setReturnForm] = useState({
    orderItemId: "",
    quantity: 1,
    reason: "",
    details: "",
  });
  const [returnSubmitting, setReturnSubmitting] = useState(false);
  const [returnFormError, setReturnFormError] = useState("");

  const authConfig = useCallback(
    () => ({
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }),
    [token]
  );

  const redirectToLogin = useCallback(() => {
    navigate("/login", {
      replace: true,
      state: { from: "/orders" },
    });
  }, [navigate]);

  const loadOrders = useCallback(
    async ({ silent = false } = {}) => {
      if (!token) {
        redirectToLogin();
        return;
      }

      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      try {
        const [ordersResult, returnsResult] = await Promise.allSettled([
          api.get("/orders/my", authConfig()),
          api.get("/returns/my", authConfig()),
        ]);

        if (ordersResult.status === "rejected") {
          const requestError = ordersResult.reason;
          const status = requestError?.response?.status;

          if (status === 401 || status === 403) {
            redirectToLogin();
            return;
          }

          throw requestError;
        }

        const orderList = extractOrders(ordersResult.value.data);

        orderList.sort(
          (a, b) =>
            getDateTimestamp(b?.orderDate) -
            getDateTimestamp(a?.orderDate)
        );

        setOrders(orderList);

        if (returnsResult.status === "fulfilled") {
          setReturnRequests(
            extractReturnRequests(returnsResult.value.data)
          );
          setReturnHistoryError("");
        } else {
          const requestError = returnsResult.reason;

          if ([401, 403].includes(requestError?.response?.status)) {
            redirectToLogin();
            return;
          }

          console.error("Could not load return history:", requestError);
          setReturnRequests([]);
          setReturnHistoryError(
            getErrorMessage(
              requestError,
              "Return history could not be loaded. Refresh before requesting a return."
            )
          );
        }
      } catch (requestError) {
        setError(
          getErrorMessage(
            requestError,
            "Unable to load your orders. Please try again."
          )
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [authConfig, redirectToLogin, token]
  );

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  async function loadPaymentDetails(orderId, { force = false } = {}) {
    if (orderId == null || !token) return;

    const cacheKey = String(orderId);

    if (
      !force &&
      Object.prototype.hasOwnProperty.call(paymentsByOrderId, cacheKey)
    ) {
      return;
    }

    setLoadingPaymentOrderId(orderId);
    setPaymentErrors((previous) => ({ ...previous, [cacheKey]: "" }));

    try {
      const response = await api.get(
        `/payments/${orderId}`,
        authConfig()
      );

      const payment = response.data?.data ?? response.data;

      setPaymentsByOrderId((previous) => ({
        ...previous,
        [cacheKey]: payment,
      }));
    } catch (requestError) {
      const status = requestError?.response?.status;

      if (status === 401 || status === 403) {
        redirectToLogin();
        return;
      }

      setPaymentErrors((previous) => ({
        ...previous,
        [cacheKey]: getErrorMessage(
          requestError,
          "Payment details are currently unavailable."
        ),
      }));
    } finally {
      setLoadingPaymentOrderId(null);
    }
  }

  async function handleCancelOrder(order) {
    const orderId = getOrderId(order);
    const status = normalizeStatus(order.status);

    if (orderId == null) {
      setError("Order ID is missing. This order cannot be cancelled.");
      return;
    }

    if (!["pending", "confirmed"].includes(status)) {
      setError(
        "Only eligible pending orders or confirmed COD orders can be cancelled."
      );
      return;
    }

    if (!window.confirm(`Are you sure you want to cancel order #${orderId}?`)) {
      return;
    }

    setBusyOrderId(orderId);
    setError("");
    setNotice("");

    try {
      await api.delete(`/orders/${orderId}`, authConfig());

      setNotice(`Order #${orderId} was cancelled successfully.`);

      setPaymentsByOrderId((previous) => {
        const next = { ...previous };
        delete next[String(orderId)];
        return next;
      });

      await loadOrders({ silent: true });
    } catch (requestError) {
      const statusCode = requestError?.response?.status;

      if (statusCode === 401 || statusCode === 403) {
        redirectToLogin();
        return;
      }

      setError(
        getErrorMessage(
          requestError,
          "Unable to cancel this order. Please try again."
        )
      );
    } finally {
      setBusyOrderId(null);
    }
  }

  function toggleDetails(orderId) {
    const isExpanded = String(expandedOrderId) === String(orderId);

    setExpandedOrderId(isExpanded ? null : orderId);

    if (!isExpanded) {
      loadPaymentDetails(orderId);
    }
  }

  function openReturnModal(order) {
    if (returnHistoryError) {
      setError(
        "Return history is unavailable. Refresh your orders before requesting a return."
      );
      return;
    }

    if (normalizeStatus(order.status) !== "delivered") {
      setError("Returns can only be requested after delivery.");
      return;
    }

    const eligibleItems = getOrderItems(order).filter((item) =>
      canReturnItem(item, returnRequests)
    );

    if (eligibleItems.length === 0) {
      setError("No eligible items are available for a new return request.");
      return;
    }

    setError("");
    setNotice("");
    setReturnFormError("");
    setReturnModalOrder(order);

    setReturnForm({
      orderItemId: String(getItemId(eligibleItems[0])),
      quantity: 1,
      reason: "",
      details: "",
    });
  }

  async function handleSubmitReturn(event) {
    event.preventDefault();

    if (!returnModalOrder) return;

    if (returnHistoryError) {
      setReturnFormError(
        "Refresh your return history before submitting a request."
      );
      return;
    }

    if (normalizeStatus(returnModalOrder.status) !== "delivered") {
      setReturnFormError("Returns are only available for delivered orders.");
      return;
    }

    const eligibleItems = getOrderItems(returnModalOrder).filter((item) =>
      canReturnItem(item, returnRequests)
    );

    const selectedItem = eligibleItems.find(
      (item) => String(getItemId(item)) === String(returnForm.orderItemId)
    );

    if (!selectedItem) {
      setReturnFormError(
        "This product is no longer eligible for a return request. Refresh your orders."
      );
      return;
    }

    const quantity = Number(returnForm.quantity);

    if (
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > getItemQuantity(selectedItem)
    ) {
      setReturnFormError("Please select a valid return quantity.");
      return;
    }

    if (!returnForm.reason) {
      setReturnFormError("Please select a reason for the return.");
      return;
    }

    if (
      returnForm.reason === "Other" &&
      returnForm.details.trim().length < 5
    ) {
      setReturnFormError(
        "Please explain the reason in at least 5 characters."
      );
      return;
    }

    const details = returnForm.details.trim();
    const reason = details
      ? `${returnForm.reason} — ${details}`
      : returnForm.reason;

    setReturnSubmitting(true);
    setReturnFormError("");
    setError("");
    setNotice("");

    try {
      await api.post(
        "/returns",
        {
          orderItemId: Number(returnForm.orderItemId),
          quantity,
          reason,
        },
        authConfig()
      );

      const orderId = getOrderId(returnModalOrder);

      setReturnModalOrder(null);
      setNotice(
        `Return request submitted for order #${orderId}. Check its status below.`
      );

      await loadOrders({ silent: true });
    } catch (requestError) {
      const statusCode = requestError?.response?.status;

      if (statusCode === 401 || statusCode === 403) {
        redirectToLogin();
        return;
      }

      setReturnFormError(
        getErrorMessage(
          requestError,
          "Unable to submit the return request. Please try again."
        )
      );
    } finally {
      setReturnSubmitting(false);
    }
  }

  const totalSpent = orders.reduce(
    (total, order) => total + getOrderTotal(order),
    0
  );

  const activeOrders = orders.filter((order) => {
    const status = normalizeStatus(order.status);

    return ![
      "delivered",
      "cancelled",
      "returned",
      "refunded",
    ].includes(status);
  }).length;

  const deliveredOrders = orders.filter(
    (order) => normalizeStatus(order.status) === "delivered"
  ).length;

  if (loading) {
    return (
      <main className="my-orders-page">
        <div className="my-orders-container">
          <div className="orders-loading">
            <div className="orders-loader" />
            <h2>Loading your orders</h2>
            <p>Please wait while we retrieve your order history.</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="my-orders-page">
      <div className="my-orders-container">
        <Link to="/account" className="orders-back-link">
          <ArrowLeft size={16} />
          Back to your account
        </Link>

        <header className="orders-hero">
          <div className="orders-heading">
            <span className="orders-eyebrow">YOUR SHOPNOVA ACCOUNT</span>
            <h1>
              My Orders<span>.</span>
            </h1>
            <p>
              Track purchases, review payments, cancel eligible orders
              and request returns after delivery.
            </p>
          </div>

          <button
            type="button"
            className="orders-refresh-button"
            onClick={() => loadOrders({ silent: true })}
            disabled={refreshing}
          >
            <RefreshCw
              size={15}
              className={refreshing ? "orders-spinning" : ""}
            />
            {refreshing ? "Refreshing..." : "Refresh orders"}
          </button>
        </header>

        <section className="orders-stats">
          <div className="orders-stat-card">
            <div className="stat-icon stat-icon-dark">
              <Package size={21} />
            </div>
            <div>
              <span>Total orders</span>
              <strong>{orders.length}</strong>
            </div>
          </div>

          <div className="orders-stat-card">
            <div className="stat-icon stat-icon-gold">
              <Clock3 size={21} />
            </div>
            <div>
              <span>Active orders</span>
              <strong>{activeOrders}</strong>
            </div>
          </div>

          <div className="orders-stat-card">
            <div className="stat-icon stat-icon-green">
              <CheckCircle2 size={21} />
            </div>
            <div>
              <span>Delivered</span>
              <strong>{deliveredOrders}</strong>
            </div>
          </div>
        </section>

        {notice && (
          <div
            className="orders-notice orders-notice-success"
            role="status"
          >
            <CheckCircle2 size={18} />
            <span>{notice}</span>
            <button type="button" onClick={() => setNotice("")}>
              Dismiss
            </button>
          </div>
        )}

        {error && (
          <div
            className="orders-notice orders-notice-error"
            role="alert"
          >
            <XCircle size={18} />
            <span>{error}</span>
            <button type="button" onClick={() => loadOrders()}>
              Retry
            </button>
          </div>
        )}

        {returnHistoryError && (
          <div
            className="orders-notice orders-notice-error"
            role="alert"
          >
            <XCircle size={18} />
            <span>
              Return history is unavailable. New return requests are
              disabled until history can be loaded. {returnHistoryError}
            </span>
            <button
              type="button"
              onClick={() => loadOrders({ silent: true })}
              disabled={refreshing}
            >
              Retry
            </button>
          </div>
        )}

        <section className="orders-list">
          <div className="orders-list-heading">
            <div>
              <h2>Order history</h2>
              <p>
                {orders.length} {orders.length === 1 ? "order" : "orders"} in
                your account · Total order value {formatPrice(totalSpent)}
              </p>
            </div>

            <span className="orders-secure-label">
              <ShieldCheck size={14} />
              Secure account
            </span>
          </div>

          {orders.length === 0 ? (
            <div className="orders-empty">
              <div className="orders-empty-icon">
                <ShoppingBag size={33} strokeWidth={1.6} />
              </div>
              <span className="orders-eyebrow">YOUR PURCHASE HISTORY</span>
              <h2>No orders yet</h2>
              <p>
                Your orders will appear here after the backend successfully
                creates them.
              </p>
              <Link to="/products" className="orders-primary-button">
                Explore products
                <ArrowRight size={17} />
              </Link>
            </div>
          ) : (
            orders.map((order, index) => {
              const orderId = getOrderId(order);
              const cacheKey = String(orderId);
              const items = getOrderItems(order);
              const status = normalizeStatus(order.status);
              const progress = getStatusProgress(order.status);
              const expanded =
                String(expandedOrderId) === String(orderId);
              const payment = paymentsByOrderId[cacheKey];
              const paymentError = paymentErrors[cacheKey];
              const loadingThisPayment =
                String(loadingPaymentOrderId) === String(orderId);

              const orderReturnRequests = returnRequests.filter(
                (request) =>
                  String(request?.orderId) === String(orderId)
              );

              const canRequestReturn =
                !returnHistoryError &&
                status === "delivered" &&
                items.some((item) => canReturnItem(item, returnRequests));

              const canCancel =
                status === "pending" ||
                (status === "confirmed" &&
                  String(payment?.paymentMethod).toUpperCase() === "COD" &&
                  String(payment?.paymentStatus).toUpperCase() === "PENDING");

              return (
                <article
                  className="order-card"
                  key={orderId ?? index}
                  style={{
                    animationDelay: `${Math.min(index * 55, 330)}ms`,
                  }}
                >
                  <div className="order-card-top">
                    <div className="order-reference">
                      <span className="order-reference-label">
                        ORDER NUMBER
                      </span>
                      <strong>
                        {orderId != null ? `#${orderId}` : "Order"}
                      </strong>
                      <small>
                        <CalendarDays size={13} />
                        Placed on {formatDate(order.orderDate)}
                      </small>
                    </div>

                    <span className={`order-status ${status}`}>
                      <span className="order-status-dot" />
                      {displayStatus(order.status)}
                    </span>
                  </div>

                  <div className="order-card-main">
                    <div className="order-product-icon">
                      <ShoppingBag size={26} strokeWidth={1.5} />
                    </div>

                    <div className="order-product-summary">
                      <strong>
                        {items.length > 0
                          ? items.length === 1
                            ? getItemName(items[0])
                            : `${getItemName(items[0])} and ${
                                items.length - 1
                              } more`
                          : "Order items"}
                      </strong>
                      <span>
                        {items.reduce(
                          (sum, item) => sum + getItemQuantity(item),
                          0
                        )}{" "}
                        total items
                      </span>
                      <span>
                        Expected delivery: {formatDate(order.expectedDeliveryDate)}
                      </span>
                    </div>

                    <div className="order-total">
                      <span>ORDER TOTAL</span>
                      <strong>{formatPrice(getOrderTotal(order))}</strong>
                    </div>
                  </div>

                  {progress >= 0 && (
                    <div className="order-progress-wrap">
                      <div className="order-progress">
                        {[
                          "Order placed",
                          "Confirmed",
                          "Shipped",
                          "Delivered",
                        ].map((label, stepIndex) => {
                          const complete = stepIndex <= progress;

                          return (
                            <div
                              className={`progress-step ${
                                complete ? "is-complete" : ""
                              }`}
                              key={label}
                            >
                              <span className="progress-marker">
                                {complete ? (
                                  <CheckCircle2 size={15} />
                                ) : (
                                  stepIndex + 1
                                )}
                              </span>
                              <span>{label}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {status === "cancelled" && (
                    <div className="order-expanded-details">
                      <p className="order-no-items">
                        This order has been cancelled.
                      </p>
                    </div>
                  )}

                  {expanded && (
                    <div className="order-expanded-details">
                      <h3>Order details</h3>

                      {items.length ? (
                        <div className="order-items-list">
                          {items.map((item, itemIndex) => (
                            <div
                              className="order-item-row"
                              key={getItemId(item) ?? item.productId ?? itemIndex}
                            >
                              <div className="order-item-icon">
                                <ShoppingBag size={19} />
                              </div>

                              <div className="order-item-info">
                                <strong>{getItemName(item)}</strong>
                                {item.productId != null && (
                                  <span>Product ID: {item.productId}</span>
                                )}
                                <span>
                                  {formatPrice(getItemPrice(item))} ×{" "}
                                  {getItemQuantity(item)}
                                </span>
                              </div>

                              <strong className="order-item-price">
                                {formatPrice(
                                  getItemPrice(item) * getItemQuantity(item)
                                )}
                              </strong>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="order-no-items">
                          Item details are not available for this order.
                        </p>
                      )}

                      <section className="order-extra-panel">
                        <h4>
                          <CreditCard size={16} />
                          Payment information
                        </h4>

                        {loadingThisPayment ? (
                          <p>Loading payment details...</p>
                        ) : payment ? (
                          <div className="order-extra-grid">
                            <div>
                              <span>Payment method</span>
                              <strong>{payment.paymentMethod || "Not available"}</strong>
                            </div>
                            <div>
                              <span>Payment status</span>
                              <strong>{payment.paymentStatus || "Not available"}</strong>
                            </div>
                            <div>
                              <span>Payment ID</span>
                              <strong>{payment.paymentId ?? "Not available"}</strong>
                            </div>
                            <div>
                              <span>Payment date</span>
                              <strong>{formatDate(payment.paymentDate)}</strong>
                            </div>
                            <div>
                              <span>Recorded amount</span>
                              <strong>{formatPrice(payment.amount)}</strong>
                            </div>
                          </div>
                        ) : (
                          <div className="order-payment-unavailable">
                            <p>
                              {paymentError ||
                                "Payment details are not available for this order."}
                            </p>
                            {paymentError && (
                              <button
                                type="button"
                                onClick={() =>
                                  loadPaymentDetails(orderId, { force: true })
                                }
                                disabled={loadingThisPayment}
                              >
                                Try again
                              </button>
                            )}
                          </div>
                        )}
                      </section>

                      {getAddressText(order) ||
                      order.deliveryFullName ||
                      order.deliveryPhone ? (
                        <div className="order-delivery-info">
                          <div>
                            <span>
                              <MapPin size={14} />
                              Delivery address
                            </span>
                            <strong>{order.deliveryFullName || "Recipient"}</strong>
                            {getAddressText(order) && (
                              <strong>{getAddressText(order)}</strong>
                            )}
                            {order.deliveryPhone && (
                              <strong>{order.deliveryPhone}</strong>
                            )}
                            {order.deliveryEmail && (
                              <strong>{order.deliveryEmail}</strong>
                            )}
                          </div>

                          <div>
                            <span>
                              <Truck size={14} />
                              Delivery information
                            </span>
                            <strong>
                              Expected: {formatDate(order.expectedDeliveryDate)}
                            </strong>
                            {order.actualDeliveryDate && (
                              <strong>
                                Delivered: {formatDate(order.actualDeliveryDate)}
                              </strong>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="order-extra-panel">
                          <h4>
                            <MapPin size={16} />
                            Delivery address
                          </h4>
                          <p>
                            Delivery details were not included in the backend
                            response.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="order-card-actions">
                    <button
                      type="button"
                      className="order-details-button"
                      onClick={() => toggleDetails(orderId)}
                      aria-expanded={expanded}
                    >
                      {expanded ? (
                        <>
                          Hide details <ChevronUp size={16} />
                        </>
                      ) : (
                        <>
                          View order details <ChevronDown size={16} />
                        </>
                      )}
                    </button>

                    {canCancel && (
                      <button
                        type="button"
                        className="order-cancel-button"
                        disabled={busyOrderId === orderId}
                        onClick={() => handleCancelOrder(order)}
                      >
                        {busyOrderId === orderId ? (
                          <>
                            <LoaderCircle
                              size={15}
                              className="orders-spinning"
                            />
                            Cancelling...
                          </>
                        ) : (
                          <>
                            <XCircle size={15} />
                            Cancel order
                          </>
                        )}
                      </button>
                    )}

                    {status === "confirmed" && !canCancel && !payment && (
                      <button
                        type="button"
                        className="order-check-payment-button"
                        onClick={() => {
                          setExpandedOrderId(orderId);
                          loadPaymentDetails(orderId, { force: true });
                        }}
                      >
                        Check cancellation eligibility
                      </button>
                    )}

                    {canRequestReturn && (
                      <button
                        type="button"
                        className="order-return-button"
                        onClick={() => openReturnModal(order)}
                      >
                        <RotateCcw size={15} />
                        Return / Refund
                      </button>
                    )}
                  </div>

                  {orderReturnRequests.length > 0 && (
                    <div className="order-return-history">
                      <h3>Returns &amp; Refunds</h3>

                      {orderReturnRequests.map((request) => (
                        <div
                          className="order-return-history-item"
                          key={request.returnRequestId}
                        >
                          <div>
                            <strong>{request.productName || "Product"}</strong>
                            <span>
                              Return request #{request.returnRequestId}
                            </span>
                            <p>
                              <b>Reason:</b> {request.reason || "Not provided"}
                            </p>
                            <p>
                              <b>Quantity:</b> {request.quantity}
                            </p>
                            <p>
                              <b>Requested:</b> {formatDate(request.requestDate)}
                            </p>
                          </div>

                          <span
                            className={`order-return-status ${normalizeStatus(
                              request.returnStatus
                            )}`}
                          >
                            {displayStatus(request.returnStatus)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </article>
              );
            })
          )}
        </section>

        <div className="orders-help">
          <div className="orders-help-icon">
            <ShieldCheck size={17} />
          </div>
          <p>
            Cancellation and return requests are validated by the ShopNova
            backend. Refund completion in the current backend is simulated
            and does not transfer real money.
          </p>
          <Package size={20} className="orders-help-clock" />
        </div>

        <div style={{ marginTop: 20 }}>
          <Link to="/products" className="orders-back-link">
            <ArrowLeft size={15} />
            Continue shopping
          </Link>
        </div>
      </div>

      {returnModalOrder && (
        <div
          className="return-modal-backdrop"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !returnSubmitting
            ) {
              setReturnModalOrder(null);
            }
          }}
        >
          <section
            className="return-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="return-modal-title"
          >
            <div className="return-modal-heading">
              <div>
                <span className="orders-eyebrow">
                  SHOPNOVA AFTER-SALES SUPPORT
                </span>
                <h2 id="return-modal-title">Return / Refund Request</h2>
                <p>Order #{getOrderId(returnModalOrder)}</p>
              </div>

              <button
                type="button"
                className="return-modal-close"
                disabled={returnSubmitting}
                onClick={() => setReturnModalOrder(null)}
                aria-label="Close return form"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmitReturn}>
              <label htmlFor="return-item">Product to return</label>
              <select
                id="return-item"
                value={returnForm.orderItemId}
                onChange={(event) => {
                  setReturnForm((current) => ({
                    ...current,
                    orderItemId: event.target.value,
                    quantity: 1,
                  }));
                  setReturnFormError("");
                }}
                required
              >
                {getOrderItems(returnModalOrder)
                  .filter((item) => canReturnItem(item, returnRequests))
                  .map((item) => (
                    <option
                      key={getItemId(item)}
                      value={String(getItemId(item))}
                    >
                      {getItemName(item)} — purchased {getItemQuantity(item)}
                    </option>
                  ))}
              </select>

              <label htmlFor="return-quantity">Quantity to return</label>
              <select
                id="return-quantity"
                value={returnForm.quantity}
                onChange={(event) =>
                  setReturnForm((current) => ({
                    ...current,
                    quantity: Number(event.target.value),
                  }))
                }
                required
              >
                {Array.from(
                  {
                    length: getItemQuantity(
                      getOrderItems(returnModalOrder).find(
                        (item) =>
                          String(getItemId(item)) ===
                          String(returnForm.orderItemId)
                      )
                    ),
                  },
                  (_, index) => index + 1
                ).map((quantity) => (
                  <option key={quantity} value={quantity}>
                    {quantity}
                  </option>
                ))}
              </select>

              <label htmlFor="return-reason">Reason for return</label>
              <select
                id="return-reason"
                value={returnForm.reason}
                onChange={(event) => {
                  setReturnForm((current) => ({
                    ...current,
                    reason: event.target.value,
                  }));
                  setReturnFormError("");
                }}
                required
              >
                <option value="">Select a reason</option>
                {RETURN_REASONS.map((reason) => (
                  <option key={reason} value={reason}>
                    {reason}
                  </option>
                ))}
              </select>

              <label htmlFor="return-details">
                Additional details{" "}
                <span className="return-optional">(optional)</span>
              </label>
              <textarea
                id="return-details"
                rows={4}
                maxLength={500}
                value={returnForm.details}
                onChange={(event) =>
                  setReturnForm((current) => ({
                    ...current,
                    details: event.target.value,
                  }))
                }
                placeholder="Tell us what happened..."
              />

              <span className="return-character-count">
                {returnForm.details.length}/500 characters
              </span>

              {returnFormError && (
                <div
                  className="orders-notice orders-notice-error"
                  role="alert"
                >
                  <XCircle size={17} />
                  <span>{returnFormError}</span>
                </div>
              )}

              <p className="return-modal-note">
                Your request will be reviewed by ShopNova. Refund processing
                starts after approval. Returns are available only for
                delivered orders.
              </p>

              <div className="return-modal-actions">
                <button
                  type="button"
                  className="return-secondary-button"
                  disabled={returnSubmitting}
                  onClick={() => setReturnModalOrder(null)}
                >
                  Not now
                </button>

                <button
                  type="submit"
                  className="return-submit-button"
                  disabled={returnSubmitting || Boolean(returnHistoryError)}
                >
                  {returnSubmitting ? (
                    <>
                      <LoaderCircle
                        size={15}
                        className="orders-spinning"
                      />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <RotateCcw size={15} />
                      Submit request
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
