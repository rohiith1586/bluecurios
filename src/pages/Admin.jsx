import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  BarChart3,
  Boxes,
  ClipboardList,
  Package,
  Users,
  Plus,
  Trash2,
  Upload,
  Eye,
  EyeOff,
  LogOut,
  RefreshCw,
  CreditCard,
  X,
  Image as ImageIcon,
  Search,
  ChevronDown,
  ChevronUp,
  MapPin,
  Phone,
  Mail,
  User,
  IndianRupee,
  CheckCircle2,
  Clock3,
  AlertCircle,
  Truck,
  PackageCheck,
} from "lucide-react";

import { supabase } from "../lib/supabase";

/* =========================================================
   CONSTANTS
========================================================= */

const BUCKET = "product-images";

const EMPTY_FORM = {
  name: "",
  slug: "",
  description: "",
  price: "",
  materials: "",
  care_instructions: "",
  production_time: "",
  shipping_info: "",
  returns_info: "",
  published: true,
};

/* =========================================================
   HELPERS
========================================================= */

function makeSlug(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function formatPrice(value) {
  return `₹${Number(value || 0).toLocaleString(
    "en-IN"
  )}`;
}

function formatDate(value) {
  if (!value) return "";

  return new Date(value).toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}

function formatDateTime(value) {
  if (!value) return "";

  return new Date(value).toLocaleString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }
  );
}

function safeValue(value, fallback = "Not provided") {
  if (
    value === null ||
    value === undefined ||
    String(value).trim() === ""
  ) {
    return fallback;
  }

  return String(value);
}

/* =========================================================
   PAYMENT HELPERS
========================================================= */

function getPaymentStatus(order) {
  const explicit =
    order?.payment_status ||
    order?.paymentStatus ||
    order?.payment_state;

  if (explicit) {
    const value = String(explicit).toLowerCase();

    if (
      value.includes("paid") ||
      value.includes("success") ||
      value === "captured"
    ) {
      return "Paid";
    }

    if (
      value.includes("fail") ||
      value.includes("declin") ||
      value.includes("cancel")
    ) {
      return "Failed";
    }

    return "Pending";
  }

  const orderStatus = String(
    order?.status || ""
  ).toLowerCase();

  if (
    orderStatus === "failed" ||
    orderStatus === "payment_failed"
  ) {
    return "Failed";
  }

  if (
    orderStatus === "paid" ||
    orderStatus === "confirmed" ||
    orderStatus === "processing" ||
    orderStatus === "shipped" ||
    orderStatus === "delivered"
  ) {
    return "Paid";
  }

  if (
    order?.razorpay_payment_id ||
    order?.razorpay_paymentId
  ) {
    return "Paid";
  }

  return "Pending";
}

function getPaymentMethod(order) {
  return (
    order?.payment_method ||
    order?.paymentMethod ||
    order?.payment_type ||
    order?.method ||
    order?.shipping_address
      ?.payment_method ||
    order?.shipping_address
      ?.paymentMethod ||
    (order?.razorpay_payment_id
      ? "UPI"
      : "Not provided")
  );
}

function getUpiReference(order) {
  return (
    order?.upi_reference ||
    order?.upiReference ||
    order?.upi_ref ||
    order?.transaction_id ||
    order?.transactionId ||
    order?.payment_reference ||
    order?.paymentReference ||
    order?.shipping_address
      ?.upi_reference ||
    order?.shipping_address
      ?.upiReference ||
    order?.shipping_address
      ?.upi_ref ||
    "Not provided"
  );
}

function paymentBadgeClass(status) {
  if (status === "Paid") {
    return "payment-paid";
  }

  if (status === "Failed") {
    return "payment-failed";
  }

  return "payment-pending";
}

/* =========================================================
   ORDER STATUS
========================================================= */

function orderStatusClass(status) {
  const value = String(
    status || "pending"
  ).toLowerCase();

  if (value === "delivered") {
    return "order-delivered";
  }

  if (value === "shipped") {
    return "order-shipped";
  }

  if (value === "processing") {
    return "order-processing";
  }

  if (value === "confirmed") {
    return "order-confirmed";
  }

  if (value === "cancelled") {
    return "order-cancelled";
  }

  return "order-pending";
}

function OrderStatusIcon({ status }) {
  const value = String(
    status || "pending"
  ).toLowerCase();

  if (value === "delivered") {
    return <PackageCheck size={15} />;
  }

  if (value === "shipped") {
    return <Truck size={15} />;
  }

  if (value === "processing") {
    return <Package size={15} />;
  }

  if (value === "confirmed") {
    return <CheckCircle2 size={15} />;
  }

  if (value === "cancelled") {
    return <AlertCircle size={15} />;
  }

  return <Clock3 size={15} />;
}

/* =========================================================
   SHIPPING HELPERS
========================================================= */

function getShippingAddress(order) {
  return (
    order?.shipping_address ||
    order?.shippingAddress ||
    {}
  );
}

function getCustomerName(order) {
  const address = getShippingAddress(order);

  return (
    order?.customer_name ||
    order?.customerName ||
    address?.full_name ||
    address?.fullName ||
    address?.name ||
    "Not provided"
  );
}

function getCustomerEmail(order) {
  const address = getShippingAddress(order);

  return (
    order?.customer_email ||
    order?.customerEmail ||
    address?.email ||
    "Not provided"
  );
}

function getCustomerPhone(order) {
  const address = getShippingAddress(order);

  return (
    order?.customer_phone ||
    order?.customerPhone ||
    address?.phone ||
    address?.mobile ||
    address?.phone_number ||
    "Not provided"
  );
}

function getAddressLines(order) {
  const address = getShippingAddress(order);

  return {
    fullName:
      address?.full_name ||
      address?.fullName ||
      address?.name,

    phone:
      address?.phone ||
      address?.mobile ||
      address?.phone_number,

    email:
      address?.email,

    address:
      address?.address ||
      address?.address_line_1 ||
      address?.addressLine1 ||
      address?.street,

    address2:
      address?.address_line_2 ||
      address?.addressLine2 ||
      address?.landmark,

    city:
      address?.city ||
      address?.town,

    state:
      address?.state ||
      address?.state_name,

    pin:
      address?.pin ||
      address?.pincode ||
      address?.postal_code ||
      address?.postalCode,

    country:
      address?.country,

    landmark:
      address?.landmark,
  };
}

/* =========================================================
   ORDERS PANEL
========================================================= */

