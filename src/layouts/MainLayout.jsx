import { useEffect, useMemo, useState } from "react";
import { Link, Outlet, useLocation, useSearchParams } from "react-router-dom";

import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { getCategories } from "@/services/api/categoryApi";

function MainLayout() {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated, user, logout } = useAuth();
  const { itemCount } = useCart();
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const userDisplayName =
    user?.name ?? [user?.first_name, user?.last_name].filter(Boolean).join(" ");
  const isProductsPage = location.pathname === "/products";
  const isLoginPage = location.pathname === "/login";
  const isRegisterPage = location.pathname === "/register";
  const searchTerm = searchParams.get("search") ?? "";
  const selectedCategoryId = searchParams.get("category_id") ?? "all";

  const categoryList = useMemo(() => {
    const deduped = new Map();

    categoryOptions.forEach((category) => {
      if (category?.id != null && category?.name) {
        deduped.set(String(category.id), category.name);
      }
    });

    return Array.from(deduped.entries()).map(([id, name]) => ({ id, name }));
  }, [categoryOptions]);

  useEffect(() => {
    if (!isProductsPage) {
      return;
    }

    let isMounted = true;

    async function loadCategories() {
      try {
        const response = await getCategories();
        const categories = Array.isArray(response)
          ? response
              .map((category) => ({
                id: category?.id,
                name: `${category?.name ?? ""}`.trim(),
              }))
              .filter((category) => category.id != null && category.name)
              .sort((left, right) => left.name.localeCompare(right.name))
          : [];

        if (isMounted) {
          setCategoryOptions(categories);
        }
      } catch {
        if (isMounted) {
          setCategoryOptions([]);
        }
      }
    }

    void loadCategories();

    return () => {
      isMounted = false;
    };
  }, [isProductsPage]);

  const updateFilterParams = ({ nextSearch, nextCategoryId }) => {
    const nextParams = new URLSearchParams(searchParams);

    if (nextSearch?.trim()) {
      nextParams.set("search", nextSearch.trim());
    } else {
      nextParams.delete("search");
    }

    if (nextCategoryId && nextCategoryId !== "all") {
      nextParams.set("category_id", nextCategoryId);
    } else {
      nextParams.delete("category_id");
    }

    setSearchParams(nextParams, { replace: true });
  };

  return (
    <div className="min-h-screen bg-page-glow font-body text-slate-800">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <header className="border-b border-slate-300/70 bg-white/90 backdrop-blur">
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-3 px-4 py-4 md:grid-cols-[180px,1fr,auto]">
          <Link
            className="font-heading text-xl font-semibold text-brand-800"
            to="/products"
          >
            Shopfront
          </Link>

          <div className="flex w-full justify-center">
            {isProductsPage ? (
              <div className="flex w-full max-w-lg items-center gap-2">
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(event) =>
                    updateFilterParams({
                      nextSearch: event.target.value,
                      nextCategoryId: selectedCategoryId,
                    })
                  }
                  placeholder="Search products"
                  className="h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                />

                <select
                  value={selectedCategoryId}
                  onChange={(event) =>
                    updateFilterParams({
                      nextSearch: searchTerm,
                      nextCategoryId: event.target.value,
                    })
                  }
                  className="h-9 w-32 rounded-lg border border-slate-300 bg-white px-2 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                >
                  <option value="all">All</option>
                  {categoryList.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
          </div>

          <nav className="flex w-full flex-wrap items-center justify-end gap-3 text-sm md:w-auto" aria-label="Primary navigation">
            {/* <Link className="text-slate-700 hover:text-slate-900" to="/products">
              Products
            </Link> */}
            {!isAuthenticated && !isLoginPage && (
              <Link className="text-slate-700 hover:text-slate-900" to="/login">
                Login
              </Link>
            )}
            {!isAuthenticated && !isRegisterPage && (
              <Link className="text-slate-700 hover:text-slate-900" to="/register">
                Register
              </Link>
            )}
            {isAuthenticated && (
              <Link
                className="relative rounded-lg p-2 text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
                to="/cart"
                aria-label="Cart"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h2l2.1 10.3a1 1 0 0 0 1 .8h8.7a1 1 0 0 0 1-.8L20 7H7" />
                  <circle cx="9" cy="19" r="1.5" />
                  <circle cx="17" cy="19" r="1.5" />
                </svg>
                {itemCount > 0 ? (
                  <span className="absolute -right-1 -top-1 inline-flex min-w-4 items-center justify-center rounded-full bg-brand-700 px-1 text-[10px] font-semibold text-white">
                    {itemCount}
                  </span>
                ) : null}
              </Link>
            )}
            {isAuthenticated && (
              <Link className="text-slate-700 hover:text-slate-900" to="/orders">
                Orders
              </Link>
            )}
            {isAuthenticated && (
              <div
                className="relative"
                onMouseEnter={() => setIsProfileMenuOpen(true)}
                onMouseLeave={() => setIsProfileMenuOpen(false)}
              >
                <button
                  type="button"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-50"
                  onClick={() => setIsProfileMenuOpen((open) => !open)}
                  aria-expanded={isProfileMenuOpen}
                  aria-haspopup="menu"
                  aria-label="Open profile menu"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
                    <circle cx="12" cy="8" r="3.5" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 20a7 7 0 0 1 14 0" />
                  </svg>
                </button>

                {isProfileMenuOpen ? (
                  <div className="absolute right-0 top-full z-20 pt-2" role="menu">
                    <div className="w-44 rounded-xl border border-slate-200 bg-white p-2 shadow-soft">
                      <p className="px-2 py-1 text-xs text-slate-500" title={userDisplayName || undefined}>
                        {userDisplayName || "Account"}
                      </p>
                      <Link
                        className="block rounded-lg px-2 py-2 text-sm text-slate-700 transition hover:bg-slate-100"
                        to="/profile"
                        role="menuitem"
                        onClick={() => setIsProfileMenuOpen(false)}
                      >
                        Profile
                      </Link>
                      <button
                        type="button"
                        className="mt-1 block w-full rounded-lg px-2 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-100"
                        role="menuitem"
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          logout();
                        }}
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </nav>
        </div>
      </header>
      <main id="main-content" className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
      <footer className="mt-auto border-t border-slate-300/70 bg-white/90">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
          <section>
            <h2 className="font-heading text-lg font-semibold text-slate-900">Shopfront</h2>
            <p className="mt-3 text-sm text-slate-600">
              Curated products, secure checkout, and fast order tracking for everyday shopping.
            </p>
          </section>

          <section>
            <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-700">Shop</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li>
                <Link className="hover:text-slate-900" to="/products">Products</Link>
              </li>
              <li>
                <Link className="hover:text-slate-900" to="/cart">Cart</Link>
              </li>
              <li>
                <Link className="hover:text-slate-900" to="/orders">Orders</Link>
              </li>
            </ul>
          </section>

          <section>
            <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-700">Support</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li>Email: support@shopfront.in</li>
              <li>Phone: +91 98765 43210</li>
              <li>Mon - Sat: 9:00 AM - 8:00 PM</li>
            </ul>
          </section>

          <section>
            <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-700">Updates</h3>
            <p className="mt-3 text-sm text-slate-600">
              Get offers and new arrivals in your inbox.
            </p>
            <div className="mt-3 flex gap-2">
              <input
                type="email"
                placeholder="Enter email"
                className="h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              />
              <button
                type="button"
                className="h-9 rounded-lg bg-brand-700 px-3 text-sm font-semibold text-white transition hover:bg-brand-800"
              >
                Join
              </button>
            </div>
          </section>
        </div>
        <div className="border-t border-slate-200 px-4 py-4 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} Shopfront. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

export default MainLayout;
