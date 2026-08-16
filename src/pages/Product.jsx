import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
  Heart,
  Minus,
  Plus,
  ShieldCheck,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useStore } from "../lib/store";
import { supabase } from "../lib/supabase";

export default function Product() {
  const { slug } = useParams();
  const { addToCart } = useStore();

  const [product, setProduct] = useState(null);
  const [images, setImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(0);

  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProduct() {
      setLoading(true);
      setError("");

      try {
        if (!supabase) {
          throw new Error(
            "Supabase is not connected."
          );
        }

        // Load product
        const {
          data: productData,
          error: productError,
        } = await supabase
          .from("products")
          .select("*")
          .eq("slug", slug)
          .maybeSingle();

        if (productError) {
          throw productError;
        }

        if (!productData) {
          throw new Error(
            "Product not found."
          );
        }

        // Load product images
        const {
          data: imageData,
          error: imageError,
        } = await supabase
          .from("product_images")
          .select("*")
          .eq("product_id", productData.id)
          .order("sort_order", {
            ascending: true,
          });

        if (imageError) {
          throw imageError;
        }

        // Convert storage paths into public URLs
        const productImages = (imageData || [])
          .map((image) => {
            const {
              data: publicUrlData,
            } = supabase.storage
              .from("product-images")
              .getPublicUrl(
                image.storage_path
              );

            return {
              ...image,
              url: publicUrlData.publicUrl,
            };
          });

        setProduct(productData);
        setImages(productImages);
      } catch (err) {
        console.error(
          "PRODUCT LOAD ERROR:",
          err
        );

        setError(
          err.message ||
            "Unable to load product."
        );
      }

      setLoading(false);
    }

    loadProduct();
  }, [slug]);

  if (loading) {
    return (
      <section className="section empty-state">
        <p>Loading...</p>

        <h1>
          Finding your BlueCurios piece.
        </h1>
      </section>
    );
  }

  if (error || !product) {
    return (
      <section className="section empty-state">
        <Link
          to="/shop"
          className="text-link"
        >
          <ArrowLeft size={16} />
          Back to shop
        </Link>

        <h1>
          Product not found.
        </h1>

        <p>
          {error ||
            `We couldn't find the product "${slug}".`}
        </p>
      </section>
    );
  }

  const handleAddToCart = () => {
    addToCart({
      ...product,
      quantity: qty,
      image:
        images[selectedImage]?.url || null,
      images: images.map(
        (image) => image.url
      ),
    });
  };

  const currentImage =
    images[selectedImage]?.url;

  return (
    <section className="section product-detail">
      {/* IMAGE GALLERY */}
      <div className="gallery">
        {currentImage ? (
          <div className="main-product-image">
            <img
              src={currentImage}
              alt={
                images[selectedImage]?.alt_text ||
                product.name
              }
            />
          </div>
        ) : (
          <div className="image-placeholder">
            Product image coming soon
          </div>
        )}

        {images.length > 1 && (
          <div className="product-thumbnails">
            {images.map(
              (image, index) => (
                <button
                  key={image.id}
                  type="button"
                  className={
                    selectedImage === index
                      ? "thumbnail active"
                      : "thumbnail"
                  }
                  onClick={() =>
                    setSelectedImage(index)
                  }
                  aria-label={`View image ${
                    index + 1
                  }`}
                >
                  <img
                    src={image.url}
                    alt={
                      image.alt_text ||
                      `${product.name} ${
                        index + 1
                      }`
                    }
                  />
                </button>
              )
            )}
          </div>
        )}
      </div>

      {/* PRODUCT INFORMATION */}
      <div className="product-info">
        <Link
          to="/shop"
          className="text-link"
        >
          <ArrowLeft size={16} />
          Back to shop
        </Link>

        <span className="eyebrow">
          BlueCurios
        </span>

        <h1>
          {product.name}
        </h1>

        <div className="price">
          ₹
          {Number(
            product.price || 0
          ).toLocaleString("en-IN")}
        </div>

        {product.description && (
          <p>
            {product.description}
          </p>
        )}

        {/* QUANTITY */}
        <div className="qty">
          <button
            type="button"
            onClick={() =>
              setQty(
                Math.max(1, qty - 1)
              )
            }
            aria-label="Decrease quantity"
          >
            <Minus size={15} />
          </button>

          <span>{qty}</span>

          <button
            type="button"
            onClick={() =>
              setQty(qty + 1)
            }
            aria-label="Increase quantity"
          >
            <Plus size={15} />
          </button>
        </div>

        {/* ACTIONS */}
        <div className="buy-row">
          <button
            type="button"
            className="btn primary"
            onClick={handleAddToCart}
          >
            Add to Cart
          </button>

          <button
            type="button"
            className="icon-square"
            aria-label="Add to wishlist"
          >
            <Heart size={18} />
          </button>
        </div>

        {/* DETAILS */}
        <div className="details">
          <div>
            <ShieldCheck size={18} />

            <span>
              <b>
                Handmade details
              </b>

              <br />

              Small variations are a
              natural part of handmade work.
            </span>
          </div>

          <details>
            <summary>
              Materials
            </summary>

            <p>
              {product.materials ||
                "Material details will be added soon."}
            </p>
          </details>

          <details>
            <summary>
              Care instructions
            </summary>

            <p>
              {product.care_instructions ||
                "Care instructions will be added soon."}
            </p>
          </details>

          <details>
            <summary>
              Production time
            </summary>

            <p>
              {product.production_time ||
                "Production time will be confirmed before ordering."}
            </p>
          </details>

          <details>
            <summary>
              Shipping & returns
            </summary>

            <p>
              {product.shipping_info ||
                "Shipping information will be published before launch."}
            </p>

            <p>
              {product.returns_info ||
                "Returns information will be published before launch."}
            </p>
          </details>
        </div>
      </div>
    </section>
  );
}