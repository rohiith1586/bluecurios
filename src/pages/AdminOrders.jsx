import React, { useEffect, useState } from "react";
import {
  ClipboardList,
  RefreshCw,
  CreditCard,
  Package,
} from "lucide-react";

import { supabase } from "../lib/supabase";

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    setLoading(true);
    setError("");

    const { data, error } = await supabase
      .from("orders")
      .select(`
        id,
        order_number,
        user_id,
        status,
        subtotal,
        shipping,
        total,
        payment_method,
        payment_reference,
        razorpay_order_id,
        razorpay_payment_id,
        shipping_address,
        created_at,
        order_items (
          id,
          product_id,
          product_name,
          variant_label,
          unit_price,
          quantity
        )
      `)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error("ADMIN ORDERS ERROR:", error);
      setError(error.message);
      setOrders([]);
    } else {
      setOrders(data || []);
    }

    setLoading(false);
  }

  async function refresh() {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  }

  async function updateStatus(id, status) {
    const { error } = await supabase
      .from("orders")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    setOrders((current) =>
      current.map((order) =>
        order.id === id
          ? { ...order, status }
          : order
      )
    );
  }

  function isPaid(order) {
    return (
      Boolean(order.razorpay_payment_id) ||
      order.status === "paid"
    );
  }

  function money(value) {
    return `₹${Number(value || 0).toLocaleString("en-IN")}`;
  }

  if (loading) {
    return <AdminBox>Loading orders...</AdminBox>;
  }

  if (error) {
    return (
      <AdminBox>
        <h2>Orders</h2>

        <p>
          Unable to load orders.
        </p>

        <small>{error}</small>

        <button
          type="button"
          onClick={loadOrders}
          style={buttonStyle}
        >
          Try again
        </button>
      </AdminBox>
    );
  }

  return (
    <div>
      <Header
        count={orders.length}
        refreshing={refreshing}
        onRefresh={refresh}
      />

      {orders.length === 0 ? (
        <AdminBox>
          <ClipboardList size={32} />

          <h2>No orders yet.</h2>

          <p>
            Orders created during checkout
            will appear here.
          </p>
        </AdminBox>
      ) : (
        <div
          style={{
            display: "grid",
            gap: 18,
          }}
        >
          {orders.map((order) => {
            const address =
              order.shipping_address || {};

            const paid = isPaid(order);

            return (
              <div
                key={order.id}
                style={cardStyle}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 15,
                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <h3
                      style={{
                        margin: 0,
                        fontSize: 21,
                      }}
                    >
                      {order.order_number ||
                        "Order"}
                    </h3>

                    <small
                      style={{
                        color: "#718087",
                      }}
                    >
                      {order.created_at
                        ? new Date(
                            order.created_at
                          ).toLocaleString(
                            "en-IN"
                          )
                        : ""}
                    </small>
                  </div>

                  <select
                    value={
                      order.status ||
                      "pending"
                    }
                    onChange={(event) =>
                      updateStatus(
                        order.id,
                        event.target.value
                      )
                    }
                    style={selectStyle}
                  >
                    <option value="pending">
                      Pending
                    </option>

                    <option value="paid">
                      Paid
                    </option>

                    <option value="confirmed">
                      Confirmed
                    </option>

                    <option value="processing">
                      Processing
                    </option>

                    <option value="shipped">
                      Shipped
                    </option>

                    <option value="delivered">
                      Delivered
                    </option>

                    <option value="cancelled">
                      Cancelled
                    </option>
                  </select>
                </div>

                <div
                  style={{
                    marginTop: 20,
                    padding: 16,
                    borderRadius: 14,
                    background: "#f7f4ee",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <CreditCard size={18} />

                    <strong>
                      Payment
                    </strong>

                    <span
                      style={{
                        marginLeft: "auto",
                        fontWeight: 700,
                        color: paid
                          ? "#176b3a"
                          : "#9a6500",
                      }}
                    >
                      {paid
                        ? "PAID"
                        : "PENDING"}
                    </span>
                  </div>

                  <div
                    style={{
                      marginTop: 10,
                      display: "grid",
                      gap: 5,
                      fontSize: 13,
                      color: "#66767d",
                    }}
                  >
                    <span>
                      Razorpay order:{" "}
                      {order.razorpay_order_id ||
                        "—"}
                    </span>

                    <span>
                      Razorpay payment:{" "}
                      {order.razorpay_payment_id ||
                        "—"}
                    </span>

                    <span>
                      Payment reference:{" "}
                      {order.payment_reference ||
                        "—"}
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    marginTop: 20,
                  }}
                >
                  <h4
                    style={{
                      marginBottom: 10,
                    }}
                  >
                    <Package
                      size={16}
                      style={{
                        verticalAlign: "middle",
                        marginRight: 6,
                      }}
                    />
                    Items
                  </h4>

                  {(order.order_items || [])
                    .map((item) => (
                      <div
                        key={item.id}
                        style={{
                          display: "flex",
                          justifyContent:
                            "space-between",
                          gap: 15,
                          padding:
                            "10px 0",
                          borderBottom:
                            "1px solid #ece8e1",
                        }}
                      >
                        <span>
                          {item.product_name ||
                            "Product"}

                          {" × "}

                          {item.quantity}

                          {item.variant_label && (
                            <small>
                              {" · "}
                              {
                                item.variant_label
                              }
                            </small>
                          )}
                        </span>

                        <strong>
                          {money(
                            Number(
                              item.unit_price ||
                                0
                            ) *
                              Number(
                                item.quantity ||
                                  0
                              )
                          )}
                        </strong>
                      </div>
                    ))}
                </div>

                <div
                  style={{
                    marginTop: 20,
                    display: "grid",
                    gap: 7,
                  }}
                >
                  <TotalRow
                    label="Subtotal"
                    value={money(
                      order.subtotal
                    )}
                  />

                  <TotalRow
                    label="Shipping"
                    value={
                      Number(
                        order.shipping || 0
                      ) === 0
                        ? "Free"
                        : money(
                            order.shipping
                          )
                    }
                  />

                  <TotalRow
                    label="Total"
                    value={money(
                      order.total
                    )}
                    total
                  />
                </div>

                <details
                  style={{
                    marginTop: 22,
                  }}
                >
                  <summary
                    style={{
                      cursor: "pointer",
                      fontWeight: 700,
                    }}
                  >
                    Customer & shipping
                    details
                  </summary>

                  <div
                    style={{
                      marginTop: 15,
                      display: "grid",
                      gap: 7,
                      color: "#5f7077",
                    }}
                  >
                    <div>
                      <b>Name:</b>{" "}
                      {address.full_name ||
                        address.name ||
                        "—"}
                    </div>

                    <div>
                      <b>Email:</b>{" "}
                      {address.email ||
                        "—"}
                    </div>

                    <div>
                      <b>Phone:</b>{" "}
                      {address.phone ||
                        "—"}
                    </div>

                    <div>
                      <b>Address:</b>{" "}
                      {address.address ||
                        "—"}
                    </div>

                    <div>
                      <b>City:</b>{" "}
                      {address.city ||
                        "—"}
                    </div>

                    <div>
                      <b>State:</b>{" "}
                      {address.state ||
                        "—"}
                    </div>

                    <div>
                      <b>PIN:</b>{" "}
                      {address.pin ||
                        address.pincode ||
                        "—"}
                    </div>
                  </div>
                </details>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Header({
  count,
  refreshing,
  onRefresh,
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 15,
        marginBottom: 25,
        flexWrap: "wrap",
      }}
    >
      <div>
        <p
          style={{
            color: "#65757c",
            fontSize: 18,
            margin: 0,
          }}
        >
          Manage customer orders and
          payments.
        </p>
      </div>

      <button
        type="button"
        onClick={onRefresh}
        disabled={refreshing}
        style={buttonStyle}
      >
        <RefreshCw size={15} />

        {refreshing
          ? "Refreshing..."
          : `Refresh · ${count}`}
      </button>
    </div>
  );
}

function TotalRow({
  label,
  value,
  total,
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        fontWeight: total ? 700 : 400,
        fontSize: total ? 18 : 14,
        paddingTop: total ? 10 : 0,
        borderTop: total
          ? "1px solid #ddd8cf"
          : "none",
      }}
    >
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function AdminBox({ children }) {
  return (
    <div style={cardStyle}>
      {children}
    </div>
  );
}

const cardStyle = {
  background: "#fff",
  border: "1px solid #ddd8cf",
  borderRadius: 20,
  padding: 26,
};

const buttonStyle = {
  border: "none",
  background: "#202d31",
  color: "#fff",
  borderRadius: 25,
  padding: "11px 17px",
  cursor: "pointer",
  fontWeight: 700,
  display: "inline-flex",
  alignItems: "center",
  gap: 7,
};

const selectStyle = {
  border: "1px solid #d8d3ca",
  borderRadius: 10,
  padding: "10px 12px",
  background: "#fff",
  fontSize: 14,
};