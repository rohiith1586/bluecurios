import React, { useEffect, useState } from "react";
import {
  RefreshCw,
  ExternalLink,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { supabase } from "../lib/supabase";

export default function AdminRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const loadRequests = async () => {
    if (!supabase) {
      console.error("Supabase is not connected.");
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("custom_requests")
        .select("*")
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        console.error("LOAD REQUESTS ERROR:", error);
        throw error;
      }

      setRequests(data || []);
    } catch (error) {
      console.error(error);
      alert(
        error?.message ||
          "Could not load custom requests."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const updateStatus = async (id, status) => {
    if (!supabase) return;

    setUpdatingId(id);

    try {
      const { error } = await supabase
        .from("custom_requests")
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) {
        console.error("UPDATE STATUS ERROR:", error);
        throw error;
      }

      setRequests((prev) =>
        prev.map((request) =>
          request.id === id
            ? {
                ...request,
                status,
              }
            : request
        )
      );

    } catch (error) {
      console.error(error);

      alert(
        error?.message ||
          "Could not update request."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const formatDate = (date) => {
    if (!date) return "—";

    return new Date(date).toLocaleString(
      "en-IN",
      {
        dateStyle: "medium",
        timeStyle: "short",
      }
    );
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "approved":
        return "request-status approved";

      case "completed":
        return "request-status completed";

      case "rejected":
        return "request-status rejected";

      default:
        return "request-status pending";
    }
  };

  return (
    <section className="section admin-requests-page">

      <div className="narrow">

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "20px",
            marginBottom: "30px",
          }}
        >

          <div>
            <span className="eyebrow">
              Customer enquiries
            </span>

            <h1>
              Custom Requests.
            </h1>

            <p className="lead">
              Review custom crochet requests submitted
              by customers.
            </p>
          </div>

          <button
            type="button"
            className="btn secondary"
            onClick={loadRequests}
            disabled={loading}
          >
            <RefreshCw size={17} />

            {loading
              ? "Loading..."
              : "Refresh"}
          </button>

        </div>


        {/* LOADING */}

        {loading && (
          <div className="form-card">
            <p>Loading custom requests...</p>
          </div>
        )}


        {/* EMPTY */}

        {!loading && requests.length === 0 && (
          <div className="form-card">

            <h3>
              No custom requests yet.
            </h3>

            <p>
              When a customer submits the custom
              request form, it will appear here.
            </p>

          </div>
        )}


        {/* REQUESTS */}

        {!loading && requests.length > 0 && (

          <div
            style={{
              display: "grid",
              gap: "24px",
            }}
          >

            {requests.map((request) => (

              <article
                key={request.id}
                className="form-card"
              >

                {/* HEADER */}

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: "20px",
                    marginBottom: "20px",
                  }}
                >

                  <div>

                    <span className="eyebrow">
                      Custom request
                    </span>

                    <h2>
                      {request.name ||
                        "Unnamed customer"}
                    </h2>

                    <p>
                      {formatDate(
                        request.created_at
                      )}
                    </p>

                  </div>


                  <span
                    className={getStatusClass(
                      request.status
                    )}
                  >
                    {request.status ||
                      "new"}
                  </span>

                </div>


                {/* CUSTOMER */}

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fit, minmax(220px, 1fr))",
                    gap: "16px",
                    marginBottom: "24px",
                  }}
                >

                  <div>
                    <strong>
                      Email
                    </strong>

                    <p>
                      {request.email || "—"}
                    </p>
                  </div>


                  <div>
                    <strong>
                      Phone
                    </strong>

                    <p>
                      {request.phone || "—"}
                    </p>
                  </div>


                  <div>
                    <strong>
                      Budget
                    </strong>

                    <p>
                      {request.budget
                        ? `₹${Number(
                            request.budget
                          ).toLocaleString("en-IN")}`
                        : "Not specified"}
                    </p>
                  </div>

                </div>


                {/* REQUEST DETAILS */}

                <div
                  style={{
                    marginBottom: "24px",
                  }}
                >

                  <strong>
                    Request details
                  </strong>

                  <div
                    style={{
                      whiteSpace: "pre-wrap",
                      marginTop: "10px",
                      lineHeight: "1.7",
                    }}
                  >
                    {request.request ||
                      "No details provided."}
                  </div>

                </div>


                {/* IMAGE */}

                {request.image_url && (

                  <div
                    style={{
                      marginBottom: "24px",
                    }}
                  >

                    <strong>
                      Reference image
                    </strong>

                    <div
                      style={{
                        marginTop: "12px",
                      }}
                    >

                      <img
                        src={request.image_url}
                        alt="Customer reference"
                        style={{
                          width: "100%",
                          maxWidth: "500px",
                          maxHeight: "500px",
                          objectFit: "contain",
                          borderRadius: "12px",
                          display: "block",
                          border:
                            "1px solid #ddd",
                        }}
                      />

                    </div>

                    <a
                      href={request.image_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn secondary"
                      style={{
                        display: "inline-flex",
                        marginTop: "12px",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      Open Image
                      <ExternalLink size={16} />
                    </a>

                  </div>

                )}


                {/* STATUS */}

                <div
                  style={{
                    borderTop:
                      "1px solid #ddd",
                    paddingTop: "20px",
                  }}
                >

                  <strong>
                    Update status
                  </strong>

                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "10px",
                      marginTop: "12px",
                    }}
                  >

                    <button
                      type="button"
                      className="btn secondary"
                      disabled={
                        updatingId === request.id
                      }
                      onClick={() =>
                        updateStatus(
                          request.id,
                          "pending"
                        )
                      }
                    >
                      <Clock size={16} />
                      Pending
                    </button>


                    <button
                      type="button"
                      className="btn secondary"
                      disabled={
                        updatingId === request.id
                      }
                      onClick={() =>
                        updateStatus(
                          request.id,
                          "approved"
                        )
                      }
                    >
                      <CheckCircle size={16} />
                      Approved
                    </button>


                    <button
                      type="button"
                      className="btn secondary"
                      disabled={
                        updatingId === request.id
                      }
                      onClick={() =>
                        updateStatus(
                          request.id,
                          "completed"
                        )
                      }
                    >
                      <CheckCircle size={16} />
                      Completed
                    </button>


                    <button
                      type="button"
                      className="btn secondary"
                      disabled={
                        updatingId === request.id
                      }
                      onClick={() =>
                        updateStatus(
                          request.id,
                          "rejected"
                        )
                      }
                    >
                      <XCircle size={16} />
                      Rejected
                    </button>

                  </div>

                </div>

              </article>

            ))}

          </div>

        )}

      </div>

    </section>
  );
}