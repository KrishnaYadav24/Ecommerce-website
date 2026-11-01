import {
  Link,
  NavLink,
  useNavigate,
  useLocation,
} from "react-router-dom";
import {
  Search,
  ShoppingBag,
  UserRound,
  Menu,
  X,
  ChevronDown,
  ArrowUpRight,
} from "lucide-react";
import { useEffect, useState } from "react";
import api from "../services/api";
import "./Header.css";

function getList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.content)) return data.content;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.categories)) return data.categories;
  return [];
}

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [categories, setCategories] = useState([]);

  const navigate = useNavigate();
  const location = useLocation();

  const isLoggedIn = Boolean(localStorage.getItem("token"));

  useEffect(() => {
    let active = true;

    async function loadCategories() {
      try {
        const response = await api.get("/displaycategory");

        if (active) {
          setCategories(getList(response.data));
        }
      } catch (error) {
        console.error("Could not load categories:", error);
      }
    }

    loadCategories();

    return () => {
      active = false;
    };
  }, []);

  // Close mobile menus whenever the route changes.
  useEffect(() => {
    setMenuOpen(false);
    setCategoriesOpen(false);
    setMobileSearchOpen(false);
  }, [location.pathname, location.search]);

  // Escape key closes open navigation panels.
  useEffect(() => {
    function handleEscape(event) {
      if (event.key === "Escape") {
        setMenuOpen(false);
        setCategoriesOpen(false);
        setMobileSearchOpen(false);
      }
    }

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, []);

  function closeMenu() {
    setMenuOpen(false);
    setCategoriesOpen(false);
    setMobileSearchOpen(false);
  }

  function submitSearch(event) {
    event.preventDefault();

    const query = search.trim();

    navigate(
      query
        ? `/products?search=${encodeURIComponent(query)}`
        : "/products"
    );

    closeMenu();
  }

  function openCategory(name) {
    navigate(
      name
        ? `/products?category=${encodeURIComponent(name)}`
        : "/products"
    );

    closeMenu();
  }

  function handleAccountClick() {
    closeMenu();
    navigate(isLoggedIn ? "/account" : "/login");
  }

  function toggleMobileSearch() {
    setMenuOpen(false);
    setCategoriesOpen(false);
    setMobileSearchOpen((open) => !open);
  }

  return (
    <>
      <div className="shopnova-announcement">
        <span className="announcement-star">✳</span>
        COMPLIMENTARY SHIPPING ON ORDERS OVER ₹1,999
        <span className="announcement-star">✳</span>
      </div>

      <header className="shopnova-header">
        <button
          type="button"
          className="header-menu"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          onClick={() => {
            setMobileSearchOpen(false);
            setCategoriesOpen(false);
            setMenuOpen((open) => !open);
          }}
        >
          {menuOpen ? <X size={21} /> : <Menu size={21} />}
        </button>

        <Link
          to="/"
          className="shopnova-logo"
          onClick={closeMenu}
          aria-label="ShopNova home"
        >
          SHOPNOVA<span>.</span>
        </Link>

        <nav
          className={`shopnova-nav ${
            menuOpen ? "shopnova-nav-open" : ""
          }`}
          aria-label="Main navigation"
        >
          <NavLink to="/" end onClick={closeMenu}>
            Home
          </NavLink>

          <NavLink to="/products" onClick={closeMenu}>
            Shop All
          </NavLink>

          <div className="header-category-menu">
            <button
              type="button"
              className={`header-category-button ${
                categoriesOpen ? "category-button-active" : ""
              }`}
              aria-expanded={categoriesOpen}
              onClick={() => setCategoriesOpen((open) => !open)}
            >
              Categories
              <ChevronDown
                size={15}
                className={
                  categoriesOpen ? "category-chevron-open" : ""
                }
              />
            </button>

            {categoriesOpen && (
              <div className="header-category-dropdown">
                <div className="header-dropdown-heading">
                  <div>
                    <span>SHOPNOVA COLLECTION</span>
                    <h3>Shop by category</h3>
                  </div>

                  <button
                    type="button"
                    className="header-dropdown-close"
                    aria-label="Close categories"
                    onClick={() => setCategoriesOpen(false)}
                  >
                    <X size={18} />
                  </button>
                </div>

                <button
                  type="button"
                  className="header-dropdown-item"
                  onClick={() => openCategory("")}
                >
                  <span>All products</span>
                  <ArrowUpRight size={16} />
                </button>

                {categories.map((category) => {
                  const name =
                    category.name || category.categoryName || "Category";

                  return (
                    <button
                      type="button"
                      className="header-dropdown-item"
                      key={category.id ?? name}
                      onClick={() => openCategory(name)}
                    >
                      <span>{name}</span>
                      <ArrowUpRight size={16} />
                    </button>
                  );
                })}

                {categories.length === 0 && (
                  <p className="header-category-empty">
                    Categories are unavailable right now.
                  </p>
                )}
              </div>
            )}
          </div>
        </nav>

        <div className="shopnova-header-actions">
          <form
            className={`header-search-form ${
              mobileSearchOpen ? "header-search-form-open" : ""
            }`}
            onSubmit={submitSearch}
            role="search"
          >
            <button
              type="submit"
              className="header-search-submit"
              aria-label="Submit search"
              tabIndex={-1}
            >
              <Search size={18} />
            </button>

            <input
              type="search"
              placeholder="Search products"
              aria-label="Search products"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />

            {mobileSearchOpen && (
              <button
                type="button"
                className="header-search-close"
                aria-label="Close search"
                onClick={() => setMobileSearchOpen(false)}
              >
                <X size={18} />
              </button>
            )}
          </form>

          <button
            type="button"
            className="header-mobile-search-toggle"
            aria-label={mobileSearchOpen ? "Close search" : "Search products"}
            aria-expanded={mobileSearchOpen}
            onClick={toggleMobileSearch}
          >
            {mobileSearchOpen ? <X size={20} /> : <Search size={20} />}
          </button>

          <button
            type="button"
            className="header-action"
            aria-label={isLoggedIn ? "My account" : "Login"}
            title={isLoggedIn ? "My account" : "Login"}
            onClick={handleAccountClick}
          >
            <UserRound size={20} />
          </button>

          <Link
            to="/cart"
            className="header-action header-bag"
            aria-label="Shopping bag"
            title="Shopping bag"
            onClick={closeMenu}
          >
            <ShoppingBag size={20} />
            <span>Bag</span>
          </Link>
        </div>
      </header>
    </>
  );
}

export default Header;