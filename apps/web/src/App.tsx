import { FormEvent, useEffect, useMemo, useState } from "react";
import { ArrowRight, Check, Clock, Mail, MapPin, Menu, Phone, X } from "lucide-react";
import { getSpamToken, submitLead } from "./api";
import type { LeadPayload } from "./types";

const menuItems = [
  {
    title: "Green brunch bowl",
    text: "Egg, herbs, roasted greens, tahini dressing.",
    price: "320 UAH"
  },
  {
    title: "Citrus salmon toast",
    text: "House sourdough, cured salmon, fennel, lemon cream.",
    price: "285 UAH"
  },
  {
    title: "Market garden plate",
    text: "Seasonal vegetables, grains, seeds, soft cheese.",
    price: "260 UAH"
  }
];

const stats = [
  ["09:00", "daily opening"],
  ["24", "seasonal seats"],
  ["4.9", "guest rating"]
];

const navLinks = [
  ["Menu", "#menu"],
  ["Story", "#story"],
  ["Contact", "#contact"]
];

const namePattern = /^[A-Za-zА-Яа-яІіЇїЄєҐґ'’\-\s]{2,60}$/;
const phonePattern = /^\+?38\s?\(?0(39|50|63|66|67|68|73|91|92|93|94|95|96|97|98|99)\)?[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}$/;

function maskPhone(value: string) {
  const digits = value.replace(/\D/g, "").replace(/^38/, "").slice(0, 10);

  if (!digits) {
    return "";
  }

  const parts = ["+38"];
  if (digits.length > 0) parts.push(` (${digits.slice(0, 3)}`);
  if (digits.length >= 3) parts[parts.length - 1] += ")";
  if (digits.length > 3) parts.push(` ${digits.slice(3, 6)}`);
  if (digits.length > 6) parts.push(`-${digits.slice(6, 8)}`);
  if (digits.length > 8) parts.push(`-${digits.slice(8, 10)}`);

  return parts.join("");
}

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [formStartedAt] = useState(() => Date.now());
  const [spamToken, setSpamToken] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    getSpamToken()
      .then(({ token }) => setSpamToken(token))
      .catch(() => setSpamToken(""));
  }, []);

  const year = useMemo(() => new Date().getFullYear(), []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setError("");

    const formData = new FormData(event.currentTarget);
    const payload: LeadPayload = {
      name: String(formData.get("name") || "").trim(),
      phone: String(formData.get("phone") || "").trim(),
      email: String(formData.get("email") || "").trim(),
      message: String(formData.get("message") || "").trim(),
      company: String(formData.get("company") || "").trim(),
      startedAt: formStartedAt,
      spamToken,
      source: "landing"
    };

    if (!namePattern.test(payload.name)) {
      setStatus("error");
      setError("Вкажіть ім'я літерами.");
      return;
    }

    if (!phonePattern.test(payload.phone)) {
      setStatus("error");
      setError("Вкажіть телефон українського оператора.");
      return;
    }

    try {
      await submitLead(payload);
      event.currentTarget.reset();
      setPhone("");
      setStatus("success");
    } catch (caught) {
      setStatus("error");
      setError(caught instanceof Error ? caught.message : "Не вдалося надіслати форму.");
    }
  }

  return (
    <>
      <header className="site-header">
        <a className="brand link-stub" href="#top" aria-label="Bistro Pulse home">
          BP
        </a>
        <nav className={`nav ${menuOpen ? "nav-open" : ""}`} aria-label="Primary navigation">
          {navLinks.map(([label, href]) => (
            <a className="link-stub" href={href} key={href} onClick={() => setMenuOpen(false)}>
              {label}
            </a>
          ))}
          <a className="nav-cta link-stub" href="#contact" onClick={() => setMenuOpen(false)}>
            Book a table
          </a>
        </nav>
        <button
          className="menu-button"
          type="button"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((value) => !value)}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </header>

      <main id="top">
        <section className="hero" aria-labelledby="hero-title">
          <p className="eyebrow">Bistro Pulse</p>
          <h1 id="hero-title">Landing page title</h1>
          <p className="hero-copy">
            Seasonal brunch, quiet coffee, and a contact flow that sends every booking request to the CRM pipeline.
          </p>
          <a className="button button-primary" href="#contact">
            Reserve now <ArrowRight size={18} aria-hidden="true" />
          </a>
          <img className="hero-image" src="/images/hero-food.jpg" alt="Seasonal dishes on a shared restaurant table" />
        </section>

        <section className="menu-section" id="menu" aria-labelledby="menu-title">
          <div className="section-heading">
            <p className="eyebrow">Menu</p>
            <h2 id="menu-title">Heading</h2>
          </div>
          <div className="cards">
            {menuItems.map((item) => (
              <article className="menu-card" key={item.title}>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </div>
                <strong>{item.price}</strong>
              </article>
            ))}
          </div>
        </section>

        <section className="story-section" id="story" aria-labelledby="story-title">
          <div className="portrait-wrap">
            <img src="/images/chef.jpg" alt="Restaurant host portrait" />
          </div>
          <div className="story-copy">
            <p className="eyebrow">Contact us</p>
            <h2 id="story-title">Designed for quick table requests and clean handoff</h2>
            <p>
              The page keeps the visual language restrained and close to the Figma reference: white space, black type,
              compact cards, a clear form, and mobile-first navigation.
            </p>
            <div className="feature-list">
              <span><Check size={18} /> Fresh daily menu</span>
              <span><Check size={18} /> CRM-ready booking form</span>
              <span><Check size={18} /> No-captcha spam defense</span>
            </div>
          </div>
        </section>

        <section className="contact-section" id="contact" aria-labelledby="contact-title">
          <div className="contact-copy">
            <p className="eyebrow">Contact us</p>
            <h2 id="contact-title">Let us know when you are coming</h2>
            <p>Leave your details and the team will confirm the table by phone.</p>
            <div className="contact-meta">
              <span><MapPin size={18} /> Kyiv, Yaroslavska 12</span>
              <span><Phone size={18} /> +38 (050) 123-45-67</span>
              <span><Mail size={18} /> hello@bistropulse.test</span>
              <span><Clock size={18} /> 09:00 - 21:00</span>
            </div>
          </div>

          <form className="contact-form" onSubmit={onSubmit} noValidate>
            <label>
              Name
              <input name="name" autoComplete="name" placeholder="Олена" pattern={namePattern.source} required />
            </label>
            <label>
              Phone
              <input
                name="phone"
                autoComplete="tel"
                inputMode="tel"
                placeholder="+38 (050) 123-45-67"
                value={phone}
                onChange={(event) => setPhone(maskPhone(event.target.value))}
                required
              />
            </label>
            <label>
              Email
              <input name="email" autoComplete="email" type="email" placeholder="name@example.com" />
            </label>
            <label>
              Message
              <textarea name="message" rows={4} placeholder="Time, guests, preferences" />
            </label>
            <input className="hp-field" name="company" tabIndex={-1} autoComplete="off" aria-hidden="true" />
            <button className="button button-dark" type="submit" disabled={status === "loading" || !spamToken}>
              {status === "loading" ? "Sending..." : "Submit"}
            </button>
            {status === "success" && <p className="form-note success">Request received. We will call you shortly.</p>}
            {status === "error" && <p className="form-note error">{error}</p>}
          </form>
        </section>

        <section className="stats-row" aria-label="Bistro highlights">
          {stats.map(([value, label]) => (
            <div key={label}>
              <strong>{value}</strong>
              <span>{label}</span>
            </div>
          ))}
        </section>
      </main>

      <footer className="footer">
        <span>Bistro Pulse</span>
        <span>{year}</span>
      </footer>
    </>
  );
}

