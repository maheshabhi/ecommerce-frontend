import { Link, Outlet } from 'react-router-dom'

function AuthLayout() {
  return (
    <section className="bg-page-glow px-4 py-6 font-body text-slate-800 sm:py-10">
      <div className="mx-auto max-w-md rounded-2xl border border-slate-200/80 bg-white/95 p-5 shadow-soft backdrop-blur sm:p-6 md:p-8">
        <header className="mb-6">
          <p className="text-sm uppercase tracking-[0.2em] text-brand-700">Ecommerce</p>
          <h1 className="mt-2 font-heading text-2xl font-semibold text-slate-900">Account Access</h1>
        </header>
        <Outlet />
        {/* <nav className="mt-6 flex flex-wrap gap-3 text-sm text-slate-600" aria-label="Authentication pages">
          <Link className="underline underline-offset-2" to="/login">
            Login
          </Link>
          <Link className="underline underline-offset-2" to="/register">
            Register
          </Link>
          <Link className="underline underline-offset-2" to="/verify-email">
            Verify Email
          </Link>
          <Link className="underline underline-offset-2" to="/forgot-password">
            Forgot Password
          </Link>
        </nav> */}
      </div>
    </section>
  )
}

export default AuthLayout
