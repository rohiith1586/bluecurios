import React from "react";
import { Heart, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";
import { useStore } from "../lib/store";

export default function ProductCard({ product }) {
  const {
    addToCart,
    wishlist,
    toggleWishlist,
  } = useStore();

  const liked = wishlist.includes(product.id);

  function handleWishlist(event) {
    event.preventDefault();
    event.stopPropagation();

    toggleWishlist(product.id);
  }

  function handleAddToCart(event) {
    event.preventDefault();
    event.stopPropagation();

    addToCart(product);
  }

  return (
    <article className="product-card">

      <div className="product-image-wrap">

        <Link
          to={`/product/${product.slug || product.id}`}
          className="product-image-link"
        >

          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              className="product-image"
              loading="lazy"
            />
          ) : (
            <div className="product-image-placeholder">
              Product photography to be added
            </div>
          )}

        </Link>

        <button
          type="button"
          className={liked ? "wish active" : "wish"}
          onClick={handleWishlist}
          aria-label={
            liked
              ? "Remove from wishlist"
              : "Add to wishlist"
          }
        >
          <Heart
            size={18}
            fill={liked ? "currentColor" : "none"}
          />
        </button>

      </div>

      <div className="product-card-info">

        <Link
          to={`/product/${product.slug || product.id}`}
          className="product-name"
        >
          {product.name}
        </Link>

        <div className="product-meta">
          <span>
            {product.category || "Handmade crochet"}
          </span>

          <strong>
            ₹
            {Number(product.price || 0).toLocaleString(
              "en-IN"
            )}
          </strong>
        </div>

        <button
          type="button"
          className="add-btn"
          onClick={handleAddToCart}
        >
          <ShoppingBag size={16} />
          Add to Cart
        </button>

      </div>

    </article>
  );
}