import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  LayoutDashboard,
  LoaderCircle,
  Package,
  RefreshCw,
  RotateCcw,
  ShoppingCart,
  TrendingUp,
  Truck,
  XCircle,
} from "lucide-react";

import api from "../services/api";
import "./AdminDashboard.css";

const EMPTY_DASHBOARD = {
  sales: null,
  orders: null,
  inventory: null,
  returns: null,
  delivery: null,
  bestSelling: [],
};

function money(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

function number(value) {
  return Number(value || 0).toLocaleString("en-IN");
}

function localDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getErrorMessage(error) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.detail ||
    error?.response?.data?.error ||
    error?.message ||
    "Unable to load this report."
  );
}

function unwrapList(payload) {
  const data = payload?.data ?? payload;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.content)) return data.content;
  if (Array.isArray(data?.products)) return data.products;

  return [];
}

function MetricCard({
  title,
  value,
  description,
  icon: Icon,
  tone = "blue",
  loading,
  error,
}) {
  return (
    <article className={`admin-metric-card tone-${tone}`}>
      <div className="admin-metric-top">
        <span className="admin-metric-title">{title}</span>

        <span className="admin-metric-icon">
          <Icon size={20} />
        </span>
      </div>

      <div className="admin-metric-value">
        {loading ? (
          <LoaderCircle className="admin-inline-loader" size={21} />
        ) : error ? (
          "—"
        ) : (
          value
        )}
      </div>

      <div className="admin-metric-description">
        {error ? "Report unavailable" : description}
      </div>
    </article>
  );
}

function StatusItem({ label, value, tone = "neutral" }) {
  return (
    <div className="admin-status-item">
      <span className="admin-status-dot-wrap">
        <span className={`admin-status-dot status-${tone}`} />
        <span>{label}</span>
      </span>

      <strong>{number(value)}</strong>
    </div>
  );
}

