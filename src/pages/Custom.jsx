import React, { useEffect, useState } from "react";
import { UploadCloud, X, Image as ImageIcon } from "lucide-react";
import { supabase } from "../lib/supabase";

export default function Custom() {
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    productType: "",
    colour: "",
    size: "",
    design: "",
    budget: "",
    deadline: "",
    notes: "",
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please choose an image file.");
      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Please choose an image smaller than 5 MB.");
      e.target.value = "";
      return;
    }

    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }

    setImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }

    setImage(null);
    setImagePreview("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!supabase) {
      alert("Supabase is not connected.");
      return;
    }

    setLoading(true);

    try {
      let imageUrl = null;

      // ==========================================
      // 1. UPLOAD IMAGE
      // ==========================================

      if (image) {
        const fileExtension =
          image.name.split(".").pop()?.toLowerCase() || "jpg";

        const fileName = `${Date.now()}-${Math.random()
          .toString(36)
          .substring(2, 10)}.${fileExtension}`;

        const filePath = `requests/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("custom-requests")
          .upload(filePath, image, {
            cacheControl: "3600",
            upsert: false,
            contentType: image.type,
          });

        if (uploadError) {
          console.error("IMAGE UPLOAD ERROR:", uploadError);

          throw new Error(
            `Image upload failed: ${uploadError.message}`
          );
        }

        const { data: publicUrlData } = supabase.storage
          .from("custom-requests")
          .getPublicUrl(filePath);

        imageUrl = publicUrlData?.publicUrl || null;

        console.log("Uploaded image:", imageUrl);
      }

      // ==========================================
      // 2. CREATE REQUEST TEXT
      // ==========================================

      const requestText = `
Product type: ${form.productType || "Not specified"}

Preferred colour: ${form.colour || "Not specified"}

Size / measurements: ${form.size || "Not specified"}

Preferred design:
${form.design || "Not specified"}

Deadline: ${form.deadline || "Not specified"}

Additional notes:
${form.notes || "None"}
      `.trim();

      // ==========================================
      // 3. GET CURRENT USER
      // ==========================================

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.error("AUTH ERROR:", userError);
      }

      // ==========================================
      // 4. SAVE REQUEST TO DATABASE
      // ==========================================

      const { data: requestData, error: insertError } = await supabase
        .from("custom_requests")
        .insert({
          user_id: user?.id || null,
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          request: requestText,
          budget: form.budget ? Number(form.budget) : null,
          status: "new",
          image_url: imageUrl,
        })
        .select()
        .single();

      if (insertError) {
        console.error("DATABASE ERROR:", insertError);

        throw new Error(
          `Could not submit request: ${insertError.message}`
        );
      }

      // This is now AFTER requestData has been created
      console.log("CUSTOM REQUEST SAVED:", requestData);

      // ==========================================
      // 5. SUCCESS
      // ==========================================

      alert(
        "Your custom request has been submitted successfully! We'll review it and get back to you."
      );

      // ==========================================
      // 6. RESET FORM
      // ==========================================

      setForm({
        name: "",
        email: "",
        phone: "",
        productType: "",
        colour: "",
        size: "",
        design: "",
        budget: "",
        deadline: "",
        notes: "",
      });

      removeImage();
    } catch (error) {
      console.error("CUSTOM REQUEST FAILED:", error);

      alert(
        error?.message ||
          "Could not submit your request. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="section custom-page">
      <div className="narrow">
        <span className="eyebrow">
          Made around your idea
        </span>

        <h1>
          Dream It.
          <br />
          <em>We'll Crochet It.</em>
        </h1>

        <p className="lead">
          Tell us what you're imagining. Handmade custom pieces may
          require additional production time, and we'll confirm
          feasibility and timing before any payment is taken.
        </p>

        <form
          className="form-card"
          onSubmit={handleSubmit}
        >
          {/* NAME */}

          <label>
            Name

            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              placeholder="Your name"
            />
          </label>

          {/* EMAIL */}

          <label>
            Email

            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
              placeholder="your@email.com"
            />
          </label>

          {/* PHONE */}

          <label>
            Phone

            <input
              name="phone"
              type="tel"
              value={form.phone}
              onChange={handleChange}
              required
              placeholder="Your phone number"
            />
          </label>

          {/* PRODUCT TYPE */}

          <label>
            Product type

            <input
              name="productType"
              value={form.productType}
              onChange={handleChange}
              required
              placeholder="e.g. bag, top, home piece"
            />
          </label>

          {/* COLOUR */}

          <label>
            Preferred colour

            <input
              name="colour"
              value={form.colour}
              onChange={handleChange}
              placeholder="Colour, palette or reference"
            />
          </label>

          {/* SIZE */}

          <label>
            Size

            <input
              name="size"
              value={form.size}
              onChange={handleChange}
              placeholder="Size or measurements"
            />
          </label>

          {/* DESIGN */}

          <label>
            Preferred design

            <textarea
              name="design"
              value={form.design}
              onChange={handleChange}
              placeholder="Tell us about the shape, texture or details you want."
            />
          </label>

          {/* BUDGET */}

          <label>
            Budget

            <input
              name="budget"
              type="number"
              min="0"
              step="0.01"
              value={form.budget}
              onChange={handleChange}
              placeholder="Your budget in ₹"
            />
          </label>

          {/* DEADLINE */}

          <label>
            Deadline

            <input
              name="deadline"
              type="date"
              value={form.deadline}
              onChange={handleChange}
            />
          </label>

          {/* IMAGE */}

          <label>
            Reference image

            <div className="upload">
              {!imagePreview ? (
                <label className="upload-select">
                  <UploadCloud size={21} />

                  <span>
                    Choose an image
                  </span>

                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    hidden
                  />
                </label>
              ) : (
                <div className="upload-preview">
                  <img
                    src={imagePreview}
                    alt="Reference preview"
                  />

                  <div className="upload-preview-info">
                    <ImageIcon size={18} />

                    <span>
                      {image?.name}
                    </span>
                  </div>

                  <button
                    type="button"
                    className="upload-remove"
                    onClick={removeImage}
                    aria-label="Remove image"
                  >
                    <X size={18} />
                  </button>
                </div>
              )}
            </div>
          </label>

          {/* NOTES */}

          <label>
            Additional notes

            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              placeholder="Anything else we should know?"
            />
          </label>

          {/* SUBMIT */}

          <button
            className="btn primary"
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Sending Request..."
              : "Send Custom Request"}
          </button>
        </form>
      </div>
    </section>
  );
}