function OrdersPanel() {
  const [orders, setOrders] = useState([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [paymentFilter, setPaymentFilter] =
    useState("all");

  const [statusFilter, setStatusFilter] =
    useState("all");

  const [expandedOrders, setExpandedOrders] =
    useState({});

  /* =======================================================
     LOAD ORDERS
  ======================================================= */

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    if (!supabase) {
      setError(
        "Supabase is not connected."
      );
      setLoading(false);
      return;
    }

    setError("");

    setLoading(true);

    /*
      We use * here intentionally.

      This keeps the admin compatible with your
      existing orders table even if you have fields
      such as:

      payment_method
      payment_status
      upi_reference
      customer_name
      customer_email
      etc.

      without breaking the query if one of those
      optional columns is not present.
    */

    const {
      data,
      error: ordersError,
    } = await supabase
      .from("orders")
      .select(`
        *,
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

    if (ordersError) {
      console.error(
        "ORDERS ERROR:",
        ordersError
      );

      setError(
        ordersError.message ||
          "Unable to load orders."
      );

      setOrders([]);
    } else {
      setOrders(data || []);
    }

    setLoading(false);
  }

  /* =======================================================
     REFRESH
  ======================================================= */

  async function refreshOrders() {
    if (refreshing) return;

    setRefreshing(true);

    await loadOrders();

    setRefreshing(false);
  }

  /* =======================================================
     UPDATE ORDER STATUS
  ======================================================= */

  async function updateOrderStatus(orderId, status) {
  if (!supabase) return;

  // Convert UI status labels to database values
  const statusMap = {
    Pending: "pending",
    Confirmed: "confirmed",
    Processing: "processing",
    Shipped: "shipped",
    Delivered: "delivered",
    Cancelled: "cancelled",
  };

  const dbStatus = statusMap[status] || status.toLowerCase();

  const {
    error: updateError,
  } = await supabase
    .from("orders")
    .update({
      status: dbStatus,
    })
    .eq("id", orderId);

  if (updateError) {
    alert(updateError.message);
    return;
  }

  setOrders((current) =>
    current.map((order) =>
      order.id === orderId
        ? {
            ...order,
            status: dbStatus,
          }
        : order
    )
  );
}

  /* =======================================================
     SEARCH
  ======================================================= */

  function orderMatchesSearch(
    order,
    query
  ) {
    if (!query.trim()) return true;

    const normalized =
      query
        .toLowerCase()
        .trim();

    const address =
      getShippingAddress(order);

    const items =
      order?.order_items || [];

    const itemText = items
      .map((item) =>
        [
          item?.product_name,
          item?.variant_label,
        ]
          .filter(Boolean)
          .join(" ")
      )
      .join(" ");

    const searchableText = [
      order?.order_number,
      order?.id,
      order?.user_id,
      order?.razorpay_order_id,
      order?.razorpay_payment_id,
      order?.upi_reference,
      order?.upiReference,
      order?.transaction_id,
      getCustomerName(order),
      getCustomerEmail(order),
      getCustomerPhone(order),
      address?.address,
      address?.city,
      address?.state,
      address?.pin,
      address?.pincode,
      address?.postal_code,
      itemText,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return searchableText.includes(
      normalized
    );
  }

  /* =======================================================
     FILTERED ORDERS
  ======================================================= */

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const payment =
        getPaymentStatus(order);

      const status =
        String(
          order?.status || "pending"
        ).toLowerCase();

      const paymentMatches =
        paymentFilter === "all" ||
        payment.toLowerCase() ===
          paymentFilter;

      const statusMatches =
        statusFilter === "all" ||
        status === statusFilter;

      const searchMatches =
        orderMatchesSearch(
          order,
          search
        );

      return (
        paymentMatches &&
        statusMatches &&
        searchMatches
      );
    });
  }, [
    orders,
    search,
    paymentFilter,
    statusFilter,
  ]);

  /* =======================================================
     STATS
  ======================================================= */

  const orderStats = useMemo(() => {
    let paid = 0;
    let pending = 0;
    let failed = 0;
    let revenue = 0;

    orders.forEach((order) => {
      const payment =
        getPaymentStatus(order);

      if (payment === "Paid") {
        paid += 1;
        revenue += Number(
          order?.total || 0
        );
      }

      if (payment === "Pending") {
        pending += 1;
      }

      if (payment === "Failed") {
        failed += 1;
      }
    });

    return {
      total: orders.length,
      paid,
      pending,
      failed,
      revenue,
    };
  }, [orders]);

  /* =======================================================
     EXPAND
  ======================================================= */

  function toggleExpanded(orderId) {
    setExpandedOrders(
      (current) => ({
        ...current,
        [orderId]:
          !current[orderId],
      })
    );
  }

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <div className="admin-card admin-loading-card">
        <div className="admin-spinner" />

        <p>
          Loading orders...
        </p>
      </div>
    );
  }

  /* =======================================================
     ERROR
  ======================================================= */

  if (error) {
    return (
      <div className="admin-card admin-error-card">
        <AlertCircle size={28} />

        <h2>
          Orders
        </h2>

        <p>
          Unable to load orders.
        </p>

        <small>
          {error}
        </small>

        <button
          type="button"
          className="admin-btn admin-btn-dark"
          onClick={loadOrders}
        >
          Try again
        </button>
      </div>
    );
  }

  /* =======================================================
     RENDER ORDERS
  ======================================================= */

  return (
    <div className="orders-panel">

      {/* ===================================================
          HEADING
      =================================================== */}

      <div className="admin-page-heading">
        <div>
          <span className="admin-eyebrow">
            Store activity
          </span>

          <h2>
            Orders
          </h2>

          <p>
            Manage BlueCurios customer
            orders, payments and delivery.
          </p>
        </div>

        <button
          type="button"
          className="admin-btn admin-btn-light"
          onClick={refreshOrders}
          disabled={refreshing}
        >
          <RefreshCw
            size={16}
            className={
              refreshing
                ? "spin"
                : ""
            }
          />

          {refreshing
            ? "Refreshing..."
            : "Refresh orders"}
        </button>
      </div>

      {/* ===================================================
          ORDER STATS
      =================================================== */}

      <div className="order-summary-grid">

        <div className="order-summary-card">
          <span>
            Total orders
          </span>

          <strong>
            {orderStats.total}
          </strong>
        </div>

        <div className="order-summary-card">
          <span>
            Paid
          </span>

          <strong>
            {orderStats.paid}
          </strong>
        </div>

        <div className="order-summary-card">
          <span>
            Pending
          </span>

          <strong>
            {orderStats.pending}
          </strong>
        </div>

        <div className="order-summary-card">
          <span>
            Revenue
          </span>

          <strong>
            {formatPrice(
              orderStats.revenue
            )}
          </strong>
        </div>

      </div>

      {/* ===================================================
          SEARCH + FILTERS
      =================================================== */}

      <div className="order-filter-box">

        <div className="order-search">
          <Search size={18} />

          <input
            type="search"
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Search order, customer, email, phone, product..."
          />

          {search && (
            <button
              type="button"
              onClick={() =>
                setSearch("")
              }
              aria-label="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <div className="order-filter-row">

          <div className="order-filter">
            <CreditCard
              size={16}
            />

            <select
              value={paymentFilter}
              onChange={(event) =>
                setPaymentFilter(
                  event.target.value
                )
              }
            >
              <option value="all">
                All payments
              </option>

              <option value="paid">
                Paid
              </option>

              <option value="pending">
                Pending
              </option>

              <option value="failed">
                Failed
              </option>
            </select>
          </div>

          <div className="order-filter">
            <Package size={16} />

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value
                )
              }
            >
              <option value="all">
                All order status
              </option>

              <option value="pending">
                Pending
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

          <div className="order-result-count">
            {filteredOrders.length}
            {" "}
            {filteredOrders.length === 1
              ? "order"
              : "orders"}
          </div>

        </div>
      </div>

      {/* ===================================================
          NO ORDERS
      =================================================== */}

      {orders.length === 0 ? (
        <div className="admin-empty">

          <ClipboardList size={32} />

          <h3>
            No orders yet.
          </h3>

          <p>
            Orders will appear here
            after customers complete
            checkout.
          </p>

        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="admin-empty">

          <Search size={32} />

          <h3>
            No matching orders.
          </h3>

          <p>
            Try changing your search
            or filters.
          </p>

        </div>
      ) : (

        <div className="admin-order-list">

          {filteredOrders.map(
            (order) => {
              const address =
                getShippingAddress(
                  order
                );

              const shipping =
                getAddressLines(
                  order
                );

              const payment =
                getPaymentStatus(
                  order
                );

              const paymentMethod =
                getPaymentMethod(
                  order
                );

              const upiReference =
                getUpiReference(
                  order
                );

              const status =
                String(
                  order?.status ||
                    "pending"
                ).toLowerCase();

              const isExpanded =
                Boolean(
                  expandedOrders[
                    order.id
                  ]
                );

              const items =
                order?.order_items ||
                [];

              return (
                <article
                  className={`admin-order-card ${
                    isExpanded
                      ? "expanded"
                      : ""
                  }`}
                  key={order.id}
                >

                  {/* =========================================
                      ORDER HEADER
                  ========================================= */}

                  <div className="admin-order-header">

                    <div className="order-main-info">

                      <div className="order-number-row">

                        <span className="order-number-label">
                          Order
                        </span>

                        <strong className="admin-order-number">
                          {order.order_number ||
                            `#${String(
                              order.id
                            ).slice(
                              0,
                              8
                            )}`}
                        </strong>

                      </div>

                      <span className="order-date">
                        {formatDateTime(
                          order.created_at
                        )}
                      </span>

                    </div>

                    <div className="order-header-right">

                      <span
                        className={`payment-badge ${paymentBadgeClass(
                          payment
                        )}`}
                      >
                        {payment ===
                        "Paid" ? (
                          <CheckCircle2
                            size={14}
                          />
                        ) : payment ===
                          "Failed" ? (
                          <AlertCircle
                            size={14}
                          />
                        ) : (
                          <Clock3
                            size={14}
                          />
                        )}

                        {payment}
                      </span>

                      <strong className="order-total-top">
                        {formatPrice(
                          order.total
                        )}
                      </strong>

                    </div>

                  </div>

                  {/* =========================================
                      QUICK CUSTOMER INFO
                  ========================================= */}

                  <div className="order-quick-info">

                    <div className="quick-info-item">
                      <User
                        size={15}
                      />

                      <span>
                        {getCustomerName(
                          order
                        )}
                      </span>
                    </div>

                    <div className="quick-info-item">
                      <Mail
                        size={15}
                      />

                      <span>
                        {getCustomerEmail(
                          order
                        )}
                      </span>
                    </div>

                    <div className="quick-info-item">
                      <Phone
                        size={15}
                      />

                      <span>
                        {getCustomerPhone(
                          order
                        )}
                      </span>
                    </div>

                  </div>

                  {/* =========================================
                      PAYMENT + STATUS ROW
                  ========================================= */}

                  <div className="order-meta-bar">

                    <div className="order-payment-summary">

                      <span>
                        Payment:
                      </span>

                      <strong>
                        {safeValue(
                          paymentMethod
                        )}
                      </strong>

                      {upiReference !==
                        "Not provided" && (
                        <>
                          <span className="meta-divider">
                            •
                          </span>

                          <span>
                            UPI:
                          </span>

                          <strong>
                            {upiReference}
                          </strong>
                        </>
                      )}

                    </div>

                    <div className="order-status-control">

                      <OrderStatusIcon
                        status={status}
                      />

                      <select
                        className={`order-status-select ${orderStatusClass(
                          status
                        )}`}
                        value={
                          status
                        }
                        onChange={(
                          event
                        ) =>
                          updateOrderStatus(
                            order.id,
                            event.target
                              .value
                          )
                        }
                      >
                        <option value="pending">
                          Pending
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

                  </div>

                  {/* =========================================
                      EXPAND BUTTON
                  ========================================= */}

                  <button
                    type="button"
                    className="order-expand-button"
                    onClick={() =>
                      toggleExpanded(
                        order.id
                      )
                    }
                  >
                    <span>
                      {isExpanded
                        ? "Hide order details"
                        : "View order details"}
                    </span>

                    {isExpanded ? (
                      <ChevronUp
                        size={18}
                      />
                    ) : (
                      <ChevronDown
                        size={18}
                      />
                    )}
                  </button>

                  {/* =========================================
                      DETAILS
                  ========================================= */}

                  {isExpanded && (
                    <div className="order-expanded-content">

                      {/* =====================================
                          CUSTOMER
                      ===================================== */}

                      <section className="order-detail-section">

                        <div className="order-section-title">
                          <User
                            size={17}
                          />

                          <div>
                            <strong>
                              Customer
                            </strong>

                            <small>
                              Customer information
                            </small>
                          </div>
                        </div>

                        <div className="detail-grid">

                          <div className="detail-field">
                            <span>
                              Full name
                            </span>

                            <strong>
                              {safeValue(
                                getCustomerName(
                                  order
                                )
                              )}
                            </strong>
                          </div>

                          <div className="detail-field">
                            <span>
                              Email
                            </span>

                            <strong>
                              {safeValue(
                                getCustomerEmail(
                                  order
                                )
                              )}
                            </strong>
                          </div>

                          <div className="detail-field">
                            <span>
                              Phone
                            </span>

                            <strong>
                              {safeValue(
                                getCustomerPhone(
                                  order
                                )
                              )}
                            </strong>
                          </div>

                          <div className="detail-field">
                            <span>
                              Customer ID
                            </span>

                            <strong className="breakable">
                              {safeValue(
                                order?.user_id
                              )}
                            </strong>
                          </div>

                        </div>

                      </section>

                      {/* =====================================
                          SHIPPING
                      ===================================== */}

                      <section className="order-detail-section">

                        <div className="order-section-title">
                          <MapPin
                            size={17}
                          />

                          <div>
                            <strong>
                              Shipping
                            </strong>

                            <small>
                              Full delivery address
                            </small>
                          </div>
                        </div>

                        <div className="shipping-address-card">

                          <strong>
                            {safeValue(
                              shipping.fullName ||
                                getCustomerName(
                                  order
                                )
                            )}
                          </strong>

                          {shipping.address && (
                            <p>
                              {
                                shipping.address
                              }
                            </p>
                          )}

                          {shipping.address2 && (
                            <p>
                              {
                                shipping.address2
                              }
                            </p>
                          )}

                          <p>
                            {[
                              shipping.city,
                              shipping.state,
                              shipping.pin,
                            ]
                              .filter(
                                Boolean
                              )
                              .join(
                                ", "
                              ) ||
                              "Address not provided"}
                          </p>

                          {shipping.country && (
                            <p>
                              {
                                shipping.country
                              }
                            </p>
                          )}

                          {shipping.landmark && (
                            <p>
                              <span className="muted-label">
                                Landmark:
                              </span>{" "}
                              {
                                shipping.landmark
                              }
                            </p>
                          )}

                          {shipping.phone && (
                            <p>
                              <Phone
                                size={14}
                              />
                              {
                                shipping.phone
                              }
                            </p>
                          )}

                        </div>

                      </section>

                      {/* =====================================
                          PAYMENT
                      ===================================== */}

                      <section className="order-detail-section">

                        <div className="order-section-title">
                          <CreditCard
                            size={17}
                          />

                          <div>
                            <strong>
                              Payment
                            </strong>

                            <small>
                              Payment information
                            </small>
                          </div>
                        </div>

                        <div className="payment-detail-grid">

                          <div className="detail-field">
                            <span>
                              Payment status
                            </span>

                            <strong>
                              <span
                                className={`payment-badge ${paymentBadgeClass(
                                  payment
                                )}`}
                              >
                                {payment ===
                                "Paid" ? (
                                  <CheckCircle2
                                    size={14}
                                  />
                                ) : payment ===
                                  "Failed" ? (
                                  <AlertCircle
                                    size={14}
                                  />
                                ) : (
                                  <Clock3
                                    size={14}
                                  />
                                )}

                                {payment}
                              </span>
                            </strong>
                          </div>

                          <div className="detail-field">
                            <span>
                              Payment method
                            </span>

                            <strong>
                              {safeValue(
                                paymentMethod
                              )}
                            </strong>
                          </div>

                          <div className="detail-field">
                            <span>
                              UPI reference
                            </span>

                            <strong className="breakable">
                              {safeValue(
                                upiReference
                              )}
                            </strong>
                          </div>

                          <div className="detail-field">
                            <span>
                              Razorpay payment ID
                            </span>

                            <strong className="breakable">
                              {safeValue(
                                order?.razorpay_payment_id ||
                                  order?.razorpay_paymentId
                              )}
                            </strong>
                          </div>

                          <div className="detail-field">
                            <span>
                              Razorpay order ID
                            </span>

                            <strong className="breakable">
                              {safeValue(
                                order?.razorpay_order_id ||
                                  order?.razorpay_orderId
                              )}
                            </strong>
                          </div>

                        </div>

                      </section>

                      {/* =====================================
                          PRODUCTS
                      ===================================== */}

                      <section className="order-detail-section">

                        <div className="order-section-title">
                          <Boxes
                            size={17}
                          />

                          <div>
                            <strong>
                              Products
                            </strong>

                            <small>
                              Items in this order
                            </small>
                          </div>
                        </div>

                        {items.length ===
                        0 ? (
                          <div className="no-items">
                            No product items found.
                          </div>
                        ) : (
                          <div className="order-items-table">

                            {items.map(
                              (item) => {
                                const quantity =
                                  Number(
                                    item?.quantity ||
                                      0
                                  );

                                const unitPrice =
                                  Number(
                                    item?.unit_price ||
                                      0
                                  );

                                const lineTotal =
                                  unitPrice *
                                  quantity;

                                return (
                                  <div
                                    className="order-item-row"
                                    key={
                                      item.id
                                    }
                                  >

                                    <div className="order-item-product">

                                      <div className="product-mini-icon">
                                        <Package
                                          size={
                                            18
                                          }
                                        />
                                      </div>

                                      <div>
                                        <strong>
                                          {safeValue(
                                            item?.product_name,
                                            "Product"
                                          )}
                                        </strong>

                                        {item?.variant_label && (
                                          <small>
                                            {
                                              item.variant_label
                                            }
                                          </small>
                                        )}
                                      </div>

                                    </div>

                                    <div className="order-item-qty">
                                      ×{" "}
                                      {quantity}
                                    </div>

                                    <div className="order-item-unit">
                                      {formatPrice(
                                        unitPrice
                                      )}
                                    </div>

                                    <strong className="order-item-total">
                                      {formatPrice(
                                        lineTotal
                                      )}
                                    </strong>

                                  </div>
                                );
                              }
                            )}

                          </div>
                        )}

                      </section>

                      {/* =====================================
                          TOTAL
                      ===================================== */}

                      <section className="order-total-section">

                        <div>
                          <span>
                            Order total
                          </span>

                          <small>
                            {items.length}{" "}
                            {items.length ===
                            1
                              ? "item"
                              : "items"}
                          </small>
                        </div>

                        <strong>
                          {formatPrice(
                            order?.total
                          )}
                        </strong>

                      </section>

                      {/* =====================================
                          EXTRA ORDER IDS
                      ===================================== */}

                      <div className="order-system-info">

                        <span>
                          Order ID:
                        </span>

                        <strong>
                          {safeValue(
                            order?.id
                          )}
                        </strong>

                        {order?.created_at && (
                          <>
                            <span>
                              Created:
                            </span>

                            <strong>
                              {formatDateTime(
                                order.created_at
                              )}
                            </strong>
                          </>
                        )}

                      </div>

                    </div>
                  )}

                </article>
              );
            }
          )}

        </div>
      )}

    </div>
  );
}

/* =========================================================
   ADMIN
========================================================= */

export default function Admin() {
  const [active, setActive] =
    useState("Overview");

  const [products, setProducts] =
    useState([]);
  const [customers, setCustomers] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [expandedCustomer, setExpandedCustomer] = useState(null);
  const [customerError, setCustomerError] = useState("");
  const [refreshingCustomers, setRefreshingCustomers] = useState(false);

  const [loadingProducts, setLoadingProducts] =
    useState(true);

  const [showForm, setShowForm] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [deletingId, setDeletingId] =
    useState(null);

  const [images, setImages] =
    useState([]);

  const [previewUrls, setPreviewUrls] =
    useState([]);

  const [form, setForm] =
    useState(EMPTY_FORM);

  const [error, setError] =
    useState("");

  const [status, setStatus] =
    useState("");

  const [progress, setProgress] =
    useState(0);
  
  const filteredCustomers = customers.filter((customer) => {
  const query = customerSearch.trim().toLowerCase();

  if (!query) return true;

  return [
    customer.name,
    customer.email,
    customer.phone,
  ]
    .filter(Boolean)
    .some((value) =>
      String(value).toLowerCase().includes(query)
    );
});

  /* =======================================================
     PREVIEW URL
  ======================================================= */

  useEffect(() => {
    const urls = images.map((file) =>
      URL.createObjectURL(file)
    );

    setPreviewUrls(urls);

    return () => {
      urls.forEach((url) =>
        URL.revokeObjectURL(url)
      );
    };
  }, [images]);

  /* =======================================================
     LOAD PRODUCTS
  ======================================================= */

  useEffect(() => {
    loadProducts();
  }, []);
  /* =======================================================
   LOAD CUSTOMERS FROM ORDERS
======================================================= */

useEffect(() => {
  if (active === "Customers") {
    loadCustomers();
  }
}, [active]);

async function loadCustomers() {
  if (!supabase) {
    setCustomerError("Supabase is not connected.");
    return;
  }

  setLoadingCustomers(true);
  setCustomerError("");

  try {
    const { data, error } = await supabase
      .from("orders")
      .select(`
        id,
        order_number,
        total,
        status,
        shipping_address,
        created_at,
        razorpay_payment_id,
        order_items (
          id,
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
      throw error;
    }

    const customerMap = new Map();

    (data || []).forEach((order) => {
      const address = order.shipping_address || {};

      const name =
        address.full_name ||
        "Unknown customer";

      const email =
        address.email ||
        "No email";

      const phone =
        address.phone ||
        "No phone";

      const customerKey =
        email !== "No email"
          ? email.toLowerCase().trim()
          : `${name}-${phone}`.toLowerCase();

      if (!customerMap.has(customerKey)) {
        customerMap.set(customerKey, {
          id: customerKey,
          name,
          email,
          phone,
          orders: [],
          totalSpent: 0,
          latestOrder: order.created_at,
        });
      }

      const customer =
        customerMap.get(customerKey);

      customer.orders.push(order);

      customer.totalSpent +=
        Number(order.total || 0);

      if (
        new Date(order.created_at) >
        new Date(customer.latestOrder)
      ) {
        customer.latestOrder =
          order.created_at;
      }
    });

    setCustomers(
      Array.from(customerMap.values())
    );
  } catch (err) {
    console.error(
      "CUSTOMERS LOAD ERROR:",
      err
    );

    setCustomers([]);

    setCustomerError(
      err?.message ||
        "Unable to load customers."
    );
  } finally {
    setLoadingCustomers(false);
    setRefreshingCustomers(false);
  }
}

