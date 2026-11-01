
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../services/api";
import "./AdminOrders.css";

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);

const formatDate = (date) => {
  if (!date) return "—";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "—";

  return parsedDate.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const getErrorMessage = (error, fallback) => {
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
};

const extractList = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.content)) return data.content;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.data?.content)) return data.data.content;
  if (Array.isArray(data?.items)) return data.items;

  return [];
};

const getOrderId = (order) => order?.orderId ?? order?.id;

const getNextStatus = (status) => {
  if (status === "CONFIRMED") return "SHIPPED";
  if (status === "SHIPPED") return "DELIVERED";

  return null;
};

const orderStatusLabel = (status) =>
  ({
    PENDING: "Pending",
    CONFIRMED: "Confirmed",
    SHIPPED: "Shipped",
    DELIVERED: "Delivered",
    CANCELED: "Cancelled",
    CANCELLED: "Cancelled",
  })[status] || status || "Unknown";

const paymentMethodLabel = (method) =>
  ({
    COD: "Cash on Delivery",
    UPI: "UPI",
    CARD: "Card",
    NET_BANKING: "Net Banking",
  })[method] || method || "Unknown";

const paymentStatusLabel = (status) =>
  ({
    SUCCESS: "Paid / Collected",
    PENDING: "Payment Pending",
    PROCESSING: "Processing",
    FAILED: "Failed",
  })[status] || status || "Unknown";

const getPaymentStatusClass = (status) => {
  const safeStatus = String(status || "unknown").toLowerCase();

  return `payment-${safeStatus.replace(/[^a-z0-9-]/g, "")}`;
};

