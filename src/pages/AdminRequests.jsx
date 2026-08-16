import React, {
  useEffect,
  useState,
} from "react";

import {
  Package,
  RefreshCw,
  Trash2,
} from "lucide-react";

import { supabase } from "../lib/supabase";

const STATUSES = [
  "new",
  "reviewing",
  "quoted",
  "approved",
  "completed",
  "rejected",
];

export default function AdminRequests() {
  const [requests, setRequests] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    loadRequests();
  }, []);

  async function loadRequests() {
    setLoading(true);
    setError("");

    const { data, error } =
      await supabase
        .from("custom_requests")
        .select("*")
        .order("created_at", {
          ascending: false,
        });

    if (error) {
      console.error(
        "CUSTOM REQUESTS ERROR:",
        error
      );

      setError(error.message);
      setRequests([]);
    } else {
      setRequests(data || []);
    }

    setLoading(false);
  }

  async function updateStatus(
    id,
    status
  ) {
    const { error } =
      await supabase
        .from("custom_requests")
        .update({
          status,
        })
        .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    setRequests((current) =>
      current.map((request) =>
        request.id === id
          ? {
              ...request,
              status,
            }
          : request
      )
    );
  }

  async function updateNotes(
    id,
    admin_notes
  ) {
    const { error } =
      await supabase
        .from("custom_requests")
        .update({
          admin_notes,
        })
        .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    setRequests((current) =>
      current.map((request) =>
        request.id === id
          ? {
              ...request,
              admin_notes,
            }
          : request
      )
    );
  }

  async function deleteRequest(
    request
  ) {
    const confirmed =
      window.confirm(
        `Delete the custom request from ${request.name}?`
      );

    if (!confirmed) return;

    const { error } =
      await supabase
        .from("custom_requests")
        .delete()
        .eq("id", request.id);

    if (error) {
      alert(error.message);
      return;
    }

    setRequests((current) =>
      current.filter(
        (item) =>
          item.id !== request.id
      )
    );
  }

  if (loading) {
    return (
      <Box>
        Loading custom requests...
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <h2>Custom requests</h2>

        <p>{error}</p>

        <button
          type="button"
          onClick={loadRequests}
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
          marginBottom: 25,
          flexWrap: "wrap",
          gap: 15,
        }}
      >
        <p
          style={{
            margin: 0,
            color: "#65757c",
            fontSize: 18,
          }}
        >
          Review and manage custom
          crochet requests.
        </p>

        <button
          type="button"
          onClick={loadRequests}
          style={buttonStyle}
        >
          <RefreshCw size={15} />
          Refresh
        </button>
      </div>

      {requests.length === 0 ? (
        <Box>
          <Package size={30} />

          <h2>No requests yet.</h2>

          <p>
            New custom requests will
            appear here.
          </p>
        </Box>
      ) : (
        <div
          style={{
            display: "grid",
            gap: 16,
          }}
        >
          {requests.map((request) => (
            <div
              key={request.id}
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
                    {request.name}
                  </h3>

                  <p
                    style={{
                      color: "#65757c",
                      margin:
                        "6px 0",
                    }}
                  >
                    {request.email ||
                      "No email"}
                    {" · "}
                    {request.phone ||
                      "No phone"}
                  </p>

                  <small
                    style={{
                      color: "#718087",
                    }}
                  >
                    {request.created_at
                      ? new Date(
                          request.created_at
                        ).toLocaleString(
                          "en-IN"
                        )
                      : ""}
                  </small>
                </div>

                <select
                  value={
                    request.status ||
                    "new"
                  }
                  onChange={(event) =>
                    updateStatus(
                      request.id,
                      event.target.value
                    )
                  }
                  style={selectStyle}
                >
                  {STATUSES.map(
                    (status) => (
                      <option
                        key={status}
                        value={status}
                      >
                        {status
                          .charAt(0)
                          .toUpperCase() +
                          status.slice(1)}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div
                style={{
                  marginTop: 20,
                  padding: 18,
                  borderRadius: 14,
                  background: "#f7f4ee",
                }}
              >
                <strong>
                  Request
                </strong>

                <p
                  style={{
                    whiteSpace:
                      "pre-wrap",
                    lineHeight: 1.6,
                    marginBottom: 0,
                  }}
                >
                  {request.request}
                </p>
              </div>

              <div
                style={{
                  marginTop: 15,
                  color: "#65757c",
                }}
              >
                Budget:{" "}
                <strong>
                  ₹
                  {Number(
                    request.budget || 0
                  ).toLocaleString(
                    "en-IN"
                  )}
                </strong>
              </div>

              <label
                style={{
                  display: "block",
                  marginTop: 18,
                  fontWeight: 700,
                }}
              >
                Admin notes

                <textarea
                  defaultValue={
                    request.admin_notes ||
                    ""
                  }
                  onBlur={(event) =>
                    updateNotes(
                      request.id,
                      event.target.value
                    )
                  }
                  rows={3}
                  placeholder="Internal notes..."
                  style={{
                    display: "block",
                    width: "100%",
                    boxSizing:
                      "border-box",
                    marginTop: 7,
                    border:
                      "1px solid #d8d3ca",
                    borderRadius: 10,
                    padding: 12,
                    resize: "vertical",
                    fontFamily:
                      "inherit",
                  }}
                />
              </label>

              <div
                style={{
                  display: "flex",
                  justifyContent:
                    "flex-end",
                  marginTop: 15,
                }}
              >
                <button
                  type="button"
                  onClick={() =>
                    deleteRequest(
                      request
                    )
                  }
                  style={{
                    ...buttonStyle,
                    background:
                      "#fcebea",
                    color: "#a52820",
                  }}
                >
                  <Trash2 size={15} />
                  Delete
                </button>
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

const selectStyle = {
  border: "1px solid #d8d3ca",
  borderRadius: 10,
  padding: "10px 12px",
  background: "#fff",
};