async function refreshCustomers() {
  setRefreshingCustomers(true);
  await loadCustomers();
}
const [customRequests, setCustomRequests] = useState([]);
const [loadingCustomRequests, setLoadingCustomRequests] = useState(false);
const [customRequestError, setCustomRequestError] = useState("");

async function loadCustomRequests() {
  if (!supabase) {
    setCustomRequestError("Supabase is not connected.");
    return;
  }

  setLoadingCustomRequests(true);
  setCustomRequestError("");

  try {
    const { data, error } = await supabase
      .from("custom_requests")
      .select("*")
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      throw error;
    }

    setCustomRequests(data || []);
  } catch (err) {
    console.error("CUSTOM REQUESTS LOAD ERROR:", err);

    setCustomRequests([]);

    setCustomRequestError(
      err?.message || "Unable to load custom requests."
    );
  } finally {
    setLoadingCustomRequests(false);
  }
}

async function updateCustomRequestStatus(id, status) {
  if (!supabase) return;

  const { error } = await supabase
    .from("custom_requests")
    .update({ status })
    .eq("id", id);

  if (error) {
    console.error("CUSTOM REQUEST STATUS ERROR:", error);
    setCustomRequestError(error.message);
    return;
  }

  setCustomRequests((current) =>
    current.map((request) =>
      request.id === id
        ? { ...request, status }
        : request
    )
  );
}