function SectionHeading({ eyebrow, title, description, action }) {
  return (
    <div className="admin-section-heading">
      <div>
        <span className="admin-eyebrow">{eyebrow}</span>
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>

      {action}
    </div>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [dashboard, setDashboard] = useState(EMPTY_DASHBOARD);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errors, setErrors] = useState({});
  const [authError, setAuthError] = useState("");

  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 6);
    return localDateString(date);
  });

  const [endDate, setEndDate] = useState(() =>
    localDateString(new Date())
  );

  const [dateReport, setDateReport] = useState(null);
  const [dateReportError, setDateReportError] = useState("");
  const [dateReportLoading, setDateReportLoading] = useState(false);

  // Load all dashboard reports
  const loadDashboard = useCallback(async () => {
    if (!token) {
      setAuthError(
        "Please log in with an admin account to view this dashboard."
      );
      setLoading(false);
      setRefreshing(false);
      return;
    }

    setLoading(true);
    setRefreshing(true);
    setAuthError("");
    setErrors({});

    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };

    const requests = [
      ["sales", "/admin/reports/sales"],
      ["orders", "/admin/reports/orders/analytics"],
      ["inventory", "/admin/reports/inventory"],
      ["returns", "/admin/reports/returns-refunds"],
      ["delivery", "/admin/reports/delivery"],
      ["bestSelling", "/admin/reports/best-selling-products"],
    ];

    try {
      const results = await Promise.allSettled(
        requests.map(([, endpoint]) => api.get(endpoint, config))
      );

      const nextDashboard = { ...EMPTY_DASHBOARD };
      const nextErrors = {};
      let hasAuthError = false;

      results.forEach((result, index) => {
        const [key] = requests[index];

        if (result.status === "fulfilled") {
          const payload =
            result.value?.data?.data ?? result.value?.data;

          if (key === "bestSelling") {
            nextDashboard.bestSelling = unwrapList(payload);
          } else {
            nextDashboard[key] = payload;
          }
        } else {
          const error = result.reason;

          nextErrors[key] = getErrorMessage(error);

          if ([401, 403].includes(error?.response?.status)) {
            hasAuthError = true;
          }

          console.error(`Admin report "${key}" failed:`, error);
        }
      });

      setDashboard(nextDashboard);
      setErrors(nextErrors);

      if (hasAuthError) {
        setAuthError(
          "Admin reports were denied. Please sign in with an account that has ADMIN access."
        );
      }
    } catch (error) {
      setAuthError(getErrorMessage(error));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // Date-wise sales report
  async function loadDateWiseReport(event) {
    event.preventDefault();

    if (!token) {
      setDateReportError("Please log in first.");
      return;
    }

    if (!startDate || !endDate) {
      setDateReportError("Select both start date and end date.");
      return;
    }

    if (startDate > endDate) {
      setDateReportError("Start date cannot be after end date.");
      return;
    }

    setDateReportLoading(true);
    setDateReportError("");
    setDateReport(null);

    try {
      const response = await api.get(
        "/admin/reports/sales/date-range",
        {
          params: {
            startDate,
            endDate,
          },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setDateReport(response.data?.data ?? response.data);
    } catch (error) {
      setDateReportError(getErrorMessage(error));
    } finally {
      setDateReportLoading(false);
    }
  }

  const sales = dashboard.sales;
  const orders = dashboard.orders;
  const inventory = dashboard.inventory;
  const returns = dashboard.returns;
  const delivery = dashboard.delivery;
  const bestSelling = dashboard.bestSelling;

  const inventoryHasError = Boolean(errors.inventory);
  const orderHasError = Boolean(errors.orders);
  const returnsHasError = Boolean(errors.returns);
  const deliveryHasError = Boolean(errors.delivery);
  const salesHasError = Boolean(errors.sales);
  const bestSellingHasError = Boolean(errors.bestSelling);

  return (
    <main className="admin-dashboard-page">
      {/* Top navigation */}
      <header className="admin-topbar">
        <div className="admin-brand">
          <div className="admin-brand-mark">S</div>

          <div>
            <strong>ShopNova</strong>
            <span>ADMIN CONSOLE</span>
          </div>
        </div>

        <div className="admin-topbar-right">
          <span className="admin-live-indicator">
            <span />
            Store overview
          </span>

          <button
            type="button"
            className="admin-refresh-button"
            onClick={loadDashboard}
            disabled={refreshing}
          >
            <RefreshCw
              size={16}
              className={refreshing ? "admin-spin" : ""}
            />

            <span>
              {refreshing ? "Refreshing" : "Refresh data"}
            </span>
          </button>
        </div>
      </header>

      <div className="admin-dashboard-layout">
        {/* Sidebar */}
        <aside className="admin-sidebar">
          <div className="admin-sidebar-label">WORKSPACE</div>

          <a className="admin-nav-link active" href="#admin-overview">
            <LayoutDashboard size={18} />
            Dashboard
          </a>

          <a className="admin-nav-link" href="#admin-orders">
            <ShoppingCart size={18} />
            Order analytics
          </a>

          {/* NEW: Open the full Orders Management page */}
          <a
            className="admin-nav-link"
            href="/admin/orders"
            onClick={(event) => {
              event.preventDefault();
              navigate("/admin/orders");
            }}
          >
            <ShoppingCart size={18} />
            Manage orders
          </a>

          <a className="admin-nav-link" href="#admin-inventory">
            <Package size={18} />
            Inventory
          </a>

          <a className="admin-nav-link" href="#admin-returns">
            <RotateCcw size={18} />
            Returns & refunds
          </a>

          <a className="admin-nav-link" href="#admin-delivery">
            <Truck size={18} />
            Delivery
          </a>

          <a className="admin-nav-link" href="#admin-reports">
            <Activity size={18} />
            Sales reports
          </a>

          <div className="admin-sidebar-bottom">
            <div className="admin-sidebar-bottom-icon">
              <CheckCircle2 size={17} />
            </div>

            <div>
              <strong>Live backend reports</strong>
              <p>
                Numbers are fetched from your Spring Boot services.
              </p>
            </div>
          </div>
        </aside>

        {/* Dashboard content */}
        <section
          className="admin-dashboard-content"
          id="admin-overview"
        >
          <div className="admin-page-heading">
            <div>
              <div className="admin-breadcrumb">
                Workspace <span>/</span> Dashboard
              </div>

              <h1>Good to see you, Admin.</h1>

              <p>
                Here’s what’s happening across your ShopNova store.
              </p>
            </div>

            <div className="admin-date-chip">
              <CalendarDays size={16} />

              {new Date().toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </div>
          </div>

          {authError && (
            <div className="admin-alert admin-alert-warning">
              <AlertTriangle size={19} />

              <div>
                <strong>Admin access notice</strong>
                <p>{authError}</p>
              </div>

              {!token && (
                <button
                  type="button"
                  onClick={() =>
                    navigate("/login", {
                      state: { from: "/admin" },
                    })
                  }
                >
                  Go to login
                </button>
              )}
            </div>
          )}

          {Object.keys(errors).length > 0 && (
            <div className="admin-alert admin-alert-info">
              <AlertTriangle size={18} />

              <div>
                <strong>Some reports could not be loaded</strong>
                <p>
                  The dashboard is showing data from successful requests.
                  Check the failed endpoint in the browser Network tab.
                </p>
              </div>
            </div>
          )}

          {/* Main metrics */}
          <SectionHeading
            eyebrow="STORE PERFORMANCE"
            title="Business overview"
            description="A snapshot of revenue, orders and customer returns."
          />

          <div className="admin-metrics-grid">
            <MetricCard
              title="Total revenue"
              value={money(sales?.totalRevenue)}
              description={
                salesHasError
                  ? "Sales report unavailable"
                  : `${number(sales?.successfulPayments)} successful payments`
              }
              icon={CircleDollarSign}
              tone="green"
              loading={loading && !sales}
              error={salesHasError}
            />

            <MetricCard
              title="Net revenue"
              value={money(sales?.netRevenue)}
              description="Revenue less successful refunds"
              icon={TrendingUp}
              tone="blue"
              loading={loading && !sales}
              error={salesHasError}
            />

            <MetricCard
              title="Total orders"
              value={number(orders?.totalOrders)}
              description={
                orderHasError
                  ? "Order report unavailable"
                  : `${number(orders?.pendingOrders)} pending orders`
              }
              icon={ShoppingCart}
              tone="purple"
              loading={loading && !orders}
              error={orderHasError}
            />

            <MetricCard
              title="Delivered orders"
              value={number(orders?.deliveredOrders)}
              description="Orders marked as delivered"
              icon={Truck}
              tone="orange"
              loading={loading && !orders}
              error={orderHasError}
            />

            <MetricCard
              title="Requested returns"
              value={number(returns?.requestedReturns)}
              description={
                returnsHasError
                  ? "Returns report unavailable"
                  : `${number(returns?.pendingRefunds)} pending refunds`
              }
              icon={RotateCcw}
              tone="rose"
              loading={loading && !returns}
              error={returnsHasError}
            />
          </div>

          {/* Order analytics and inventory */}
          <div className="admin-dashboard-grid">
            <section className="admin-panel" id="admin-orders">
              <SectionHeading
                eyebrow="ORDER MANAGEMENT"
                title="Order analytics"
                description="Current order status distribution."
                action={
                  <button
                    type="button"
                    className="admin-primary-button"
                    onClick={() => navigate("/admin/orders")}
                  >
                    Manage Orders →
                  </button>
                }
              />

              {orderHasError ? (
                <p className="admin-inline-error">{errors.orders}</p>
              ) : (
                <div className="admin-status-list">
                  <StatusItem
                    label="Pending"
                    value={orders?.pendingOrders}
                    tone="warning"
                  />

                  <StatusItem
                    label="Confirmed"
                    value={orders?.confirmedOrders}
                    tone="info"
                  />

                  <StatusItem
                    label="Shipped"
                    value={orders?.shippedOrders}
                    tone="purple"
                  />

                  <StatusItem
                    label="Delivered"
                    value={orders?.deliveredOrders}
                    tone="success"
                  />

                  <StatusItem
                    label="Cancelled"
                    value={orders?.cancelledOrders}
                    tone="danger"
                  />
                </div>
              )}

              <div className="admin-panel-foot">
                <Package size={17} />
                <span>
                  Order status totals are provided by the backend analytics
                  service.
                </span>
              </div>
            </section>

            <section className="admin-panel" id="admin-inventory">
              <SectionHeading
                eyebrow="STOCK HEALTH"
                title="Inventory alerts"
                description="Products that may need replenishment."
              />

              {inventoryHasError ? (
                <p className="admin-inline-error">
                  {errors.inventory}
                </p>
              ) : (
                <>
                  <div className="admin-inventory-summary">
                    <div className="admin-inventory-total">
                      <span>Total products</span>
                      <strong>
                        {number(inventory?.totalProducts)}
                      </strong>
                    </div>

                    <div className="admin-inventory-stat out">
                      <XCircle size={19} />

                      <div>
                        <span>Out of stock</span>
                        <strong>
                          {number(inventory?.outOfStockCount)}
                        </strong>
                      </div>
                    </div>

                    <div className="admin-inventory-stat low">
                      <AlertTriangle size={19} />

                      <div>
                        <span>Low stock (1–10)</span>
                        <strong>
                          {number(inventory?.lowStockCount)}
                        </strong>
                      </div>
                    </div>
                  </div>

                  <div className="admin-stock-lists">
                    <div>
                      <h3>Out of stock</h3>

                      {inventory?.outOfStockProducts?.length ? (
                        inventory.outOfStockProducts
                          .slice(0, 4)
                          .map((product, index) => (
                            <div
                              className="admin-stock-row"
                              key={product.id ?? `out-${index}`}
                            >
                              <span>
                                {product.name ||
                                  product.productName ||
                                  `Product ${product.id ?? ""}`}
                              </span>

                              <strong className="stock-zero">
                                0 left
                              </strong>
                            </div>
                          ))
                      ) : (
                        <p className="admin-empty-note">
                          No out-of-stock products.
                        </p>
                      )}
                    </div>

                    <div>
                      <h3>Low stock</h3>

                      {inventory?.lowStockProducts?.length ? (
                        inventory.lowStockProducts
                          .slice(0, 4)
                          .map((product, index) => (
                            <div
                              className="admin-stock-row"
                              key={product.id ?? `low-${index}`}
                            >
                              <span>
                                {product.name ||
                                  product.productName ||
                                  `Product ${product.id ?? ""}`}
                              </span>

                              <strong className="stock-low">
                                {number(product.stock)} left
                              </strong>
                            </div>
                          ))
                      ) : (
                        <p className="admin-empty-note">
                          No low-stock products.
                        </p>
                      )}
                    </div>
                  </div>
                </>
              )}
            </section>
          </div>

          {/* Returns and delivery */}
          <div className="admin-dashboard-grid">
            <section className="admin-panel" id="admin-returns">
              <SectionHeading
                eyebrow="AFTER-SALES"
                title="Returns & refunds"
                description="Request and refund status counts."
              />

              {returnsHasError ? (
                <p className="admin-inline-error">{errors.returns}</p>
              ) : (
                <>
                  <h3 className="admin-subsection-title">
                    Return requests
                  </h3>

                  <div className="admin-mini-grid">
                    <div>
                      <span>Requested</span>
                      <strong>
                        {number(returns?.requestedReturns)}
                      </strong>
                    </div>

                    <div>
                      <span>Approved</span>
                      <strong>
                        {number(returns?.approvedReturns)}
                      </strong>
                    </div>

                    <div>
                      <span>Rejected</span>
                      <strong>
                        {number(returns?.rejectedReturns)}
                      </strong>
                    </div>

                    <div>
                      <span>Received</span>
                      <strong>
                        {number(returns?.receivedReturns)}
                      </strong>
                    </div>

                    <div>
                      <span>Completed</span>
                      <strong>
                        {number(returns?.completedReturns)}
                      </strong>
                    </div>
                  </div>

                  <h3 className="admin-subsection-title admin-spaced-title">
                    Refund processing
                  </h3>

                  <div className="admin-status-list">
                    <StatusItem
                      label="Pending"
                      value={returns?.pendingRefunds}
                      tone="warning"
                    />

                    <StatusItem
                      label="Processing"
                      value={returns?.processingRefunds}
                      tone="info"
                    />

                    <StatusItem
                      label="Successful"
                      value={returns?.successfulRefunds}
                      tone="success"
                    />

                    <StatusItem
                      label="Failed"
                      value={returns?.failedRefunds}
                      tone="danger"
                    />
                  </div>

                  <div className="admin-refund-total">
                    <span>Total successful refund amount</span>
                    <strong>
                      {money(returns?.totalSuccessfulRefundAmount)}
                    </strong>
                  </div>
                </>
              )}
            </section>

            <section className="admin-panel" id="admin-delivery">
              <SectionHeading
                eyebrow="FULFILMENT"
                title="Delivery performance"
                description="Performance for delivered orders."
              />

              {deliveryHasError ? (
                <p className="admin-inline-error">
                  {errors.delivery}
                </p>
              ) : (
                <>
                  <div className="admin-delivery-highlight">
                    <div className="admin-delivery-icon">
                      <Truck size={22} />
                    </div>

                    <div>
                      <span>On-time delivery rate</span>

                      <strong>
                        {Number(
                          delivery?.onTimeDeliveryPercentage || 0
                        ).toFixed(1)}
                        %
                      </strong>
                    </div>
                  </div>

                  <div className="admin-delivery-stats">
                    <div>
                      <span>Total delivered</span>
                      <strong>
                        {number(delivery?.totalDeliveredOrders)}
                      </strong>
                    </div>

                    <div>
                      <span>On time</span>
                      <strong className="text-success">
                        {number(delivery?.onTimeDeliveries)}
                      </strong>
                    </div>

                    <div>
                      <span>Late deliveries</span>
                      <strong className="text-danger">
                        {number(delivery?.lateDeliveries)}
                      </strong>
                    </div>

                    <div>
                      <span>Overdue orders</span>
                      <strong className="text-warning">
                        {number(delivery?.overdueOrders)}
                      </strong>
                    </div>
                  </div>

                  <div className="admin-average-delay">
                    <Clock3 size={17} />
                    <span>Average delay for late deliveries</span>

                    <strong>
                      {Number(
                        delivery?.averageDelayDays || 0
                      ).toFixed(1)}{" "}
                      days
                    </strong>
                  </div>
                </>
              )}
            </section>
          </div>

          {/* Best-selling products */}
          <section
            className="admin-panel admin-best-selling"
            id="admin-reports"
          >
            <SectionHeading
              eyebrow="PRODUCT PERFORMANCE"
              title="Best-selling products"
              description="Sales ranking from delivered orders only."
            />

            {bestSellingHasError ? (
              <p className="admin-inline-error">
                {errors.bestSelling}
              </p>
            ) : bestSelling.length === 0 && !loading ? (
              <div className="admin-empty-state">
                <Package size={29} />
                <strong>No best-selling data available</strong>
                <p>
                  The report returns products sold in delivered orders.
                </p>
              </div>
            ) : (
              <div className="admin-table-scroll">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Product ID</th>
                      <th>Quantity sold</th>
                      <th>Total sales amount</th>
                    </tr>
                  </thead>

                  <tbody>
                    {bestSelling.map((product, index) => (
                      <tr
                        key={
                          product.productId ??
                          product.id ??
                          `best-${index}`
                        }
                      >
                        <td>
                          <div className="admin-product-cell">
                            <span className="admin-product-rank">
                              {index + 1}
                            </span>

                            <strong>
                              {product.productName || "Unnamed product"}
                            </strong>
                          </div>
                        </td>

                        <td>#{product.productId ?? "—"}</td>

                        <td>
                          {number(product.totalQuantitySold)}
                        </td>

                        <td className="admin-sales-cell">
                          {money(product.totalSalesAmount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Date-wise sales report */}
          <section className="admin-panel admin-date-report">
            <SectionHeading
              eyebrow="REVENUE REPORTING"
              title="Date-wise sales"
              description="Select a date range to calculate successful payment revenue."
            />

            <form
              className="admin-date-form"
              onSubmit={loadDateWiseReport}
            >
              <label>
                <span>Start date</span>

                <input
                  type="date"
                  value={startDate}
                  max={endDate || undefined}
                  onChange={(event) =>
                    setStartDate(event.target.value)
                  }
                  required
                />
              </label>

              <label>
                <span>End date</span>

                <input
                  type="date"
                  value={endDate}
                  min={startDate || undefined}
                  onChange={(event) =>
                    setEndDate(event.target.value)
                  }
                  required
                />
              </label>

              <button
                className="admin-primary-button"
                type="submit"
                disabled={dateReportLoading}
              >
                {dateReportLoading ? (
                  <LoaderCircle size={17} className="admin-spin" />
                ) : (
                  <CalendarDays size={17} />
                )}

                Generate report
              </button>
            </form>

            {dateReportError && (
              <div className="admin-inline-error admin-date-error">
                {dateReportError}
              </div>
            )}

            {dateReport && (
              <div className="admin-date-result">
                <div>
                  <span>Report period</span>

                  <strong>
                    {dateReport.startDate || startDate} –{" "}
                    {dateReport.endDate || endDate}
                  </strong>
                </div>

                <div>
                  <span>Successful payment revenue</span>

                  <strong className="admin-date-revenue">
                    {money(dateReport.totalRevenue)}
                  </strong>
                </div>

                <div>
                  <span>Successful payments</span>

                  <strong>
                    {number(dateReport.successfulPayments)}
                  </strong>
                </div>
              </div>
            )}

            {!dateReport && !dateReportError && (
              <div className="admin-report-hint">
                <ArrowDownRight size={17} />
                Choose dates and generate a report to view the results.
              </div>
            )}
          </section>

          <footer className="admin-footer">
            <span>ShopNova Admin Console</span>

            <span>
              Report figures are supplied by your configured backend services.
            </span>
          </footer>
        </section>
      </div>
    </main>
  );
}