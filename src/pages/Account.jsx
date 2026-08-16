import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function Account() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const [orders, setOrders] = useState([]);

  const [loading, setLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(false);

  const [error, setError] = useState("");

  /* ============================================================
     LOAD ACCOUNT
  ============================================================ */

  useEffect(() => {
    let mounted = true;

    async function loadAccount() {
      try {
        setLoading(true);
        setError("");

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

        if (!mounted) return;

        setUser(currentUser);

        /* ======================================================
           NOT LOGGED IN
        ====================================================== */

        if (!currentUser) {
          setIsAdmin(false);
          setOrders([]);
          return;
        }

        /* ======================================================
           CHECK ADMIN ROLE
        ====================================================== */

        const {
          data: profile,
          error: profileError,
        } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", currentUser.id)
          .maybeSingle();

        if (profileError) {
          console.error("Profile error:", profileError);
        }

        const admin = profile?.role === "admin";

        if (!mounted) return;

        setIsAdmin(admin);

        /* ======================================================
           LOAD ORDERS
        ====================================================== */

        await loadOrders(currentUser.id, admin);
      } catch (err) {
        console.error("Account loading error:", err);

        if (mounted) {
          setError(
            err?.message ||
              "Unable to load your account."
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadAccount();

    return () => {
      mounted = false;
    };
  }, []);

  /* ============================================================
     LOAD ORDERS
  ============================================================ */

  async function loadOrders(userId, admin) {
    try {
      setOrdersLoading(true);
      setError("");

      if (!supabase) {
        throw new Error("Supabase is not connected.");
      }

      let query = supabase
        .from("orders")
        .select("*")
        .order("created_at", {
          ascending: false,
        });

      /*
       * CUSTOMER:
       * Only show orders belonging to the logged-in customer.
       */

      if (!admin) {
        query = query.eq("user_id", userId);
      }

      /*
       * ADMIN:
       * No user_id filter, so admin sees all orders.
       */

      const {
        data,
        error: ordersError,
      } = await query;

      if (ordersError) {
        console.error(
          "Orders loading error:",
          ordersError
        );

        throw ordersError;
      }

      setOrders(data || []);
    } catch (err) {
      console.error(
        "LOAD ORDERS ERROR:",
        err
      );

      setOrders([]);

      setError(
        err?.message ||
          "Unable to load orders."
      );
    } finally {
      setOrdersLoading(false);
    }
  }

  /* ============================================================
     REFRESH ORDERS
  ============================================================ */

  async function refreshOrders() {
    if (!user) return;

    await loadOrders(
      user.id,
      isAdmin
    );
  }

  /* ============================================================
     SIGN OUT
  ============================================================ */

  async function signOut() {
    await supabase.auth.signOut();

    navigate("/login");
  }

  /* ============================================================
     MONEY
  ============================================================ */

  function money(amount) {
    return `₹${Number(
      amount || 0
    ).toLocaleString("en-IN")}`;
  }

  /* ============================================================
     DATE
  ============================================================ */

  function formatDate(date) {
    if (!date) {
      return "Date unavailable";
    }

    try {
      return new Date(date).toLocaleString(
        "en-IN",
        {
          dateStyle: "medium",
          timeStyle: "short",
        }
      );
    } catch {
      return date;
    }
  }

  /* ============================================================
     STATUS
  ============================================================ */

  function formatStatus(status) {
    if (!status) {
      return "Pending";
    }

    return String(status)
      .replace(/_/g, " ")
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase()
      );
  }

  function statusStyle(status) {
    const value = String(
      status || "pending"
    ).toLowerCase();

    if (
      value === "paid" ||
      value === "confirmed" ||
      value === "completed"
    ) {
      return {
        background: "#e8f6ed",
        color: "#176b3a",
      };
    }

    if (
      value === "cancelled" ||
      value === "canceled"
    ) {
      return {
        background: "#fdeaea",
        color: "#a12626",
      };
    }

    if (
      value === "shipped" ||
      value === "processing"
    ) {
      return {
        background: "#eef4f8",
        color: "#28566f",
      };
    }

    return {
      background: "#fff4dc",
      color: "#8a5b00",
    };
  }

  /* ============================================================
     SHIPPING ADDRESS
  ============================================================ */

  function getShipping(order) {
    if (
      !order ||
      !order.shipping_address
    ) {
      return {};
    }

    if (
      typeof order.shipping_address ===
      "string"
    ) {
      try {
        return JSON.parse(
          order.shipping_address
        );
      } catch {
        return {};
      }
    }

    return order.shipping_address;
  }

  /* ============================================================
     LOADING
  ============================================================ */

  if (loading) {
    return (
      <section className="section account-page">
        <div className="narrow">
          <p>Loading account...</p>
        </div>
      </section>
    );
  }

  /* ============================================================
     LOGIN REQUIRED
  ============================================================ */

  if (!user) {
    return (
      <section className="section account-page">
        <div className="narrow">
          <span className="eyebrow">
            Your space
          </span>

          <h1>Account.</h1>

          <p className="lead">
            Sign in to view your orders,
            saved addresses and wishlist.
          </p>

          <div className="account-grid">
            <Link to="/login">
              Login
            </Link>

            <Link to="/signup">
              Create account
            </Link>

            <Link to="/wishlist">
              Wishlist
            </Link>
          </div>
        </div>
      </section>
    );
  }

  /* ============================================================
     ACCOUNT
  ============================================================ */

  return (
    <section className="section account-page">
      <div className="narrow">

        {/* ======================================================
            HEADER
        ====================================================== */}

        <span className="eyebrow">
          {isAdmin
            ? "Studio control"
            : "Your space"}
        </span>

        <h1>
          {isAdmin
            ? "Admin account."
            : "Account."}
        </h1>

        <p className="lead">
          You are signed in as{" "}
          <strong>
            {user.email}
          </strong>
          .
        </p>

        {/* ======================================================
            ERROR
        ====================================================== */}

        {error && (
          <div
            style={{
              marginTop: 24,
              padding: 16,
              borderRadius: 12,
              background: "#fdeaea",
              color: "#9b2222",
              border:
                "1px solid #efcaca",
            }}
          >
            <strong>
              Unable to load orders
            </strong>

            <div
              style={{
                marginTop: 6,
              }}
            >
              {error}
            </div>
          </div>
        )}

        {/* ======================================================
            ADMIN AREA
        ====================================================== */}

        {isAdmin && (
          <div
            style={{
              marginTop: 30,
              padding: 28,
              border:
                "1px solid #d8d4cd",
              borderRadius: 18,
              background: "#fff",
            }}
          >
            <span className="eyebrow">
              Administrator
            </span>

            <h2
              style={{
                marginTop: 10,
              }}
            >
              BlueCurious Studio
            </h2>

            <p>
              Manage products, images,
              orders and your store
              catalogue.
            </p>

            <Link
              to="/admin"
              style={{
                display: "inline-block",
                marginTop: 15,
                padding:
                  "14px 22px",
                borderRadius:
                  "999px",
                background:
                  "#1f2b2f",
                color: "#fff",
                textDecoration:
                  "none",
              }}
            >
              Open Admin Dashboard →
            </Link>
          </div>
        )}

        {/* ======================================================
            CUSTOMER LINKS
        ====================================================== */}

        {!isAdmin && (
          <div
            className="account-grid"
            style={{
              marginTop: 30,
            }}
          >
            <Link to="/shop">
              Continue shopping
            </Link>

            <Link to="/wishlist">
              Wishlist
            </Link>
          </div>
        )}

        {/* ======================================================
            ORDER HISTORY
        ====================================================== */}

        <div
          style={{
            marginTop: 50,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              alignItems: "center",
              gap: 20,
              flexWrap: "wrap",
            }}
          >
            <div>
              <span className="eyebrow">
                {isAdmin
                  ? "Store orders"
                  : "Your purchases"}
              </span>

              <h2
                style={{
                  marginTop: 8,
                }}
              >
                {isAdmin
                  ? "All orders."
                  : "Order history."}
              </h2>
            </div>

            <button
              type="button"
              onClick={refreshOrders}
              disabled={
                ordersLoading
              }
              style={{
                padding:
                  "10px 18px",
                borderRadius:
                  "999px",
                border:
                  "1px solid #d8d4cd",
                background:
                  "#fff",
                cursor:
                  ordersLoading
                    ? "default"
                    : "pointer",
              }}
            >
              {ordersLoading
                ? "Refreshing..."
                : "Refresh orders"}
            </button>
          </div>

          {/* ====================================================
              LOADING ORDERS
          ==================================================== */}

          {ordersLoading && (
            <div
              style={{
                marginTop: 25,
                padding: 25,
                border:
                  "1px solid #ddd",
                borderRadius: 16,
              }}
            >
              Loading orders...
            </div>
          )}

          {/* ====================================================
              NO ORDERS
          ==================================================== */}

          {!ordersLoading &&
            orders.length === 0 && (
              <div
                style={{
                  marginTop: 25,
                  padding: 30,
                  border:
                    "1px solid #ddd",
                  borderRadius: 18,
                  background:
                    "#faf9f6",
                }}
              >
                <h3>
                  {isAdmin
                    ? "No orders yet."
                    : "You have no orders yet."}
                </h3>

                <p
                  style={{
                    opacity: 0.7,
                  }}
                >
                  {isAdmin
                    ? "Orders placed by customers will appear here."
                    : "Your completed orders will appear here after you place an order."}
                </p>

                {!isAdmin && (
                  <Link
                    to="/shop"
                    className="btn primary"
                    style={{
                      display:
                        "inline-block",
                      marginTop: 10,
                    }}
                  >
                    Start shopping
                  </Link>
                )}
              </div>
            )}

          {/* ====================================================
              ORDERS
          ==================================================== */}

          {!ordersLoading &&
            orders.length > 0 && (
              <div
                style={{
                  display: "grid",
                  gap: 20,
                  marginTop: 25,
                }}
              >
                {orders.map(
                  (order) => {
                    const shippingAddress =
                      getShipping(
                        order
                      );

                    const orderStatus =
                      order.status ||
                      "pending";

                    const paymentMethod =
                      shippingAddress.payment_method ||
                      "UPI";

                    const upiReference =
                      shippingAddress.upi_reference ||
                      "";

                    return (
                      <div
                        key={
                          order.id ||
                          order.order_number
                        }
                        style={{
                          border:
                            "1px solid #ddd",
                          borderRadius:
                            18,
                          padding: 25,
                          background:
                            "#fff",
                        }}
                      >

                        {/* ORDER HEADER */}

                        <div
                          style={{
                            display:
                              "flex",
                            justifyContent:
                              "space-between",
                            alignItems:
                              "flex-start",
                            gap: 20,
                            flexWrap:
                              "wrap",
                          }}
                        >
                          <div>
                            <div
                              style={{
                                fontSize:
                                  13,
                                opacity:
                                  0.65,
                                marginBottom:
                                  5,
                              }}
                            >
                              Order number
                            </div>

                            <strong
                              style={{
                                fontSize:
                                  18,
                              }}
                            >
                              {order.order_number ||
                                order.id}
                            </strong>

                            <div
                              style={{
                                marginTop:
                                  8,
                                fontSize:
                                  14,
                                opacity:
                                  0.65,
                              }}
                            >
                              {formatDate(
                                order.created_at
                              )}
                            </div>
                          </div>

                          <span
                            style={{
                              display:
                                "inline-block",
                              padding:
                                "8px 14px",
                              borderRadius:
                                "999px",
                              fontSize:
                                13,
                              fontWeight:
                                600,
                              ...statusStyle(
                                orderStatus
                              ),
                            }}
                          >
                            {formatStatus(
                              orderStatus
                            )}
                          </span>
                        </div>

                        {/* ORDER INFORMATION */}

                        <div
                          style={{
                            display:
                              "grid",
                            gridTemplateColumns:
                              "repeat(auto-fit, minmax(180px, 1fr))",
                            gap: 18,
                            marginTop:
                              25,
                            paddingTop:
                              20,
                            borderTop:
                              "1px solid #eee",
                          }}
                        >

                          <div>
                            <div
                              style={{
                                fontSize:
                                  13,
                                opacity:
                                  0.65,
                              }}
                            >
                              Total
                            </div>

                            <strong
                              style={{
                                fontSize:
                                  20,
                              }}
                            >
                              {money(
                                order.total
                              )}
                            </strong>
                          </div>

                          <div>
                            <div
                              style={{
                                fontSize:
                                  13,
                                opacity:
                                  0.65,
                              }}
                            >
                              Payment
                            </div>

                            <strong>
                              {paymentMethod}
                            </strong>
                          </div>

                          <div>
                            <div
                              style={{
                                fontSize:
                                  13,
                                opacity:
                                  0.65,
                              }}
                            >
                              UPI reference
                            </div>

                            <strong
                              style={{
                                wordBreak:
                                  "break-word",
                              }}
                            >
                              {upiReference ||
                                "Not provided"}
                            </strong>
                          </div>
                        </div>

                        {/* CUSTOMER DETAILS FOR ADMIN */}

                        {isAdmin && (
                          <div
                            style={{
                              marginTop:
                                20,
                              paddingTop:
                                20,
                              borderTop:
                                "1px solid #eee",
                            }}
                          >
                            <h3
                              style={{
                                margin:
                                  "0 0 12px",
                              }}
                            >
                              Customer
                            </h3>

                            <p
                              style={{
                                margin:
                                  "5px 0",
                              }}
                            >
                              <strong>
                                Name:
                              </strong>{" "}
                              {shippingAddress.full_name ||
                                "—"}
                            </p>

                            <p
                              style={{
                                margin:
                                  "5px 0",
                              }}
                            >
                              <strong>
                                Email:
                              </strong>{" "}
                              {shippingAddress.email ||
                                "—"}
                            </p>

                            <p
                              style={{
                                margin:
                                  "5px 0",
                              }}
                            >
                              <strong>
                                Phone:
                              </strong>{" "}
                              {shippingAddress.phone ||
                                "—"}
                            </p>

                            <p
                              style={{
                                margin:
                                  "5px 0",
                              }}
                            >
                              <strong>
                                Address:
                              </strong>{" "}
                              {shippingAddress.address ||
                                "—"}
                            </p>

                            <p
                              style={{
                                margin:
                                  "5px 0",
                              }}
                            >
                              <strong>
                                City:
                              </strong>{" "}
                              {shippingAddress.city ||
                                "—"}
                            </p>

                            <p
                              style={{
                                margin:
                                  "5px 0",
                              }}
                            >
                              <strong>
                                State:
                              </strong>{" "}
                              {shippingAddress.state ||
                                "—"}
                            </p>

                            <p
                              style={{
                                margin:
                                  "5px 0",
                              }}
                            >
                              <strong>
                                PIN:
                              </strong>{" "}
                              {shippingAddress.pin ||
                                "—"}
                            </p>
                          </div>
                        )}

                        {/* CUSTOMER DELIVERY DETAILS */}

                        {!isAdmin && (
                          <div
                            style={{
                              marginTop:
                                20,
                              paddingTop:
                                20,
                              borderTop:
                                "1px solid #eee",
                            }}
                          >
                            <h3
                              style={{
                                margin:
                                  "0 0 10px",
                              }}
                            >
                              Delivery
                            </h3>

                            <p
                              style={{
                                margin:
                                  "5px 0",
                              }}
                            >
                              {shippingAddress.full_name ||
                                ""}
                            </p>

                            <p
                              style={{
                                margin:
                                  "5px 0",
                              }}
                            >
                              {shippingAddress.address ||
                                ""}
                            </p>

                            <p
                              style={{
                                margin:
                                  "5px 0",
                              }}
                            >
                              {shippingAddress.city ||
                                ""}
                              {shippingAddress.city &&
                              shippingAddress.state
                                ? ", "
                                : ""}
                              {shippingAddress.state ||
                                ""}
                            </p>

                            <p
                              style={{
                                margin:
                                  "5px 0",
                              }}
                            >
                              PIN:{" "}
                              {shippingAddress.pin ||
                                "—"}
                            </p>
                          </div>
                        )}

                      </div>
                    );
                  }
                )}
              </div>
            )}
        </div>

        {/* ======================================================
            SIGN OUT
        ====================================================== */}

        <button
          onClick={signOut}
          style={{
            marginTop: 35,
            padding:
              "13px 22px",
            border: "none",
            borderRadius:
              "999px",
            cursor:
              "pointer",
          }}
        >
          Sign out
        </button>

      </div>
    </section>
  );
}