import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function AdminRoute({ children }) {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdmin();
  }, []);

  async function checkAdmin() {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      console.log("ADMIN USER:", user);

      if (userError) {
        console.error("USER ERROR:", userError);
        setLoading(false);
        return;
      }

      if (!user) {
        console.log("NO USER LOGGED IN");
        setLoading(false);
        return;
      }

      const {
        data: profile,
        error: profileError,
      } = await supabase
        .from("profiles")
        .select("id, is_admin")
        .eq("id", user.id)
        .maybeSingle();

      console.log("ADMIN PROFILE:", profile);
      console.log("PROFILE ERROR:", profileError);

      if (profileError) {
        console.error(
          "ADMIN PROFILE ERROR:",
          profileError
        );

        setIsAdmin(false);
        setLoading(false);
        return;
      }

      if (profile?.is_admin === true) {
        console.log("ADMIN ACCESS GRANTED");
        setIsAdmin(true);
      } else {
        console.log("ADMIN ACCESS DENIED");
        setIsAdmin(false);
      }

    } catch (error) {
      console.error(
        "ADMIN CHECK FAILED:",
        error
      );

      setIsAdmin(false);
    }

    setLoading(false);
  }

  if (loading) {
    return (
      <section className="section">
        <div className="narrow">
          <span className="eyebrow">
            BlueCurios
          </span>

          <h1>
            Checking access...
          </h1>

          <p>
            Please wait.
          </p>
        </div>
      </section>
    );
  }

  if (!isAdmin) {
    return (
      <Navigate
        to="/account"
        replace
      />
    );
  }

  return children;
}