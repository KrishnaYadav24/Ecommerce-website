import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, RefreshCw, XCircle } from "lucide-react";

import api from "../services/api";
import "./AdminReturnsRefunds.css";

function unwrapList(payload) {
  const data = payload?.data ?? payload;

  if (Array.isArray(data)) return data;

  for (const key of [
    "items",
    "returns",
    "returnRequests",
    "refunds",
    "content",
  ]) {
    if (Array.isArray(data?.[key])) return data[key];
  }

  return [];
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

function getReturnId(item) {
  return item?.returnRequestId ?? item?.id;
}

function getRefundId(item) {
  return item?.refundId ?? item?.id;
}

function getReturnStatus(item) {
  return String(item?.returnStatus ?? item?.status ?? "UNKNOWN").toUpperCase();
}

function getRefundStatus(item) {
  return String(item?.refundStatus ?? item?.status ?? "UNKNOWN").toUpperCase();
}

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatStatus(status) {
  return String(status || "Unknown")
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function getStatusClass(status) {
  return String(status || "unknown").toLowerCase().replaceAll("_", "-");
}

export default function AdminReturnsRefunds() {
  const [activeTab, setActiveTab] = useState("returns");

  const [returns, setReturns] = useState([]);
  const [refunds, setRefunds] = useState([]);

  const [loading, setLoading] = useState(true);
  const [busyAction, setBusyAction] = useState("");
  const [search, setSearch] = useState("");

  const [error, setError] = useState("");
  const [refundError, setRefundError] = useState("");
  const [notice, setNotice] = useState("");

  const fetchData = useCallback(async (showLoader = true) => {
    const token = localStorage.getItem("token");

    if (!token) {
      setError("Please log in with your admin account.");
      setLoading(false);
      return;
    }

    if (showLoader) setLoading(true);

    setError("");
    setRefundError("");

    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };

    const [returnsResult, refundsResult] = await Promise.allSettled([
      api.get("/returns/admin", config),
      api.get("/refunds/admin", config),
    ]);

    if (returnsResult.status === "fulfilled") {
      setReturns(unwrapList(returnsResult.value.data));
    } else {
      setReturns([]);
      setError(
        getErrorMessage(
          returnsResult.reason,
          "Unable to load return requests."
        )
      );
    }

    if (refundsResult.status === "fulfilled") {
      setRefunds(unwrapList(refundsResult.value.data));
    } else {
      setRefunds([]);
      setRefundError(
        getErrorMessage(
          refundsResult.reason,
          "Unable to load refunds. Check the GET /refunds/admin endpoint."
        )
      );
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const authConfig = () => {
    const token = localStorage.getItem("token");

    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
  };

  const performAction = async (key, action, successMessage) => {
    if (busyAction) return;

    setBusyAction(key);
    setError("");
    setRefundError("");
    setNotice("");

    try {
      await action();
      setNotice(successMessage);
      await fetchData(false);
    } catch (actionError) {
      setError(
        getErrorMessage(
          actionError,
          "The action failed. Please check the backend response."
        )
      );
    } finally {
      setBusyAction("");
    }
  };

  const handleReturnDecision = (returnRequest, status) => {
    const returnId = getReturnId(returnRequest);

    if (returnId == null) {
      setError("Return request ID is missing.");
      return;
    }

    const confirmed = window.confirm(
      `${status === "APPROVED" ? "Approve" : "Reject"} return request #${returnId}?`
    );

    if (!confirmed) return;

    performAction(
      `return-${returnId}`,
      () =>
        api.put(
          `/returns/admin/${returnId}/status`,
          { status },
          authConfig()
        ),
      `Return request #${returnId} ${status.toLowerCase()} successfully.`
    );
  };

  const handleCreateRefund = (returnRequest) => {
    const returnId = getReturnId(returnRequest);

    if (returnId == null) {
      setError("Return request ID is missing.");
      return;
    }

    if (refundError) {
      setError("Load the existing refunds successfully before creating another refund.");
      return;
    }

    const confirmed = window.confirm(
      `Create a refund for return request #${returnId}?`
    );

    if (!confirmed) return;

    performAction(
      `create-refund-${returnId}`,
      () =>
        api.post(
          `/refunds/return/${returnId}`,
          {},
          authConfig()
        ),
      `Refund created for return request #${returnId}.`
    );
  };

  const handleProcessRefund = (refund) => {
    const refundId = getRefundId(refund);

    if (refundId == null) {
      setError("Refund ID is missing.");
      return;
    }

    if (!window.confirm(`Start processing refund #${refundId}?`)) {
      return;
    }

    performAction(
      `process-refund-${refundId}`,
      () => api.post(`/refunds/${refundId}/process`, {}, authConfig()),
      `Refund #${refundId} is now processing.`
    );
  };

  const handleCompleteRefund = (refund) => {
    const refundId = getRefundId(refund);

    if (refundId == null) {
      setError("Refund ID is missing.");
      return;
    }

    const confirmed = window.confirm(
      `Mark refund #${refundId} as successful? This backend workflow simulates refund completion; it does not send money through a real payment gateway.`
    );

    if (!confirmed) return;

    performAction(
      `complete-refund-${refundId}`,
      () => api.post(`/refunds/${refundId}/complete`, {}, authConfig()),
      `Refund #${refundId} marked successful.`
    );
  };

  const refundByReturnId = useMemo(() => {
    const map = new Map();

    refunds.forEach((refund) => {
      const returnId = refund?.returnRequestId;

      if (returnId != null) {
        map.set(String(returnId), refund);
      }
    });

    return map;
  }, [refunds]);

  const filteredReturns = useMemo(() => {
    const query = search.trim().toLowerCase();

    return returns.filter((item) => {
      const returnId = getReturnId(item);
      const status = getReturnStatus(item);

      const matchesSearch =
        !query ||
        [
          returnId,
          item?.orderId,
          item?.orderItemId,
          item?.productId,
          item?.productName,
          item?.reason,
          status,
        ].some((value) =>
          String(value ?? "").toLowerCase().includes(query)
        );

      return matchesSearch;
    });
  }, [returns, search]);

  const filteredRefunds = useMemo(() => {
    const query = search.trim().toLowerCase();

    return refunds.filter((item) => {
      const matchesSearch =
        !query ||
        [
          getRefundId(item),
          item?.returnRequestId,
          item?.orderId,
          item?.amount,
          getRefundStatus(item),
        ].some((value) =>
          String(value ?? "").toLowerCase().includes(query)
        );

      return matchesSearch;
    });
  }, [refunds, search]);

  const requestedCount = returns.filter(
    (item) => getReturnStatus(item) === "REQUESTED"
  ).length;

  const approvedCount = returns.filter(
    (item) => getReturnStatus(item) === "APPROVED"
  ).length;

  const pendingRefundCount = refunds.filter(
    (item) => getRefundStatus(item) === "PENDING"
  ).length;

  const processingRefundCount = refunds.filter(
    (item) => getRefundStatus(item) === "PROCESSING"
  ).length;

  const successfulRefundCount = refunds.filter(
    (item) => getRefundStatus(item) === "SUCCESS"
  ).length;

  return (
    <main className="arr-page">
      <section className="arr-header">
        <div>
          <p className="arr-eyebrow">SHOPNOVA ADMINISTRATION</p>
          <h1>Returns &amp; Refunds</h1>
          <p className="arr-subtitle">
            Review return requests and manage refund processing.
          </p>
        </div>

        <button
          type="button"
          className="arr-refresh-button"
          onClick={() => fetchData()}
          disabled={loading || Boolean(busyAction)}
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </section>

      <section className="arr-summary-grid">
        <div className="arr-summary-card">
          <span>Total returns</span>
          <strong>{returns.length}</strong>
        </div>

        <div className="arr-summary-card">
          <span>Awaiting decision</span>
          <strong>{requestedCount}</strong>
        </div>

        <div className="arr-summary-card">
          <span>Approved returns</span>
          <strong>{approvedCount}</strong>
        </div>

        <div className="arr-summary-card">
          <span>Pending refunds</span>
          <strong>{pendingRefundCount}</strong>
        </div>

        <div className="arr-summary-card">
          <span>Processing refunds</span>
          <strong>{processingRefundCount}</strong>
        </div>

        <div className="arr-summary-card">
          <span>Successful refunds</span>
          <strong>{successfulRefundCount}</strong>
        </div>
      </section>

      {notice && (
        <div className="arr-alert arr-alert-success" role="status">
          <CheckCircle2 size={18} />
          <span>{notice}</span>
        </div>
      )}

      {error && (
        <div className="arr-alert arr-alert-error" role="alert">
          <XCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      <section className="arr-panel">
        <div className="arr-toolbar">
          <div className="arr-tabs">
            <button
              type="button"
              className={activeTab === "returns" ? "active" : ""}
              onClick={() => {
                setActiveTab("returns");
                setSearch("");
              }}
            >
              Return requests
              <span>{returns.length}</span>
            </button>

            <button
              type="button"
              className={activeTab === "refunds" ? "active" : ""}
              onClick={() => {
                setActiveTab("refunds");
                setSearch("");
              }}
            >
              Refund processing
              <span>{refunds.length}</span>
            </button>
          </div>

          <input
            className="arr-search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={
              activeTab === "returns"
                ? "Search return, order, product..."
                : "Search refund or order..."
            }
          />
        </div>

        {loading ? (
          <div className="arr-state">
            <RefreshCw className="arr-spin" size={24} />
            <p>Loading returns and refunds...</p>
          </div>
        ) : activeTab === "returns" ? (
          error && returns.length === 0 ? (
            <div className="arr-state">
              <p>Return requests could not be loaded.</p>
              <button
                type="button"
                className="arr-button arr-button-secondary"
                onClick={() => fetchData()}
              >
                Try again
              </button>
            </div>
          ) : (
            <div className="arr-table-wrap">
              <table className="arr-table">
                <thead>
                  <tr>
                    <th>Return / Order</th>
                    <th>Product</th>
                    <th>Reason</th>
                    <th>Qty</th>
                    <th>Requested on</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredReturns.map((item) => {
                    const returnId = getReturnId(item);
                    const status = getReturnStatus(item);
                    const existingRefund =
                      returnId != null
                        ? refundByReturnId.get(String(returnId))
                        : null;
                    const actionKey = `return-${returnId}`;
                    const isBusy =
                      busyAction === actionKey ||
                      busyAction === `create-refund-${returnId}` ||
                      Boolean(busyAction);

                    return (
                      <tr key={returnId ?? `${item.orderId}-${item.productId}`}>
                        <td>
                          <strong>#{returnId ?? "—"}</strong>
                          <small>Order #{item.orderId ?? "—"}</small>
                        </td>

                        <td>
                          <strong className="arr-product-name">
                            {item.productName || `Product #${item.productId ?? "—"}`}
                          </strong>
                          <small>Item #{item.orderItemId ?? "—"}</small>
                        </td>

                        <td className="arr-reason">
                          {item.reason || "No reason provided"}
                        </td>

                        <td>{item.quantity ?? "—"}</td>

                        <td>{formatDate(item.requestDate)}</td>

                        <td>
                          <span
                            className={`arr-status arr-status-${getStatusClass(status)}`}
                          >
                            {formatStatus(status)}
                          </span>
                        </td>

                        <td className="arr-actions">
                          {status === "REQUESTED" ? (
                            <>
                              <button
                                type="button"
                                className="arr-button arr-button-approve"
                                disabled={isBusy}
                                onClick={() =>
                                  handleReturnDecision(item, "APPROVED")
                                }
                              >
                                Approve
                              </button>

                              <button
                                type="button"
                                className="arr-button arr-button-reject"
                                disabled={isBusy}
                                onClick={() =>
                                  handleReturnDecision(item, "REJECTED")
                                }
                              >
                                Reject
                              </button>
                            </>
                          ) : status === "APPROVED" && !existingRefund ? (
                            <button
                              type="button"
                              className="arr-button arr-button-primary"
                              disabled={isBusy || Boolean(refundError)}
                              title={
                                refundError
                                  ? "Refund list must load before creating a refund"
                                  : ""
                              }
                              onClick={() => handleCreateRefund(item)}
                            >
                              Create refund
                            </button>
                          ) : existingRefund ? (
                            <span className="arr-action-note">
                              Refund #{getRefundId(existingRefund)} created
                            </span>
                          ) : (
                            <span className="arr-action-note">No action</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}

                  {filteredReturns.length === 0 && (
                    <tr>
                      <td colSpan="7" className="arr-empty-cell">
                        {returns.length === 0
                          ? "No return requests found."
                          : "No matching return requests."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )
        ) : (
          <>
            {refundError && (
              <div className="arr-alert arr-alert-error arr-refund-alert">
                <XCircle size={18} />
                <span>{refundError}</span>
              </div>
            )}

            <div className="arr-table-wrap">
              <table className="arr-table">
                <thead>
                  <tr>
                    <th>Refund</th>
                    <th>Return request</th>
                    <th>Order</th>
                    <th>Refund amount</th>
                    <th>Status</th>
                    <th>Refund date</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredRefunds.map((item) => {
                    const refundId = getRefundId(item);
                    const status = getRefundStatus(item);
                    const isBusy = Boolean(busyAction);

                    return (
                      <tr key={refundId ?? `${item.orderId}-${item.returnRequestId}`}>
                        <td>
                          <strong>#{refundId ?? "—"}</strong>
                        </td>

                        <td>#{item.returnRequestId ?? "—"}</td>

                        <td>#{item.orderId ?? "—"}</td>

                        <td className="arr-money">
                          {formatCurrency(item.amount)}
                        </td>

                        <td>
                          <span
                            className={`arr-status arr-status-${getStatusClass(status)}`}
                          >
                            {formatStatus(status)}
                          </span>
                        </td>

                        <td>{formatDate(item.refundDate)}</td>

                        <td className="arr-actions">
                          {status === "PENDING" ? (
                            <button
                              type="button"
                              className="arr-button arr-button-primary"
                              disabled={isBusy}
                              onClick={() => handleProcessRefund(item)}
                            >
                              Start processing
                            </button>
                          ) : status === "PROCESSING" ? (
                            <button
                              type="button"
                              className="arr-button arr-button-approve"
                              disabled={isBusy}
                              onClick={() => handleCompleteRefund(item)}
                            >
                              Mark successful
                            </button>
                          ) : status === "SUCCESS" ? (
                            <span className="arr-action-note">
                              Completed
                            </span>
                          ) : (
                            <span className="arr-action-note">No action</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}

                  {filteredRefunds.length === 0 && (
                    <tr>
                      <td colSpan="7" className="arr-empty-cell">
                        {refunds.length === 0
                          ? "No refunds found yet. Approve a return and create its refund first."
                          : "No matching refunds."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <p className="arr-footnote">
              Important: “Mark successful” updates the application's refund
              status. It does not transfer money through a real payment gateway.
            </p>
          </>
        )}
      </section>
    </main>
  );
}