import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import ProductCard from "../components/ProductCard";
import { useStore } from "../lib/store";
import { supabase } from "../lib/supabase";

export default function Wishlist() {
  const { wishlist } = useStore();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadWishlist() {
      setLoading(true);
      setError("");

      if (!supabase) {
        setError("Supabase is not connected.");
        setLoading(false);
        return;
      }

      if (!wishlist || wishlist.length === 0) {
        setProducts([]);
        setLoading(false);
        return;
      }

      try {
        console.log("WISHLIST IDS:", wishlist);

        // Load products
        const {
          data: productData,
          error: productError,
        } = await supabase
          .from("products")
          .select("*")
          .in("id", wishlist)
          .eq("published", true);

        if (productError) {
          throw productError;
        }

        console.log(
          "WISHLIST PRODUCTS:",
          productData
        );

        // Load images
        const {
          data: imageData,
          error: imageError,
        } = await supabase
          .from("product_images")
          .select("*")
          .in("product_id", wishlist)
          .order("sort_order", {
            ascending: true,
          });

        if (imageError) {
          throw imageError;
        }

        console.log(
          "WISHLIST IMAGES:",
          imageData
        );

        // Attach public image URLs
        const hydratedProducts =
          (productData || []).map((product) => {

            const productImages =
              (imageData || [])
                .filter(
                  (image) =>
                    image.product_id ===
                    product.id
                )
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
                    url:
                      publicUrlData.publicUrl,
                  };
                });

            return {
              ...product,

              images: productImages,

              image:
                productImages[0]?.url ||
                null,
            };
          });

        console.log(
          "HYDRATED WISHLIST:",
          hydratedProducts
        );

        setProducts(
          hydratedProducts
        );

      } catch (err) {
        console.error(
          "WISHLIST ERROR:",
          err
        );

        setError(
          err.message ||
            "Unable to load wishlist."
        );

        setProducts([]);
      }

      setLoading(false);
    }

    loadWishlist();
  }, [wishlist]);

  if (loading) {
    return (
      <section className="section">
        <div className="narrow">

          <span className="eyebrow">
            Your saved pieces
          </span>

          <h1>Wishlist.</h1>

          <p className="lead">
            Loading your saved pieces...
          </p>

        </div>
      </section>
    );
  }

  return (
    <section className="section">

      <div className="narrow">

        <span className="eyebrow">
          Your saved pieces
        </span>

        <h1>Wishlist.</h1>

        <p className="lead">
          Pieces you've saved for later.
        </p>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {!error &&
          products.length === 0 && (
            <div className="empty-state">

              <Heart size={32} />

              <h2>
                Your wishlist is empty.
              </h2>

              <p>
                Save pieces you love and
                they'll appear here.
              </p>

              <Link
                to="/shop"
                className="btn primary"
              >
                Explore the shop
              </Link>

            </div>
          )}

        {!error &&
          products.length > 0 && (
            <div className="product-grid">

              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                />
              ))}

            </div>
          )}

      </div>

    </section>
  );
}