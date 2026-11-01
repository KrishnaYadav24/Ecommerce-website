import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock3,
  CreditCard,
  Landmark,
  MapPin,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Truck,
  Wallet,
} from "lucide-react";
import api from "../services/api";
import "./PaymentPage.css";

const SELECTED_ADDRESS_KEY = "shopnova_selected_address_id";
const PAYMENT_METHOD_KEY = "shopnova_selected_payment_method";

const PAYMENT_METHODS = [
  {
    value: "COD",
    title: "Cash on Delivery",
    description: "Pay when your order arrives.",
    note: "Payment at delivery.",
    Icon: Wallet,
    iconClass: "payment-cod-icon",
  },
  {
    value: "UPI",
    title: "UPI",
    description: "Pay using your UPI app.",
    note: "Uses the existing backend payment endpoint.",
    Icon: Smartphone,
    iconClass: "payment-upi-icon",
  },
  {
    value: "CARD",
    title: "Debit / Credit Card",
    description: "Choose your card payment option.",
    note: "Uses the existing backend payment endpoint.",
    Icon: CreditCard,
    iconClass: "payment-card-icon",
  },
  {
    value: "NET_BANKING",
    title: "Net Banking",
    description: "Pay through your bank.",
    note: "Select your bank on the next page.",
    Icon: Landmark,
    iconClass: "payment-netbanking-icon",
  },
];

