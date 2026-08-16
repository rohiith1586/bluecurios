import React from "react";
import { UploadCloud } from "lucide-react";
export default function Custom() {
  return <section className="section custom-page"><div className="narrow"><span className="eyebrow">Made around your idea</span><h1>Dream It.<br/><em>We'll Crochet It.</em></h1><p className="lead">Tell us what you're imagining. Handmade custom pieces may require additional production time, and we'll confirm feasibility and timing before any payment is taken.</p><form className="form-card" onSubmit={e=>e.preventDefault()}>
    <label>Product type<input required placeholder="e.g. bag, top, home piece"/></label>
    <label>Preferred colour<input placeholder="Colour, palette or reference"/></label>
    <label>Size<input placeholder="Size or measurements"/></label>
    <label>Preferred design<textarea placeholder="Tell us about the shape, texture or details you want."/></label>
    <label>Budget<input inputMode="decimal" placeholder="Your budget in ₹"/></label>
    <label>Deadline<input type="date"/></label>
    <label>Reference image<div className="upload"><UploadCloud size={21}/><span>Choose an image</span><input type="file" accept="image/*"/></div></label>
    <label>Additional notes<textarea placeholder="Anything else we should know?"/></label>
    <button className="btn primary" type="submit">Send Custom Request</button>
  </form></div></section>
}