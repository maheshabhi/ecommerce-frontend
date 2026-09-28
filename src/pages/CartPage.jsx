import { Link, useNavigate } from 'react-router-dom'

import Button from '@/components/ui/Button'
import InlineAlert from '@/components/ui/InlineAlert'
import { useCart } from '@/hooks/useCart'
import { DEFAULT_PRODUCT_IMAGE, formatCurrency } from '@/utils/product'

function CartPage() {
  const navigate = useNavigate()
  const { items, grandTotal, error, isLoading, isMutating, updateQuantity, removeItem, clearAllItems } = useCart()

  if (isLoading) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white/95 p-8 shadow-soft">
        <h1 className="font-heading text-3xl font-semibold text-slate-900">Your Cart</h1>
        <p className="mt-2 text-sm text-slate-500">Loading your cart items...</p>
      </section>
    )
  }

  if (!items.length) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white/95 p-8 text-center shadow-soft">
        <p className="text-sm uppercase tracking-[0.22em] text-brand-700">Cart</p>
        <h1 className="mt-2 font-heading text-3xl font-semibold text-slate-900">Your cart is empty</h1>
        <p className="mt-3 text-slate-600">Add products from the catalog to start your checkout flow.</p>
        {error ? <InlineAlert message={error} tone="error" /> : null}
        <Button className="mt-5" onClick={() => navigate('/products')}>
          Browse products
        </Button>
      </section>
    )
  }

  return (
    <section className="space-y-6" aria-labelledby="cart-page-heading">
      <header className="rounded-2xl border border-slate-200 bg-white/95 p-6 shadow-soft">
        <p className="text-sm uppercase tracking-[0.22em] text-brand-700">Cart</p>
        <h1 id="cart-page-heading" className="mt-2 font-heading text-3xl font-semibold text-slate-900">
          Review your cart
        </h1>
        <p className="mt-2 text-slate-600">Adjust quantities, remove items, and continue to the payment page.</p>
        {error ? <InlineAlert message={error} tone="error" /> : null}
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.5fr,0.8fr]">
        <div className="space-y-4">
          {items.map((item) => (
            <article
              key={item.productId}
              className="grid gap-4 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-soft sm:grid-cols-[120px,1fr]"
            >
              <div className="aspect-square overflow-hidden rounded-xl bg-slate-100">
                <img
                  src={item.image}
                  alt={item.title}
                  className="h-full w-full object-cover"
                  loading="lazy"
                  onError={(event) => {
                    event.currentTarget.src = DEFAULT_PRODUCT_IMAGE
                  }}
                />
              </div>

              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-brand-700">{item.category}</p>
                  <h2 className="mt-1 font-heading text-xl font-semibold text-slate-900">{item.title}</h2>
                  {item.brand ? <p className="mt-1 text-sm text-slate-500">Brand: {item.brand}</p> : null}
                  <p className="mt-3 text-sm text-slate-500">Unit price: {formatCurrency(item.price)}</p>
                </div>

                <div className="flex min-w-[180px] flex-col items-start gap-3 sm:items-end">
                  <p className="text-lg font-semibold text-slate-900">{formatCurrency(item.subtotal)}</p>

                  <div className="inline-flex items-center rounded-xl border border-slate-300 bg-slate-50">
                    <button
                      type="button"
                      className="px-3 py-2 text-lg text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={isMutating || item.quantity <= 1}
                      onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                    >
                      -
                    </button>
                    <span className="min-w-12 px-3 py-2 text-center text-sm font-semibold text-slate-900">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      className="px-3 py-2 text-lg text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={isMutating}
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                    >
                      +
                    </button>
                  </div>

                  <button
                    type="button"
                    className="text-sm font-semibold text-rose-700 transition hover:text-rose-800 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={isMutating}
                    onClick={() => removeItem(item.productId)}
                  >
                    Remove item
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>

        <aside className="rounded-2xl border border-slate-200 bg-white/95 p-6 shadow-soft lg:sticky lg:top-6 lg:self-start">
          <h2 className="font-heading text-2xl font-semibold text-slate-900">Order summary</h2>
          <div className="mt-5 space-y-3 text-sm text-slate-600">
            <div className="flex items-center justify-between">
              <span>Items</span>
              <span>{items.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Total quantity</span>
              <span>{items.reduce((total, item) => total + item.quantity, 0)}</span>
            </div>
            <div className="flex items-center justify-between border-t border-slate-200 pt-3 text-base font-semibold text-slate-900">
              <span>Grand total</span>
              <span>{formatCurrency(grandTotal)}</span>
            </div>
          </div>

          <Button className="mt-6 w-full" onClick={() => navigate('/checkout')}>
            Continue to payment
          </Button>
          <Button className="mt-3 w-full" variant="secondary" onClick={clearAllItems} disabled={isMutating}>
            Clear cart
          </Button>
          <p className="mt-4 text-xs text-slate-500">
            Need a shipping address? Add or update it from your <Link className="text-brand-700 underline underline-offset-2" to="/profile">profile</Link> before checkout.
          </p>
        </aside>
      </div>
    </section>
  )
}

export default CartPage