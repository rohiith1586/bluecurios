import React from "react";
import { Link } from "react-router-dom";
import {
  Minus,
  Plus,
  Trash2,
} from "lucide-react";
import { useStore } from "../lib/store";

export default function Cart() {
  const {
    cart,
    subtotal,
    updateQuantity,
    removeFromCart,
  } = useStore();

  const shipping =
    subtotal >= 999 || subtotal === 0
      ? 0
      : 79;

  return (
    <section className="section cart-page">
      <div className="narrow">

        <span className="eyebrow">
          Your bag
        </span>

        <h1>Cart.</h1>

        {!cart.length ? (
          <div className="empty-state">

            <h2>
              Your bag is empty.
            </h2>

            <p>
              When you find something curious,
              it'll live here.
            </p>

            <Link
              to="/shop"
              className="btn primary"
            >
              Explore the collection
            </Link>

          </div>
        ) : (

          <div className="cart-layout">

            {/* CART ITEMS */}

            <div className="cart-items">

              {cart.map((item) => {

                const product =
                  item.product || item;

                const productId =
                  product.id;

                const productSlug =
                  product.slug || productId;

                const productImage =
                  item.image ||
                  product.image ||
                  product.image_url ||
                  item.images?.[0] ||
                  product.images?.[0] ||
                  null;

                return (
                  <div
                    className="cart-item"
                    key={item.key || productId}
                  >

                    {/* PRODUCT IMAGE */}

                    <Link
                      to={`/product/${productSlug}`}
                      className="cart-image"
                    >

                      {productImage ? (
                        <img
                          src={productImage}
                          alt={
                            product.name ||
                            "Product"
                          }
                        />
                      ) : (
                        <div className="image-placeholder">
                          Image coming soon
                        </div>
                      )}

                    </Link>

                    {/* PRODUCT INFORMATION */}

                    <div className="cart-item-info">

                      <Link
                        to={`/product/${productSlug}`}
                        className="cart-product-name"
                      >
                        {product.name}
                      </Link>

                      <span className="cart-variant">
                        {item.variant?.color ||
                          "Default variant"}
                      </span>

                      <span className="cart-price">
                        ₹
                        {Number(
                          product.price || 0
                        ).toLocaleString("en-IN")}
                      </span>

                      {/* QUANTITY */}

                      <div className="cart-quantity">

                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(
                              item.key,
                              Math.max(
                                1,
                                item.quantity - 1
                              )
                            )
                          }
                          aria-label="Decrease quantity"
                        >
                          <Minus size={15} />
                        </button>

                        <span>
                          {item.quantity}
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(
                              item.key,
                              item.quantity + 1
                            )
                          }
                          aria-label="Increase quantity"
                        >
                          <Plus size={15} />
                        </button>

                      </div>

                    </div>

                    {/* ITEM TOTAL + REMOVE */}

                    <div className="cart-item-right">

                      <strong>
                        ₹
                        {(
                          Number(
                            product.price || 0
                          ) *
                          item.quantity
                        ).toLocaleString("en-IN")}
                      </strong>

                      <button
                        type="button"
                        onClick={() =>
                          removeFromCart(item.key)
                        }
                        className="icon-button"
                        aria-label="Remove product"
                      >
                        <Trash2 size={17} />
                      </button>

                    </div>

                  </div>
                );
              })}

            </div>

            {/* SUMMARY */}

            <aside className="cart-summary">

              <h2>Summary</h2>

              <div className="summary-row">
                <span>Subtotal</span>

                <strong>
                  ₹
                  {subtotal.toLocaleString("en-IN")}
                </strong>
              </div>

              <div className="summary-row">
                <span>Shipping</span>

                <strong>
                  {shipping
                    ? `₹${shipping}`
                    : "Free"}
                </strong>
              </div>

              <div className="summary-total">
                <span>Total</span>

                <strong>
                  ₹
                  {(
                    subtotal + shipping
                  ).toLocaleString("en-IN")}
                </strong>
              </div>

              <div className="cart-actions">

                <Link
                  to="/checkout"
                  className="btn primary"
                >
                  Checkout
                </Link>

                <Link
                  to="/shop"
                  className="text-link"
                >
                  Continue shopping
                </Link>

              </div>

            </aside>

          </div>
        )}

      </div>
    </section>
  );
}