import { Link } from 'react-router-dom'

function NotFoundPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-page-glow px-4 font-body">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white/95 p-8 text-center shadow-soft">
        <p className="text-sm uppercase tracking-[0.2em] text-brand-700">404</p>
        <h1 className="mt-2 font-heading text-2xl font-semibold text-slate-900">Page Not Found</h1>
        <p className="mt-2 text-slate-600">The page you requested does not exist.</p>
        <Link
          className="mt-6 inline-flex rounded-lg bg-brand-700 px-4 py-2 font-medium text-white transition hover:bg-brand-800"
          to="/products"
        >
          Go to Products
        </Link>
      </section>
    </main>
  )
}

export default NotFoundPage
