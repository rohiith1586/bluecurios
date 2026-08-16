import React from "react";
import { ArrowUpRight, Check, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import SectionHeading from "../components/SectionHeading";
import ProductCard from "../components/ProductCard";

const collections = [
  ["Crochet Bags", "Everyday shapes, softened by hand.", "bags"],
  ["Crochet Clothing", "Wearable texture with a curious edge.", "tops"],
  ["Accessories", "Small details, handmade slowly.", "accessories"],
  ["Home & Lifestyle", "Objects that make space feel warmer.", "home"],
  ["New Arrivals", "The newest pieces from the studio.", "new"],
  ["Custom Creations", "Something made around your idea.", "custom"]
];

const placeholders = [
  {id:"placeholder-1", name:"Product name", category:"Bags", price:0, slug:"placeholder-1"},
  {id:"placeholder-2", name:"Product name", category:"Tops", price:0, slug:"placeholder-2"},
  {id:"placeholder-3", name:"Product name", category:"Accessories", price:0, slug:"placeholder-3"},
  {id:"placeholder-4", name:"Product name", category:"Home", price:0, slug:"placeholder-4"}
];

export default function Home() {
  return <div>
    <section className="hero">
      <div className="hero-copy">
        <span className="eyebrow">Handmade · Small batch · BlueCurious</span>
        <h1>Made by Hand.<br/><em>Made to Be Yours.</em></h1>
        <p>Thoughtfully crafted crochet pieces made with creativity, patience, and a little bit of curiosity.</p>
        <div className="hero-actions"><Link className="btn primary" to="/shop">Shop Collection <ArrowUpRight size={17}/></Link><Link className="btn secondary" to="/#story">Explore BlueCurious</Link></div>
      </div>
      <div className="hero-art"><div className="image-placeholder large">Hero lifestyle photography<br/>to be added</div><div className="hero-note">01 — made slowly</div></div>
    </section>

    <section className="section">
      <SectionHeading eyebrow="Explore the studio" title="A little something for every kind of curious." text="Browse by mood, moment or the thing you've been looking for."/>
      <div className="collection-grid">{collections.map(([name, desc, key], i)=><Link className="collection-card" to={`/shop?category=${key}`} key={key}><span>0{i+1}</span><div className="collection-art">Image placeholder</div><div><h3>{name}</h3><p>{desc}</p></div><ArrowUpRight size={19}/></Link>)}</div>
    </section>

    <section className="section soft">
      <SectionHeading eyebrow="The edit" title="Made for keeping." text="Real product photography and catalogue data will appear here once products are added in Supabase."/>
      <div className="product-grid">{placeholders.map(p=><ProductCard key={p.id} product={p}/>)}</div>
    </section>

    <section className="story section" id="story">
      <div className="story-image image-placeholder large">Lifestyle image<br/>to be added</div>
      <div className="story-copy"><span className="eyebrow">Why BlueCurious?</span><h2>Not factory-perfect.<br/><em>Human-perfect.</em></h2><p>Every BlueCurious piece is handmade with attention to detail, so no two pieces feel exactly the same. The tiny variations are part of the story.</p><p>We're building a slower kind of fashion and lifestyle brand — one stitch, one idea, one curious object at a time.</p><Link className="text-link" to="/journal">Read our story <ArrowUpRight size={16}/></Link></div>
    </section>

    <section className="section promise">
      <SectionHeading eyebrow="Our promise" title="The details matter." align="center"/>
      <div className="promise-grid">
        {[
          ["Handcrafted","Every piece is made carefully by hand."],
          ["Made With Love","Designed and created with patience and attention to detail."],
          ["Uniquely Yours","Small-batch pieces that feel different from mass-produced products."]
        ].map(([title,text])=><div className="promise-card" key={title}><Sparkles size={20}/><h3>{title}</h3><p>{text}</p></div>)}
      </div>
    </section>

    <section className="custom-banner">
      <div><span className="eyebrow">Made around you</span><h2>Dream It.<br/><em>We'll Crochet It.</em></h2><p>Have a colour, shape or idea in mind? Tell us about it and we'll explore what can be made.</p></div>
      <Link className="btn light" to="/custom">Request a Custom Piece <ArrowUpRight size={17}/></Link>
    </section>

    <section className="section testimonials">
      <SectionHeading eyebrow="Kind words" title="A space for your customers' stories." text="Replace this placeholder with verified reviews after launch. BlueCurious does not publish invented testimonials." align="center"/>
      <div className="review-placeholder"><Check size={19}/><p>Verified customer reviews will appear here.</p></div>
    </section>

    <section className="section instagram"><SectionHeading eyebrow="@bluecurious" title="A curious little corner of the internet." align="center"/><div className="social-grid">{[1,2,3,4,5,6].map(n=><div className="social-placeholder" key={n}>Social image {n}<small>Connect your social feed</small></div>)}</div></section>

    <section className="newsletter"><span className="eyebrow">Stay Curious.</span><h2>New things, occasionally.</h2><p>Get first access to new drops, limited handmade pieces and special offers.</p><form onSubmit={e=>e.preventDefault()}><input type="email" required placeholder="Your email address" aria-label="Email address"/><button className="btn primary">Subscribe</button></form></section>
  </div>
}