export default function AdminOrders() {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [payments, setPayments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [loadingOrderId, setLoadingOrderId] = useState(null);
  const [loadingPaymentOrderId, setLoadingPaymentOrderId] = useState(null);

  const [error, setError] = useState("");
  const [paymentError, setPaymentError] = useState("");
  const [notice, setNotice] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Fetch orders and payments independently so a payment API
  // failure does not hide the orders table.
  const fetchOrders = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);

    setError("");
    setPaymentError("");

    const token = localStorage.getItem("token");

    if (!token) {
      setOrders([]);
      setPayments([]);
      setError("Your session is missing. Please log in again.");

      if (showLoader) setLoading(false);
      return;
    }

    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };

    try {
      const [ordersResult, paymentsResult] = await Promise.allSettled([
        api.get("/admin/orders", config),
        api.get("/admin/payments", config),
      ]);

      if (ordersResult.status === "fulfilled") {
        setOrders(extractList(ordersResult.value.data));
      } else {
        console.error("Failed to fetch admin orders:", ordersResult.reason);
        setOrders([]);
        setError(
          getErrorMessage(
            ordersResult.reason,
            "Unable to load orders. Please try again."
          )
        );
      }

      if (paymentsResult.status === "fulfilled") {
        setPayments(extractList(paymentsResult.value.data));
      } else {
        console.error(
          "Failed to fetch admin payments:",
          paymentsResult.reason
        );

        setPayments([]);
        setPaymentError(
          getErrorMessage(
            paymentsResult.reason,
            "Payment details could not be loaded."
          )
        );
      }
    } catch (err) {
      console.error("Admin order page error:", err);
      setError(getErrorMessage(err, "Unable to load admin data."));
    } finally {
      if (showLoader) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Index payments by order ID for quick table lookup.
  const paymentsByOrderId = useMemo(() => {
    const result = new Map();

    payments.forEach((payment) => {
      if (payment?.orderId !== undefined && payment?.orderId !== null) {
        result.set(String(payment.orderId), payment);
      }
    });

    return result;
  }, [payments]);

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();

    return orders.filter((order) => {
      const orderId = getOrderId(order);
      const payment = paymentsByOrderId.get(String(orderId));

      const matchesStatus =
        statusFilter === "ALL" || order.status === statusFilter;

      const items = Array.isArray(order.items) ? order.items : [];

      const searchableText = [
        orderId,
        order.deliveryFullName,
        order.deliveryEmail,
        order.deliveryPhone,
        order.status,
        payment?.paymentMethod,
        payment?.paymentStatus,
        ...items.map((item) => item.productName),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return matchesStatus && searchableText.includes(query);
    });
  }, [orders, paymentsByOrderId, search, statusFilter]);

  const counts = useMemo(
    () => ({
      total: orders.length,
      pending: orders.filter((order) => order.status === "PENDING").length,
      confirmed: orders.filter((order) => order.status === "CONFIRMED").length,
      shipped: orders.filter((order) => order.status === "SHIPPED").length,
      delivered: orders.filter((order) => order.status === "DELIVERED").length,
    }),
    [orders]
  );

  // Update delivery status using the existing admin API.
  const updateOrderStatus = async (order) => {
    const orderId = getOrderId(order);
    const nextStatus = getNextStatus(order.status);

    if (!orderId || !nextStatus) return;

    const confirmed = window.confirm(
      `Update order #${orderId} from ${orderStatusLabel(
        order.status
      )} to ${orderStatusLabel(nextStatus)}?`
    );

    if (!confirmed) return;

    const token = localStorage.getItem("token");

    if (!token) {
      setError("Your session is missing. Please log in again.");
      return;
    }

    setLoadingOrderId(String(orderId));
    setError("");
    setNotice("");

    try {
      await api.put(
        `/admin/orders/${orderId}/status`,
        { status: nextStatus },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setNotice(
        `Order #${orderId} updated to ${orderStatusLabel(nextStatus)}.`
      );

      await fetchOrders(false);
    } catch (err) {
      console.error("Failed to update order status:", err);

      setError(
        getErrorMessage(
          err,
          "Unable to update order status. Please try again."
        )
      );
    } finally {
      setLoadingOrderId(null);
    }
  };

  // Record COD collection only after delivery and actual cash receipt.
  const collectCodPayment = async (order) => {
    const orderId = getOrderId(order);
    const payment = paymentsByOrderId.get(String(orderId));

    if (!orderId || !payment) return;

    if (
      order.status !== "DELIVERED" ||
      payment.paymentMethod !== "COD" ||
      payment.paymentStatus !== "PENDING"
    ) {
      setError(
        "COD can only be collected for a delivered order with pending COD payment."
      );
      return;
    }

    const confirmed = window.confirm(
      `Confirm that cash of ${formatCurrency(
        payment.amount
      )} has actually been received for order #${orderId}?`
    );

    if (!confirmed) return;

    const token = localStorage.getItem("token");

    if (!token) {
      setError("Your session is missing. Please log in again.");
      return;
    }

    setLoadingPaymentOrderId(String(orderId));
    setError("");
    setPaymentError("");
    setNotice("");

    try {
      await api.patch(
        `/admin/payments/${orderId}/cod-collection`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setNotice(
        `COD payment for order #${orderId} marked as collected.`
      );

      await fetchOrders(false);
    } catch (err) {
      console.error("Failed to record COD collection:", err);

      setError(
        getErrorMessage(
          err,
          "Unable to record COD collection. Please verify the order and payment status."
        )
      );
    } finally {
      setLoadingPaymentOrderId(null);
    }
  };

  return (
    <main className="admin-orders-page">
      <header className="orders-header">
        <div>
          <p className="orders-eyebrow">SHOPNOVA ADMINISTRATION</p>
          <h1>Order Management</h1>
          <p className="orders-subtitle">
            Manage orders, delivery progress and recorded payments.
          </p>
        </div>

        <div className="orders-header-actions">
          <button
            type="button"
            className="orders-btn orders-btn-light"
            onClick={() => navigate("/admin")}
          >
            Back to Dashboard
          </button>

          <button
            type="button"
            className="orders-btn orders-btn-primary"
            onClick={() => fetchOrders()}
            disabled={loading}
          >
            {loading ? "Refreshing..." : "Refresh Data"}
          </button>
        </div>
      </header>

      <section className="orders-stats">
        <div className="orders-stat-card">
          <span>Total Orders</span>
          <strong>{counts.total}</strong>
        </div>

        <div className="orders-stat-card">
          <span>Pending Orders</span>
          <strong>{counts.pending}</strong>
        </div>

        <div className="orders-stat-card">
          <span>Confirmed</span>
          <strong>{counts.confirmed}</strong>
        </div>

        <div className="orders-stat-card">
          <span>Shipped</span>
          <strong>{counts.shipped}</strong>
        </div>

        <div className="orders-stat-card">
          <span>Delivered</span>
          <strong>{counts.delivered}</strong>
        </div>
      </section>

      {error && (
        <div className="orders-alert orders-alert-error" role="alert">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => fetchOrders()}
            disabled={loading}
          >
            Retry
          </button>
        </div>
      )}

      {paymentError && (
        <div className="orders-alert orders-alert-info" role="alert">
          <span>
            Payment data is unavailable: {paymentError}
          </span>
          <button
            type="button"
            onClick={() => fetchOrders()}
            disabled={loading}
          >
            Retry
          </button>
        </div>
      )}

      {notice && (
        <div className="orders-alert orders-alert-success" role="status">
          {notice}
        </div>
      )}

      <section className="orders-content">
        <div className="orders-toolbar">
          <div>
            <h2>All Orders</h2>
            <p>{filteredOrders.length} order(s) found</p>
          </div>

          <div className="orders-filters">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search order, customer, product or payment..."
              aria-label="Search orders"
            />

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              aria-label="Filter by order status"
            >
              <option value="ALL">All statuses</option>
              <option value="PENDING">Pending</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="SHIPPED">Shipped</option>
              <option value="DELIVERED">Delivered</option>
              <option value="CANCELED">Cancelled</option>
              <option value="CANCELLED">Cancelled (legacy)</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="orders-state">Loading orders and payments...</div>
        ) : error && orders.length === 0 ? (
          <div className="orders-state">
            <h3>Orders could not be loaded</h3>
            <p>Check the error above and try again.</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="orders-state">
            <h3>No orders found</h3>
            <p>Try another search or status filter.</p>
          </div>
        ) : (
          <div className="orders-table-wrapper">
            <table className="orders-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer / Delivery</th>
                  <th>Products</th>
                  <th>Order Date</th>
                  <th>Total</th>
                  <th>Order Status</th>
                  <th>Payment Method</th>
                  <th>Payment Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredOrders.map((order) => {
                  const orderId = getOrderId(order);
                  const items = Array.isArray(order.items) ? order.items : [];
                  const nextStatus = getNextStatus(order.status);

                  const payment = paymentsByOrderId.get(String(orderId));
                  const isUpdating =
                    loadingOrderId === String(orderId);
                  const isCollecting =
                    loadingPaymentOrderId === String(orderId);

                  const canCollectCod =
                    !paymentError &&
                    order.status === "DELIVERED" &&
                    payment?.paymentMethod === "COD" &&
                    payment?.paymentStatus === "PENDING";

                  return (
                    <tr key={orderId}>
                      <td>
                        <strong>#{orderId}</strong>
                      </td>

                      <td>
                        <div className="orders-customer">
                          <strong>
                            {order.deliveryFullName ||
                              "Customer details unavailable"}
                          </strong>
                          <span>{order.deliveryEmail || "—"}</span>
                          <span>{order.deliveryPhone || "—"}</span>

                          {order.deliveryHouseAddress && (
                            <span>{order.deliveryHouseAddress}</span>
                          )}

                          {order.deliveryArea && (
                            <span>{order.deliveryArea}</span>
                          )}

                          {(order.deliveryCity || order.deliveryState) && (
                            <span>
                              {order.deliveryCity || ""}
                              {order.deliveryCity && order.deliveryState
                                ? `, ${order.deliveryState}`
                                : order.deliveryState || ""}
                            </span>
                          )}

                          {order.deliveryPincode && (
                            <span>PIN: {order.deliveryPincode}</span>
                          )}
                        </div>
                      </td>

                      <td>
                        <details className="orders-product-details">
                          <summary>
                            {items.length} item(s)
                            {items.length > 0 &&
                              ` · ${items[0].productName || "Product"}`}
                            {items.length > 1 && " + more"}
                          </summary>

                          <div className="orders-item-list">
                            {items.map((item, index) => (
                              <div
                                className="orders-item"
                                key={`${item.productId ?? "product"}-${index}`}
                              >
                                <div>
                                  <strong>
                                    {item.productName || "Product"}
                                  </strong>
                                  <span>Qty: {item.quantity ?? 0}</span>
                                </div>

                                <span>
                                  {formatCurrency(
                                    (Number(item.price) || 0) *
                                      (Number(item.quantity) || 0)
                                  )}
                                </span>
                              </div>
                            ))}
                          </div>
                        </details>
                      </td>

                      <td>{formatDate(order.orderDate)}</td>

                      <td className="orders-amount">
                        {formatCurrency(order.totalAmount)}
                      </td>

                      <td>
                        <span
                          className={`orders-status status-${String(
                            order.status || "unknown"
                          ).toLowerCase()}`}
                        >
                          {orderStatusLabel(order.status)}
                        </span>
                      </td>

                      <td>
                        <div className="orders-payment-info">
                          {paymentError ? (
                            <span className="orders-payment-muted">
                              Unavailable
                            </span>
                          ) : payment ? (
                            <>
                              <strong>
                                {paymentMethodLabel(payment.paymentMethod)}
                              </strong>
                              <span>
                                {formatCurrency(payment.amount)}
                              </span>
                            </>
                          ) : (
                            <span className="orders-payment-muted">
                              Not recorded
                            </span>
                          )}
                        </div>
                      </td>

                      <td>
                        <div className="orders-payment-info">
                          {paymentError ? (
                            <span className="orders-payment-muted">
                              Unavailable
                            </span>
                          ) : payment ? (
                            <>
                              <span
                                className={`orders-payment-badge ${getPaymentStatusClass(
                                  payment.paymentStatus
                                )}`}
                              >
                                {paymentStatusLabel(payment.paymentStatus)}
                              </span>

                              {payment.paymentDate && (
                                <small className="orders-payment-date">
                                  {formatDate(payment.paymentDate)}
                                </small>
                              )}
                            </>
                          ) : (
                            <span className="orders-payment-badge payment-unknown">
                              Not recorded
                            </span>
                          )}
                        </div>
                      </td>

                      <td>
                        <div className="orders-row-actions">
                          {nextStatus ? (
                            <button
                              type="button"
                              className="orders-btn orders-btn-primary orders-action-btn"
                              onClick={() => updateOrderStatus(order)}
                              disabled={
                                loadingOrderId !== null ||
                                loadingPaymentOrderId !== null
                              }
                            >
                              {isUpdating
                                ? "Updating..."
                                : nextStatus === "SHIPPED"
                                  ? "Mark Shipped"
                                  : "Mark Delivered"}
                            </button>
                          ) : order.status === "PENDING" ? (
                            <span className="orders-action-hint">
                              Payment confirmation required
                            </span>
                          ) : (
                            <span className="orders-action-hint">
                              No delivery action
                            </span>
                          )}

                          {canCollectCod && (
                            <button
                              type="button"
                              className="orders-btn orders-btn-cod orders-action-btn"
                              onClick={() => collectCodPayment(order)}
                              disabled={
                                loadingPaymentOrderId !== null ||
                                loadingOrderId !== null
                              }
                            >
                              {isCollecting
                                ? "Recording..."
                                : "Collect COD"}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="orders-footer-note">
        Payment statuses are taken from recorded payment data. COD should only
        be marked collected after cash has actually been received. Pending
        orders must follow the payment workflow before shipping.
      </p>
    </main>
  );
}
