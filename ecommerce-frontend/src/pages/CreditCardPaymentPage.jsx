import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  CreditCard,
  LockKeyhole,
  MapPin,
  ShieldCheck,
  ShoppingBag,
  Truck,
  X,
} from "lucide-react";
import api from "../services/api";
import "./CreditCardPaymentPage.css";

const ADDRESS_KEY = "shopnova_selected_address_id";
const PAYMENT_METHOD_KEY = "shopnova_selected_payment_method";

function unwrapResponse(data) {
  return data?.data ?? data;
}

function getErrorMessage(error, fallback) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.detail ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  );
}

function isAuthError(error) {
  return [401, 403].includes(error?.response?.status);
}

function formatPrice(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);
}

function extractAddressList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.addresses)) return data.addresses;
  return [];
}

function formatAddress(address) {
  return [
    address.houseAddress,
    address.area,
    address.landmark,
    `${address.city}, ${address.state} - ${address.pincode}`,
  ]
    .filter(Boolean)
    .join(", ");
}

function formatCardNumber(value) {
  return value
    .replace(/\D/g, "")
    .slice(0, 16)
    .replace(/(\d{4})(?=\d)/g, "$1 ");
}

function formatExpiry(value) {
  const digits = value.replace(/\D/g, "").slice(0, 4);

  if (digits.length <= 2) return digits;

  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

function validateCardDetails({ cardholder, cardNumber, expiry, cvv }) {
  if (!cardholder.trim()) {
    return "Please enter the name shown on the card.";
  }

  const digits = cardNumber.replace(/\D/g, "");

  if (digits.length !== 16) {
    return "Enter a 16-digit card number for this demo form.";
  }

  if (!/^\d{2}\/\d{2}$/.test(expiry)) {
    return "Enter the expiry date in MM/YY format.";
  }

  const [monthText, yearText] = expiry.split("/");
  const month = Number(monthText);
  const year = 2000 + Number(yearText);

  if (month < 1 || month > 12) {
    return "Enter a valid expiry month.";
  }

  const expiryEnd = new Date(year, month, 0, 23, 59, 59);

  if (expiryEnd < new Date()) {
    return "This card expiry date has passed.";
  }

  if (!/^\d{3,4}$/.test(cvv)) {
    return "Enter a valid 3- or 4-digit CVV for the demo form.";
  }

  return "";
}

export default function CreditCardPaymentPage() {
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");

  const [items, setItems] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(
    () => localStorage.getItem(ADDRESS_KEY) || ""
  );

  const [cardholder, setCardholder] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState("");
  const [pendingOrder, setPendingOrder] = useState(null);

  const selectedAddress = addresses.find(
    (address) => String(address.id) === String(selectedAddressId)
  );

  const subtotal = useMemo(
    () =>
      items.reduce(
        (sum, item) =>
          sum +
          (Number(item.price) || 0) *
            (Number(item.quantity) || 0),
        0
      ),
    [items]
  );

  const totalQuantity = useMemo(
    () =>
      items.reduce(
        (sum, item) => sum + (Number(item.quantity) || 0),
        0
      ),
    [items]
  );

  const maskedCardNumber = cardNumber.trim()
    ? `•••• •••• •••• ${cardNumber.replace(/\D/g, "").slice(-4).padStart(4, "•")}`
    : "•••• •••• •••• ••••";

  useEffect(() => {
    let active = true;

    async function loadData() {
      if (!token || !userId) {
        navigate("/login", {
          replace: true,
          state: { from: "/card-payment" },
        });
        return;
      }

      setLoading(true);
      setError("");

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      const [cartResult, addressResult] = await Promise.allSettled([
        api.get(`/getcart/${encodeURIComponent(userId)}`, config),
        api.get("/addresses", config),
      ]);

      if (!active) return;

      const authFailure = [cartResult, addressResult].find(
        (result) =>
          result.status === "rejected" &&
          isAuthError(result.reason)
      );

      if (authFailure) {
        localStorage.removeItem("token");
        localStorage.removeItem("userId");
        localStorage.removeItem("user");

        navigate("/login", {
          replace: true,
          state: { from: "/card-payment" },
        });
        return;
      }

      let loadError = "";

      if (cartResult.status === "fulfilled") {
        const body = unwrapResponse(cartResult.value.data);
        const cartItems = body?.items ?? body?.cartItems ?? [];

        setItems(Array.isArray(cartItems) ? cartItems : []);
      } else {
        setItems([]);
        loadError = getErrorMessage(
          cartResult.reason,
          "Unable to load the cart."
        );
      }

      if (addressResult.status === "fulfilled") {
        const list = extractAddressList(addressResult.value.data);
        setAddresses(list);

        const savedId = localStorage.getItem(ADDRESS_KEY);

        const address =
          (savedId &&
            list.find(
              (item) => String(item.id) === String(savedId)
            )) ||
          list.find((item) => Boolean(item.isDefault)) ||
          list[0] ||
          null;

        if (address) {
          const id = String(address.id);
          setSelectedAddressId(id);
          localStorage.setItem(ADDRESS_KEY, id);
        } else {
          setSelectedAddressId("");
          localStorage.removeItem(ADDRESS_KEY);
        }
      } else {
        setAddresses([]);
        setSelectedAddressId("");

        const addressError = getErrorMessage(
          addressResult.reason,
          "Unable to load your delivery address."
        );

        loadError = loadError
          ? `${loadError} ${addressError}`
          : addressError;
      }

      if (active) {
        setError(loadError);
        setLoading(false);
      }
    }

    loadData().catch((requestError) => {
      if (!active) return;

      setError(
        getErrorMessage(
          requestError,
          "Unable to load payment details."
        )
      );
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [navigate, token, userId]);

  function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!items.length) {
      setError("Your cart is empty.");
      return;
    }

    if (!selectedAddress) {
      setError("Please select a delivery address first.");
      return;
    }

    const validationMessage = validateCardDetails({
      cardholder,
      cardNumber,
      expiry,
      cvv,
    });

    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    localStorage.setItem(PAYMENT_METHOD_KEY, "CARD");
    setConfirmOpen(true);
  }

  async function handleConfirmPayment() {
    if (submitting) return;

    if (!token || !userId) {
      navigate("/login", {
        replace: true,
        state: { from: "/card-payment" },
      });
      return;
    }

    if (!selectedAddress) {
      setConfirmOpen(false);
      setError("Please select a delivery address first.");
      return;
    }

    setSubmitting(true);
    setError("");

    const authConfig = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };

    try {
      localStorage.setItem(
        ADDRESS_KEY,
        String(selectedAddress.id)
      );

      localStorage.setItem(PAYMENT_METHOD_KEY, "CARD");

      // Create the order only after the user confirms in the popup.
      let order = pendingOrder;

      if (!order) {
        const orderResponse = await api.post(
          "/orders",
          { addressId: Number(selectedAddress.id) },
          authConfig
        );

        order = unwrapResponse(orderResponse.data);

        const orderId = order?.orderId ?? order?.id;

        if (!orderId) {
          throw new Error(
            "The order response did not contain an order ID."
          );
        }

        order = { ...order, orderId };
        setPendingOrder(order);
      }

      // The existing backend receives only the payment method.
      // Card number, expiry and CVV are not sent or stored here.
      const paymentResponse = await api.post(
        `/payments/${order.orderId}`,
        { paymentMethod: "CARD" },
        authConfig
      );

      const payment = unwrapResponse(paymentResponse.data);

      const finalOrder = {
        ...order,
        orderId: order.orderId,
        totalAmount: order.totalAmount ?? subtotal,
        deliveryFullName:
          order.deliveryFullName ?? selectedAddress.fullName,
        deliveryEmail:
          order.deliveryEmail ?? selectedAddress.email,
        deliveryPhone:
          order.deliveryPhone ?? selectedAddress.phone,
        deliveryHouseAddress:
          order.deliveryHouseAddress ?? selectedAddress.houseAddress,
        deliveryArea:
          order.deliveryArea ?? selectedAddress.area,
        deliveryLandmark:
          order.deliveryLandmark ?? selectedAddress.landmark,
        deliveryPincode:
          order.deliveryPincode ?? selectedAddress.pincode,
        deliveryCity:
          order.deliveryCity ?? selectedAddress.city,
        deliveryState:
          order.deliveryState ?? selectedAddress.state,
        deliveryAddressType:
          order.deliveryAddressType ?? selectedAddress.addressType,
        paymentId: payment?.paymentId,
        paymentMethod: payment?.paymentMethod ?? "CARD",
        paymentStatus: payment?.paymentStatus,
        paymentDate: payment?.paymentDate,
      };

      setConfirmOpen(false);

      navigate("/order-success", {
        replace: true,
        state: {
          order: finalOrder,
          payment,
        },
      });
    } catch (requestError) {
      if (isAuthError(requestError)) {
        localStorage.removeItem("token");
        localStorage.removeItem("userId");
        localStorage.removeItem("user");
        navigate("/login", {
          replace: true,
          state: { from: "/card-payment" },
        });
        return;
      }

      setConfirmOpen(false);
      setError(
        getErrorMessage(
          requestError,
          "The order/payment request failed. Please try again."
        )
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="cardpay-page">
        <div className="cardpay-loading">
          <span className="cardpay-spinner" />
          Loading your checkout...
        </div>
      </main>
    );
  }

  if (!items.length) {
    return (
      <main className="cardpay-page">
        <div className="cardpay-empty">
          <ShoppingBag size={42} />
          <h1>Your cart is empty</h1>
          <p>Add products before continuing to payment.</p>
          {error && <div className="cardpay-error">{error}</div>}
          <Link to="/products" className="cardpay-primary">
            Explore products <ArrowRight size={17} />
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="cardpay-page">
      <div className="cardpay-container">
        <nav className="cardpay-breadcrumb">
          <Link to="/">Home</Link>
          <span>/</span>
          <Link to="/cart">Cart</Link>
          <span>/</span>
          <Link to="/checkout">Delivery address</Link>
          <span>/</span>
          <Link to="/payment">Payment</Link>
          <span>/</span>
          <span>Card</span>
        </nav>

        <header className="cardpay-heading">
          <div>
            <span className="cardpay-eyebrow">SHOPNOVA CHECKOUT</span>
            <h1>Debit / Credit Card<span>.</span></h1>
            <p>Review your card details before confirming this demo payment.</p>
          </div>

          <div className="cardpay-secure-label">
            <ShieldCheck size={18} />
            Secure checkout
          </div>
        </header>

        {error && (
          <div className="cardpay-error" role="alert">
            {error}
          </div>
        )}

        <div className="cardpay-layout">
          <section className="cardpay-main">
            <div className="cardpay-section-title">
              <span className="cardpay-heading-icon">
                <CreditCard size={21} />
              </span>
              <div>
                <h2>Card information</h2>
                <p>Enter sample details to preview the checkout flow.</p>
              </div>
            </div>

            <div className="cardpay-demo-warning">
              <LockKeyhole size={18} />
              <span>
                Demo only: do not enter real card details. This page does not
                process a real card transaction.
              </span>
            </div>

            <div className="cardpay-card-preview" aria-label="Card preview">
              <div className="cardpay-card-top">
                <span className="cardpay-card-brand">SHOPNOVA</span>
                <CreditCard size={30} />
              </div>

              <div className="cardpay-chip" aria-hidden="true">
                <span />
              </div>

              <div className="cardpay-card-number">
                {maskedCardNumber}
              </div>

              <div className="cardpay-card-bottom">
                <div>
                  <small>CARDHOLDER</small>
                  <strong>{cardholder.trim() || "YOUR NAME"}</strong>
                </div>

                <div>
                  <small>EXPIRES</small>
                  <strong>{expiry || "MM/YY"}</strong>
                </div>
              </div>

              <span className="cardpay-card-orbit cardpay-orbit-one" />
              <span className="cardpay-card-orbit cardpay-orbit-two" />
            </div>

            <form className="cardpay-form" onSubmit={handleSubmit}>
              <label className="cardpay-field">
                <span>Name on card</span>
                <input
                  type="text"
                  value={cardholder}
                  onChange={(event) =>
                    setCardholder(
                      event.target.value
                        .replace(/[^a-zA-Z .'-]/g, "")
                        .slice(0, 60)
                    )
                  }
                  placeholder="Enter cardholder name"
                  autoComplete="off"
                  maxLength={60}
                />
              </label>

              <label className="cardpay-field">
                <span>Card number</span>
                <div className="cardpay-input-wrap">
                  <CreditCard size={19} />
                  <input
                    type="text"
                    inputMode="numeric"
                    value={cardNumber}
                    onChange={(event) =>
                      setCardNumber(formatCardNumber(event.target.value))
                    }
                    placeholder="1234 5678 9012 3456"
                    autoComplete="off"
                    maxLength={19}
                  />
                </div>
              </label>

              <div className="cardpay-field-row">
                <label className="cardpay-field">
                  <span>Expiry date</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={expiry}
                    onChange={(event) =>
                      setExpiry(formatExpiry(event.target.value))
                    }
                    placeholder="MM/YY"
                    autoComplete="off"
                    maxLength={5}
                  />
                </label>

                <label className="cardpay-field">
                  <span>CVV</span>
                  <input
                    type="password"
                    inputMode="numeric"
                    value={cvv}
                    onChange={(event) =>
                      setCvv(event.target.value.replace(/\D/g, "").slice(0, 4))
                    }
                    placeholder="•••"
                    autoComplete="off"
                    maxLength={4}
                  />
                </label>
              </div>

              <p className="cardpay-form-note">
                For this demo, the card fields are used only for local form
                validation. They are not sent to the backend.
              </p>

              <button
                type="submit"
                className="cardpay-primary cardpay-pay-button"
                disabled={submitting}
              >
                Review payment <ArrowRight size={17} />
              </button>

              <Link to="/payment" className="cardpay-secondary">
                <ArrowLeft size={16} />
                Back to payment methods
              </Link>
            </form>
          </section>

          <aside className="cardpay-summary">
            <span className="cardpay-eyebrow">YOUR PURCHASE</span>
            <h2>Order summary</h2>

            <div className="cardpay-items">
              {items.map((item, index) => (
                <div className="cardpay-item" key={item.productId ?? index}>
                  <div className="cardpay-item-icon">
                    <ShoppingBag size={18} />
                    <span>{Number(item.quantity) || 0}</span>
                  </div>
                  <div className="cardpay-item-copy">
                    <strong>{item.productName || "Product"}</strong>
                    <span>
                      {formatPrice(item.price)} × {Number(item.quantity) || 0}
                    </span>
                  </div>
                  <strong className="cardpay-line-price">
                    {formatPrice(
                      (Number(item.price) || 0) *
                        (Number(item.quantity) || 0)
                    )}
                  </strong>
                </div>
              ))}
            </div>

            <div className="cardpay-summary-row">
              <span>Total quantity</span>
              <strong>{totalQuantity}</strong>
            </div>

            <div className="cardpay-divider" />

            <div className="cardpay-total">
              <span>Estimated total</span>
              <strong>{formatPrice(subtotal)}</strong>
            </div>

            <div className="cardpay-address">
              <div className="cardpay-address-title">
                <MapPin size={18} />
                <strong>Delivery address</strong>
                <Link to="/checkout">Change</Link>
              </div>

              {selectedAddress ? (
                <>
                  <strong>{selectedAddress.fullName}</strong>
                  <p>{formatAddress(selectedAddress)}</p>
                  <span>{selectedAddress.phone}</span>
                </>
              ) : (
                <div className="cardpay-address-missing">
                  <p>No delivery address selected.</p>
                  <Link to="/checkout">Choose an address</Link>
                </div>
              )}
            </div>

            <div className="cardpay-delivery-note">
              <Truck size={19} />
              <div>
                <strong>Delivery details</strong>
                <span>Your selected address will be attached to the order.</span>
              </div>
            </div>

            <div className="cardpay-secure-footer">
              <ShieldCheck size={17} />
              <span>ShopNova demo checkout</span>
            </div>
          </aside>
        </div>
      </div>

      {confirmOpen && (
        <div
          className="cardpay-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !submitting) {
              setConfirmOpen(false);
            }
          }}
        >
          <section
            className="cardpay-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cardpay-modal-title"
          >
            <button
              type="button"
              className="cardpay-modal-close"
              onClick={() => setConfirmOpen(false)}
              disabled={submitting}
              aria-label="Close confirmation"
            >
              <X size={19} />
            </button>

            <div className="cardpay-modal-icon">
              <ShieldCheck size={27} />
            </div>

            <span className="cardpay-eyebrow">PAYMENT CONFIRMATION</span>
            <h2 id="cardpay-modal-title">Confirm your payment?</h2>
            <p>
              You are about to continue with the ShopNova demo payment flow
              using a Debit / Credit Card.
            </p>

            <div className="cardpay-modal-total">
              <span>Order total</span>
              <strong>{formatPrice(subtotal)}</strong>
            </div>

            <div className="cardpay-modal-disclaimer">
              <LockKeyhole size={17} />
              <span>
                No actual card charge will occur. The current backend simulates
                payment success; it does not contact your bank.
              </span>
            </div>

            <button
              type="button"
              className="cardpay-primary"
              onClick={handleConfirmPayment}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <span className="cardpay-button-spinner" />
                  Processing...
                </>
              ) : (
                <>
                  Confirm demo payment <ArrowRight size={17} />
                </>
              )}
            </button>

            <button
              type="button"
              className="cardpay-cancel-button"
              onClick={() => setConfirmOpen(false)}
              disabled={submitting}
            >
              Go back and edit
            </button>
          </section>
        </div>
      )}
    </main>
  );
}