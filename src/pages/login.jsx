import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e) {
    e.preventDefault();

    setLoading(true);
    setError("");

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      console.error("LOGIN ERROR:", error);
      setError(error.message);
      setLoading(false);
      return;
    }

    console.log("LOGGED IN USER:", data.user);

    navigate("/admin");
  }

  return (
    <section className="section account-page">
      <div className="narrow">

        <span className="eyebrow">
          BlueCurious
        </span>

        <h1>
          Welcome back.
        </h1>

        <p className="lead">
          Sign in to your BlueCurious account.
        </p>

        <form
          className="account-form"
          onSubmit={handleLogin}
        >

          <label>
            Email

            <input
              type="email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              placeholder="your@email.com"
              required
            />
          </label>

          <label>
            Password

            <input
              type="password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              placeholder="Your password"
              required
            />
          </label>

          {error && (
            <p className="error-message">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="btn primary"
            disabled={loading}
          >
            {loading
              ? "Signing in..."
              : "Sign in"}
          </button>

        </form>

        <p className="placeholder-note">
          Don't have an account?{" "}
          <Link to="/account">
            Create an account
          </Link>
        </p>

      </div>
    </section>
  );
}