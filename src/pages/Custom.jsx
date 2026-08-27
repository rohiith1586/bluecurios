```jsx
import React, { useState } from "react";
import { UploadCloud, X, Image as ImageIcon } from "lucide-react";

export default function Custom() {
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    // Only allow images
    if (!file.type.startsWith("image/")) {
      alert("Please choose an image file.");
      return;
    }

    // Limit file size to 5 MB
    if (file.size > 5 * 1024 * 1024) {
      alert("Please choose an image smaller than 5 MB.");
      return;
    }

    setImage(file);

    // Create preview
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
  };

  const removeImage = () => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }

    setImage(null);
    setImagePreview("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (image) {
      console.log("Selected image:", image);
    }

    alert(
      "Your custom request has been prepared. We will review your request and get back to you."
    );
  };

  return (
    <section className="section custom-page">
      <div className="narrow">

        <span className="eyebrow">Made around your idea</span>

        <h1>
          Dream It.
          <br />
          <em>We'll Crochet It.</em>
        </h1>

        <p className="lead">
          Tell us what you're imagining. Handmade custom pieces may require
          additional production time, and we'll confirm feasibility and timing
          before any payment is taken.
        </p>

        <form className="form-card" onSubmit={handleSubmit}>

          <label>
            Product type
            <input
              required
              placeholder="e.g. bag, top, home piece"
            />
          </label>

          <label>
            Preferred colour
            <input
              placeholder="Colour, palette or reference"
            />
          </label>

          <label>
            Size
            <input
              placeholder="Size or measurements"
            />
          </label>

          <label>
            Preferred design
            <textarea
              placeholder="Tell us about the shape, texture or details you want."
            />
          </label>

          <label>
            Budget
            <input
              inputMode="decimal"
              placeholder="Your budget in ₹"
            />
          </label>

          <label>
            Deadline
            <input type="date" />
          </label>

          <label>
            Reference image

            <div className="upload">

              {!imagePreview ? (
                <>
                  <UploadCloud size={21} />

                  <span>Choose an image</span>

                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                </>
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

                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                  />

                </div>
              )}

            </div>
          </label>

          <label>
            Additional notes
            <textarea
              placeholder="Anything else we should know?"
            />
          </label>

          <button
            className="btn primary"
            type="submit"
          >
            Send Custom Request
          </button>

        </form>
      </div>
    </section>
  );
}
```
