import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock3,
  CreditCard,
  LockKeyhole,
  ShieldCheck,
  X,
} from "lucide-react";

import api from "../services/api";
import "./NetBankingPage.css";

const ADDRESS_KEY = "shopnova_selected_address_id";
const PENDING_ORDER_KEY = "shopnova_pending_order_for_payment";

const BANKS = [
  { id: "SBI", name: "State Bank of India", shortName: "SBI" },
  { id: "HDFC", name: "HDFC Bank", shortName: "HDFC" },
  { id: "ICICI", name: "ICICI Bank", shortName: "ICICI" },
  { id: "AXIS", name: "Axis Bank", shortName: "AXIS" },
  { id: "KOTAK", name: "Kotak Mahindra Bank", shortName: "KOTAK" },
  { id: "OTHER", name: "Other Bank", shortName: "OTHER" },
];

function getApiError(error, fallback) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.detail ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  );
}

function unwrap(data) {
  return data?.data ?? data;
}

function getAddressList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.addresses)) return data.addresses;
  return [];
}

function getCartItems(data) {
  const body = unwrap(data);
  const items = body?.items ?? body?.cartItems ?? [];
  return Array.isArray(items) ? items : [];
}

function getStoredPendingOrder() {
  try {
    return JSON.parse(sessionStorage.getItem(PENDING_ORDER_KEY) || "null");
  } catch {
    return null;
  }
}

function formatPrice(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);
}

function formatAddress(address) {
  return [
    address?.deliveryHouseAddress ?? address?.houseAddress,
    address?.deliveryArea ?? address?.area,
    address?.deliveryLandmark ?? address?.landmark,
    [
      address?.deliveryCity ?? address?.city,
      address?.deliveryState ?? address?.state,
    ].filter(Boolean).join(", "),
    address?.deliveryPincode ?? address?.pincode,
  ]
    .filter(Boolean)
    .join(", ");
}

function isAuthError(error) {
  return [401, 403].includes(error?.response?.status);
}

