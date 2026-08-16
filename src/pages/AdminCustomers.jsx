import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Users,
  RefreshCw,
  Search,
} from "lucide-react";

import { supabase } from "../lib/supabase";

export default function AdminCustomers() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadCustomers();
  }, []);

  async function loadCustomers() {
    setLoading(true);
    setError("");

    const { data, error } = await supabase
      .from("orders")
      .select(`
        id,
        user_id,
        total,
        shipping_address,
        created_at
      `)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error(
        "CUSTOMERS ERROR:",
        error
      );

      setError(error.message);
      setOrders([]);
    } else {
      setOrders(data || []);
    }

    setLoading(false);
  }

  const customers = useMemo(() => {
    const map = new Map();

    for (const order of orders) {
      const address =
        order.shipping_address || {};

      const email =
        address.email ||
        order.user_id ||
        "unknown";

      const key = email.toLowerCase();

      if (!map.has(key)) {
        map.set(key, {
          key,
          user_id: order.user_id,
          name:
            address.full_name ||
            address.name ||
            "Customer",
          email:
            address.email || "—",
          phone:
            address.phone || "—",
          city:
            address.city || "—",
          orders: 0,
          spent: 0,
          lastOrder:
            order.created_at,
        });
      }

      const customer = map.get(key);

      customer.orders += 1;

      customer.spent += Number(
        order.total || 0
      );

      if (
        new Date(order.created_at) >
        new Date(customer.lastOrder)
      ) {
        customer.lastOrder =
          order.created_at;
      }
    }

    return Array.from(map.values());
  }, [orders]);

  const filtered = customers.filter(
    (customer) => {
      const query =
        search.trim().toLowerCase();

      if (!query) return true;

      return [
        customer.name,
        customer.email,
        customer.phone,
        customer.city,
      ].some((value) =>
        String(value)
          .toLowerCase()
          .includes(query)
      );
    }
  );

  if (loading) {
    return <Box>Loading customers...</Box>;
  }

  if (error) {
    return (
      <Box>
        <h2>Customers</h2>
        <p>{error}</p>

        <button
          type="button"
          onClick={loadCustomers}
          style={buttonStyle}
        >
          Try again
        </button>
      </Box>
    );
  }

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          alignItems: "center",
          gap: 15,
          marginBottom: 25,
          flexWrap: "wrap",
        }}
      >
        <div>
          <p
            style={{
              margin: 0,
              color: "#65757c",
              fontSize: 18,
            }}
          >
            Customers who have placed
            orders.
          </p>
        </div>

        <button
          type="button"
          onClick={loadCustomers}
          style={buttonStyle}
        >
          <RefreshCw size={15} />
          Refresh
        </button>
      </div>

      <div
        style={{
          position: "relative",
          marginBottom: 20,
        }}
      >
        <Search
          size={17}
          style={{
            position: "absolute",
            left: 14,
            top: 14,
            color: "#718087",
          }}
        />

        <input
          value={search}
          onChange={(event) =>
            setSearch(event.target.value)
          }
          placeholder="Search customers..."
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding:
              "13px 14px 13px 42px",
            border:
              "1px solid #d8d3ca",
            borderRadius: 12,
            fontSize: 15,
          }}
        />
      </div>

      {filtered.length === 0 ? (
        <Box>
          <Users size={30} />

          <h2>No customers found.</h2>

          <p>
            Customers will appear after
            checkout orders are created.
          </p>
        </Box>
      ) : (
        <div
          style={{
            display: "grid",
            gap: 12,
          }}
        >
          {filtered.map((customer) => (
            <div
              key={customer.key}
              style={cardStyle}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent:
                    "space-between",
                  gap: 20,
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <h3
                    style={{
                      margin: 0,
                    }}
                  >
                    {customer.name}
                  </h3>

                  <p
                    style={{
                      margin:
                        "7px 0 0",
                      color: "#65757c",
                    }}
                  >
                    {customer.email}
                  </p>

                  <p
                    style={{
                      margin:
                        "4px 0 0",
                      color: "#65757c",
                    }}
                  >
                    {customer.phone}
                    {" · "}
                    {customer.city}
                  </p>
                </div>

                <div
                  style={{
                    textAlign: "right",
                  }}
                >
                  <strong
                    style={{
                      fontFamily:
                        "Georgia, serif",
                      fontSize: 25,
                      fontWeight: 400,
                    }}
                  >
                    ₹
                    {customer.spent.toLocaleString(
                      "en-IN"
                    )}
                  </strong>

                  <div
                    style={{
                      color: "#718087",
                      fontSize: 13,
                      marginTop: 4,
                    }}
                  >
                    {customer.orders} order
                    {customer.orders === 1
                      ? ""
                      : "s"}
                  </div>
                </div>
              </div>

              <div
                style={{
                  marginTop: 15,
                  paddingTop: 13,
                  borderTop:
                    "1px solid #e6e2db",
                  color: "#718087",
                  fontSize: 13,
                }}
              >
                Last order:{" "}
                {customer.lastOrder
                  ? new Date(
                      customer.lastOrder
                    ).toLocaleString(
                      "en-IN"
                    )
                  : "—"}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Box({ children }) {
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
  padding: 25,
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