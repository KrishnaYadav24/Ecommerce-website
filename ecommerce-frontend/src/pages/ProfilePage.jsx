
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserRound, Mail, Phone, Package, LogOut, ArrowRight } from "lucide-react";
import api from "../services/api";
import "./ProfilePage.css";

function ProfilePage() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login", { replace: true, state: { from: "/account" } });
        return;
      }

      try {
        const response = await api.get("/users/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const body = response.data;
        const profile = body?.data ?? body?.user ?? body;

        if (active) {
          setUser(profile);
          setError("");
        }
      } catch (err) {
        if (!active) return;

        if (err.response?.status === 401 || err.response?.status === 403) {
          localStorage.removeItem("token");
          localStorage.removeItem("userId");
          localStorage.removeItem("user");

          navigate("/login", {
            replace: true,
            state: { from: "/account" },
          });
          return;
        }

        setError(
          err.response?.data?.message ||
          "We could not load your profile. Please try again."
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    loadProfile();

    return () => {
      active = false;
    };
  }, [navigate]);

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("user");

    navigate("/login", { replace: true });
  }

  if (loading) {
    return (
      <main className="profile-page">
        <p className="profile-status">Loading your account...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="profile-page">
        <div className="profile-error">
          <h1>Account unavailable</h1>
          <p>{error}</p>
          <button
            className="profile-primary-button"
            onClick={() => window.location.reload()}
          >
            Try again
          </button>
        </div>
      </main>
    );
  }

  const name = user?.name || "ShopNova Customer";
  const email = user?.email || "Not available";
  const phone = user?.phone || "Not available";

  return (
    <main className="profile-page">
      <div className="profile-breadcrumb">
        <Link to="/">Home</Link>
        <span>/</span>
        <span>My Account</span>
      </div>

      <section className="profile-heading">
        <div>
          <p className="profile-eyebrow">YOUR SHOPNOVA SPACE</p>
          <h1>My Account<span>.</span></h1>
          <p className="profile-subtitle">
            Your details, your orders, your shopping experience.
          </p>
        </div>

        <button className="profile-logout" onClick={handleLogout}>
          <LogOut size={16} />
          Sign out
        </button>
      </section>

      <section className="profile-layout">
        <aside className="profile-sidebar">
          <div className="profile-avatar">
            <UserRound size={30} strokeWidth={1.4} />
          </div>

          <p className="profile-welcome">WELCOME BACK</p>
          <h2>{name}</h2>
          <p className="profile-sidebar-email">{email}</p>

          <div className="profile-sidebar-divider" />

          <div className="profile-side-link profile-side-link-active">
            <UserRound size={17} />
            <span>Personal information</span>
          </div>

          <Link to="/orders" className="profile-side-link">
            <Package size={17} />
            <span>My orders</span>
            <ArrowRight size={15} />
          </Link>
        </aside>

        <div className="profile-main">
          <div className="profile-section-heading">
            <div>
              <p className="profile-eyebrow">ACCOUNT DETAILS</p>
              <h2>Personal information</h2>
            </div>
            <span className="profile-status-tag">ACTIVE ACCOUNT</span>
          </div>

          <div className="profile-info-card">
            <div className="profile-info-row">
              <div className="profile-info-icon">
                <UserRound size={19} />
              </div>
              <div className="profile-info-content">
                <span>Full name</span>
                <strong>{name}</strong>
              </div>
            </div>

            <div className="profile-info-row">
              <div className="profile-info-icon">
                <Mail size={19} />
              </div>
              <div className="profile-info-content">
                <span>Email address</span>
                <strong>{email}</strong>
              </div>
            </div>

            <div className="profile-info-row">
              <div className="profile-info-icon">
                <Phone size={19} />
              </div>
              <div className="profile-info-content">
                <span>Phone number</span>
                <strong>{phone}</strong>
              </div>
            </div>
          </div>

          <div className="profile-order-promo">
            <div>
              <p className="profile-eyebrow">YOUR SHOPPING JOURNEY</p>
              <h3>Looking for your orders?</h3>
              <p>Your purchases and order updates will live here.</p>
            </div>

            <Link to="/orders" className="profile-order-link">
              View orders <ArrowRight size={16} />
            </Link>
          </div>

          <p className="profile-security-note">
            Your account information is retrieved from your signed-in session.
          </p>
        </div>
      </section>
    </main>
  );
}

export default ProfilePage;