function getInitialPaymentMethod() {
  const savedMethod = localStorage.getItem(PAYMENT_METHOD_KEY);

  return PAYMENT_METHODS.some((method) => method.value === savedMethod)
    ? savedMethod
    : "COD";
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

function unwrapResponse(data) {
  return data?.data ?? data;
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

function getExpectedDeliveryDate() {
  const date = new Date();
  date.setDate(date.getDate() + 5);

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function PaymentPage() {
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");

  const [items, setItems] = useState([]);
  const [addresses, setAddresses] = useState([]);

  const [selectedAddressId, setSelectedAddressId] = useState(
    () => localStorage.getItem(SELECTED_ADDRESS_KEY) || ""
  );

  const [paymentMethod, setPaymentMethod] = useState(
    getInitialPaymentMethod
  );

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pendingOrder, setPendingOrder] = useState(null);

  const selectedAddress = addresses.find(
    (address) => String(address.id) === String(selectedAddressId)
  );

  const authConfig = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  useEffect(() => {
    let active = true;

    async function loadPaymentData() {
      if (!token || !userId) {
        navigate("/login", {
          replace: true,
          state: { from: "/payment" },
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
          state: { from: "/payment" },
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
          "Unable to load your cart."
        );
      }

      if (addressResult.status === "fulfilled") {
        const list = extractAddressList(addressResult.value.data);

        setAddresses(list);

        const savedId = localStorage.getItem(SELECTED_ADDRESS_KEY);

        const selected =
          (savedId &&
            list.find(
              (address) => String(address.id) === String(savedId)
            )) ||
          list.find((address) => Boolean(address.isDefault)) ||
          list[0] ||
          null;

        if (selected) {
          const id = String(selected.id);

          setSelectedAddressId(id);
          localStorage.setItem(SELECTED_ADDRESS_KEY, id);
        } else {
          setSelectedAddressId("");
          localStorage.removeItem(SELECTED_ADDRESS_KEY);
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

    loadPaymentData().catch((loadError) => {
      if (!active) return;

      setError(
        getErrorMessage(
          loadError,
          "Unable to load payment details."
        )
      );

      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [navigate, token, userId]);

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

  const totalQuantity = useMemo(
    () =>
      items.reduce(
        (total, item) =>
          total + (Number(item.quantity) || 0),
        0
      ),
    [items]
  );
  
  //separate pages for netbanking and creditcart payment part 
  function handlePaymentMethodChange(method) {
    if (submitting) return;

    setPaymentMethod(method);
    localStorage.setItem(PAYMENT_METHOD_KEY, method);
    setError("");
    setNotice("");

    if (method === "NET_BANKING") {
      navigate("/netbanking-payment");
      return;
    }

    if (method === "CARD") {
      navigate("/card-payment");
    }
  }
  
  
  async function handleConfirmOrder() {
    if (submitting) return;

    // Safety check: Card must use its dedicated page.
	if (paymentMethod === "CARD") {
	  navigate("/card-payment");
	  return;
	}
	
	// Safety check: Net Banking must use its dedicated page.
	if (paymentMethod === "NET_BANKING") {
	  navigate("/netbanking-payment");
	  return;
	}

    setError("");
    setNotice("");

    if (!token || !userId) {
      navigate("/login", {
        replace: true,
        state: { from: "/payment" },
      });
      return;
    }

    if (!items.length) {
      setError("Your cart is empty. Add products before checkout.");
      return;
    }

    if (!selectedAddress) {
      setError("Please select a delivery address first.");
      return;
    }

    if (
      !PAYMENT_METHODS.some(
        (method) => method.value === paymentMethod
      )
    ) {
      setError("Please select a valid payment method.");
      return;
    }

    setSubmitting(true);

    try {
      localStorage.setItem(
        SELECTED_ADDRESS_KEY,
        String(selectedAddress.id)
      );

      localStorage.setItem(PAYMENT_METHOD_KEY, paymentMethod);

      // Stage 1: Create order for COD, UPI or CARD.
      let order = pendingOrder;

      if (!order) {
        const orderResponse = await api.post(
          "/orders",
          {
            addressId: Number(selectedAddress.id),
          },
          authConfig
        );

        order = unwrapResponse(orderResponse.data);

        const orderId = order?.orderId ?? order?.id;

        if (!orderId) {
          throw new Error(
            "Order API did not return an order ID. Please check the backend response."
          );
        }

        order = {
          ...order,
          orderId,
        };

        setPendingOrder(order);
      }

      // Stage 2: Call the existing payment API.
      const paymentResponse = await api.post(
        `/payments/${order.orderId}`,
        {
          paymentMethod,
        },
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
        paymentMethod: payment?.paymentMethod ?? paymentMethod,
        paymentStatus: payment?.paymentStatus,
        paymentDate: payment?.paymentDate,
      };

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
          state: { from: "/payment" },
        });
        return;
      }

      setError(
        getErrorMessage(
          requestError,
          "Order/payment request failed. Please try again."
        )
      );

      if (pendingOrder) {
        setNotice(
          `Order #${pendingOrder.orderId} was already created. You can retry payment without creating another order during this session.`
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="payment-page">
        <div className="payment-loading">
          <span className="payment-spinner" />
          Loading your payment details...
        </div>
      </main>
    );
  }

  if (!items.length && !pendingOrder) {
    return (
      <main className="payment-page">
        <div className="payment-empty">
          <ShoppingBag size={42} />
          <h1>Your cart is empty</h1>
          <p>Add products before continuing to payment.</p>

          {error && (
            <div className="payment-error" role="alert">
              {error}
            </div>
          )}

          <Link to="/products" className="payment-primary-button">
            Explore products <ArrowRight size={17} />
          </Link>

          <Link to="/cart" className="payment-secondary-button">
            Back to cart
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="payment-page">
      <div className="payment-container">
        <nav className="payment-breadcrumb" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <span>/</span>
          <Link to="/cart">Cart</Link>
          <span>/</span>
          <Link to="/checkout">Delivery address</Link>
          <span>/</span>
          <span>Payment</span>
        </nav>

        <header className="payment-heading">
          <div>
            <span className="payment-eyebrow">SHOPNOVA CHECKOUT</span>
            <h1>
              Payment method<span>.</span>
            </h1>
            <p>Review your delivery details and choose how to pay.</p>
          </div>

          <div className="payment-secure-label">
            <ShieldCheck size={18} />
            Secure checkout
          </div>
        </header>

        <div className="payment-progress">
          <div className="payment-progress-step payment-progress-complete">
            <span>
              <CheckCircle2 size={17} />
            </span>
            <div>
              <strong>Shopping bag</strong>
              <small>Products selected</small>
            </div>
          </div>

          <div className="payment-progress-line" />

          <div className="payment-progress-step payment-progress-complete">
            <span>
              <CheckCircle2 size={17} />
            </span>
            <div>
              <strong>Delivery address</strong>
              <small>Address selected</small>
            </div>
          </div>

          <div className="payment-progress-line" />

          <div className="payment-progress-step payment-progress-active">
            <span>
              <CreditCard size={17} />
            </span>
            <div>
              <strong>Payment</strong>
              <small>Select a payment method</small>
            </div>
          </div>
        </div>

        {error && (
          <div className="payment-error" role="alert">
            {error}
          </div>
        )}

        {notice && (
          <div className="payment-notice" role="status">
            <Clock3 size={20} />
            <span>{notice}</span>
          </div>
        )}

        <div className="payment-layout">
          <section className="payment-main-card">
            <div className="payment-section-heading">
              <div className="payment-section-icon">
                <Wallet size={21} />
              </div>
              <div>
                <h2>Choose payment option</h2>
                <p>Select a method supported by the backend.</p>
              </div>
            </div>

            <div className="payment-method-list">
              {PAYMENT_METHODS.map((method) => {
                const Icon = method.Icon;
                const selected = paymentMethod === method.value;

                return (
                  <label
                    key={method.value}
                    className={`payment-method-card ${
                      selected ? "payment-method-selected" : ""
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={method.value}
                      checked={selected}
                      disabled={submitting}
                      onChange={() =>
                        handlePaymentMethodChange(method.value)
                      }
                    />

                    <span
                      className={`payment-method-icon ${method.iconClass}`}
                    >
                      <Icon size={23} />
                    </span>

                    <span className="payment-method-copy">
                      <strong>{method.title}</strong>
                      <span>{method.description}</span>
                      <small>{method.note}</small>
                    </span>

                    <span className="payment-method-radio">
                      {selected && <span />}
                    </span>
                  </label>
                );
              })}
            </div>

            <div className="payment-address-section">
              <div className="payment-section-heading">
                <div className="payment-section-icon">
                  <MapPin size={21} />
                </div>
                <div>
                  <h2>Delivery address</h2>
                  <p>Confirm where this order should be delivered.</p>
                </div>
              </div>

              {selectedAddress ? (
                <div className="payment-address-card">
                  <div className="payment-address-card-top">
                    <span className="payment-address-type">
                      <MapPin size={14} />
                      {selectedAddress.addressType || "Address"}
                    </span>

                    {selectedAddress.isDefault && (
                      <span className="payment-address-default">
                        <CheckCircle2 size={13} />
                        Default
                      </span>
                    )}
                  </div>

                  <strong>{selectedAddress.fullName}</strong>
                  <p>{formatAddress(selectedAddress)}</p>
                  <span>{selectedAddress.phone}</span>

                  {selectedAddress.email && (
                    <span>{selectedAddress.email}</span>
                  )}

                  <Link
                    to="/checkout"
                    className="payment-change-address"
                  >
                    Change address <ArrowRight size={15} />
                  </Link>
                </div>
              ) : (
                <div className="payment-address-missing">
                  <MapPin size={25} />
                  <strong>No delivery address selected</strong>
                  <p>Return to checkout to add or select an address.</p>

                  <Link
                    to="/checkout"
                    className="payment-primary-button"
                  >
                    Select address <ArrowRight size={16} />
                  </Link>
                </div>
              )}
            </div>

            <div className="payment-info-note">
              <ShieldCheck size={18} />
              <p>
                Your delivery address and selected payment method will be sent
                to the existing backend APIs when you confirm the order.
              </p>
            </div>
          </section>

          <aside className="payment-summary">
            <span className="payment-eyebrow">YOUR PURCHASE</span>
            <h2>Order summary</h2>

            <div className="payment-summary-items">
              {items.map((item, index) => (
                <div
                  className="payment-summary-item"
                  key={item.productId ?? index}
                >
                  <div className="payment-summary-product-icon">
                    <ShoppingBag size={18} />
                    <span>{Number(item.quantity) || 0}</span>
                  </div>

                  <div className="payment-summary-product">
                    <strong>{item.productName || "Product"}</strong>
                    <span>
                      {formatPrice(item.price)} ×{" "}
                      {Number(item.quantity) || 0}
                    </span>
                  </div>

                  <strong className="payment-summary-line-price">
                    {formatPrice(
                      (Number(item.price) || 0) *
                        (Number(item.quantity) || 0)
                    )}
                  </strong>
                </div>
              ))}
            </div>

            <div className="payment-summary-row">
              <span>Products</span>
              <strong>{items.length}</strong>
            </div>

            <div className="payment-summary-row">
              <span>Total quantity</span>
              <strong>{totalQuantity}</strong>
            </div>

            <div className="payment-summary-row">
              <span>Shipping</span>
              <span>To be confirmed</span>
            </div>

            <div className="payment-summary-divider" />

            <div className="payment-summary-total">
              <span>Estimated total</span>
              <strong>{formatPrice(subtotal)}</strong>
            </div>

            <p className="payment-summary-disclaimer">
              The backend validates the final order total and available stock.
            </p>

            <div className="payment-delivery-estimate">
              <Truck size={19} />
              <div>
                <strong>Estimated delivery</strong>
                <span>{getExpectedDeliveryDate()}</span>
                <small>Estimate only; subject to order confirmation.</small>
              </div>
            </div>

            <div className="payment-selected-method">
              <span>Selected payment</span>
              <strong>
                {PAYMENT_METHODS.find(
                  (method) => method.value === paymentMethod
                )?.title ?? paymentMethod}
              </strong>
            </div>

            <button
              type="button"
              className="payment-primary-button payment-confirm-button"
              disabled={!selectedAddress || !items.length || submitting}
              onClick={handleConfirmOrder}
            >
              {submitting ? (
                <>
                  <span className="payment-button-spinner" />
                  Processing...
                </>
              ) : (
                <>
                  Confirm Order
                  <ArrowRight size={17} />
                </>
              )}
            </button>

            <p className="payment-confirm-note">
              Your order confirmation is shown only after both backend
              requests succeed.
            </p>

            <Link to="/checkout" className="payment-secondary-button">
              <ArrowLeft size={16} />
              Back to delivery address
            </Link>

            <div className="payment-secure-footer">
              <ShieldCheck size={16} />
              <span>Secure ShopNova checkout</span>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}