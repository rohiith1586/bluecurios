import React, { useEffect, useMemo, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { Link } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import { supabase } from "../lib/supabase";

export default function Shop() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProducts() {
      setLoading(true);
      setError("");

      if (!supabase) {
        setError("Supabase is not connected.");
        setLoading(false);
        return;
      }

      try {
        // Load published products
        const {
          data: productData,
          error: productError,
        } = await supabase
          .from("products")
          .select("*")
          .eq("published", true)
          .order("created_at", {
            ascending: false,
          });

        if (productError) {
          throw productError;
        }

        // Load product images
        const {
          data: imageData,
          error: imageError,
        } = await supabase
          .from("product_images")
          .select("*")
          .order("sort_order", {
            ascending: true,
          });

        if (imageError) {
          throw imageError;
        }

        // Attach public image URLs
        const productsWithImages = (productData || []).map(
          (product) => {
            const images = (imageData || [])
              .filter(
                (image) =>
                  image.product_id === product.id
              )
              .map((image) => {
                const { data: publicUrlData } =
                  supabase.storage
                    .from("product-images")
                    .getPublicUrl(image.storage_path);

                return {
                  ...image,
                  url: publicUrlData.publicUrl,
                };
              });

            return {
              ...product,
              images,
              image: images[0]?.url || null,
            };
          }
        );

        setProducts(productsWithImages);
      } catch (err) {
        console.error("SHOP LOAD ERROR:", err);

        setError(
          err.message || "Unable to load products."
        );

        setProducts([]);
      }

      setLoading(false);
    }

    loadProducts();
  }, []);

  /*
   * Search + category filtering
   */
  const visible = useMemo(() => {
    return products.filter((product) => {
      const matchesText =
        !query ||
        product.name
          ?.toLowerCase()
          .includes(query.toLowerCase());

      /*
       * Categories are not currently connected
       * to category names, so All remains the
       * active filter for now.
       */
      const matchesCategory =
        category === "All";

      return matchesText && matchesCategory;
    });
  }, [products, query, category]);

  return (
    <section className="section shop-page">
      <div className="shop-header">
        <div className="shop-heading">
          <span className="eyebrow">
            The collection
          </span>

          <h1>
            Shop BlueCurios.
          </h1>

          <p className="lead">
            Thoughtfully made pieces,
            added in small batches.
          </p>
        </div>

        <div className="shop-tools">
          <div className="search-box">
            <Search size={18} />

            <input
              type="text"
              value={query}
              onChange={(e) =>
                setQuery(e.target.value)
              }
              placeholder="Search pieces..."
              aria-label="Search products"
            />
          </div>

          <div className="filter-box">
            <SlidersHorizontal size={17} />

            <select
              value={category}
              onChange={(e) =>
                setCategory(e.target.value)
              }
              aria-label="Filter products"
            >
              <option value="All">
                All
              </option>

              <option value="Bags">
                Bags
              </option>

              <option value="Tops">
                Tops
              </option>

              <option value="Dresses">
                Dresses
              </option>

              <option value="Accessories">
                Accessories
              </option>

              <option value="Home">
                Home
              </option>

              <option value="Custom">
                Custom
              </option>
            </select>
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="empty-state">
          <p>
            Loading the collection...
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="empty-state">
          <h2>
            Something went wrong.
          </h2>

          <p>
            {error}
          </p>
        </div>
      )}

      {/* Products */}
      {!loading &&
        !error &&
        visible.length > 0 && (
          <div className="product-grid">
            {visible.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
              />
            ))}
          </div>
        )}

      {/* No products */}
      {!loading &&
        !error &&
        visible.length === 0 && (
          <div className="empty-state">
            <h2>
              The shelves are waiting.
            </h2>

            <p>
              Add published products
              in the BlueCurios admin
              dashboard and they'll appear
              here automatically.
            </p>

            <Link
              to="/admin"
              className="btn primary"
            >
              Go to Admin
            </Link>
          </div>
        )}
    </section>
  );
}