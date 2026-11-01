import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Edit3,
  MapPin,
  Package,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Star,
  Trash2,
  Truck,
  X,
} from "lucide-react";
import api from "../services/api";
import "./CheckoutPage.css";

const SELECTED_ADDRESS_KEY = "shopnova_selected_address_id";

const EMPTY_ADDRESS = {
  fullName: "",
  email: "",
  phone: "",
  houseAddress: "",
  area: "",
  landmark: "",
  pincode: "",
  city: "",
  state: "",
  addressType: "Home",
  isDefault: false,
};

function readSavedUser() {
  try {
    const data = JSON.parse(localStorage.getItem("user") || "{}");
    return data?.user ?? data?.data ?? data ?? {};
  } catch {
    return {};
  }
}

function getNewAddress(isDefault = false) {
  const user = readSavedUser();

  return {
    ...EMPTY_ADDRESS,
    fullName: user?.name || user?.fullName || "",
    email: user?.email || "",
    phone: user?.phone || "",
    isDefault,
  };
}

function extractAddressList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.addresses)) return data.addresses;
  return [];
}

function extractResponseData(data) {
  return data?.data ?? data;
}

function getApiErrorMessage(error, fallback) {
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

export default function CheckoutPage() {
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Actual address data comes from the backend.
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(
    () => localStorage.getItem(SELECTED_ADDRESS_KEY) || ""
  );

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [addressForm, setAddressForm] = useState(() => getNewAddress());
  const [addressSavedMessage, setAddressSavedMessage] = useState("");
  const [addressBusy, setAddressBusy] = useState(false);

  function authConfig() {
    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
  }

  function redirectToLogin() {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("user");

    navigate("/login", {
      replace: true,
      state: { from: "/checkout" },
    });
  }

  async function reloadAddresses(preferredId = null) {
    const response = await api.get("/addresses", authConfig());
    const list = extractAddressList(response.data);

    setAddresses(list);

    const savedId = localStorage.getItem(SELECTED_ADDRESS_KEY);

    const preferred =
      preferredId !== null && preferredId !== ""
        ? list.find(
            (address) => String(address.id) === String(preferredId)
          )
        : null;

    const previouslySelected = savedId
      ? list.find((address) => String(address.id) === String(savedId))
      : null;

    const chosen =
      preferred ||
      previouslySelected ||
      list.find((address) => Boolean(address.isDefault)) ||
      list[0] ||
      null;

    if (chosen) {
      const id = String(chosen.id);
      localStorage.setItem(SELECTED_ADDRESS_KEY, id);
      setSelectedAddressId(id);
    } else {
      localStorage.removeItem(SELECTED_ADDRESS_KEY);
      setSelectedAddressId("");
    }

    return list;
  }

  useEffect(() => {
    let active = true;

    async function loadCheckoutData() {
      if (!token || !userId) {
        navigate("/login", {
          replace: true,
          state: { from: "/checkout" },
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
        redirectToLogin();
        return;
      }

      if (cartResult.status === "fulfilled") {
        const body = cartResult.value.data;
        const cartItems =
          body?.items ??
          body?.data?.items ??
          body?.cartItems ??
          [];

        setItems(Array.isArray(cartItems) ? cartItems : []);
      } else {
        setError(
          getApiErrorMessage(
            cartResult.reason,
            "Unable to load your cart. Please try again."
          )
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
          localStorage.setItem(SELECTED_ADDRESS_KEY, id);
          setSelectedAddressId(id);
        } else {
          localStorage.removeItem(SELECTED_ADDRESS_KEY);
          setSelectedAddressId("");
        }

        setFormOpen(list.length === 0);
        setAddressForm(getNewAddress(list.length === 0));
      } else {
        setAddresses([]);
        setSelectedAddressId("");
        setFormOpen(true);
        setAddressForm(getNewAddress(true));

        setError((current) =>
          current
            ? `${current} Saved delivery addresses could not be loaded.`
            : getApiErrorMessage(
                addressResult.reason,
                "Unable to load saved delivery addresses. Please try again."
              )
        );
      }

      setLoading(false);
    }

    loadCheckoutData().catch((loadError) => {
      if (!active) return;

      setError(
        getApiErrorMessage(
          loadError,
          "Unable to load checkout. Please try again."
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

  const selectedAddress = addresses.find(
    (address) => String(address.id) === String(selectedAddressId)
  );

  function updateAddressField(event) {
    const { name, value, type, checked } = event.target;

    setAddressForm((previous) => ({
      ...previous,
      [name]:
        type === "checkbox"
          ? checked
          : name === "phone" || name === "pincode"
            ? value.replace(/\D/g, "")
            : value,
    }));

    setError("");
    setAddressSavedMessage("");
  }

  function openAddAddress() {
    setEditingId(null);
    setAddressForm(getNewAddress(addresses.length === 0));
    setFormOpen(true);
    setError("");
    setAddressSavedMessage("");
  }

  function openEditAddress(address) {
    setEditingId(address.id);
    setAddressForm({ ...EMPTY_ADDRESS, ...address });
    setFormOpen(true);
    setError("");
    setAddressSavedMessage("");
  }

  function closeAddressForm() {
    setFormOpen(false);
    setEditingId(null);
    setAddressForm(getNewAddress(addresses.length === 0));
    setError("");
  }

  async function handleSaveAddress(event) {
    event.preventDefault();
    setError("");
    setAddressSavedMessage("");

    if (!/^[6-9]\d{9}$/.test(addressForm.phone)) {
      setError("Enter a valid 10-digit Indian mobile number.");
      return;
    }

    if (!/^\d{6}$/.test(addressForm.pincode)) {
      setError("Enter a valid 6-digit PIN code.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addressForm.email)) {
      setError("Enter a valid email address.");
      return;
    }

    const cleanedAddress = Object.fromEntries(
      Object.entries(addressForm).map(([key, value]) => [
        key,
        typeof value === "string" ? value.trim() : value,
      ])
    );

    cleanedAddress.isDefault =
      Boolean(cleanedAddress.isDefault) ||
      (!editingId && addresses.length === 0);

    setAddressBusy(true);

    try {
      const response = editingId
        ? await api.put(
            `/addresses/${editingId}`,
            cleanedAddress,
            authConfig()
          )
        : await api.post(
            "/addresses",
            cleanedAddress,
            authConfig()
          );

      const savedAddress = extractResponseData(response.data);
      const savedId = savedAddress?.id ?? editingId;

      const nextPreferredId =
        cleanedAddress.isDefault || !selectedAddressId
          ? savedId
          : selectedAddressId;

      await reloadAddresses(nextPreferredId);

      setFormOpen(false);
      setEditingId(null);
      setAddressForm(getNewAddress(false));

      setAddressSavedMessage(
        editingId
          ? "Address updated successfully to your ShopNova account."
          : "Address saved successfully to your ShopNova account."
      );
    } catch (saveError) {
      if (isAuthError(saveError)) {
        redirectToLogin();
        return;
      }

      setError(
        getApiErrorMessage(
          saveError,
          "Unable to save this address. Please try again."
        )
      );
    } finally {
      setAddressBusy(false);
    }
  }

  function chooseAddress(id) {
    const normalizedId = String(id);

    setSelectedAddressId(normalizedId);
    localStorage.setItem(SELECTED_ADDRESS_KEY, normalizedId);
    setAddressSavedMessage("");
    setError("");
  }

  async function makeDefaultAddress(id) {
    setError("");
    setAddressSavedMessage("");
    setAddressBusy(true);

    try {
      await api.patch(
        `/addresses/${id}/default`,
        {},
        authConfig()
      );

      await reloadAddresses(id);
      setAddressSavedMessage("Default delivery address updated.");
    } catch (requestError) {
      if (isAuthError(requestError)) {
        redirectToLogin();
        return;
      }

      setError(
        getApiErrorMessage(
          requestError,
          "Unable to set the default address. Please try again."
        )
      );
    } finally {
      setAddressBusy(false);
    }
  }

  async function removeAddress(id) {
    const addressToRemove = addresses.find(
      (address) => String(address.id) === String(id)
    );

    if (!addressToRemove) return;

    setError("");
    setAddressSavedMessage("");
    setAddressBusy(true);

    const wasSelected = String(selectedAddressId) === String(id);

    try {
      await api.delete(`/addresses/${id}`, authConfig());

      if (wasSelected) {
        localStorage.removeItem(SELECTED_ADDRESS_KEY);
      }

      await reloadAddresses(wasSelected ? null : selectedAddressId);

      setAddressSavedMessage(
        "Address removed from your ShopNova account."
      );
    } catch (requestError) {
      if (isAuthError(requestError)) {
        redirectToLogin();
        return;
      }

      setError(
        getApiErrorMessage(
          requestError,
          "Unable to remove this address. Please try again."
        )
      );
    } finally {
      setAddressBusy(false);
    }
  }

  function continueToPayment() {
    setError("");

    if (!selectedAddress) {
      setError("Please add or select a delivery address first.");
      return;
    }

    localStorage.setItem(
      SELECTED_ADDRESS_KEY,
      String(selectedAddress.id)
    );

    navigate("/payment");
  }

  if (loading) {
    return (
      <main className="checkout-page">
        <div className="checkout-loading">
          <span className="checkout-spinner" />
          Loading checkout...
        </div>
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main className="checkout-page">
        <div className="checkout-empty">
          <ShoppingBag size={40} />
          <h1>Your cart is empty</h1>
          <p>Add products before proceeding to checkout.</p>

          {error && <div className="checkout-error">{error}</div>}

          <Link to="/products" className="checkout-primary-button">
            Explore products <ArrowRight size={17} />
          </Link>

          <Link to="/cart" className="checkout-back-button">
            Back to cart
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="checkout-page">
      <div className="checkout-container">
        <nav className="checkout-breadcrumb" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <span>/</span>
          <Link to="/cart">Cart</Link>
          <span>/</span>
          <span>Checkout</span>
        </nav>

        <header className="checkout-heading">
          <div>
            <span className="checkout-eyebrow">SHOPNOVA CHECKOUT</span>
            <h1>
              Delivery details<span>.</span>
            </h1>
            <p>Choose where you want your order delivered.</p>
          </div>

          <div className="checkout-secure-label">
            <ShieldCheck size={18} />
            Secure checkout
          </div>
        </header>

        <div className="checkout-steps">
          <div className="checkout-step checkout-step-complete">
            <span><CheckCircle2 size={17} /></span>
            <div>
              <strong>Shopping bag</strong>
              <small>Products selected</small>
            </div>
          </div>

          <div className="checkout-step-line" />

          <div className="checkout-step checkout-step-active">
            <span><MapPin size={17} /></span>
            <div>
              <strong>Delivery address</strong>
              <small>Choose or add an address</small>
            </div>
          </div>

          <div className="checkout-step-line" />

          <div className="checkout-step">
            <span><Package size={17} /></span>
            <div>
              <strong>Order confirmation</strong>
              <small>After backend integration</small>
            </div>
          </div>
        </div>

        {error && (
          <div className="checkout-error" role="alert">
            {error}
          </div>
        )}

        {addressSavedMessage && (
          <div
            className="checkout-address-book-success"
            role="status"
          >
            <CheckCircle2 size={18} />
            {addressSavedMessage}
          </div>
        )}

        <div className="checkout-layout">
          <section className="checkout-form-card">
            <div className="checkout-card-heading">
              <div className="checkout-card-icon">
                <MapPin size={21} />
              </div>
              <div>
                <h2>Delivery addresses</h2>
                <p>
                  Select a saved address, set a default or add another address.
                </p>
              </div>
            </div>

            <div className="checkout-address-book">
              {addresses.length === 0 ? (
                <div className="checkout-no-address">
                  <MapPin size={27} />
                  <strong>No saved addresses yet</strong>
                  <p>Add a delivery address to continue.</p>
                </div>
              ) : (
                <div className="checkout-address-list">
                  {addresses.map((address) => {
                    const selected =
                      String(selectedAddressId) === String(address.id);

                    return (
                      <article
                        key={address.id}
                        className={
                          selected
                            ? "checkout-saved-address checkout-saved-address-selected"
                            : "checkout-saved-address"
                        }
                      >
                        <label className="checkout-address-select">
                          <input
                            type="radio"
                            name="selectedAddress"
                            value={address.id}
                            checked={selected}
                            onChange={() => chooseAddress(address.id)}
                          />

                          <span className="checkout-address-type-badge">
                            <MapPin size={14} />
                            {address.addressType}
                          </span>

                          {address.isDefault && (
                            <span className="checkout-default-badge">
                              <Star size={12} />
                              Default
                            </span>
                          )}
                        </label>

                        <div className="checkout-saved-address-body">
                          <strong>{address.fullName}</strong>
                          <p>{formatAddress(address)}</p>
                          <span>{address.phone}</span>
                          <span>{address.email}</span>
                        </div>

                        <div className="checkout-address-card-actions">
                          {!address.isDefault && (
                            <button
                              type="button"
                              disabled={addressBusy}
                              onClick={() =>
                                makeDefaultAddress(address.id)
                              }
                            >
                              <Star size={14} />
                              Set default
                            </button>
                          )}

                          <button
                            type="button"
                            disabled={addressBusy}
                            onClick={() => openEditAddress(address)}
                          >
                            <Edit3 size={14} />
                            Edit
                          </button>

                          <button
                            type="button"
                            className="checkout-delete-address"
                            disabled={addressBusy}
                            onClick={() => removeAddress(address.id)}
                          >
                            <Trash2 size={14} />
                            Remove
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}

              {!formOpen && (
                <button
                  type="button"
                  className="checkout-add-address-button"
                  onClick={openAddAddress}
                >
                  <Plus size={18} />
                  Add new address
                </button>
              )}
            </div>

            {formOpen && (
              <div className="checkout-address-form-panel">
                <div className="checkout-address-form-heading">
                  <div>
                    <span className="checkout-eyebrow">
                      {editingId ? "EDIT ADDRESS" : "NEW DELIVERY ADDRESS"}
                    </span>
                    <h3>
                      {editingId ? "Update address" : "Add an address"}
                    </h3>
                  </div>

                  {addresses.length > 0 && (
                    <button
                      type="button"
                      className="checkout-close-form"
                      onClick={closeAddressForm}
                      aria-label="Close address form"
                    >
                      <X size={19} />
                    </button>
                  )}
                </div>

                <form
                  className="checkout-form"
                  onSubmit={handleSaveAddress}
                >
                  <div className="checkout-field">
                    <label htmlFor="checkout-fullName">Full name *</label>
                    <input
                      id="checkout-fullName"
                      name="fullName"
                      value={addressForm.fullName}
                      onChange={updateAddressField}
                      placeholder="Recipient's full name"
                      autoComplete="name"
                      maxLength={100}
                      required
                    />
                  </div>

                  <div className="checkout-field">
                    <label htmlFor="checkout-email">Email address *</label>
                    <input
                      id="checkout-email"
                      name="email"
                      type="email"
                      value={addressForm.email}
                      onChange={updateAddressField}
                      placeholder="you@example.com"
                      autoComplete="email"
                      maxLength={150}
                      required
                    />
                  </div>

                  <div className="checkout-field">
                    <label htmlFor="checkout-phone">Mobile number *</label>
                    <input
                      id="checkout-phone"
                      name="phone"
                      type="tel"
                      inputMode="numeric"
                      value={addressForm.phone}
                      onChange={updateAddressField}
                      placeholder="10-digit mobile number"
                      autoComplete="tel"
                      maxLength={10}
                      pattern="[6-9][0-9]{9}"
                      required
                    />
                  </div>

                  <div className="checkout-field">
                    <label htmlFor="checkout-pincode">PIN code *</label>
                    <input
                      id="checkout-pincode"
                      name="pincode"
                      inputMode="numeric"
                      value={addressForm.pincode}
                      onChange={updateAddressField}
                      placeholder="6-digit PIN code"
                      autoComplete="postal-code"
                      maxLength={6}
                      pattern="[0-9]{6}"
                      required
                    />
                  </div>

                  <div className="checkout-field checkout-field-full">
                    <label htmlFor="checkout-houseAddress">
                      House / Flat / Building / Street *
                    </label>
                    <input
                      id="checkout-houseAddress"
                      name="houseAddress"
                      value={addressForm.houseAddress}
                      onChange={updateAddressField}
                      placeholder="House number, building name, street"
                      autoComplete="street-address"
                      maxLength={200}
                      required
                    />
                  </div>

                  <div className="checkout-field checkout-field-full">
                    <label htmlFor="checkout-area">Area / Locality *</label>
                    <input
                      id="checkout-area"
                      name="area"
                      value={addressForm.area}
                      onChange={updateAddressField}
                      placeholder="Locality, sector or colony"
                      maxLength={150}
                      required
                    />
                  </div>

                  <div className="checkout-field checkout-field-full">
                    <label htmlFor="checkout-landmark">
                      Landmark <span>(optional)</span>
                    </label>
                    <input
                      id="checkout-landmark"
                      name="landmark"
                      value={addressForm.landmark}
                      onChange={updateAddressField}
                      placeholder="Nearby landmark"
                      maxLength={150}
                    />
                  </div>

                  <div className="checkout-field">
                    <label htmlFor="checkout-city">City *</label>
                    <input
                      id="checkout-city"
                      name="city"
                      value={addressForm.city}
                      onChange={updateAddressField}
                      placeholder="City"
                      autoComplete="address-level2"
                      maxLength={100}
                      required
                    />
                  </div>

                  <div className="checkout-field">
                    <label htmlFor="checkout-state">State *</label>
                    <input
                      id="checkout-state"
                      name="state"
                      value={addressForm.state}
                      onChange={updateAddressField}
                      placeholder="State"
                      autoComplete="address-level1"
                      maxLength={100}
                      required
                    />
                  </div>

                  <div className="checkout-field checkout-field-full">
                    <span className="checkout-field-label">Address type</span>
                    <div className="checkout-address-types">
                      {["Home", "Work", "Other"].map((type) => (
                        <label
                          key={type}
                          className={
                            addressForm.addressType === type
                              ? "checkout-address-type checkout-address-type-active"
                              : "checkout-address-type"
                          }
                        >
                          <input
                            type="radio"
                            name="addressType"
                            value={type}
                            checked={addressForm.addressType === type}
                            onChange={updateAddressField}
                          />
                          {type}
                        </label>
                      ))}
                    </div>
                  </div>

                  <label className="checkout-default-checkbox checkout-field-full">
                    <input
                      type="checkbox"
                      name="isDefault"
                      checked={Boolean(addressForm.isDefault)}
                      onChange={updateAddressField}
                    />
                    <span>Set as my default delivery address</span>
                  </label>

                  <div className="checkout-form-actions checkout-field-full">
                    <button
                      type="button"
                      className="checkout-back-button"
                      onClick={closeAddressForm}
                      disabled={addressBusy}
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      className="checkout-primary-button"
                      disabled={addressBusy}
                    >
                      {addressBusy
                        ? "Saving..."
                        : editingId
                          ? "Save changes"
                          : "Save address"}
                      <ArrowRight size={17} />
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="checkout-selected-address-note">
              <ShieldCheck size={17} />
              <span>
                Your saved delivery addresses are synced with your ShopNova account.
              </span>
            </div>
          </section>

          <aside className="checkout-summary">
            <span className="checkout-eyebrow">YOUR PURCHASE</span>
            <h2>Order summary</h2>

            <div className="checkout-summary-items">
              {items.map((item, index) => (
                <div
                  className="checkout-summary-item"
                  key={item.productId ?? index}
                >
                  <div className="checkout-summary-product-icon">
                    <ShoppingBag size={19} />
                    <span>{Number(item.quantity) || 0}</span>
                  </div>

                  <div className="checkout-summary-product">
                    <strong>{item.productName || "Product"}</strong>
                    <span>
                      {formatPrice(item.price)} × {Number(item.quantity) || 0}
                    </span>
                  </div>

                  <strong className="checkout-summary-line-price">
                    {formatPrice(
                      (Number(item.price) || 0) *
                        (Number(item.quantity) || 0)
                    )}
                  </strong>
                </div>
              ))}
            </div>

            <div className="checkout-summary-row">
              <span>Products</span>
              <span>{items.length}</span>
            </div>

            <div className="checkout-summary-row">
              <span>Total quantity</span>
              <span>{totalQuantity}</span>
            </div>

            <div className="checkout-summary-row">
              <span>Shipping</span>
              <span>To be confirmed</span>
            </div>

            <div className="checkout-summary-divider" />

            <div className="checkout-summary-total">
              <span>Estimated total</span>
              <strong>{formatPrice(subtotal)}</strong>
            </div>

            <p className="checkout-summary-note">
              Final amount and shipping charges must be confirmed by the
              backend before the order is submitted.
            </p>

            <div className="checkout-delivery-note">
              <Truck size={19} />
              <span>
                Expected delivery will be confirmed when the backend creates
                the order.
              </span>
            </div>

            <div className="checkout-address-preview">
              <span className="checkout-eyebrow">DELIVER TO</span>

              {selectedAddress ? (
                <>
                  <strong>{selectedAddress.fullName}</strong>
                  <span>{selectedAddress.phone}</span>
                  <span>{selectedAddress.email}</span>
                  <p>{formatAddress(selectedAddress)}</p>
                  <span className="checkout-preview-type">
                    {selectedAddress.addressType}
                    {selectedAddress.isDefault ? " · Default address" : ""}
                  </span>
                </>
              ) : (
                <p>Select or add a delivery address to see it here.</p>
              )}
            </div>

            <button
              type="button"
              className="checkout-primary-button checkout-confirm-placeholder"
              disabled={!selectedAddress || addressBusy}
              onClick={continueToPayment}
            >
              Continue to payment
              <ArrowRight size={17} />
            </button>

            <p className="checkout-summary-note">
              Order placement will be enabled after payment and backend order integration.
            </p>

            <Link
              to="/cart"
              className="checkout-back-button checkout-summary-back"
            >
              <ArrowLeft size={16} />
              Back to cart
            </Link>
          </aside>
        </div>
      </div>
    </main>
  );
}