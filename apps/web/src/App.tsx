import { FormEvent, useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { getSpamToken, submitLead } from "./api";
import type { LeadPayload } from "./types";

const navLinks = [
  ["Page", "#top"],
  ["Page", "#testimonials"],
  ["Page", "#contact"]
];

const testimonials = [
  {
    quote: "“A terrific piece of praise”",
    avatar: "/images/avatar-1.jpg"
  },
  {
    quote: "“A fantastic bit of feedback”",
    avatar: "/images/avatar-2.jpg"
  },
  {
    quote: "“A genuinely glowing review”",
    avatar: "/images/avatar-3.jpg"
  }
];

const footerColumns = [
  ["Topic", "Page", "Page", "Page"],
  ["Topic", "Page", "Page", "Page"],
  ["Topic", "Page", "Page", "Page"]
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

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setError("");

    const formData = new FormData(event.currentTarget);
    const firstName = String(formData.get("firstName") || "").trim();
    const lastName = String(formData.get("lastName") || "").trim();
    const fullName = [firstName, lastName].filter(Boolean).join(" ");
    const payload: LeadPayload = {
      name: fullName,
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
        <a className="brand link-stub" href="#top" aria-label="Site name home">
          Site name
        </a>
        <nav className={`nav ${menuOpen ? "nav-open" : ""}`} aria-label="Primary navigation">
          {navLinks.map(([label, href], index) => (
            <a className="link-stub" href={href} key={`${href}-${index}`} onClick={() => setMenuOpen(false)}>
              {label}
            </a>
          ))}
          <a className="nav-cta link-stub" href="#contact" onClick={() => setMenuOpen(false)}>
            Send form
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
          <h1 id="hero-title">Landing page title</h1>
          <p className="hero-copy">And a subheading describing your site, too</p>
          <a className="button button-primary" href="#contact">
            Send form
          </a>
          <img className="hero-image" src="/images/hero-food.jpg" alt="Seasonal dishes on a shared restaurant table" />
        </section>

        <section className="testimonials-section" id="testimonials" aria-labelledby="testimonials-title">
          <div className="section-heading">
            <h2 id="testimonials-title">Heading</h2>
            <p>Subheading to introduce testimonials</p>
          </div>
          <div className="testimonial-grid">
            {testimonials.map((item) => (
              <article className="testimonial-card" key={item.quote}>
                <h3>{item.quote}</h3>
                <div className="person">
                  <img src={item.avatar} alt="" aria-hidden="true" />
                  <div>
                    <strong>Name</strong>
                    <span>Description</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="contact-section" id="contact" aria-labelledby="contact-title">
          <div className="contact-heading">
            <h2 id="contact-title">Contact us</h2>
            <p>Subheading for description or instructions</p>
          </div>

          <form className="contact-form" onSubmit={onSubmit} noValidate>
            <div className="form-row">
              <label>
                First name
                <input name="firstName" autoComplete="given-name" placeholder="Jane" pattern={namePattern.source} required />
              </label>
              <label>
                Last name
                <input name="lastName" autoComplete="family-name" placeholder="Smitherton" pattern={namePattern.source} required />
              </label>
            </div>
            <label className="full-field">
              Email address
              <input name="email" autoComplete="email" type="email" placeholder="email@janesfakedomain.net" />
            </label>
            <label className="full-field">
              Number
              <input
                name="phone"
                autoComplete="tel"
                inputMode="tel"
                placeholder="+380-XX-XX-XX-XXX"
                value={phone}
                onChange={(event) => setPhone(maskPhone(event.target.value))}
                required
              />
            </label>
            <label className="full-field">
              Your message
              <textarea name="message" rows={4} placeholder="Enter your question or message" />
            </label>
            <input className="hp-field" name="company" tabIndex={-1} autoComplete="off" aria-hidden="true" />
            <button className="button button-dark full-field" type="submit" disabled={status === "loading" || !spamToken}>
              {status === "loading" ? "Sending..." : "Submit"}
            </button>
            {status === "success" && <p className="form-note success">Request received. We will call you shortly.</p>}
            {status === "error" && <p className="form-note error">{error}</p>}
          </form>
          <img className="contact-image" src="/images/chef.jpg" alt="Contact portrait" />
        </section>
      </main>

      <footer className="footer">
        <div className="footer-brand">
          <span>Site name</span>
          <div className="social-links" aria-label="Social links">
            <a href="#" aria-label="Social link" />
            <a href="#" aria-label="Social link" />
            <a href="#" aria-label="Social link" />
            <a href="#" aria-label="Social link" />
          </div>
        </div>
        <div className="footer-columns">
          {footerColumns.map((column, index) => (
            <div key={index}>
              {column.map((item, itemIndex) =>
                itemIndex === 0 ? <strong key={item}>{item}</strong> : <a href="#" key={`${item}-${itemIndex}`}>{item}</a>
              )}
            </div>
          ))}
        </div>
      </footer>
    </>
  );
}
