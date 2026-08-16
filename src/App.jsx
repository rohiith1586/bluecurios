import React from "react";
import { Routes, Route } from "react-router-dom";

import Layout from "./components/Layout";
import AdminRoute from "./components/AdminRoute";

import { StoreProvider } from "./lib/store.jsx";

import Home from "./pages/Home";
import Shop from "./pages/Shop";
import Product from "./pages/Product";
import Custom from "./pages/Custom";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Account from "./pages/Account";
import Wishlist from "./pages/Wishlist";
import Journal from "./pages/Journal";
import Admin from "./pages/Admin";
import Login from "./pages/login";

export default function App() {
  return (
    <StoreProvider>
      <Layout>
        <Routes>

          <Route path="/" element={<Home />} />

          <Route path="/shop" element={<Shop />} />

          <Route
            path="/product/:slug"
            element={<Product />}
          />

          <Route
            path="/custom"
            element={<Custom />}
          />

          <Route
            path="/cart"
            element={<Cart />}
          />

          <Route
            path="/checkout"
            element={<Checkout />}
          />

          <Route
            path="/account"
            element={<Account />}
          />

          <Route
            path="/login"
            element={<Login />}
          />

          <Route
            path="/wishlist"
            element={<Wishlist />}
          />

          <Route
            path="/journal"
            element={<Journal />}
          />

          <Route
            path="/admin"
            element={
              <AdminRoute>
                <Admin />
              </AdminRoute>
            }
          />

        </Routes>
      </Layout>
    </StoreProvider>
  );
}