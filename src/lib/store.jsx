import React, {
  createContext,
  useContext,
  useMemo,
  useState,
} from "react";

const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);

  // Add product to cart
  const addToCart = (product, variant = {}) => {
    setCart((current) => {
      const key = `${product.id}-${variant.color || ""}-${variant.size || ""}`;

      const existing = current.find(
        (item) => item.key === key
      );

      if (existing) {
        return current.map((item) =>
          item.key === key
            ? {
                ...item,
                quantity: item.quantity + 1,
              }
            : item
        );
      }

      return [
        ...current,
        {
          key,
          product,
          variant,
          quantity: 1,
        },
      ];
    });
  };

  // Remove one item completely
  const removeFromCart = (key) => {
    setCart((current) =>
      current.filter((item) => item.key !== key)
    );
  };

  // Update item quantity
  const updateQuantity = (key, quantity) => {
    if (quantity < 1) {
      removeFromCart(key);
      return;
    }

    setCart((current) =>
      current.map((item) =>
        item.key === key
          ? {
              ...item,
              quantity,
            }
          : item
      )
    );
  };

  // Clear entire cart after successful payment
  const clearCart = () => {
    setCart([]);
  };

  // Add/remove product from wishlist
  const toggleWishlist = (id) => {
    setWishlist((current) =>
      current.includes(id)
        ? current.filter((x) => x !== id)
        : [...current, id]
    );
  };

  // Calculate cart subtotal
  const subtotal = cart.reduce(
    (sum, item) =>
      sum +
      Number(item.product?.price || 0) *
        Number(item.quantity || 0),
    0
  );

  const value = useMemo(
    () => ({
      cart,
      wishlist,
      subtotal,

      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      toggleWishlist,
    }),
    [cart, wishlist, subtotal]
  );

  return (
    <StoreContext.Provider value={value}>
      {children}
    </StoreContext.Provider>
  );
}

export const useStore = () => useContext(StoreContext);