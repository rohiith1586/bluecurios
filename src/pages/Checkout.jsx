import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { supabase } from "../lib/supabase";
import { useStore } from "../lib/store.jsx";

export default function Checkout() {
  const navigate = useNavigate();
  const store = useStore();

  const cart = store?.cart || [];
  const clearCart = store?.clearCart || (() => {});

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [confirmed, setConfirmed] = useState(false);
  const [createdOrderNumber, setCreatedOrderNumber] = useState("");

  // IMPORTANT:
  // Stores the order amount BEFORE clearCart() empties the cart.
  const [confirmedTotal, setConfirmedTotal] = useState(0);

  const [upiReference, setUpiReference] = useState("");

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pin: "",
  });

  /*
   * ============================================================
   * UPI DETAILS
   * ============================================================
   */

  const UPI_ID = "rohiith1586@okicici";

  /*
   * QR IMAGE
   *
   * Your image is located at:
   *
   * public/upi-qr.jpg
   *
   * Therefore the browser path is:
   *
   * /upi-qr.jpg
   */

  const UPI_QR = "/upi-qr.jpg";

  /* ============================================================
     LOAD USER
  ============================================================ */

  useEffect(() => {
    loadUser();
  }, []);

  async function loadUser() {
    try {
      if (!supabase) {
        throw new Error("Supabase is not connected.");
      }

      const {
        data: { user: currentUser },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!currentUser) {
        setUser(null);
        return;
      }

      setUser(currentUser);

      setForm((current) => ({
        ...current,
        email: current.email || currentUser.email || "",
      }));
    } catch (err) {
      console.error("CHECKOUT USER ERROR:", err);

      setError(
        err?.message || "Unable to load your account."
      );
    } finally {
      setLoading(false);
    }
  }

  /* ============================================================
     FORM
  ============================================================ */

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  /* ============================================================
     CART HELPERS
  ============================================================ */

  function getItemPrice(item) {
    return Number(
      item?.product?.price ??
        item?.price ??
        item?.unit_price ??
        0
    );
  }

  function getItemQuantity(item) {
    const quantity = Number(item?.quantity ?? 1);

    return quantity > 0 ? quantity : 1;
  }

  function getItemProductId(item) {
    return (
      item?.product?.id ??
      item?.product_id ??
      null
    );
  }

  function getItemName(item) {
    return (
      item?.product?.name ??
      item?.product_name ??
      item?.name ??
      "Product"
    );
  }

  function getVariantLabel(item) {
    if (item?.variant_label) {
      return item.variant_label;
    }

    if (!item?.variant) {
      return null;
    }

    const parts = [];

    if (item.variant.color) {
      parts.push(`Color: ${item.variant.color}`);
    }

    if (item.variant.size) {
      parts.push(`Size: ${item.variant.size}`);
    }

    return parts.length
      ? parts.join(", ")
      : null;
  }

  /* ============================================================
     TOTALS
  ============================================================ */

  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => {
      const price = getItemPrice(item);
      const quantity = getItemQuantity(item);

      return sum + price * quantity;
    }, 0);
  }, [cart]);

  const shipping = 0;

  const total = subtotal + shipping;

  /* ============================================================
     FORMAT MONEY
  ============================================================ */

  function money(amount) {
    return `₹${Number(amount || 0).toLocaleString("en-IN")}`;
  }

  /* ============================================================
     ORDER NUMBER
  ============================================================ */

  function createOrderNumber() {
    const randomPart = Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase();

    return `BC-${Date.now()}-${randomPart}`;
  }

  /* ============================================================
     VALIDATION
  ============================================================ */

  function validateForm() {
    if (!form.full_name.trim()) {
      return "Please enter your full name.";
    }

    if (!form.email.trim()) {
      return "Please enter your email.";
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        form.email.trim()
      )
    ) {
      return "Please enter a valid email address.";
    }

    if (!form.phone.trim()) {
      return "Please enter your phone number.";
    }

    if (!/^\d{10}$/.test(form.phone.trim())) {
      return "Please enter a valid 10-digit phone number.";
    }

    if (!form.address.trim()) {
      return "Please enter your address.";
    }

    if (!form.city.trim()) {
      return "Please enter your city.";
    }

    if (!form.state.trim()) {
      return "Please enter your state.";
    }

    if (!form.pin.trim()) {
      return "Please enter your PIN code.";
    }

    if (!/^\d{6}$/.test(form.pin.trim())) {
      return "Please enter a valid 6-digit PIN code.";
    }

    if (!cart.length) {
      return "Your cart is empty.";
    }

    if (total <= 0) {
      return "Your order total must be greater than ₹0.";
    }

    return "";
  }

  /* ============================================================
     SUBMIT ORDER
  ============================================================ */

  async function handleCheckout(event) {
    event.preventDefault();

    if (processing) {
      return;
    }

    setError("");
    setSuccess("");

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    if (!upiReference.trim()) {
      setError(
        "Please enter the UPI transaction/reference ID after making the payment."
      );
      return;
    }

    setProcessing(true);

    try {
      /* ========================================================
         1. SUPABASE
      ======================================================== */

      if (!supabase) {
        throw new Error("Supabase is not connected.");
      }

      /* ========================================================
         2. CURRENT USER
      ======================================================== */

      const {
        data: { user: currentUser },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!currentUser) {
        setProcessing(false);

        navigate("/login", {
          state: {
            from: "/checkout",
          },
        });

        return;
      }

      setUser(currentUser);

      /* ========================================================
         3. SAVE ORDER TOTAL BEFORE ANYTHING CHANGES
      ======================================================== */

      /*
       * IMPORTANT FIX
       *
       * We save the current total now.
       * Later clearCart() will make total become ₹0,
       * but confirmedTotal will still contain the real
       * amount of this order.
       */

      const orderTotal = total;

      setConfirmedTotal(orderTotal);

      /* ========================================================
         4. ORDER NUMBER
      ======================================================== */

      const orderNumber = createOrderNumber();

      setCreatedOrderNumber(orderNumber);

      /* ========================================================
         5. SHIPPING DETAILS
      ======================================================== */

      const shippingAddress = {
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        pin: form.pin.trim(),

        payment_method: "UPI",
        upi_id: UPI_ID,
        upi_reference: upiReference.trim(),
        payment_submitted_at:
          new Date().toISOString(),
      };

      /* ========================================================
         6. CREATE ORDER
      ======================================================== */

      setSuccess("Creating your order...");

      const {
        data: order,
        error: orderError,
      } = await supabase
        .from("orders")
        .insert({
          user_id: currentUser.id,

          order_number: orderNumber,

          status: "pending",

          subtotal: subtotal,

          shipping: shipping,

          total: orderTotal,

          shipping_address: shippingAddress,
        })
        .select()
        .single();

      if (orderError) {
        console.error(
          "ORDER CREATE ERROR:",
          orderError
        );

        throw orderError;
      }

      if (!order?.id) {
        throw new Error(
          "Order was created but no order ID was returned."
        );
      }

      /* ========================================================
         7. CREATE ORDER ITEMS
      ======================================================== */

      setSuccess(
        "Saving your order items..."
      );

      const orderItems = cart.map((item) => ({
        order_id: order.id,

        product_id: getItemProductId(item),

        product_name: getItemName(item),

        variant_label: getVariantLabel(item),

        unit_price: getItemPrice(item),

        quantity: getItemQuantity(item),
      }));

      const { error: itemsError } =
        await supabase
          .from("order_items")
          .insert(orderItems);

      if (itemsError) {
        console.error(
          "ORDER ITEMS ERROR:",
          itemsError
        );

        throw itemsError;
      }

      /* ========================================================
         8. PAYMENT SUBMITTED
      ======================================================== */

      setSuccess(
        "Payment proof received. Confirming your order..."
      );

      /* ========================================================
         9. CLEAR CART
      ======================================================== */

      /*
       * IMPORTANT:
       *
       * confirmedTotal has already been saved above.
       *
       * So even after clearCart() makes the cart empty
       * and total becomes ₹0, the success screen will
       * continue showing the real order amount.
       */

      try {
        clearCart();
      } catch (cartError) {
        console.warn(
          "Could not clear cart:",
          cartError
        );
      }

      /* ========================================================
         10. SUCCESS
      ======================================================== */

      setProcessing(false);

      setSuccess("");

      setConfirmed(true);
    } catch (err) {
      console.error(
        "CHECKOUT ERROR:",
        err
      );

      setProcessing(false);

      setSuccess("");

      setError(
        err?.message ||
          "Unable to place your order. Your cart has not been cleared."
      );
    }
  }

  /* ============================================================
     LOADING
  ============================================================ */

  if (loading) {
    return (
      <section className="section">
        <div className="narrow">
          <p>Loading checkout...</p>
        </div>
      </section>
    );
  }

  /* ============================================================
     LOGIN REQUIRED
  ============================================================ */

  if (!user) {
    return (
      <section className="section">
        <div className="narrow">
          <span className="eyebrow">
            Checkout
          </span>

          <h1>Please sign in.</h1>

          <p className="lead">
            You need to be signed in before
            placing an order.
          </p>

          <button
            type="button"
            className="btn primary"
            onClick={() =>
              navigate("/login", {
                state: {
                  from: "/checkout",
                },
              })
            }
          >
            Sign in
          </button>
        </div>
      </section>
    );
  }

  /* ============================================================
     SUCCESS SCREEN
  ============================================================ */

  if (confirmed) {
    return (
      <section className="section">
        <div
          className="narrow"
          style={{
            maxWidth: 760,
            textAlign: "center",
            margin: "0 auto",
            paddingTop: 60,
            paddingBottom: 80,
          }}
        >
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              margin: "0 auto 24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 40,
              background: "#e8f6ed",
            }}
          >
            ✓
          </div>

          <span className="eyebrow">
            Order confirmed
          </span>

          <h1>
            🎉 Thank you for your order!
          </h1>

          <p
            className="lead"
            style={{
              maxWidth: 600,
              margin: "0 auto 24px",
            }}
          >
            Your UPI payment details have
            been submitted successfully.
            We will verify your payment and
            process your order.
          </p>

          <div
            style={{
              padding: 24,
              margin: "24px auto",
              maxWidth: 500,
              border: "1px solid #ddd",
              borderRadius: 16,
              background: "#faf9f6",
            }}
          >
            {/* ORDER NUMBER */}

            <p
              style={{
                margin: "0 0 8px",
                opacity: 0.7,
              }}
            >
              Order number
            </p>

            <strong
              style={{
                fontSize: 20,
              }}
            >
              {createdOrderNumber}
            </strong>

            {/* AMOUNT */}

            <div
              style={{
                marginTop: 18,
              }}
            >
              <p
                style={{
                  margin: "0 0 8px",
                  opacity: 0.7,
                }}
              >
                Amount
              </p>

              <strong
                style={{
                  fontSize: 22,
                }}
              >
                {money(confirmedTotal)}
              </strong>
            </div>

            {/* PAYMENT METHOD */}

            <div
              style={{
                marginTop: 18,
              }}
            >
              <p
                style={{
                  margin: "0 0 8px",
                  opacity: 0.7,
                }}
              >
                Payment method
              </p>

              <strong>
                UPI
              </strong>
            </div>

            {/* TRANSACTION REFERENCE */}

            <div
              style={{
                marginTop: 18,
              }}
            >
              <p
                style={{
                  margin: "0 0 8px",
                  opacity: 0.7,
                }}
              >
                Transaction reference
              </p>

              <strong
                style={{
                  wordBreak: "break-word",
                }}
              >
                {upiReference}
              </strong>
            </div>
          </div>

          <p
            style={{
              opacity: 0.7,
              marginBottom: 28,
            }}
          >
            Keep your UPI transaction reference
            until your payment has been verified.
          </p>

          <div
            style={{
              display: "flex",
              gap: 12,
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              className="btn primary"
              onClick={() =>
                navigate("/account")
              }
            >
              View my account
            </button>

            <button
              type="button"
              className="btn"
              onClick={() =>
                navigate("/shop")
              }
            >
              Continue shopping
            </button>
          </div>
        </div>
      </section>
    );
  }

  /* ============================================================
     EMPTY CART
  ============================================================ */

  if (!cart.length) {
    return (
      <section className="section">
        <div className="narrow">
          <span className="eyebrow">
            Checkout
          </span>

          <h1>Your cart is empty.</h1>

          <p className="lead">
            Add something beautiful to your
            cart before checking out.
          </p>

          <button
            type="button"
            className="btn primary"
            onClick={() =>
              navigate("/shop")
            }
          >
            Continue shopping
          </button>
        </div>
      </section>
    );
  }

  /* ============================================================
     MAIN CHECKOUT
  ============================================================ */

  return (
    <section className="section">
      <div className="narrow checkout-page">

        <span className="eyebrow">
          Checkout
        </span>

        <h1>
          Complete your order.
        </h1>

        <p className="lead">
          Enter your delivery details and
          pay securely using UPI.
        </p>

        {/* ERROR */}

        {error && (
          <div
            className="error-message"
            style={{
              marginBottom: 24,
              padding: 14,
              borderRadius: 10,
            }}
          >
            {error}
          </div>
        )}

        {/* SUCCESS / PROCESSING */}

        {success && (
          <div
            className="success-message"
            style={{
              marginBottom: 24,
              padding: 14,
              borderRadius: 10,
            }}
          >
            {success}
          </div>
        )}

        <div className="checkout-grid">

          {/* ==================================================
              LEFT
          ================================================== */}

          <form
            className="checkout-form"
            onSubmit={handleCheckout}
          >

            {/* CUSTOMER DETAILS */}

            <div className="checkout-card">

              <h2>
                Delivery details
              </h2>

              <label>
                Full name

                <input
                  type="text"
                  value={form.full_name}
                  onChange={(e) =>
                    updateField(
                      "full_name",
                      e.target.value
                    )
                  }
                  placeholder="Your full name"
                  autoComplete="name"
                  required
                  disabled={processing}
                />
              </label>

              <label>
                Email

                <input
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    updateField(
                      "email",
                      e.target.value
                    )
                  }
                  placeholder="your@email.com"
                  autoComplete="email"
                  required
                  disabled={processing}
                />
              </label>

              <label>
                Phone number

                <input
                  type="tel"
                  inputMode="numeric"
                  value={form.phone}
                  onChange={(e) =>
                    updateField(
                      "phone",
                      e.target.value
                        .replace(/\D/g, "")
                        .slice(0, 10)
                    )
                  }
                  placeholder="9876543210"
                  autoComplete="tel"
                  maxLength="10"
                  required
                  disabled={processing}
                />
              </label>

              <label>
                Address

                <textarea
                  value={form.address}
                  onChange={(e) =>
                    updateField(
                      "address",
                      e.target.value
                    )
                  }
                  placeholder="House number, street, area"
                  rows="4"
                  autoComplete="street-address"
                  required
                  disabled={processing}
                />
              </label>

              <div className="checkout-two-column">

                <label>
                  City

                  <input
                    type="text"
                    value={form.city}
                    onChange={(e) =>
                      updateField(
                        "city",
                        e.target.value
                      )
                    }
                    placeholder="Bengaluru"
                    autoComplete="address-level2"
                    required
                    disabled={processing}
                  />
                </label>

                <label>
                  State

                  <input
                    type="text"
                    value={form.state}
                    onChange={(e) =>
                      updateField(
                        "state",
                        e.target.value
                      )
                    }
                    placeholder="Karnataka"
                    autoComplete="address-level1"
                    required
                    disabled={processing}
                  />
                </label>

              </div>

              <label>
                PIN code

                <input
                  type="text"
                  inputMode="numeric"
                  value={form.pin}
                  onChange={(e) =>
                    updateField(
                      "pin",
                      e.target.value
                        .replace(/\D/g, "")
                        .slice(0, 6)
                    )
                  }
                  placeholder="560001"
                  autoComplete="postal-code"
                  maxLength="6"
                  required
                  disabled={processing}
                />
              </label>

            </div>

            {/* ==================================================
                UPI PAYMENT
            ================================================== */}

            <div className="checkout-card">

              <h2>
                Pay with UPI
              </h2>

              <p>
                Scan the QR code below with
                any UPI app and pay the exact
                order amount.
              </p>

              {/* QR IMAGE */}

              <div
                style={{
                  textAlign: "center",
                  margin: "28px 0",
                }}
              >
                <img
                  src={UPI_QR}
                  alt="BlueCurios UPI QR code"
                  className="upi-qr"
                  style={{
                    width: 260,
                    maxWidth: "100%",
                    height: "auto",
                    borderRadius: 16,
                    border: "1px solid #ddd",
                    display: "block",
                    margin: "0 auto",
                  }}
                  onError={(e) => {
                    e.currentTarget.style.display =
                      "none";

                    setError(
                      "UPI QR image could not be loaded. Make sure the file is named upi-qr.jpg and is inside the public folder."
                    );
                  }}
                />
              </div>

              {/* AMOUNT */}

              <div
                style={{
                  textAlign: "center",
                  marginBottom: 24,
                }}
              >

                <div
                  style={{
                    fontSize: 14,
                    opacity: 0.7,
                    marginBottom: 6,
                  }}
                >
                  Amount to pay
                </div>

                <strong
                  style={{
                    fontSize: 28,
                  }}
                >
                  {money(total)}
                </strong>

              </div>

              {/* UPI ID */}

              <div
                style={{
                  textAlign: "center",
                  marginBottom: 24,
                }}
              >

                <div
                  style={{
                    fontSize: 14,
                    opacity: 0.7,
                    marginBottom: 6,
                  }}
                >
                  UPI ID
                </div>

                <strong
                  style={{
                    fontSize: 18,
                  }}
                >
                  {UPI_ID}
                </strong>

              </div>

              {/* REFERENCE ID */}

              <label>
                UPI transaction / reference ID

                <input
                  type="text"
                  value={upiReference}
                  onChange={(e) =>
                    setUpiReference(
                      e.target.value
                    )
                  }
                  placeholder="Enter transaction ID"
                  required
                  disabled={processing}
                />
              </label>

              <p
                style={{
                  fontSize: 14,
                  opacity: 0.7,
                  marginTop: 8,
                }}
              >
                After completing the payment,
                enter the transaction/reference
                ID shown in your UPI app.
              </p>

              {/* SUBMIT */}

              <button
                type="submit"
                className="btn primary checkout-pay-button"
                disabled={
                  processing ||
                  !upiReference.trim()
                }
                style={{
                  marginTop: 20,
                }}
              >
                {processing
                  ? "Submitting order..."
                  : `I've Paid ${money(total)}`}
              </button>

            </div>

          </form>

          {/* ==================================================
              RIGHT — ORDER SUMMARY
          ================================================== */}

          <aside className="checkout-summary">

            <div className="checkout-card">

              <h2>
                Your order
              </h2>

              <div className="checkout-items">

                {cart.map(
                  (item, index) => {
                    const price =
                      getItemPrice(item);

                    const quantity =
                      getItemQuantity(item);

                    const itemName =
                      getItemName(item);

                    const variantLabel =
                      getVariantLabel(item);

                    return (
                      <div
                        key={
                          item.key ||
                          item.id ||
                          item.product?.id ||
                          index
                        }
                        className="checkout-item"
                      >

                        <div>

                          <strong>
                            {itemName}
                          </strong>

                          {variantLabel && (
                            <small
                              style={{
                                display: "block",
                              }}
                            >
                              {variantLabel}
                            </small>
                          )}

                          <small
                            style={{
                              display: "block",
                            }}
                          >
                            Qty: {quantity}
                          </small>

                        </div>

                        <strong>
                          {money(
                            price * quantity
                          )}
                        </strong>

                      </div>
                    );
                  }
                )}

              </div>

              {/* TOTALS */}

              <div className="checkout-totals">

                <div>
                  <span>
                    Subtotal
                  </span>

                  <strong>
                    {money(subtotal)}
                  </strong>
                </div>

                <div>
                  <span>
                    Shipping
                  </span>

                  <strong>
                    {shipping === 0
                      ? "Free"
                      : money(shipping)}
                  </strong>
                </div>

                <div className="total">

                  <span>
                    Total
                  </span>

                  <strong>
                    {money(total)}
                  </strong>

                </div>

              </div>

            </div>

          </aside>

        </div>
      </div>
    </section>
  );
}