import React from "react";
import { Link, NavLink } from "react-router-dom";
import {
  Heart,
  Menu,
  ShoppingBag,
  X,
  UserRound,
} from "lucide-react";
import { useState } from "react";
import { useStore } from "../lib/store";

export default function Layout({ children }) {
  const [open, setOpen] = useState(false);
  const { cart, wishlist } = useStore();

  const nav = [
    ["Shop", "/shop"],
    ["Our Story", "/#story"],
    ["Custom", "/custom"],
    ["Journal", "/journal"],
  ];

  return (
    <div className="site-shell">

      <div className="announcement">
        Small-batch crochet · Made slowly · Made with care
      </div>

      <header className="header">

        <button
          className="mobile-menu"
          onClick={() => setOpen(!open)}
          aria-label="Toggle navigation"
        >
          {open ? (
            <X size={22} />
          ) : (
            <Menu size={22} />
          )}
        </button>

        <Link className="logo" to="/">
          BlueCurios<span>˚</span>
        </Link>

        <nav className={open ? "nav open" : "nav"}>
          {nav.map(([label, href]) => (
            <NavLink
              key={label}
              to={href}
              onClick={() => setOpen(false)}
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="header-actions">

          <Link
            to="/account"
            aria-label="Account"
          >
            <UserRound size={19} />
          </Link>

          <Link
            to="/wishlist"
            aria-label="Wishlist"
            className="icon-badge"
          >
            <Heart size={19} />

            {wishlist.length > 0 && (
              <b>{wishlist.length}</b>
            )}
          </Link>

          <Link
            to="/cart"
            aria-label="Cart"
            className="icon-badge"
          >
            <ShoppingBag size={19} />

            {cart.length > 0 && (
              <b>
                {cart.reduce(
                  (n, x) => n + x.quantity,
                  0
                )}
              </b>
            )}
          </Link>

        </div>

      </header>

      <main>
        {children}
      </main>

      <footer className="footer">

        <div>
          <div className="logo">
            BlueCurios<span>˚</span>
          </div>

          <p>
            Handmade pieces for curious lives.
          </p>
        </div>

        <div>
          <h4>Explore</h4>
          <Link to="/shop">Shop</Link>
          <Link to="/custom">
            Custom crochet
          </Link>
          <Link to="/account">
            Your account
          </Link>
        </div>

        <div>
          <h4>Help</h4>
          <a href="#shipping">
            Shipping
          </a>
          <a href="#returns">
            Returns
          </a>
          <a href="mailto:hello@bluecurios.example">
            Contact
          </a>
        </div>

        <div>
          <h4>Stay Curious.</h4>

          <p>
            New drops, limited pieces and quiet
            little surprises.
          </p>

          <form
            onSubmit={(e) =>
              e.preventDefault()
            }
            className="newsletter-mini"
          >
            <input
              aria-label="Email"
              placeholder="Your email"
            />

            <button type="submit">
              Join
            </button>
          </form>
        </div>

        <div className="footer-bottom">
          © {new Date().getFullYear()} BlueCurios ·
          Replace placeholder contact and policy
          details before launch.
        </div>

      </footer>

    </div>
  );
}