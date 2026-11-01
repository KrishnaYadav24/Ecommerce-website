
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  Check,
  ShieldCheck,
  Sparkles,
  LockKeyhole,
  UserRound,
  Mail,
  Phone,
  CheckCircle2,
} from "lucide-react";
import api from "../services/api";
import "./AuthPage.css";

const requirements = [
  { label: "At least 8 characters", test: (p) => p.length >= 8 },
  { label: "One uppercase letter", test: (p) => /[A-Z]/.test(p) },
  { label: "One lowercase letter", test: (p) => /[a-z]/.test(p) },
  { label: "One number", test: (p) => /\d/.test(p) },
  {
    label: "One special character",
    test: (p) => /[^A-Za-z0-9]/.test(p),
  },
];

function RegisterPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [focusedField, setFocusedField] = useState("");

  const passwordChecks = useMemo(
    () => requirements.map((item) => item.test(form.password)),
    [form.password]
  );

  const strength = passwordChecks.filter(Boolean).length;

  const strengthLabel =
    !form.password
      ? "Your password strength"
      : strength <= 2
        ? "Needs more strength"
        : strength <= 3
          ? "Getting stronger"
          : strength <= 4
            ? "Strong password"
            : "Excellent password";

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setError("");
  };

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (passwordChecks.some((passed) => !passed)) {
      setError("Please meet all password requirements before continuing.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Your passwords don't match yet. Please check them.");
      return;
    }

    if (!acceptedTerms) {
      setError("Please accept the terms to create your account.");
      return;
    }

    try {
      setLoading(true);

      await api.post("/registeruser", {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
      });

      navigate("/login", {
        replace: true,
        state: {
          email: form.email.trim(),
          registered: true,
        },
      });
    } catch (err) {
      setError(
        err.response?.status === 409
          ? "An account with these details may already exist. Try signing in."
          : err.response?.status === 400
            ? "Some details were rejected. Please check your information."
            : err.response
              ? `We couldn't create your account (HTTP ${err.response.status}).`
              : "We couldn't reach the server. Check that your backend is running."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-experience">
      <Link to="/" className="auth-mobile-brand">
        SHOPNOVA<span>.</span>
      </Link>

      <section className="auth-visual auth-visual-register">
        <div className="auth-visual-top">
          <Link to="/" className="auth-brand auth-brand-light">
            SHOPNOVA<span>.</span>
          </Link>

          <span className="auth-edition">
            THE EVERYDAY EDIT <span>—</span> 001
          </span>
        </div>

        <div className="auth-artwork" aria-hidden="true">
          <div className="auth-art-orbit auth-art-orbit-one" />
          <div className="auth-art-orbit auth-art-orbit-two" />

          <div className="auth-art-disc">
            <div className="auth-art-disc-inner">
              <span className="auth-art-star">✳</span>
              <span className="auth-art-disc-word">THE GOOD</span>
              <span className="auth-art-disc-word">STUFF.</span>
              <span className="auth-art-disc-small">
                OBJECTS FOR EVERYDAY LIVING
              </span>
            </div>
          </div>

          <div className="auth-art-label auth-art-label-top">
            <Sparkles size={15} />
            A LITTLE MORE YOU
          </div>

          <div className="auth-art-label auth-art-label-bottom">
            EST. FOR YOUR EVERYDAY
            <span>✳</span>
          </div>
        </div>

        <div className="auth-visual-bottom">
          <div>
            <p className="auth-visual-kicker">GOOD THINGS START HERE</p>
            <h2>
              Your taste.
              <br />
              Your space.
              <br />
              <span>Your kind of store.</span>
            </h2>
          </div>

          <p className="auth-visual-note">
            Discover the everyday,
            <br />
            differently.
          </p>
        </div>
      </section>

      <section className="auth-form-panel">
        <div className="auth-panel-top">
          <span className="auth-step-indicator">
            <span className="auth-step-active">01</span>
            <span className="auth-step-line" />
            <span>YOUR ACCOUNT</span>
          </span>

          <p>
            Already a member?{" "}
            <Link to="/login">Sign in <ArrowRight size={13} /></Link>
          </p>
        </div>

        <div className="auth-form-content">
          <div className="auth-heading-block">
            <div className="auth-heading-icon">
              <Sparkles size={19} />
            </div>

            <p className="auth-eyebrow">A BETTER WAY TO SHOP</p>

            <h1>
              Make yourself
              <br />
              <span>at home.</span>
            </h1>

            <p className="auth-description">
              Create your account. Your next favourite thing
              is closer than you think.
            </p>
          </div>

          {error && (
            <div className="auth-error" role="alert">
              <span className="auth-error-mark">!</span>
              <p>{error}</p>
            </div>
          )}

          <form className="auth-form auth-form-modern" onSubmit={handleSubmit}>
            <div className="auth-field">
              <label htmlFor="register-name">YOUR NAME</label>
              <div className={`auth-input-shell ${focusedField === "name" ? "is-focused" : ""}`}>
                <UserRound size={17} />
                <input
                  id="register-name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  placeholder="What should we call you?"
                  value={form.name}
                  onChange={handleChange}
                  onFocus={() => setFocusedField("name")}
                  onBlur={() => setFocusedField("")}
                  required
                  maxLength={100}
                />
                {form.name.trim() && <Check size={16} className="auth-input-success" />}
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="register-email">EMAIL ADDRESS</label>
              <div className={`auth-input-shell ${focusedField === "email" ? "is-focused" : ""}`}>
                <Mail size={17} />
                <input
                  id="register-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={handleChange}
                  onFocus={() => setFocusedField("email")}
                  onBlur={() => setFocusedField("")}
                  required
                  maxLength={254}
                />
                {form.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) && (
                  <Check size={16} className="auth-input-success" />
                )}
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="register-phone">PHONE NUMBER</label>
              <div className={`auth-input-shell ${focusedField === "phone" ? "is-focused" : ""}`}>
                <Phone size={17} />
                <input
                  id="register-phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="Your contact number"
                  value={form.phone}
                  onChange={handleChange}
                  onFocus={() => setFocusedField("phone")}
                  onBlur={() => setFocusedField("")}
                  required
                  maxLength={20}
                />
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="register-password">CREATE PASSWORD</label>
              <div className={`auth-input-shell ${focusedField === "password" ? "is-focused" : ""}`}>
                <LockKeyhole size={17} />
                <input
                  id="register-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Create a strong password"
                  value={form.password}
                  onChange={handleChange}
                  onFocus={() => setFocusedField("password")}
                  onBlur={() => setFocusedField("")}
                  required
                />
                <button
                  type="button"
                  className="auth-icon-button"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>

              <div className="auth-strength">
                <div className="auth-strength-bars">
                  {requirements.map((item, index) => (
                    <span
                      key={item.label}
                      className={index < strength ? `strength-level-${strength}` : ""}
                    />
                  ))}
                </div>

                <span className="auth-strength-label">{strengthLabel}</span>
              </div>

              {form.password && (
                <div className="auth-password-checklist">
                  {requirements.map((item, index) => (
                    <div
                      key={item.label}
                      className={passwordChecks[index] ? "requirement-passed" : ""}
                    >
                      <CheckCircle2 size={13} />
                      <span>{item.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="auth-field">
              <label htmlFor="register-confirm-password">CONFIRM PASSWORD</label>
              <div className={`auth-input-shell ${
                focusedField === "confirmPassword" ? "is-focused" : ""
              } ${
                form.confirmPassword && form.password === form.confirmPassword
                  ? "is-valid"
                  : ""
              }`}>
                <ShieldCheck size={17} />
                <input
                  id="register-confirm-password"
                  name="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="One last check"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  onFocus={() => setFocusedField("confirmPassword")}
                  onBlur={() => setFocusedField("")}
                  required
                />
                <button
                  type="button"
                  className="auth-icon-button"
                  onClick={() => setShowConfirm((value) => !value)}
                  aria-label={showConfirm ? "Hide confirmation" : "Show confirmation"}
                >
                  {showConfirm ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>

              {form.confirmPassword && (
                <p className={`auth-match-note ${
                  form.password === form.confirmPassword ? "is-matched" : ""
                }`}>
                  {form.password === form.confirmPassword
                    ? "Your passwords match."
                    : "Your passwords don't match yet."}
                </p>
              )}
            </div>

            <label className="auth-terms">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(event) => setAcceptedTerms(event.target.checked)}
              />
              <span className="auth-custom-checkbox">
                <Check size={12} />
              </span>
              <span>
                I agree to the terms of service and privacy policy.
              </span>
            </label>

            <button
              type="submit"
              className="auth-submit auth-submit-modern"
              disabled={loading}
            >
              <span>{loading ? "Creating your account..." : "Create my account"}</span>
              {loading ? (
                <span className="auth-button-spinner" />
              ) : (
                <ArrowRight size={18} />
              )}
            </button>

            <p className="auth-secure-note">
              <ShieldCheck size={14} />
              Your information is handled securely.
            </p>
          </form>
        </div>

        <div className="auth-panel-footer">
          <span>SHOPNOVA © 2026</span>
          <span>MADE FOR EVERYDAY LIVING</span>
        </div>
      </section>
    </main>
  );
}

export default RegisterPage;