export default function NetBankingPage() {
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");

  const [items, setItems] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(
    () => localStorage.getItem(ADDRESS_KEY) || ""
  );
  const [selectedBank, setSelectedBank] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingOrder, setPendingOrder] = useState(getStoredPendingOrder);

  const authConfig = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  useEffect(() => {
    let active = true;

    async function loadData() {
      if (!token || !userId) {
        navigate("/login", {
          replace: true,
          state: { from: "/payment" },
        });
        return;
      }

      setLoading(true);
      setError("");

      const [cartResult, addressResult] = await Promise.allSettled([
        api.get(
          `/getcart/${encodeURIComponent(userId)}`,
          authConfig
        ),
        api.get("/addresses", authConfig),
      ]);

      if (!active) return;

      const authFailure = [cartResult, addressResult].find(
        (result) =>
          result.status === "rejected" &&
          isAuthError(result.reason)
      );

      if (authFailure) {
        navigate("/login", {
          replace: true,
          state: { from: "/payment" },
        });
        return;
      }

      const savedOrder = getStoredPendingOrder();

      if (cartResult.status === "fulfilled") {
        const cartItems = getCartItems(cartResult.value.data);

        // After order creation, the backend clears the cart.
        // If payment then fails, retain the items from that saved order.
        setItems(
          cartItems.length > 0
            ? cartItems
            : Array.isArray(savedOrder?.items)
              ? savedOrder.items
              : []
        );
      } else if (Array.isArray(savedOrder?.items)) {
        setItems(savedOrder.items);
      } else {
        setItems([]);
        setError(
          getApiError(
            cartResult.reason,
            "Unable to load your cart."
          )
        );
      }

      if (addressResult.status === "fulfilled") {
        const list = getAddressList(addressResult.value.data);
        setAddresses(list);

        const savedAddressId = localStorage.getItem(ADDRESS_KEY);

        const address =
          (savedAddressId &&
            list.find(
              (item) => String(item.id) === String(savedAddressId)
            )) ||
          list.find((item) => Boolean(item.isDefault)) ||
          list[0];

        if (address) {
          setSelectedAddressId(String(address.id));
          localStorage.setItem(ADDRESS_KEY, String(address.id));
        } else {
          setSelectedAddressId("");
        }
      } else if (!savedOrder) {
        setAddresses([]);
        setError(
          getApiError(
            addressResult.reason,
            "Unable to load the delivery address."
          )
        );
      }

      if (active) setLoading(false);
    }

    loadData().catch((loadError) => {
      if (!active) return;

      setError(
        getApiError(loadError, "Unable to load Net Banking.")
      );
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [navigate, token, userId]);

  const selectedAddress = addresses.find(
    (address) => String(address.id) === String(selectedAddressId)
  );

  const addressSnapshot =
    selectedAddress ||
    (pendingOrder?.deliveryFullName
      ? {
          fullName: pendingOrder.deliveryFullName,
          email: pendingOrder.deliveryEmail,
          phone: pendingOrder.deliveryPhone,
          houseAddress: pendingOrder.deliveryHouseAddress,
          area: pendingOrder.deliveryArea,
          landmark: pendingOrder.deliveryLandmark,
          pincode: pendingOrder.deliveryPincode,
          city: pendingOrder.deliveryCity,
          state: pendingOrder.deliveryState,
          addressType: pendingOrder.deliveryAddressType,
        }
      : null);

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

  const payableAmount = Number(
    pendingOrder?.totalAmount ?? subtotal
  ) || 0;

  function openPaymentConfirmation() {
    setError("");

    if (!selectedBank) {
      setError("Please select your bank to continue.");
      return;
    }

    if (!addressSnapshot) {
      setError("Please select a delivery address at checkout.");
      return;
    }

    if (!items.length && !pendingOrder) {
      setError("Your cart is empty.");
      return;
    }

    setShowConfirm(true);
  }

  async function confirmAndPay() {
    if (submitting) return;

    if (!token || !userId) {
      navigate("/login", {
        replace: true,
        state: { from: "/payment" },
      });
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      let order = pendingOrder || getStoredPendingOrder();

      // Create the order once. On a payment retry, reuse that order.
      if (!order) {
        if (!selectedAddress?.id) {
          throw new Error(
            "The selected delivery address is missing. Return to checkout."
          );
        }

        const orderResponse = await api.post(
          "/orders",
          {
            addressId: Number(selectedAddress.id),
          },
          authConfig
        );

        const createdOrder = unwrap(orderResponse.data);
        const orderId = createdOrder?.orderId ?? createdOrder?.id;

        if (orderId == null) {
          throw new Error(
            "The order API did not return an order ID."
          );
        }

        order = {
          ...createdOrder,
          orderId,
        };

        sessionStorage.setItem(
          PENDING_ORDER_KEY,
          JSON.stringify(order)
        );

        setPendingOrder(order);
      }

      // Existing backend PaymentMethod enum value: NET_BANKING.
      const paymentResponse = await api.post(
        `/payments/${order.orderId}`,
        {
          paymentMethod: "NET_BANKING",
        },
        authConfig
      );

      const payment = unwrap(paymentResponse.data);

      if (!payment?.paymentId || !payment?.paymentStatus) {
        throw new Error(
          "The payment API did not return a valid payment result."
        );
      }

      if (String(payment.paymentStatus).toUpperCase() !== "SUCCESS") {
        setError(
          `Payment was not successful. Current status: ${payment.paymentStatus}`
        );
        return;
      }

      const finalOrder = {
        ...order,
        status: "CONFIRMED",
        totalAmount: order.totalAmount ?? payableAmount,
        deliveryFullName:
          order.deliveryFullName ?? addressSnapshot?.fullName,
        deliveryEmail:
          order.deliveryEmail ?? addressSnapshot?.email,
        deliveryPhone:
          order.deliveryPhone ?? addressSnapshot?.phone,
        deliveryHouseAddress:
          order.deliveryHouseAddress ?? addressSnapshot?.houseAddress,
        deliveryArea:
          order.deliveryArea ?? addressSnapshot?.area,
        deliveryLandmark:
          order.deliveryLandmark ?? addressSnapshot?.landmark,
        deliveryPincode:
          order.deliveryPincode ?? addressSnapshot?.pincode,
        deliveryCity:
          order.deliveryCity ?? addressSnapshot?.city,
        deliveryState:
          order.deliveryState ?? addressSnapshot?.state,
        deliveryAddressType:
          order.deliveryAddressType ?? addressSnapshot?.addressType,
        paymentId: payment.paymentId,
        paymentMethod: payment.paymentMethod,
        paymentStatus: payment.paymentStatus,
        paymentDate: payment.paymentDate,
        selectedBank,
      };

      sessionStorage.removeItem(PENDING_ORDER_KEY);

      navigate("/order-success", {
        replace: true,
        state: {
          order: finalOrder,
          payment,
        },
      });
    } catch (requestError) {
      if (isAuthError(requestError)) {
        navigate("/login", {
          replace: true,
          state: { from: "/payment" },
        });
        return;
      }

      setError(
        getApiError(
          requestError,
          "Payment could not be completed. Please try again."
        )
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="netbanking-page">
        <div className="netbanking-loading">
          <span className="netbanking-spinner" />
          Loading payment details...
        </div>
      </main>
    );
  }

  return (
    <main className="netbanking-page">
      <div className="netbanking-container">
        <nav className="netbanking-breadcrumb">
          <Link to="/">Home</Link>
          <span>/</span>
          <Link to="/checkout">Delivery address</Link>
          <span>/</span>
          <Link to="/payment">Payment methods</Link>
          <span>/</span>
          <span>Net Banking</span>
        </nav>

        <header className="netbanking-heading">
          <div>
            <span className="netbanking-eyebrow">
              SHOPNOVA SECURE CHECKOUT
            </span>
            <h1>Net Banking<span>.</span></h1>
            <p>Select your bank and review the payment before confirming.</p>
          </div>

          <span className="netbanking-secure-badge">
            <ShieldCheck size={17} />
            Secure checkout
          </span>
        </header>

        {error && (
          <div className="netbanking-error" role="alert">
            {error}
          </div>
        )}

        <div className="netbanking-layout">
          <section className="netbanking-card">
            <div className="netbanking-section-heading">
              <div className="netbanking-heading-icon">
                <Building2 size={22} />
              </div>
              <div>
                <h2>Select your bank</h2>
                <p>Choose the bank you want to use for this payment.</p>
              </div>
            </div>

            <div className="netbanking-bank-list">
              {BANKS.map((bank) => (
                <label
                  key={bank.id}
                  className={`netbanking-bank-option ${
                    selectedBank === bank.id
                      ? "netbanking-bank-selected"
                      : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="netBankingBank"
                    value={bank.id}
                    checked={selectedBank === bank.id}
                    disabled={submitting}
                    onChange={() => {
                      setSelectedBank(bank.id);
                      setError("");
                    }}
                  />

                  <span className="netbanking-bank-logo">
                    {bank.shortName}
                  </span>

                  <span className="netbanking-bank-name">
                    <strong>{bank.name}</strong>
                    <small>Net Banking</small>
                  </span>

                  <span className="netbanking-radio-mark">
                    {selectedBank === bank.id && <span />}
                  </span>
                </label>
              ))}
            </div>

            <div className="netbanking-demo-note">
              <Clock3 size={18} />
              <p>
                Your current backend simulates payment success. This screen
                does not redirect to your bank or transfer real money.
              </p>
            </div>
          </section>

          <aside className="netbanking-summary">
            <span className="netbanking-eyebrow">PAYMENT SUMMARY</span>
            <h2>Review before payment</h2>

            <div className="netbanking-summary-row">
              <span>Items</span>
              <strong>{items.reduce(
                (sum, item) => sum + (Number(item.quantity) || 0),
                0
              )}</strong>
            </div>

            <div className="netbanking-summary-row">
              <span>Selected bank</span>
              <strong>
                {BANKS.find((bank) => bank.id === selectedBank)?.name ||
                  "Not selected"}
              </strong>
            </div>

            <div className="netbanking-summary-divider" />

            <div className="netbanking-amount-row">
              <span>Amount payable</span>
              <strong>{formatPrice(payableAmount)}</strong>
            </div>

            {addressSnapshot && (
              <div className="netbanking-delivery">
                <span>DELIVER TO</span>
                <strong>{addressSnapshot.fullName}</strong>
                <p>{formatAddress(addressSnapshot)}</p>
                {addressSnapshot.phone && (
                  <small>{addressSnapshot.phone}</small>
                )}
              </div>
            )}

            <button
              type="button"
              className="netbanking-primary-button"
              disabled={!selectedBank || !addressSnapshot || submitting}
              onClick={openPaymentConfirmation}
            >
              Proceed to Payment
              <ArrowRight size={17} />
            </button>

            <p className="netbanking-legal-note">
              A confirmation dialog will appear before the backend payment
              request is submitted.
            </p>

            <Link
              to="/payment"
              className="netbanking-back-button"
              onClick={() =>
                localStorage.setItem(
                  "shopnova_selected_payment_method",
                  "NET_BANKING"
                )
              }
            >
              <ArrowLeft size={16} />
              Back to payment methods
            </Link>

            <div className="netbanking-trust">
              <LockKeyhole size={16} />
              Your session uses the existing authenticated API
            </div>
          </aside>
        </div>
      </div>

      {showConfirm && (
        <div
          className="netbanking-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !submitting) {
              setShowConfirm(false);
            }
          }}
        >
          <section
            className="netbanking-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="netbanking-modal-title"
          >
            <div className="netbanking-modal-icon">
              <CreditCard size={25} />
            </div>

            {!submitting && (
              <button
                type="button"
                className="netbanking-modal-close"
                onClick={() => setShowConfirm(false)}
                aria-label="Close confirmation"
              >
                <X size={19} />
              </button>
            )}

            <span className="netbanking-eyebrow">
              PAYMENT CONFIRMATION
            </span>

            <h2 id="netbanking-modal-title">
              Confirm your payment?
            </h2>

            <p>
              You selected{" "}
              <strong>
                {BANKS.find((bank) => bank.id === selectedBank)?.name}
              </strong>
              . Confirm to submit the order and payment request to ShopNova.
            </p>

            <div className="netbanking-modal-amount">
              <span>Amount payable</span>
              <strong>{formatPrice(payableAmount)}</strong>
            </div>

            <div className="netbanking-modal-demo-warning">
              <ShieldCheck size={17} />
              <span>
                This project currently uses simulated payment processing;
                no real bank transaction will occur.
              </span>
            </div>

            <div className="netbanking-modal-actions">
              <button
                type="button"
                className="netbanking-modal-cancel"
                disabled={submitting}
                onClick={() => setShowConfirm(false)}
              >
                Go Back
              </button>

              <button
                type="button"
                className="netbanking-modal-confirm"
                disabled={submitting}
                onClick={confirmAndPay}
              >
                {submitting ? (
                  <>
                    <span className="netbanking-button-spinner" />
                    Processing...
                  </>
                ) : (
                  <>
                    Confirm &amp; Pay
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}