useEffect(() => {
  if (active === "Custom Requests") {
    loadCustomRequests();
  }
}, [active]);
  async function loadProducts() {
    if (!supabase) {
      setLoadingProducts(false);
      setError(
        "Supabase is not connected."
      );
      return;
    }

    setLoadingProducts(true);

    const {
      data,
      error: productsError,
    } = await supabase
      .from("products")
      .select("*")
      .order("created_at", {
        ascending: false,
      });

    if (productsError) {
      console.error(
        "PRODUCTS LOAD ERROR:",
        productsError
      );

      setProducts([]);
      setError(
        productsError.message
      );
    } else {
      setProducts(data || []);
    }

    setLoadingProducts(false);
  }

  /* =======================================================
     STATS
  ======================================================= */

  const publishedCount =
    useMemo(
      () =>
        products.filter(
          (product) =>
            product.published
        ).length,
      [products]
    );

  const draftCount =
    useMemo(
      () =>
        products.filter(
          (product) =>
            !product.published
        ).length,
      [products]
    );

  /* =======================================================
     FORM
  ======================================================= */

  function updateForm(
    field,
    value
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleNameChange(
    value
  ) {
    setForm((current) => ({
      ...current,
      name: value,
      slug: makeSlug(value),
    }));
  }

  function openCreateForm() {
    setForm({
      ...EMPTY_FORM,
    });

    setImages([]);
    setError("");
    setStatus("");
    setProgress(0);
    setShowForm(true);
    setActive("Products");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function closeCreateForm() {
    if (saving) return;

    setShowForm(false);

    setForm({
      ...EMPTY_FORM,
    });

    setImages([]);
    setError("");
    setStatus("");
    setProgress(0);
  }

  /* =======================================================
     IMAGE SELECTION
  ======================================================= */

  function handleImages(event) {
    const selectedFiles =
      Array.from(
        event.target.files || []
      );

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    const validFiles = [];

    for (const file of selectedFiles) {
      if (
        !allowedTypes.includes(
          file.type
        )
      ) {
        alert(
          `${file.name} is not supported.\n\nPlease use JPG, PNG, or WebP images.`
        );

        continue;
      }

      const duplicate =
        images.some(
          (existing) =>
            existing.name ===
              file.name &&
            existing.size ===
              file.size &&
            existing.lastModified ===
              file.lastModified
        );

      if (!duplicate) {
        validFiles.push(file);
      }
    }

    if (validFiles.length) {
      setImages((current) => [
        ...current,
        ...validFiles,
      ]);

      setError("");

      setStatus(
        `${
          images.length +
          validFiles.length
        } image${
          images.length +
            validFiles.length ===
          1
            ? ""
            : "s"
        } selected.`
      );
    }

    event.target.value = "";
  }

  function removeImage(index) {
    setImages((current) =>
      current.filter(
        (_, imageIndex) =>
          imageIndex !== index
      )
    );

    setError("");
  }

  /* =======================================================
     CREATE PRODUCT
  ======================================================= */

  async function createProduct(
    event
  ) {
    event.preventDefault();

    if (saving) return;

    setError("");
    setStatus("");
    setProgress(0);

    if (!supabase) {
      setError(
        "Supabase is not connected."
      );
      return;
    }

    const name =
      form.name.trim();

    const price =
      Number(form.price);

    if (!name) {
      setError(
        "Please enter a product name."
      );
      return;
    }

    if (
      !form.price ||
      Number.isNaN(price) ||
      price < 0
    ) {
      setError(
        "Please enter a valid price."
      );
      return;
    }

    if (!images.length) {
      setError(
        "Please select at least one product image."
      );
      return;
    }

    setSaving(true);

    let createdProduct = null;

    const uploadedPaths = [];

    try {
      const {
        data: {
          user,
        },
        error: userError,
      } =
        await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        throw new Error(
          "You are not signed in. Please log in again."
        );
      }

      const baseSlug =
        makeSlug(name) ||
        `product-${Date.now()}`;

      let slug = baseSlug;

      const {
        data: existing,
        error: slugCheckError,
      } =
        await supabase
          .from("products")
          .select("id")
          .eq("slug", slug)
          .maybeSingle();

      if (slugCheckError) {
        throw slugCheckError;
      }

      if (existing) {
        slug = `${baseSlug}-${Date.now()}`;
      }

      setStatus(
        "Creating product..."
      );

      const {
        data: product,
        error: productError,
      } =
        await supabase
          .from("products")
          .insert({
            name,
            slug,
            description:
              form.description.trim() ||
              null,
            price,
            materials:
              form.materials.trim() ||
              null,
            care_instructions:
              form.care_instructions.trim() ||
              null,
            production_time:
              form.production_time.trim() ||
              null,
            shipping_info:
              form.shipping_info.trim() ||
              null,
            returns_info:
              form.returns_info.trim() ||
              null,
            published:
              form.published,
          })
          .select()
          .single();

      if (productError) {
        throw new Error(
          `Product could not be created: ${productError.message}`
        );
      }

      createdProduct = product;

      for (
        let index = 0;
        index < images.length;
        index++
      ) {
        const file =
          images[index];

        const extension =
          file.name
            .split(".")
            .pop()
            ?.toLowerCase() ||
          "jpg";

        const safeName =
          file.name
            .replace(
              /\.[^/.]+$/,
              ""
            )
            .toLowerCase()
            .replace(
              /[^a-z0-9]+/g,
              "-"
            )
            .replace(
              /^-+|-+$/g,
              ""
            )
            .slice(
              0,
              60
            ) || "image";

        const storagePath =
          `${product.id}/${Date.now()}-${index + 1}-${safeName}.${extension}`;

        setStatus(
          `Uploading image ${
            index + 1
          } of ${
            images.length
          }...`
        );

        const {
          error: uploadError,
        } =
          await supabase.storage
            .from(BUCKET)
            .upload(
              storagePath,
              file,
              {
                cacheControl:
                  "3600",
                upsert: false,
                contentType:
                  file.type ||
                  "image/jpeg",
              }
            );

        if (uploadError) {
          throw new Error(
            `Image ${
              index + 1
            } upload failed: ${uploadError.message}`
          );
        }

        uploadedPaths.push(
          storagePath
        );

        const {
          error: imageRowError,
        } =
          await supabase
            .from(
              "product_images"
            )
            .insert({
              product_id:
                product.id,
              storage_path:
                storagePath,
              alt_text: name,
              sort_order:
                index,
            });

        if (imageRowError) {
          throw new Error(
            `Image ${
              index + 1
            } could not be saved: ${imageRowError.message}`
          );
        }

        setProgress(
          Math.round(
            ((index + 1) /
              images.length) *
              100
          )
        );
      }

      setStatus(
        "Product and all images saved successfully."
      );

      setProgress(100);

      await loadProducts();

      setTimeout(() => {
        closeCreateForm();
      }, 700);
    } catch (err) {
      console.error(
        "CREATE PRODUCT ERROR:",
        err
      );

      setError(
        err?.message ||
          "Unable to create product."
      );

      if (uploadedPaths.length) {
        try {
          await supabase.storage
            .from(BUCKET)
            .remove(
              uploadedPaths
            );
        } catch (cleanupError) {
          console.error(
            "STORAGE ROLLBACK ERROR:",
            cleanupError
          );
        }
      }

      if (createdProduct?.id) {
        try {
          await supabase
            .from(
              "product_images"
            )
            .delete()
            .eq(
              "product_id",
              createdProduct.id
            );
        } catch (
          cleanupError
        ) {
          console.error(
            "IMAGE ROW ROLLBACK ERROR:",
            cleanupError
          );
        }

        try {
          await supabase
            .from("products")
            .delete()
            .eq(
              "id",
              createdProduct.id
            );
        } catch (
          cleanupError
        ) {
          console.error(
            "PRODUCT ROLLBACK ERROR:",
            cleanupError
          );
        }
      }

      setProgress(0);
      setStatus("");
    } finally {
      setSaving(false);
    }
  }

  /* =======================================================
     PUBLISH / UNPUBLISH
  ======================================================= */

  async function togglePublished(
    product
  ) {
    if (!supabase) {
      alert(
        "Supabase is not connected."
      );
      return;
    }

    const nextPublished =
      !product.published;

    const {
      error: updateError,
    } =
      await supabase
        .from("products")
        .update({
          published:
            nextPublished,
          updated_at:
            new Date().toISOString(),
        })
        .eq(
          "id",
          product.id
        );

    if (updateError) {
      alert(
        updateError.message
      );
      return;
    }

    setProducts((current) =>
      current.map((item) =>
        item.id === product.id
          ? {
              ...item,
              published:
                nextPublished,
            }
          : item
      )
    );
  }

  /* =======================================================
     DELETE PRODUCT
  ======================================================= */

  async function deleteProduct(
    product
  ) {
    if (!supabase) {
      alert(
        "Supabase is not connected."
      );
      return;
    }

    const confirmed =
      window.confirm(
        `Delete "${product.name}"?\n\nThis will remove the product, its image records, and its uploaded images from Storage.`
      );

    if (!confirmed) return;

    setDeletingId(
      product.id
    );

    try {
      const {
        data: imageRows,
        error: imageError,
      } =
        await supabase
          .from(
            "product_images"
          )
          .select(
            "storage_path"
          )
          .eq(
            "product_id",
            product.id
          );

      if (imageError) {
        throw imageError;
      }

      const paths =
        imageRows
          ?.map(
            (image) =>
              image.storage_path
          )
          .filter(Boolean) ||
        [];

      if (paths.length) {
        const {
          error:
            storageError,
        } =
          await supabase.storage
            .from(BUCKET)
            .remove(paths);

        if (storageError) {
          throw storageError;
        }
      }

      const {
        error:
          imagesDeleteError,
      } =
        await supabase
          .from(
            "product_images"
          )
          .delete()
          .eq(
            "product_id",
            product.id
          );

      if (imagesDeleteError) {
        throw imagesDeleteError;
      }

      const {
        error:
          productDeleteError,
      } =
        await supabase
          .from("products")
          .delete()
          .eq(
            "id",
            product.id
          );

      if (productDeleteError) {
        throw productDeleteError;
      }

      setProducts((current) =>
        current.filter(
          (item) =>
            item.id !==
            product.id
        )
      );
    } catch (err) {
      console.error(
        "DELETE PRODUCT ERROR:",
        err
      );

      alert(
        err?.message ||
          "Unable to delete product."
      );
    } finally {
      setDeletingId(null);
    }
  }

  /* =======================================================
     SIGN OUT
  ======================================================= */

  async function signOut() {
    if (supabase) {
      await supabase.auth.signOut();
    }

    window.location.href =
      "/login";
  }

  /* =======================================================
     NAVIGATION
  ======================================================= */

  function changeSection(
    section
  ) {
    setActive(section);

    if (
      section !== "Products" &&
      showForm
    ) {
      closeCreateForm();
    }
  }

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <>
      <style>{`

        /* =====================================================
           GLOBAL ADMIN
        ===================================================== */

        .bc-admin {
          min-height: 100vh;
          display: flex;
          background: #f4f8fa;
          color: #172f3b;
          font-family: Arial, Helvetica, sans-serif;
        }

        .bc-admin * {
          box-sizing: border-box;
        }

        /* =====================================================
           SIDEBAR
        ===================================================== */

        .bc-admin-sidebar {
          width: 250px;
          min-height: 100vh;
          flex-shrink: 0;
          background: #102f3d;
          color: #fff;
          padding: 30px 18px;
          display: flex;
          flex-direction: column;
          position: sticky;
          top: 0;
          height: 100vh;
        }

        .bc-admin-logo {
          padding: 8px 12px 35px;
          font-family: Georgia, serif;
          font-size: 29px;
          letter-spacing: -1px;
        }

        .bc-admin-logo span {
          color: #76b7d1;
          font-size: 15px;
          vertical-align: top;
        }

        .bc-admin-nav {
          display: grid;
          gap: 5px;
        }

        .bc-admin-nav button {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 12px;
          border: 0;
          border-radius: 10px;
          padding: 12px 13px;
          background: transparent;
          color: #c8dbe3;
          text-align: left;
          cursor: pointer;
          font-size: 14px;
          transition: .18s ease;
        }

        .bc-admin-nav button:hover {
          background: rgba(255,255,255,.08);
          color: #fff;
        }

        .bc-admin-nav button.active {
          background: #eaf5f9;
          color: #10394a;
        }

        .bc-admin-signout {
          margin-top: auto;
          padding-top: 25px;
          border-top: 1px solid rgba(255,255,255,.1);
        }

        /* =====================================================
           MAIN
        ===================================================== */

        .bc-admin-main {
          flex: 1;
          min-width: 0;
          padding: 60px clamp(25px, 5vw, 75px);
        }

        .bc-admin-content {
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
        }

        .admin-eyebrow {
          display: block;
          color: #236d8b;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 3px;
          text-transform: uppercase;
          margin-bottom: 14px;
        }

        .bc-admin-title {
          margin: 0;
          font-family: Georgia, serif;
          font-size: clamp(44px, 5vw, 70px);
          font-weight: 400;
          letter-spacing: -2px;
          line-height: 1;
          color: #163846;
        }

        .bc-admin-subtitle {
          color: #687f89;
          font-size: 17px;
          margin: 18px 0 0;
          max-width: 650px;
          line-height: 1.6;
        }

        .admin-page-heading {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 25px;
          margin-bottom: 30px;
        }

        .admin-page-heading h2 {
          margin: 0;
          font-family: Georgia, serif;
          font-size: 38px;
          font-weight: 400;
          color: #173c4d;
        }

        .admin-page-heading p {
          margin: 8px 0 0;
          color: #71858d;
        }

        /* =====================================================
           BUTTONS
        ===================================================== */

        .admin-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border: 0;
          border-radius: 999px;
          padding: 12px 18px;
          font-weight: 700;
          font-size: 14px;
          cursor: pointer;
          white-space: nowrap;
          transition: .18s ease;
        }

        .admin-btn:disabled {
          opacity: .55;
          cursor: not-allowed;
        }

        .admin-btn-dark {
          background: #126b91;
          color: #fff;
        }

        .admin-btn-dark:hover:not(:disabled) {
          background: #0e5b7c;
          transform: translateY(-1px);
        }

        .admin-btn-light {
          background: #fff;
          color: #20546a;
          border: 1px solid #d4e0e5;
        }

        .admin-btn-light:hover:not(:disabled) {
          background: #eef7fa;
        }

        /* =====================================================
           OVERVIEW
        ===================================================== */

        .admin-hero-actions {
          display: flex;
          gap: 12px;
          margin-top: 30px;
        }

        .admin-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
          margin-top: 45px;
        }

        .admin-stat {
          background: #fff;
          border: 1px solid #dce7eb;
          border-radius: 15px;
          padding: 22px;
        }

        .admin-stat span {
          display: block;
          color: #71858d;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 12px;
        }

        .admin-stat strong {
          display: block;
          font-family: Georgia, serif;
          font-size: 32px;
          font-weight: 400;
          color: #16506a;
        }

        .admin-dashboard-grid {
          display: grid;
          grid-template-columns: 1.2fr 1fr 1fr;
          gap: 15px;
          margin-top: 30px;
        }

        .admin-card {
          background: #fff;
          border: 1px solid #dce7eb;
          border-radius: 16px;
          padding: 25px;
        }

        .admin-card h3 {
          margin: 0 0 8px;
          font-family: Georgia, serif;
          font-size: 23px;
          font-weight: 400;
        }

        .admin-card p {
          color: #74868e;
          line-height: 1.6;
          margin: 0;
        }

        /* =====================================================
           PRODUCT FORM
        ===================================================== */

        .admin-product-form {
          background: #fff;
          border: 1px solid #dce7eb;
          border-radius: 18px;
          padding: clamp(22px, 4vw, 38px);
          margin-bottom: 30px;
          box-shadow: 0 10px 35px rgba(18,71,92,.05);
        }

        .admin-product-form h3 {
          margin: 0;
          font-family: Georgia, serif;
          font-size: 28px;
          font-weight: 400;
        }

        .admin-form-intro {
          color: #71858d;
          margin: 8px 0 28px;
          line-height: 1.5;
        }

        .admin-form-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 18px;
        }

        .admin-field {
          display: block;
        }

        .admin-field.full {
          grid-column: 1 / -1;
        }

        .admin-field > span {
          display: block;
          font-size: 13px;
          font-weight: 700;
          margin-bottom: 7px;
        }

        .admin-field input,
        .admin-field textarea {
          width: 100%;
          border: 1px solid #ccdce2;
          border-radius: 10px;
          padding: 13px 14px;
          background: #fff;
          color: #203b46;
          font: inherit;
          outline: none;
          transition: .18s ease;
        }

        .admin-field textarea {
          min-height: 105px;
          resize: vertical;
        }

        .admin-field input:focus,
        .admin-field textarea:focus {
          border-color: #3b86a4;
          box-shadow: 0 0 0 3px rgba(59,134,164,.1);
        }

        .admin-slug {
          margin-top: 18px;
          background: #eef7fa;
          border-radius: 10px;
          padding: 11px 13px;
          color: #71858d;
          font-size: 13px;
        }

        .admin-slug strong {
          color: #20546a;
        }

        .admin-upload {
          margin-top: 25px;
          padding: 22px;
          background: #f8fbfc;
          border: 1px dashed #aec7d0;
          border-radius: 15px;
        }

        .admin-upload h4 {
          margin: 0;
          font-family: Georgia, serif;
          font-size: 22px;
          font-weight: 400;
        }

        .admin-upload p {
          margin: 7px 0 17px;
          color: #71858d;
          font-size: 13px;
        }

        .admin-upload-box {
          position: relative;
          min-height: 125px;
          border: 1px solid #d6e3e8;
          border-radius: 13px;
          background: #fff;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 7px;
          color: #53717d;
          cursor: pointer;
          overflow: hidden;
          text-align: center;
        }

        .admin-upload-box strong {
          color: #20546a;
        }

        .admin-upload-box small {
          color: #8799a0;
        }

        .admin-upload-box input {
          position: absolute;
          inset: 0;
          opacity: 0;
          cursor: pointer;
        }

        .admin-image-previews {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(125px, 1fr));
          gap: 12px;
          margin-top: 17px;
        }

        .admin-image-preview {
          position: relative;
          background: #fff;
          border: 1px solid #dce5e9;
          border-radius: 12px;
          overflow: hidden;
        }

        .admin-image-preview img {
          display: block;
          width: 100%;
          height: 125px;
          object-fit: cover;
          background: #eee;
        }

        .admin-image-preview-label {
          display: block;
          padding: 8px 9px;
          font-size: 11px;
          color: #60747c;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .admin-image-preview-main {
          position: absolute;
          left: 7px;
          top: 7px;
          padding: 5px 7px;
          border-radius: 999px;
          background: #126b91;
          color: #fff;
          font-size: 10px;
          font-weight: 700;
        }

        .admin-image-remove {
          position: absolute;
          top: 7px;
          right: 7px;
          width: 28px;
          height: 28px;
          border: 0;
          border-radius: 50%;
          background: rgba(255,255,255,.94);
          color: #8c342e;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .admin-checkbox {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 20px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
        }

        .admin-checkbox input {
          width: 17px;
          height: 17px;
        }

        .admin-error {
          margin-top: 18px;
          padding: 13px 15px;
          border-radius: 10px;
          background: #fbeceb;
          color: #9b342c;
          font-size: 14px;
          line-height: 1.5;
        }

        .admin-status-message {
          margin-top: 17px;
          color: #216986;
          font-size: 14px;
          font-weight: 700;
        }

        .admin-progress {
          margin-top: 14px;
        }

        .admin-progress-track {
          height: 8px;
          border-radius: 999px;
          overflow: hidden;
          background: #dce7eb;
        }

        .admin-progress-bar {
          height: 100%;
          background: #126b91;
          transition: width .25s ease;
        }

        .admin-progress-text {
          display: block;
          margin-top: 6px;
          color: #71858d;
          font-size: 12px;
        }

        .admin-form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 28px;
        }

        /* =====================================================
           PRODUCT LIST
        ===================================================== */

        .admin-product-list {
          display: grid;
          gap: 10px;
        }

        .admin-product-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          padding: 17px 19px;
          background: #fff;
          border: 1px solid #dce7eb;
          border-radius: 13px;
        }

        .admin-product-info {
          min-width: 0;
        }

        .admin-product-name {
          display: block;
          font-weight: 700;
          font-size: 15px;
        }

        .admin-product-meta {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 9px;
          margin-top: 6px;
          color: #75868d;
          font-size: 13px;
        }

        .admin-status {
          display: inline-flex;
          align-items: center;
          border-radius: 999px;
          padding: 5px 8px;
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: .7px;
        }

        .admin-status.published {
          background: #e7f1eb;
          color: #286344;
        }

        .admin-status.pending {
          background: #f3eadb;
          color: #8a6332;
        }

        .admin-product-actions {
          display: flex;
          align-items: center;
          gap: 7px;
          flex-shrink: 0;
        }

        .admin-icon-btn {
          width: 37px;
          height: 37px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #d5e1e5;
          border-radius: 9px;
          background: #fff;
          color: #345b6b;
          cursor: pointer;
        }

        .admin-icon-btn:hover {
          background: #eef7fa;
        }

        .admin-icon-btn.delete {
          color: #a33c32;
          border-color: #ead2cf;
        }

        /* =====================================================
           EMPTY / LOADING
        ===================================================== */

        .admin-empty {
          text-align: center;
          padding: 65px 25px;
          border: 1px dashed #bcd0d7;
          border-radius: 16px;
          color: #75868d;
          background: rgba(255,255,255,.35);
        }

        .admin-empty svg {
          margin-bottom: 10px;
        }

        .admin-empty h3 {
          color: #20546a;
          font-family: Georgia, serif;
          font-size: 25px;
          font-weight: 400;
          margin: 5px 0 7px;
        }

        .admin-empty p {
          margin: 0;
        }

        .admin-loading-card {
          display: flex;
          align-items: center;
          gap: 12px;
          color: #71858d;
        }

        .admin-spinner {
          width: 18px;
          height: 18px;
          border: 2px solid #dce5e9;
          border-top-color: #126b91;
          border-radius: 50%;
          animation: admin-spin .8s linear infinite;
        }

        @keyframes admin-spin {
          to {
            transform: rotate(360deg);
          }
        }

        .spin {
          animation: admin-spin .8s linear infinite;
        }

        .admin-placeholder {
          padding: 40px;
          background: #fff;
          border: 1px solid #dce7eb;
          border-radius: 16px;
        }

        .admin-placeholder h2 {
          margin: 0;
          font-family: Georgia, serif;
          font-size: 34px;
          font-weight: 400;
        }

        .admin-placeholder p {
          color: #71858d;
          line-height: 1.6;
        }

        /* =====================================================
           ORDER DASHBOARD
        ===================================================== */

        .orders-panel {
          width: 100%;
        }

        .order-summary-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 18px;
        }

        .order-summary-card {
          background: #fff;
          border: 1px solid #d7e5ea;
          border-radius: 14px;
          padding: 18px;
        }

        .order-summary-card span {
          display: block;
          color: #6f858e;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 1px;
          font-weight: 800;
          margin-bottom: 9px;
        }

        .order-summary-card strong {
          font-family: Georgia, serif;
          font-size: 27px;
          font-weight: 400;
          color: #126b91;
        }

        /* =====================================================
           SEARCH / FILTER
        ===================================================== */

        .order-filter-box {
          background: #fff;
          border: 1px solid #d7e5ea;
          border-radius: 15px;
          padding: 15px;
          margin-bottom: 18px;
        }

        .order-search {
          height: 48px;
          border: 1px solid #cfdee3;
          border-radius: 10px;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0 13px;
          color: #62808c;
          background: #fbfdfe;
        }

        .order-search:focus-within {
          border-color: #4c91ad;
          box-shadow: 0 0 0 3px rgba(76,145,173,.09);
        }

        .order-search input {
          flex: 1;
          min-width: 0;
          border: 0;
          outline: 0;
          background: transparent;
          color: #183b49;
          font: inherit;
        }

        .order-search input::placeholder {
          color: #9aaab0;
        }

        .order-search button {
          width: 28px;
          height: 28px;
          border: 0;
          border-radius: 50%;
          background: #edf5f8;
          color: #52707c;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .order-filter-row {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 11px;
          flex-wrap: wrap;
        }

        .order-filter {
          min-height: 40px;
          display: flex;
          align-items: center;
          gap: 8px;
          border: 1px solid #d6e2e6;
          border-radius: 9px;
          padding: 0 10px;
          color: #55727d;
          background: #fff;
        }

        .order-filter select {
          border: 0;
          outline: 0;
          background: transparent;
          color: #244957;
          font-weight: 600;
          cursor: pointer;
        }

        .order-result-count {
          margin-left: auto;
          color: #71868e;
          font-size: 13px;
          font-weight: 700;
        }

        /* =====================================================
           ORDER CARD
        ===================================================== */

        .admin-order-list {
          display: grid;
          gap: 14px;
        }

        .admin-order-card {
          background: #fff;
          border: 1px solid #d6e3e8;
          border-radius: 16px;
          overflow: hidden;
          transition: .18s ease;
        }

        .admin-order-card.expanded {
          border-color: #b8d2dc;
          box-shadow: 0 8px 28px rgba(22,78,99,.06);
        }

        .admin-order-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          padding: 20px 21px;
        }

        .order-main-info {
          min-width: 0;
        }

        .order-number-row {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .order-number-label {
          color: #7d9097;
          font-size: 12px;
        }

        .admin-order-number {
          color: #174b62;
          font-size: 15px;
          word-break: break-all;
        }

        .order-date {
          display: block;
          margin-top: 5px;
          color: #84959b;
          font-size: 12px;
        }

        .order-header-right {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-shrink: 0;
        }

        .order-total-top {
          font-size: 19px;
          color: #163f50;
        }

        /* =====================================================
           PAYMENT BADGES
        ===================================================== */

        .payment-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          width: fit-content;
          border-radius: 999px;
          padding: 7px 10px;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: .3px;
          white-space: nowrap;
        }

        .payment-paid {
          color: #246844;
          background: #e4f4eb;
        }

        .payment-pending {
          color: #8a6630;
          background: #f7eddb;
        }

        .payment-failed {
          color: #9c3933;
          background: #fae8e7;
        }

        /* =====================================================
           QUICK INFO
        ===================================================== */

        .order-quick-info {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          padding: 0 21px 17px;
        }

        .quick-info-item {
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 8px;
          color: #55727e;
          font-size: 13px;
        }

        .quick-info-item svg {
          flex-shrink: 0;
          color: #2c7997;
        }

        .quick-info-item span {
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        /* =====================================================
           META BAR
        ===================================================== */

        .order-meta-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          padding: 13px 21px;
          background: #f5fafc;
          border-top: 1px solid #e3edf0;
          border-bottom: 1px solid #e3edf0;
        }

        .order-payment-summary {
          display: flex;
          align-items: center;
          gap: 7px;
          flex-wrap: wrap;
          color: #71868e;
          font-size: 12px;
        }

        .order-payment-summary strong {
          color: #28576a;
        }

        .meta-divider {
          color: #b0c0c6;
        }

        .order-status-control {
          display: flex;
          align-items: center;
          gap: 7px;
          flex-shrink: 0;
        }

        .order-status-control svg {
          color: #297794;
        }

        .order-status-select {
          border: 1px solid #cbdde3;
          border-radius: 999px;
          padding: 8px 12px;
          font-size: 12px;
          font-weight: 800;
          outline: 0;
          cursor: pointer;
        }

        .order-pending {
          background: #fff8ea;
          color: #8a6630;
          border-color: #ead7ae;
        }

        .order-confirmed {
          background: #edf7fb;
          color: #24647d;
          border-color: #c9e0e9;
        }

        .order-processing {
          background: #edf4ff;
          color: #35619a;
          border-color: #cadbf0;
        }

        .order-shipped {
          background: #eef8f8;
          color: #24716f;
          border-color: #c6e2e0;
        }

        .order-delivered {
          background: #e9f7ed;
          color: #287046;
          border-color: #c8e4d1;
        }

        .order-cancelled {
          background: #faeded;
          color: #9c403a;
          border-color: #e8c8c5;
        }

        /* =====================================================
           EXPAND BUTTON
        ===================================================== */

        .order-expand-button {
          width: 100%;
          border: 0;
          background: #fff;
          padding: 14px 21px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          color: #246780;
          cursor: pointer;
          font-size: 13px;
          font-weight: 800;
          text-align: left;
        }

        .order-expand-button:hover {
          background: #f7fbfc;
        }

        /* =====================================================
           EXPANDED DETAILS
        ===================================================== */

        .order-expanded-content {
          border-top: 1px solid #e3edf0;
          background: #fbfdfe;
        }

        .order-detail-section {
          padding: 22px 21px;
          border-bottom: 1px solid #e5eef1;
        }

        .order-section-title {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #236d8b;
          margin-bottom: 17px;
        }

        .order-section-title > svg {
          flex-shrink: 0;
        }

        .order-section-title div {
          display: flex;
          flex-direction: column;
        }

        .order-section-title strong {
          color: #244f60;
          font-size: 14px;
        }

        .order-section-title small {
          color: #82959c;
          font-size: 11px;
          margin-top: 3px;
        }

        /* =====================================================
           DETAIL GRID
        ===================================================== */

        .detail-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        .detail-field {
          min-width: 0;
          background: #fff;
          border: 1px solid #e0eaee;
          border-radius: 10px;
          padding: 13px;
        }

        .detail-field > span {
          display: block;
          color: #82949b;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: .8px;
          font-weight: 800;
          margin-bottom: 6px;
        }

        .detail-field > strong {
          display: block;
          color: #294f5e;
          font-size: 13px;
          line-height: 1.45;
        }

        .breakable {
          overflow-wrap: anywhere;
        }

        /* =====================================================
           SHIPPING
        ===================================================== */

        .shipping-address-card {
          background: #fff;
          border: 1px solid #dfeaec;
          border-radius: 12px;
          padding: 16px;
          color: #355c6b;
        }

        .shipping-address-card > strong {
          display: block;
          color: #1f4c5e;
          margin-bottom: 7px;
        }

        .shipping-address-card p {
          display: flex;
          align-items: center;
          gap: 5px;
          margin: 5px 0;
          color: #5e7680;
          font-size: 13px;
          line-height: 1.5;
        }

        .muted-label {
          color: #87989f;
        }

        /* =====================================================
           PAYMENT DETAILS
        ===================================================== */

        .payment-detail-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        /* =====================================================
           ITEMS
        ===================================================== */

        .order-items-table {
          border: 1px solid #dfeaec;
          border-radius: 12px;
          overflow: hidden;
          background: #fff;
        }

        .order-item-row {
          display: grid;
          grid-template-columns: minmax(220px, 1fr) 70px 110px 120px;
          align-items: center;
          gap: 12px;
          padding: 13px 14px;
          border-bottom: 1px solid #e5eef1;
        }

        .order-item-row:last-child {
          border-bottom: 0;
        }

        .order-item-product {
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .product-mini-icon {
          width: 38px;
          height: 38px;
          flex-shrink: 0;
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #edf7fa;
          color: #287491;
        }

        .order-item-product > div:last-child {
          min-width: 0;
        }

        .order-item-product strong {
          display: block;
          color: #294f5e;
          font-size: 13px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .order-item-product small {
          display: block;
          color: #85969d;
          font-size: 11px;
          margin-top: 3px;
        }

        .order-item-qty,
        .order-item-unit {
          color: #70868f;
          font-size: 12px;
        }

        .order-item-total {
          text-align: right;
          color: #214d60;
          font-size: 13px;
        }

        .no-items {
          padding: 20px;
          background: #fff;
          border: 1px solid #e0eaee;
          border-radius: 10px;
          color: #7e9198;
          font-size: 13px;
        }

        /* =====================================================
           TOTAL
        ===================================================== */

        .order-total-section {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 21px;
          background: #edf7fa;
          border-bottom: 1px solid #dcebef;
        }

        .order-total-section div {
          display: flex;
          flex-direction: column;
        }

        .order-total-section span {
          color: #4c707d;
          font-size: 13px;
          font-weight: 800;
        }

        .order-total-section small {
          color: #81959d;
          font-size: 11px;
          margin-top: 3px;
        }

        .order-total-section > strong {
          color: #126b91;
          font-family: Georgia, serif;
          font-size: 25px;
          font-weight: 400;
        }

        /* =====================================================
           SYSTEM INFO
        ===================================================== */

        .order-system-info {
          display: flex;
          align-items: center;
          gap: 7px;
          flex-wrap: wrap;
          padding: 13px 21px;
          color: #84979e;
          font-size: 10px;
        }

        .order-system-info strong {
          color: #58737d;
          overflow-wrap: anywhere;
        }

        /* =====================================================
           RESPONSIVE
        ===================================================== */

        @media (max-width: 1100px) {

          .bc-admin-sidebar {
            width: 215px;
          }

          .admin-stats {
            grid-template-columns: repeat(2, 1fr);
          }

          .admin-dashboard-grid {
            grid-template-columns: 1fr;
          }

          .order-summary-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .order-item-row {
            grid-template-columns: minmax(180px, 1fr) 60px 90px 100px;
          }

        }

        @media (max-width: 800px) {

          .bc-admin {
            display: block;
          }

          .bc-admin-sidebar {
            width: 100%;
            min-height: auto;
            height: auto;
            position: relative;
            padding: 18px;
          }

          .bc-admin-logo {
            padding-bottom: 18px;
          }

          .bc-admin-nav {
            display: flex;
            overflow-x: auto;
            padding-bottom: 4px;
          }

          .bc-admin-nav button {
            width: auto;
            white-space: nowrap;
          }

          .bc-admin-signout {
            border: 0;
            padding-top: 10px;
          }

          .bc-admin-main {
            padding: 35px 18px;
          }

          .bc-admin-title {
            font-size: 48px;
          }

          .admin-page-heading {
            align-items: flex-start;
            flex-direction: column;
          }

          .admin-form-grid {
            grid-template-columns: 1fr;
          }

          .admin-field.full {
            grid-column: auto;
          }

          .admin-product-row {
            align-items: flex-start;
            flex-direction: column;
          }

          .admin-product-actions {
            width: 100%;
          }

          .admin-icon-btn {
            flex: 1;
          }

          .order-quick-info {
            grid-template-columns: 1fr;
          }

          .order-meta-bar {
            align-items: flex-start;
            flex-direction: column;
          }

          .order-status-control {
            width: 100%;
          }

          .order-status-select {
            flex: 1;
          }

          .detail-grid,
          .payment-detail-grid {
            grid-template-columns: 1fr;
          }

          .order-item-row {
            grid-template-columns: 1fr auto;
          }

          .order-item-product {
            grid-column: 1 / -1;
          }

          .order-item-qty {
            grid-column: 1;
          }

          .order-item-unit {
            grid-column: 2;
            text-align: right;
          }

          .order-item-total {
            grid-column: 2;
            grid-row: 2;
          }

        }

        @media (max-width: 560px) {

          .admin-stats,
          .order-summary-grid {
            grid-template-columns: 1fr 1fr;
          }

          .admin-hero-actions {
            flex-direction: column;
          }

          .admin-hero-actions .admin-btn {
            width: 100%;
          }

          .order-header {
            padding: 16px;
          }

          .admin-order-header {
            align-items: flex-start;
            flex-direction: column;
            padding: 17px;
          }

          .order-header-right {
            width: 100%;
            justify-content: space-between;
          }

          .order-filter-row {
            align-items: stretch;
            flex-direction: column;
          }

          .order-filter {
            width: 100%;
          }

          .order-filter select {
            flex: 1;
          }

          .order-result-count {
            margin-left: 0;
          }

          .order-quick-info {
            padding-left: 17px;
            padding-right: 17px;
          }

          .order-meta-bar {
            padding-left: 17px;
            padding-right: 17px;
          }

          .order-expand-button {
            padding-left: 17px;
            padding-right: 17px;
          }

          .order-detail-section {
            padding: 19px 17px;
          }

          .order-total-section {
            padding: 18px 17px;
          }

          .order-system-info {
            padding: 12px 17px;
          }

          .order-summary-card {
            padding: 15px;
          }

          .order-summary-card strong {
            font-size: 22px;
          }

        }

      `}</style>

      <section className="bc-admin">

        {/* ===================================================
            SIDEBAR
        =================================================== */}

        <aside className="bc-admin-sidebar">

          <div className="bc-admin-logo">
            BlueCurios
            <span>˚</span>
          </div>

          <nav className="bc-admin-nav">

            <button
              type="button"
              className={
                active === "Overview"
                  ? "active"
                  : ""
              }
              onClick={() =>
                changeSection(
                  "Overview"
                )
              }
            >
              <BarChart3
                size={17}
              />
              Overview
            </button>

            <button
              type="button"
              className={
                active === "Products"
                  ? "active"
                  : ""
              }
              onClick={() =>
                changeSection(
                  "Products"
                )
              }
            >
              <Boxes
                size={17}
              />
              Products
            </button>

            <button
              type="button"
              className={
                active === "Orders"
                  ? "active"
                  : ""
              }
              onClick={() =>
                changeSection(
                  "Orders"
                )
              }
            >
              <ClipboardList
                size={17}
              />
              Orders
            </button>

            <button
              type="button"
              className={
                active === "Customers"
                  ? "active"
                  : ""
              }
              onClick={() =>
                changeSection(
                  "Customers"
                )
              }
            >
              <Users
                size={17}
              />
              Customers
            </button>

            <button
              type="button"
              className={
                active ===
                "Custom Requests"
                  ? "active"
                  : ""
              }
              onClick={() =>
                changeSection(
                  "Custom Requests"
                )
              }
            >
              <Package
                size={17}
              />
              Custom Requests
            </button>

            <button
              type="button"
              className={
                active === "Coupons"
                  ? "active"
                  : ""
              }
              onClick={() =>
                changeSection(
                  "Coupons"
                )
              }
            >
              <CreditCard
                size={17}
              />
              Coupons
            </button>

          </nav>

          <div className="bc-admin-signout">

            <nav className="bc-admin-nav">

              <button
                type="button"
                onClick={
                  signOut
                }
              >
                <LogOut
                  size={17}
                />
                Sign out
              </button>

            </nav>

          </div>

        </aside>

        {/* ===================================================
            MAIN
        =================================================== */}

        <main className="bc-admin-main">

          <div className="bc-admin-content">

            {/* =================================================
                OVERVIEW
            ================================================= */}

            {active ===
              "Overview" && (
              <>

                <span className="admin-eyebrow">
                  Studio control
                </span>

                <h1 className="bc-admin-title">
                  BlueCurios Admin.
                </h1>

                <p className="bc-admin-subtitle">
                  Manage your BlueCurios
                  store, products and
                  customer orders from
                  one place.
                </p>

                <div className="admin-hero-actions">

                  <button
                    type="button"
                    className="admin-btn admin-btn-dark"
                    onClick={
                      openCreateForm
                    }
                  >
                    <Plus
                      size={17}
                    />
                    Add Product
                  </button>

                  <button
                    type="button"
                    className="admin-btn admin-btn-light"
                    onClick={() =>
                      setActive(
                        "Orders"
                      )
                    }
                  >
                    <ClipboardList
                      size={17}
                    />
                    View Orders
                  </button>

                </div>

                <div className="admin-stats">

                  <div className="admin-stat">
                    <span>
                      Total products
                    </span>

                    <strong>
                      {
                        products.length
                      }
                    </strong>
                  </div>

                  <div className="admin-stat">
                    <span>
                      Published
                    </span>

                    <strong>
                      {
                        publishedCount
                      }
                    </strong>
                  </div>

                  <div className="admin-stat">
                    <span>
                      Drafts
                    </span>

                    <strong>
                      {draftCount}
                    </strong>
                  </div>

                  <div className="admin-stat">
                    <span>
                      Orders
                    </span>

                    <strong>
                      —
                    </strong>
                  </div>

                </div>

                <div className="admin-dashboard-grid">

                  <div className="admin-card">
                    <h3>
                      Products
                    </h3>

                    <p>
                      {products.length
                        ? `${products.length} product${
                            products.length ===
                            1
                              ? ""
                              : "s"
                          } currently in your catalogue.`
                        : "Your catalogue is empty."}
                    </p>
                  </div>

                  <div className="admin-card">
                    <h3>
                      Orders
                    </h3>

                    <p>
                      Open the Orders
                      section to review
                      customer orders and
                      payment status.
                    </p>
                  </div>

                  <div className="admin-card">
                    <h3>
                      Custom
                    </h3>

                    <p>
                      Custom requests and
                      coupon management can
                      be connected here next.
                    </p>
                  </div>

                </div>

              </>
            )}

            {/* =================================================
                PRODUCTS
            ================================================= */}

            {active ===
              "Products" && (
              <>

                <div className="admin-page-heading">

                  <div>
                    <span className="admin-eyebrow">
                      Catalogue
                    </span>

                    <h2>
                      Products
                    </h2>

                    <p>
                      Create and manage
                      your BlueCurios
                      catalogue.
                    </p>
                  </div>

                  <button
                    type="button"
                    className="admin-btn admin-btn-dark"
                    onClick={() =>
                      showForm
                        ? closeCreateForm()
                        : openCreateForm()
                    }
                  >
                    {showForm ? (
                      <>
                        <X
                          size={17}
                        />
                        Close
                      </>
                    ) : (
                      <>
                        <Plus
                          size={17}
                        />
                        Add Product
                      </>
                    )}
                  </button>

                </div>

                {showForm && (
                  <form
                    className="admin-product-form"
                    onSubmit={
                      createProduct
                    }
                  >

                    <h3>
                      Add a new product
                    </h3>

                    <p className="admin-form-intro">
                      Add the product
                      details, photos and
                      publishing status.
                    </p>

                    <div className="admin-form-grid">

                      <label className="admin-field">
                        <span>
                          Product name
                        </span>

                        <input
                          value={
                            form.name
                          }
                          onChange={(
                            event
                          ) =>
                            handleNameChange(
                              event.target
                                .value
                            )
                          }
                          placeholder="Example: Crochet Daisy Bag"
                          disabled={
                            saving
                          }
                          required
                        />
                      </label>

                      <label className="admin-field">
                        <span>
                          Price (₹)
                        </span>

                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={
                            form.price
                          }
                          onChange={(
                            event
                          ) =>
                            updateForm(
                              "price",
                              event.target
                                .value
                            )
                          }
                          placeholder="1299"
                          disabled={
                            saving
                          }
                          required
                        />
                      </label>

                    </div>

                    <div className="admin-slug">
                      Slug:{" "}
                      <strong>
                        {form.slug ||
                          "your-product-slug"}
                      </strong>
                    </div>

                    <div
                      className="admin-form-grid"
                      style={{
                        marginTop:
                          18,
                      }}
                    >

                      <label className="admin-field full">
                        <span>
                          Description
                        </span>

                        <textarea
                          value={
                            form.description
                          }
                          onChange={(
                            event
                          ) =>
                            updateForm(
                              "description",
                              event.target
                                .value
                            )
                          }
                          placeholder="Tell customers about this piece..."
                          disabled={
                            saving
                          }
                        />
                      </label>

                      <label className="admin-field">
                        <span>
                          Materials
                        </span>

                        <textarea
                          value={
                            form.materials
                          }
                          onChange={(
                            event
                          ) =>
                            updateForm(
                              "materials",
                              event.target
                                .value
                            )
                          }
                          placeholder="Cotton yarn..."
                          disabled={
                            saving
                          }
                        />
                      </label>

                      <label className="admin-field">
                        <span>
                          Care instructions
                        </span>

                        <textarea
                          value={
                            form.care_instructions
                          }
                          onChange={(
                            event
                          ) =>
                            updateForm(
                              "care_instructions",
                              event.target
                                .value
                            )
                          }
                          placeholder="Hand wash gently..."
                          disabled={
                            saving
                          }
                        />
                      </label>

                      <label className="admin-field">
                        <span>
                          Production time
                        </span>

                        <input
                          value={
                            form.production_time
                          }
                          onChange={(
                            event
                          ) =>
                            updateForm(
                              "production_time",
                              event.target
                                .value
                            )
                          }
                          placeholder="3–5 working days"
                          disabled={
                            saving
                          }
                        />
                      </label>

                      <label className="admin-field">
                        <span>
                          Shipping information
                        </span>

                        <textarea
                          value={
                            form.shipping_info
                          }
                          onChange={(
                            event
                          ) =>
                            updateForm(
                              "shipping_info",
                              event.target
                                .value
                            )
                          }
                          placeholder="Ships across India..."
                          disabled={
                            saving
                          }
                        />
                      </label>

                      <label className="admin-field full">
                        <span>
                          Returns information
                        </span>

                        <textarea
                          value={
                            form.returns_info
                          }
                          onChange={(
                            event
                          ) =>
                            updateForm(
                              "returns_info",
                              event.target
                                .value
                            )
                          }
                          placeholder="Returns accepted within 7 days..."
                          disabled={
                            saving
                          }
                        />
                      </label>

                    </div>

                    <div className="admin-upload">

                      <h4>
                        Product photos
                      </h4>

                      <p>
                        Select multiple JPG,
                        PNG or WebP images.
                        The first image becomes
                        the main product image.
                      </p>

                      <label className="admin-upload-box">

                        <Upload
                          size={24}
                        />

                        <strong>
                          Choose product photos
                        </strong>

                        <small>
                          JPG, PNG or WebP
                        </small>

                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          multiple
                          onChange={
                            handleImages
                          }
                          disabled={
                            saving
                          }
                        />

                      </label>

                      {images.length >
                        0 && (
                        <div className="admin-image-previews">

                          {images.map(
                            (
                              file,
                              index
                            ) => (
                              <div
                                className="admin-image-preview"
                                key={`${file.name}-${file.size}-${file.lastModified}`}
                              >

                                {previewUrls[
                                  index
                                ] ? (
                                  <img
                                    src={
                                      previewUrls[
                                        index
                                      ]
                                    }
                                    alt={
                                      file.name
                                    }
                                  />
                                ) : (
                                  <div
                                    style={{
                                      height:
                                        125,
                                      display:
                                        "flex",
                                      alignItems:
                                        "center",
                                      justifyContent:
                                        "center",
                                    }}
                                  >
                                    <ImageIcon />
                                  </div>
                                )}

                                {index ===
                                  0 && (
                                  <span className="admin-image-preview-main">
                                    Main image
                                  </span>
                                )}

                                <button
                                  type="button"
                                  className="admin-image-remove"
                                  onClick={() =>
                                    removeImage(
                                      index
                                    )
                                  }
                                  disabled={
                                    saving
                                  }
                                  aria-label={`Remove ${file.name}`}
                                >
                                  <X
                                    size={
                                      15
                                    }
                                  />
                                </button>

                                <span className="admin-image-preview-label">
                                  {
                                    file.name
                                  }
                                </span>

                              </div>
                            )
                          )}

                        </div>
                      )}

                    </div>

                    <label className="admin-checkbox">

                      <input
                        type="checkbox"
                        checked={
                          form.published
                        }
                        onChange={(
                          event
                        ) =>
                          updateForm(
                            "published",
                            event.target
                              .checked
                          )
                        }
                        disabled={
                          saving
                        }
                      />

                      <span>
                        Publish this product
                        immediately
                      </span>

                    </label>

                    {error && (
                      <div className="admin-error">
                        {error}
                      </div>
                    )}

                    {status && (
                      <div className="admin-status-message">
                        {status}
                      </div>
                    )}

                    {saving && (
                      <div className="admin-progress">

                        <div className="admin-progress-track">

                          <div
                            className="admin-progress-bar"
                            style={{
                              width: `${progress}%`,
                            }}
                          />

                        </div>

                        <span className="admin-progress-text">
                          {progress}% complete
                        </span>

                      </div>
                    )}

                    <div className="admin-form-actions">

                      <button
                        type="button"
                        className="admin-btn admin-btn-light"
                        onClick={
                          closeCreateForm
                        }
                        disabled={
                          saving
                        }
                      >
                        Cancel
                      </button>

                      <button
                        type="submit"
                        className="admin-btn admin-btn-dark"
                        disabled={
                          saving
                        }
                      >
                        <Plus
                          size={17}
                        />

                        {saving
                          ? "Creating..."
                          : "Create Product"}
                      </button>

                    </div>

                  </form>
                )}

                {loadingProducts ? (
                  <div className="admin-card admin-loading-card">

                    <div className="admin-spinner" />

                    <p>
                      Loading products...
                    </p>

                  </div>
                ) : products.length ===
                  0 ? (
                  <div className="admin-empty">

                    <Boxes
                      size={32}
                    />

                    <h3>
                      No products yet.
                    </h3>

                    <p>
                      Add your first
                      BlueCurios product
                      above.
                    </p>

                  </div>
                ) : (
                  <div className="admin-product-list">

                    {products.map(
                      (product) => (
                        <div
                          className="admin-product-row"
                          key={
                            product.id
                          }
                        >

                          <div className="admin-product-info">

                            <strong className="admin-product-name">
                              {
                                product.name
                              }
                            </strong>

                            <div className="admin-product-meta">

                              <span>
                                {formatPrice(
                                  product.price
                                )}
                              </span>

                              <span>
                                •
                              </span>

                              <span>
                                {formatDate(
                                  product.created_at
                                )}
                              </span>

                              <span
                                className={
                                  product.published
                                    ? "admin-status published"
                                    : "admin-status pending"
                                }
                              >
                                {product.published
                                  ? "Published"
                                  : "Draft"}
                              </span>

                            </div>

                          </div>

                          <div className="admin-product-actions">

                            <button
                              type="button"
                              className="admin-icon-btn"
                              onClick={() =>
                                togglePublished(
                                  product
                                )
                              }
                              title={
                                product.published
                                  ? "Unpublish"
                                  : "Publish"
                              }
                            >
                              {product.published ? (
                                <EyeOff
                                  size={
                                    17
                                  }
                                />
                              ) : (
                                <Eye
                                  size={
                                    17
                                  }
                                />
                              )}
                            </button>

                            <button
                              type="button"
                              className="admin-icon-btn delete"
                              onClick={() =>
                                deleteProduct(
                                  product
                                )
                              }
                              disabled={
                                deletingId ===
                                product.id
                              }
                              title="Delete product"
                            >
                              {deletingId ===
                              product.id ? (
                                <div className="admin-spinner" />
                              ) : (
                                <Trash2
                                  size={
                                    17
                                  }
                                />
                              )}
                            </button>

                          </div>

                        </div>
                      )
                    )}

                  </div>
                )}

              </>
            )}

            {/* =================================================
                ORDERS
            ================================================= */}

            {active ===
              "Orders" && (
              <OrdersPanel />
            )}

            {/* =================================================
                CUSTOMERS
            ================================================= */}

            {/* =================================================
    CUSTOMERS
================================================= */}

{active === "Customers" && (
  <div>
    <div className="admin-page-heading">
      <div>
        <span className="admin-eyebrow">
          Store activity
        </span>

        <h2>Customers</h2>

        <p>
          Customer profiles, purchases and order history.
        </p>
      </div>

      <button
        type="button"
        className="admin-btn admin-btn-light"
        onClick={refreshCustomers}
        disabled={refreshingCustomers}
      >
        {refreshingCustomers ? "Refreshing..." : "Refresh"}
      </button>
    </div>

    <div className="admin-customer-toolbar">
      <div className="admin-customer-search">
        <Search size={17} />

        <input
          type="search"
          value={customerSearch}
          onChange={(event) =>
            setCustomerSearch(event.target.value)
          }
          placeholder="Search customer name, email or phone..."
        />
      </div>

      <div className="admin-customer-count">
        {filteredCustomers.length}{" "}
        {filteredCustomers.length === 1
          ? "customer"
          : "customers"}
      </div>
    </div>

    {customerError && (
      <div className="admin-error">
        {customerError}
      </div>
    )}

    {loadingCustomers ? (
      <div className="admin-card admin-loading-card">
        <div className="admin-spinner" />
        <p>Loading customers...</p>
      </div>
    ) : filteredCustomers.length === 0 ? (
      <div className="admin-empty">
        <Users size={32} />

        <h3>
          {customerSearch
            ? "No matching customers."
            : "No customers yet."}
        </h3>

        <p>
          {customerSearch
            ? "Try another name, email or phone number."
            : "Customers will appear here after orders are placed."}
        </p>
      </div>
    ) : (
      <div className="admin-customer-list">
        {filteredCustomers.map((customer) => {
          const isExpanded =
            expandedCustomer === customer.id;

          return (
            <article
              key={customer.id}
              className={`admin-customer-card ${
                isExpanded ? "expanded" : ""
              }`}
            >
              <button
                type="button"
                className="admin-customer-summary"
                onClick={() =>
                  setExpandedCustomer(
                    isExpanded ? null : customer.id
                  )
                }
              >
                <div className="admin-customer-avatar">
                  {(customer.name || "?")
                    .charAt(0)
                    .toUpperCase()}
                </div>

                <div className="admin-customer-main">
                  <strong>
                    {customer.name}
                  </strong>

                  <span>
                    {customer.email}
                  </span>
                </div>

                <div className="admin-customer-stats">
                  <div>
                    <small>Orders</small>
                    <strong>
                      {customer.orders.length}
                    </strong>
                  </div>

                  <div>
                    <small>Spent</small>
                    <strong>
                      {formatPrice(customer.totalSpent)}
                    </strong>
                  </div>

                  <div className="admin-customer-chevron">
                    {isExpanded ? "−" : "+"}
                  </div>
                </div>
              </button>

              {isExpanded && (
                <div className="admin-customer-details">

                  <div className="admin-customer-contact">

                    <div>
                      <span>Name</span>
                      <strong>
                        {customer.name}
                      </strong>
                    </div>

                    <div>
                      <span>Email</span>
                      <strong>
                        {customer.email}
                      </strong>
                    </div>

                    <div>
                      <span>Phone</span>
                      <strong>
                        {customer.phone}
                      </strong>
                    </div>

                    <div>
                      <span>Total spent</span>
                      <strong>
                        {formatPrice(customer.totalSpent)}
                      </strong>
                    </div>

                  </div>

                  <div className="admin-customer-orders-title">
                    Products purchased
                  </div>

                  <div className="admin-customer-orders">

                    {customer.orders.map((order) => (
                      <div
                        className="admin-customer-order"
                        key={order.id}
                      >

                        <div className="admin-customer-order-head">
                          <div>
                            <strong>
                              {order.order_number ||
                                `#${String(order.id).slice(0, 8)}`}
                            </strong>

                            <small>
                              {formatDateTime(
                                order.created_at
                              )}
                            </small>
                          </div>

                          <strong>
                            {formatPrice(order.total)}
                          </strong>
                        </div>

                        <div className="admin-customer-order-meta">
                          <span className="admin-customer-order-status">
                            {order.status || "pending"}
                          </span>
                        </div>

                        <div className="admin-customer-order-items">

                          {(order.order_items || []).map(
                            (item) => (
                              <div
                                className="admin-customer-order-item"
                                key={item.id}
                              >
                                <span>
                                  <strong>
                                    {item.product_name}
                                  </strong>

                                  {item.variant_label && (
                                    <small>
                                      {item.variant_label}
                                    </small>
                                  )}
                                </span>

                                <span>
                                  Qty: {item.quantity}
                                </span>

                                <strong>
                                  {formatPrice(
                                    item.unit_price
                                  )}
                                </strong>
                              </div>
                            )
                          )}

                        </div>

                        <details className="admin-customer-shipping">
                          <summary>
                            View shipping information
                          </summary>

                          <div>
                            {(() => {
                              const address =
                                order.shipping_address || {};

                              return (
                                <>
                                  <p>
                                    <strong>
                                      {address.full_name ||
                                        address.fullName ||
                                        address.name ||
                                        "Not provided"}
                                    </strong>
                                  </p>

                                  <p>
                                    {address.address ||
                                      address.address_line_1 ||
                                      address.addressLine1 ||
                                      ""}
                                  </p>

                                  {(
                                    address.address_line_2 ||
                                    address.addressLine2 ||
                                    address.landmark
                                  ) && (
                                    <p>
                                      {address.address_line_2 ||
                                        address.addressLine2 ||
                                        address.landmark}
                                    </p>
                                  )}

                                  <p>
                                    {[
                                      address.city ||
                                        address.town,
                                      address.state ||
                                        address.state_name,
                                      address.pin ||
                                        address.pincode ||
                                        address.postal_code ||
                                        address.postalCode,
                                    ]
                                      .filter(Boolean)
                                      .join(", ")}
                                  </p>

                                  <p>
                                    Phone:{" "}
                                    {address.phone ||
                                      address.mobile ||
                                      address.phone_number ||
                                      "Not provided"}
                                  </p>

                                  <p>
                                    Email:{" "}
                                    {address.email ||
                                      "Not provided"}
                                  </p>

                                  {address.country && (
                                    <p>
                                      Country:{" "}
                                      {address.country}
                                    </p>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        </details>

                      </div>
                    ))}

                  </div>

                </div>
              )}
            </article>
          );
        })}
      </div>
    )}
  </div>
)}

            {/* =================================================
                CUSTOM REQUESTS
            ================================================= */}

            {/* =========================================
    CUSTOM REQUESTS
========================================= */}

              
{active === "Custom Requests" && (
  <div>
    <div className="admin-page-heading">
      <div>
        <span className="admin-eyebrow">Studio</span>

        <h2>Custom requests</h2>

        <p>
          Review customer requests and manage their status.
        </p>
      </div>
    </div>

    {/* LOADING */}

    {loadingCustomRequests && (
      <div className="admin-placeholder">
        <Package size={30} />

        <h3>Loading custom requests...</h3>

        <p>
          Please wait while requests are loaded.
        </p>
      </div>
    )}

    {/* ERROR */}

    {customRequestError && (
      <p className="admin-error">
        {customRequestError}
      </p>
    )}

    {/* EMPTY STATE */}

    {!loadingCustomRequests &&
      !customRequestError &&
      customRequests.length === 0 && (
        <div className="admin-placeholder">
          <Package size={30} />

          <h3>No custom requests yet</h3>

          <p>
            Customer submissions will appear here.
          </p>
        </div>
      )}

    {/* CUSTOM REQUESTS */}

    {!loadingCustomRequests &&
      !customRequestError &&
      customRequests.length > 0 && (
        <div className="admin-custom-requests">
          {customRequests.map((request) => (
            <article
              key={request.id}
              className="admin-custom-request-card"
            >
              {/* ======================================
                  HEADER
              ======================================= */}

              <div className="admin-custom-request-header">
                <div>
                  <h3>
                    {request.name || "Customer"}
                  </h3>

                  <p>
                    {request.email || "No email"}
                  </p>
                </div>

                {/* STATUS */}

                <select
                  value={request.status || "new"}
                  onChange={(event) =>
                    updateCustomRequestStatus(
                      request.id,
                      event.target.value
                    )
                  }
                >
                  <option value="new">
                    New
                  </option>

                  <option value="reviewing">
                    Reviewing
                  </option>

                  <option value="quoted">
                    Quoted
                  </option>

                  <option value="approved">
                    Approved
                  </option>

                  <option value="completed">
                    Completed
                  </option>

                  <option value="rejected">
                    Rejected
                  </option>
                </select>
              </div>

              {/* ======================================
                  REQUEST DETAILS
              ======================================= */}

              <div className="admin-custom-request-body">

                {/* REQUEST */}

                <div className="custom-request-detail">
                  <strong>Request:</strong>

                  <p className="custom-request-text">
                    {request.request ||
                      "No request details provided."}
                  </p>
                </div>

                {/* PHONE */}

                {request.phone && (
                  <p>
                    <strong>Phone:</strong>{" "}
                    {request.phone}
                  </p>
                )}

                {/* BUDGET */}

                {request.budget !== null &&
                  request.budget !== undefined && (
                    <p>
                      <strong>Budget:</strong>{" "}
                      ₹
                      {Number(
                        request.budget
                      ).toLocaleString("en-IN")}
                    </p>
                  )}

                {/* ==================================
                    REFERENCE IMAGE
                =================================== */}

                {request.image_url ? (
                  <div className="admin-custom-request-image">
                    <strong>
                      Reference image:
                    </strong>

                    <div className="custom-request-image-wrapper">
                      <img
                        src={request.image_url}
                        alt="Customer reference"
                        className="custom-request-reference-image"
                        loading="lazy"
                        onLoad={() => {
                          console.log(
                            "ADMIN IMAGE LOADED:",
                            request.image_url
                          );
                        }}
                        onError={(event) => {
                          console.error(
                            "ADMIN IMAGE LOAD ERROR:",
                            request.image_url
                          );

                          event.currentTarget.style.display =
                            "none";

                          const errorMessage =
                            event.currentTarget
                              .parentElement
                              ?.querySelector(
                                ".custom-request-image-error"
                              );

                          if (errorMessage) {
                            errorMessage.style.display =
                              "block";
                          }
                        }}
                      />

                      <p
                        className="custom-request-image-error"
                        style={{
                          display: "none",
                        }}
                      >
                        Unable to load the reference image.
                        Please check the Supabase Storage
                        permissions.
                      </p>
                    </div>
                  </div>
                ) : (
                  <p>
                    <strong>
                      Reference image:
                    </strong>{" "}
                    No image provided.
                  </p>
                )}

                {/* SUBMITTED DATE */}

                {request.created_at && (
                  <p>
                    <strong>Submitted:</strong>{" "}
                    {new Date(
                      request.created_at
                    ).toLocaleString()}
                  </p>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
  </div>
)}

                  
            {/* =================================================
                COUPONS
            ================================================= */}

            {active ===
              "Coupons" && (
              <div>

                <div className="admin-page-heading">

                  <div>

                    <span className="admin-eyebrow">
                      Store tools
                    </span>

                    <h2>
                      Coupons
                    </h2>

                    <p>
                      Create and manage
                      promotional discounts.
                    </p>

                  </div>

                </div>

                <div className="admin-placeholder">

                  <CreditCard
                    size={30}
                  />

                  <h2>
                    Coupon management
                  </h2>

                  <p>
                    Coupon creation and
                    redemption tracking
                    will be connected
                    here.
                  </p>

                </div>

              </div>
            )}
           
    </div>
</main>
</section>
</>
);
}