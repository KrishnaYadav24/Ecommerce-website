import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import {
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
  Check,
} from "lucide-react";

import api from "../services/api";
import "./AuthPage.css";

// Decode JWT payload to read role claims.
// This is for frontend navigation only, not authorization.
function decodeJwtPayload(token) {
  try {
    const parts = token?.split(".");

    if (!parts || parts.length < 2) {
      return {};
    }

    const base64 = parts[1]
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const paddedBase64 = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      "="
    );

    return JSON.parse(atob(paddedBase64));
  } catch {
    return {};
  }
}

// Accept strings such as ADMIN, ROLE_ADMIN, or lists of authorities.
function normalizeRole(value) {
  if (typeof value !== "string") {
    return "";
  }

  return value
    .trim()
    .toUpperCase()
    .replace(/^ROLE_/, "");
}

function collectRoles(value) {
  if (value == null) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.flatMap(collectRoles);
  }

  if (typeof value === "object") {
    return [
      ...collectRoles(value.authority),
      ...collectRoles(value.role),
      ...collectRoles(value.roles),
      ...collectRoles(value.authorities),
    ];
  }

  if (typeof value !== "string") {
    return [];
  }

  return value
    .replace(/[\[\]"']/g, " ")
    .split(/[,\s]+/)
    .map(normalizeRole)
    .filter(Boolean);
}

// Prefer the role from the user's backend profile.
// When the profile doesn't expose a role, fall back to the fresh JWT.
function isAdminLogin(user, token) {
  const profileRoles = collectRoles([
    user?.role,
    user?.userRole,
    user?.authority,
    user?.roles,
    user?.authorities,
  ]);

  if (profileRoles.includes("ADMIN")) {
    return true;
  }

  if (
    profileRoles.includes("USER") &&
    !profileRoles.includes("ADMIN")
  ) {
    return false;
  }

  const claims = decodeJwtPayload(token);

  const tokenRoles = collectRoles([
    claims?.role,
    claims?.userRole,
    claims?.authority,
    claims?.authorities,
    claims?.roles,
  ]);

  return tokenRoles.includes("ADMIN");
}

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({
    email:
      location.state?.email ||
      localStorage.getItem("rememberedEmail") ||
      "",
    password: "",
  });

  const [rememberEmail, setRememberEmail] = useState(
    Boolean(localStorage.getItem("rememberedEmail"))
  );

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [focusedField, setFocusedField] = useState("");

  useEffect(() => {
    if (location.state?.registered) {
      setError("");
    }
  }, [location.state]);

  const handleChange = (event) => {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));

    setError("");
  };

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    try {
      setLoading(true);

      // 1. Login request
      const response = await api.post("/login", {
        email: form.email.trim(),
        password: form.password,
      });

      const token = response.data?.token;

      if (!token) {
        throw new Error(
          "The server did not return an authentication token."
        );
      }

      // 2. Load profile using the newly issued JWT
      const profileResponse = await api.get("/users/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const profileData = profileResponse.data;

      const user =
        profileData?.data?.user ??
        profileData?.data ??
        profileData?.user ??
        profileData;

      const userId = user?.id ?? user?.userId;

      if (userId == null) {
        throw new Error(
          "Your profile was returned without a user ID."
        );
      }

      // 3. Save fresh login information
      localStorage.setItem("token", token);
      localStorage.setItem("userId", String(userId));
      localStorage.setItem("user", JSON.stringify(user));

      if (rememberEmail) {
        localStorage.setItem(
          "rememberedEmail",
          form.email.trim()
        );
      } else {
        localStorage.removeItem("rememberedEmail");
      }

      // 4. Detect role and choose destination
      const isAdmin = isAdminLogin(user, token);

      const destination = isAdmin ? "/admin" : "/";

      console.info("ShopNova login redirect:", {
        destination,
        profileRole: user?.role ?? user?.userRole ?? null,
        tokenRole: decodeJwtPayload(token)?.role ?? null,
        isAdmin,
      });

      // 5. Redirect after successful login
      navigate(destination, {
        replace: true,
      });
    } catch (err) {
      console.error("Login failed:", err);

      setError(
        err.message?.includes("authentication token") ||
          err.message?.includes("user ID")
          ? err.message
          : err.response?.status === 401
            ? "That email and password combination doesn't look right."
            : err.response?.status === 403
              ? "Access denied. Please check your account permissions."
              : err.response
                ? `We couldn't sign you in (HTTP ${err.response.status}).`
                : "We couldn't reach the server. Please try again."
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

      <section className="auth-visual auth-visual-login">
        <div className="auth-visual-top">
          <Link to="/" className="auth-brand auth-brand-light">
            SHOPNOVA<span>.</span>
          </Link>

          <span className="auth-edition">
            THE EVERYDAY EDIT <span>—</span> 001
          </span>
        </div>

        <div
          className="auth-artwork auth-artwork-login"
          aria-hidden="true"
        >
          <div className="auth-art-orbit auth-art-orbit-one" />
          <div className="auth-art-orbit auth-art-orbit-two" />

          <div className="auth-art-disc">
            <div className="auth-art-disc-inner">
              <span className="auth-art-star">✳</span>
              <span className="auth-art-disc-word">GOOD TO</span>
              <span className="auth-art-disc-word">SEE YOU.</span>

              <span className="auth-art-disc-small">
                YOUR EVERYDAY, REIMAGINED
              </span>
            </div>
          </div>

          <div className="auth-art-label auth-art-label-top">
            <Sparkles size={15} />
            RIGHT WHERE YOU LEFT OFF
          </div>

          <div className="auth-art-label auth-art-label-bottom">
            YOUR SPACE AWAITS
            <span>✳</span>
          </div>
        </div>

        <div className="auth-visual-bottom">
          <div>
            <p className="auth-visual-kicker">
              WELCOME TO YOUR CORNER
            </p>

            <h2>
              Familiar finds.
              <br />
              <span>Fresh possibilities.</span>
            </h2>
          </div>

          <p className="auth-visual-note">
            Good to have
            <br />
            you back.
          </p>
        </div>
      </section>

      <section className="auth-form-panel auth-login-panel">
        <div className="auth-panel-top">
          <span className="auth-step-indicator">
            <span className="auth-step-active">01</span>
            <span className="auth-step-line" />
            <span>YOUR ACCOUNT</span>
          </span>

          <p>
            New around here?{" "}
            <Link to="/register">
              Join us <ArrowRight size={13} />
            </Link>
          </p>
        </div>

        <div className="auth-form-content auth-login-content">
          <div className="auth-heading-block">
            <div className="auth-heading-icon">
              <Sparkles size={19} />
            </div>

            <p className="auth-eyebrow">
              PICK UP WHERE YOU LEFT OFF
            </p>

            <h1>
              Good to have
              <br />
              <span>you back.</span>
            </h1>

            <p className="auth-description">
              Sign in to explore your favourites and get back to
              the things you love.
            </p>
          </div>

          {location.state?.registered && (
            <div className="auth-success" role="status">
              <Check size={17} />
              Your account has been created. Sign in to continue.
            </div>
          )}

          {error && (
            <div className="auth-error" role="alert">
              <span className="auth-error-mark">!</span>
              <p>{error}</p>
            </div>
          )}

          <form
            className="auth-form auth-form-modern"
            onSubmit={handleSubmit}
          >
            <div className="auth-field">
              <label htmlFor="login-email">
                EMAIL ADDRESS
              </label>

              <div
                className={`auth-input-shell ${
                  focusedField === "email" ? "is-focused" : ""
                }`}
              >
                <Mail size={17} />

                <input
                  id="login-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={handleChange}
                  onFocus={() => setFocusedField("email")}
                  onBlur={() => setFocusedField("")}
                  required
                />

                {form.email &&
                  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) && (
                    <Check
                      size={16}
                      className="auth-input-success"
                    />
                  )}
              </div>
            </div>

            <div className="auth-field">
              <div className="auth-label-row">
                <label htmlFor="login-password">
                  PASSWORD
                </label>

                <span className="auth-label-hint">
                  KEEP IT PRIVATE
                </span>
              </div>

              <div
                className={`auth-input-shell ${
                  focusedField === "password" ? "is-focused" : ""
                }`}
              >
                <LockKeyhole size={17} />

                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={handleChange}
                  onFocus={() => setFocusedField("password")}
                  onBlur={() => setFocusedField("")}
                  required
                />

                <button
                  type="button"
                  className="auth-icon-button"
                  onClick={() =>
                    setShowPassword((value) => !value)
                  }
                  aria-label={
                    showPassword ? "Hide password" : "Show password"
                  }
                >
                  {showPassword ? (
                    <EyeOff size={17} />
                  ) : (
                    <Eye size={17} />
                  )}
                </button>
              </div>
            </div>

            <label className="auth-terms auth-remember">
              <input
                type="checkbox"
                checked={rememberEmail}
                onChange={(event) =>
                  setRememberEmail(event.target.checked)
                }
              />

              <span className="auth-custom-checkbox">
                <Check size={12} />
              </span>

              <span>Remember my email on this device</span>
            </label>

            <button
              type="submit"
              className="auth-submit auth-submit-modern"
              disabled={loading}
            >
              <span>
                {loading
                  ? "Signing you in..."
                  : "Sign in to ShopNova"}
              </span>

              {loading ? (
                <span className="auth-button-spinner" />
              ) : (
                <ArrowRight size={18} />
              )}
            </button>

            <p className="auth-secure-note">
              <ShieldCheck size={14} />
              Your sign-in is protected by your account authentication.
            </p>
          </form>

          <div className="auth-login-divider">
            <span />
            <p>YOUR EVERYDAY STARTS HERE</p>
            <span />
          </div>

          <Link to="/products" className="auth-explore-link">
            <ArrowLeft size={15} />
            Explore the collection without signing in
          </Link>
        </div>

        <div className="auth-panel-footer">
          <span>SHOPNOVA © 2026</span>
          <span>MADE FOR EVERYDAY LIVING</span>
        </div>
      </section>
    </main>
  );
}

export default LoginPage;