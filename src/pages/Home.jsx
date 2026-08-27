import React from "react";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const collections = [
  {
    name: "Crochet Bags",
    description: "Everyday shapes, made by hand.",
    image: "/images/crochet-bags.jpg",
    category: "Crochet Bags",
  },
  {
    name: "Crochet Clothing",
    description: "Comfortable pieces with handmade character.",
    image: "/images/crochet-clothing.jpg",
    category: "Crochet Clothing",
  },
  {
    name: "Accessories",
    description: "Small details, made slowly.",
    image: "/images/accessories.jpg",
    category: "Accessories",
  },
  {
    name: "Home & Lifestyle",
    description: "Handmade pieces for a warmer space.",
    image: "/images/home-lifestyle.jpg",
    category: "Home & Lifestyle",
  },
];

export default function Home() {
  return (
    <main>

      {/* =========================
          HERO
      ========================== */}

      <section className="hero">

        <div className="hero-copy">

          <span className="eyebrow">
            Handmade · Small batch · BlueCurios
          </span>

          <h1>
            Made by Hand.
            <br />
            <em>Made to Be Yours.</em>
          </h1>

          <p>
            Thoughtfully crafted crochet pieces made with
            creativity, patience, and a little bit of curiosity.
          </p>

          <div className="hero-actions">

            <Link
              className="btn primary"
              to="/shop"
            >
              Shop Collection
              <ArrowUpRight size={17} />
            </Link>

            <Link
              className="btn secondary"
              to="/#story"
            >
              Explore BlueCurios
            </Link>

          </div>

        </div>


        <div className="hero-art">

          <img
            src="/images/8.jpg"
            alt="Handmade crochet piece"
            className="hero-image"
          />

          <div className="hero-note">
            01 — made slowly
          </div>

        </div>

      </section>


      {/* =========================
          STORY
      ========================== */}

      <section
        className="section story"
        id="story"
      >

        <div className="story-image">

          <img
            src="/images/10.jpg"
            alt="Handmade crochet creation"
          />

        </div>


        <div className="story-copy">

          <span className="eyebrow">
            Why BlueCurios?
          </span>

          <h2>
            Not factory-perfect.
            <br />
            <em>Human-perfect.</em>
          </h2>

          <p>
            Every BlueCurios piece is made by hand, one stitch
            at a time. Small differences are part of what makes
            each piece special.
          </p>

          <p>
            We believe handmade things should feel personal,
            thoughtful, and made to be enjoyed for a long time.
          </p>

          <Link
            className="text-link"
            to="/journal"
          >
            Read our story
            <ArrowUpRight size={16} />
          </Link>

        </div>

      </section>


      {/* =========================
          COLLECTIONS
      ========================== */}

      <section className="section">

        <div className="section-heading">

          <div>

            <span className="eyebrow">
              Explore the collection
            </span>

            <h2>
              Something made
              <br />
              <em>just for you.</em>
            </h2>

            <p>
              Browse our handmade crochet pieces and find
              something that feels like you.
            </p>

          </div>

          <Link
            className="btn secondary"
            to="/shop"
          >
            View Collection
            <ArrowUpRight size={17} />
          </Link>

        </div>


        <div className="collection-grid">

          {collections.map((collection, index) => (

            <Link
              key={collection.name}
              className="collection-card"
              to={`/shop?category=${encodeURIComponent(
                collection.category
              )}`}
            >

              <span>
                0{index + 1}
              </span>

              <div className="collection-art">

                <img
                  src={collection.image}
                  alt={collection.name}
                />

              </div>

              <div>

                <h3>
                  {collection.name}
                </h3>

                <p>
                  {collection.description}
                </p>

              </div>

              <ArrowUpRight size={19} />

            </Link>

          ))}

        </div>

      </section>


      {/* =========================
          NEW ARRIVALS
      ========================== */}

      <section className="section soft">

        <div className="section-heading">

          <span className="eyebrow">
            Fresh from the studio
          </span>

          <h2>
            New
            <br />
            <em>Arrivals.</em>
          </h2>

          <p>
            Discover the latest crochet pieces made in small
            batches with care and attention to detail.
          </p>

        </div>


        <div className="new-arrivals-home">

          <div className="new-arrivals-image">

            <img
              src="/images/new-arrivals.jpg"
              alt="New handmade crochet arrivals"
            />

          </div>


          <div className="new-arrivals-copy">

            <span className="eyebrow">
              Made in small batches
            </span>

            <h3>
              Little things,
              <br />
              <em>made beautifully.</em>
            </h3>

            <p>
              Carefully chosen colours, textures and details
              come together to create pieces that feel warm,
              personal and unique.
            </p>

            <Link
              className="btn primary"
              to="/shop"
            >
              Shop New Arrivals
              <ArrowUpRight size={17} />
            </Link>

          </div>

        </div>

      </section>


      {/* =========================
          CUSTOM CREATIONS
      ========================== */}

      <section className="custom-banner">

        <div>

          <span className="eyebrow">
            Made around you
          </span>

          <h2>
            Dream it.
            <br />
            <em>We'll crochet it.</em>
          </h2>

          <p>
            Have a colour, shape or idea in mind?
            Tell us about it and we'll create something
            special around your idea.
          </p>

        </div>


        <Link
          className="btn light"
          to="/custom"
        >
          Request a Custom Piece
          <ArrowUpRight size={17} />
        </Link>

      </section>


      {/* =========================
          SIMPLE PROMISE
      ========================== */}

      <section className="section promise">

        <div className="section-heading center">

          <span className="eyebrow">
            Our promise
          </span>

          <h2>
            Made with
            <br />
            <em>care.</em>
          </h2>

        </div>


        <div className="promise-grid">

          <div className="promise-card">

            <Sparkles size={20} />

            <h3>
              Handcrafted
            </h3>

            <p>
              Every piece is carefully made by hand.
            </p>

          </div>


          <div className="promise-card">

            <Sparkles size={20} />

            <h3>
              Made With Love
            </h3>

            <p>
              Created slowly with patience and attention
              to the little details.
            </p>

          </div>


          <div className="promise-card">

            <Sparkles size={20} />

            <h3>
              Uniquely Yours
            </h3>

            <p>
              Small-batch pieces with their own handmade
              character.
            </p>

          </div>

        </div>

      </section>


      {/* =========================
          FINAL CTA
      ========================== */}

      <section className="section final-home">

        <div className="final-home-card">

          <span className="eyebrow">
            Find something curious
          </span>

          <h2>
            Made slowly.
            <br />
            <em>Loved for longer.</em>
          </h2>

          <p>
            Explore our handmade collection and find a piece
            that feels like it was made just for you.
          </p>

          <Link
            className="btn primary"
            to="/shop"
          >
            Shop Collection
            <ArrowUpRight size={17} />
          </Link>

        </div>

      </section>

    </main>
  );
}