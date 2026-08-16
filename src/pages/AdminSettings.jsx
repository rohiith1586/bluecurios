import React, {
  useEffect,
  useState,
} from "react";

import {
  Save,
  RefreshCw,
} from "lucide-react";

import { supabase } from "../lib/supabase";

const defaults = {
  id: 1,
  store_name: "BlueCurious",
  support_email: "",
  support_phone: "",
  shipping_fee: 79,
  free_shipping_threshold: 999,
  announcement:
    "SMALL-BATCH CROCHET · MADE SLOWLY · MADE WITH CARE",
  upi_id: "",
  instagram_url: "",
  whatsapp_number: "",
};

export default function AdminSettings() {
  const [form, setForm] =
    useState(defaults);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    setLoading(true);
    setError("");

    const { data, error } =
      await supabase
        .from("store_settings")
        .select("*")
        .eq("id", 1)
        .maybeSingle();

    if (error) {
      console.error(
        "SETTINGS LOAD ERROR:",
        error
      );

      setError(error.message);
    } else if (data) {
      setForm({
        ...defaults,
        ...data,
      });
    }

    setLoading(false);
  }

  function updateField(
    event
  ) {
    const {
      name,
      value,
    } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    setMessage("");
  }

  async function saveSettings(
    event
  ) {
    event.preventDefault();

    setSaving(true);
    setError("");
    setMessage("");

    const payload = {
      id: 1,
      store_name:
        form.store_name.trim(),
      support_email:
        form.support_email.trim(),
      support_phone:
        form.support_phone.trim(),
      shipping_fee:
        Number(form.shipping_fee || 0),
      free_shipping_threshold:
        Number(
          form.free_shipping_threshold ||
            0
        ),
      announcement:
        form.announcement.trim(),
      upi_id:
        form.upi_id.trim(),
      instagram_url:
        form.instagram_url.trim(),
      whatsapp_number:
        form.whatsapp_number.trim(),
    };

    const { error } =
      await supabase
        .from("store_settings")
        .upsert(payload, {
          onConflict: "id",
        });

    if (error) {
      console.error(
        "SETTINGS SAVE ERROR:",
        error
      );

      setError(error.message);
    } else {
      setMessage(
        "Settings saved successfully."
      );
    }

    setSaving(false);
  }

  if (loading) {
    return (
      <Box>
        Loading store settings...
      </Box>
    );
  }

  return (
    <form
      onSubmit={saveSettings}
    >
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
            Control your BlueCurious
            store information.
          </p>
        </div>

        <button
          type="button"
          onClick={loadSettings}
          style={secondaryButton}
        >
          <RefreshCw size={15} />
          Reload
        </button>
      </div>

      {error && (
        <div style={errorStyle}>
          {error}
        </div>
      )}

      {message && (
        <div style={successStyle}>
          {message}
        </div>
      )}

      <div
        style={{
          display: "grid",
          gap: 18,
        }}
      >
        <Box>
          <h2 style={heading}>
            Store information
          </h2>

          <div style={gridStyle}>
            <Field
              label="Store name"
              name="store_name"
              value={
                form.store_name
              }
              onChange={
                updateField
              }
            />

            <Field
              label="Support email"
              name="support_email"
              type="email"
              value={
                form.support_email
              }
              onChange={
                updateField
              }
            />

            <Field
              label="Support phone"
              name="support_phone"
              value={
                form.support_phone
              }
              onChange={
                updateField
              }
            />

            <Field
              label="WhatsApp number"
              name="whatsapp_number"
              value={
                form.whatsapp_number
              }
              onChange={
                updateField
              }
            />

            <Field
              label="Instagram URL"
              name="instagram_url"
              value={
                form.instagram_url
              }
              onChange={
                updateField
              }
            />
          </div>
        </Box>

        <Box>
          <h2 style={heading}>
            Shipping
          </h2>

          <div style={gridStyle}>
            <Field
              label="Shipping fee (₹)"
              name="shipping_fee"
              type="number"
              min="0"
              value={
                form.shipping_fee
              }
              onChange={
                updateField
              }
            />

            <Field
              label="Free shipping above (₹)"
              name="free_shipping_threshold"
              type="number"
              min="0"
              value={
                form.free_shipping_threshold
              }
              onChange={
                updateField
              }
            />
          </div>
        </Box>

        <Box>
          <h2 style={heading}>
            Payment
          </h2>

          <Field
            label="UPI ID"
            name="upi_id"
            value={form.upi_id}
            onChange={
              updateField
            }
            placeholder="yourupi@bank"
          />
        </Box>

        <Box>
          <h2 style={heading}>
            Announcement bar
          </h2>

          <textarea
            name="announcement"
            value={
              form.announcement
            }
            onChange={
              updateField
            }
            rows={3}
            style={{
              width: "100%",
              boxSizing:
                "border-box",
              border:
                "1px solid #d8d3ca",
              borderRadius: 10,
              padding: 13,
              resize: "vertical",
              fontFamily:
                "inherit",
              fontSize: 15,
            }}
          />
        </Box>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent:
            "flex-end",
          marginTop: 22,
        }}
      >
        <button
          type="submit"
          disabled={saving}
          style={primaryButton}
        >
          <Save size={16} />

          {saving
            ? "Saving..."
            : "Save settings"}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  value,
  onChange,
  type = "text",
  min,
}) {
  return (
    <label
      style={{
        display: "block",
        fontWeight: 700,
      }}
    >
      {label}

      <input
        name={name}
        type={type}
        value={value ?? ""}
        onChange={onChange}
        min={min}
        style={{
          display: "block",
          width: "100%",
          boxSizing:
            "border-box",
          marginTop: 7,
          padding:
            "12px 13px",
          border:
            "1px solid #d8d3ca",
          borderRadius: 9,
          fontSize: 15,
          background: "#fff",
        }}
      />
    </label>
  );
}

function Box({ children }) {
  return (
    <div style={cardStyle}>
      {children}
    </div>
  );
}

const heading = {
  fontFamily: "Georgia, serif",
  fontWeight: 400,
  marginTop: 0,
};

const gridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(2, minmax(0, 1fr))",
  gap: 18,
};

const cardStyle = {
  background: "#fff",
  border: "1px solid #ddd8cf",
  borderRadius: 20,
  padding: 27,
};

const primaryButton = {
  border: "none",
  background: "#202d31",
  color: "#fff",
  borderRadius: 25,
  padding: "12px 19px",
  cursor: "pointer",
  fontWeight: 700,
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
};

const secondaryButton = {
  border: "none",
  background: "#eee",
  color: "#26343a",
  borderRadius: 25,
  padding: "11px 16px",
  cursor: "pointer",
  fontWeight: 700,
  display: "inline-flex",
  alignItems: "center",
  gap: 7,
};

const errorStyle = {
  marginBottom: 18,
  padding: 14,
  borderRadius: 10,
  background: "#fcebea",
  color: "#a52820",
};

const successStyle = {
  marginBottom: 18,
  padding: 14,
  borderRadius: 10,
  background: "#e7f3eb",
  color: "#176b3a",
};