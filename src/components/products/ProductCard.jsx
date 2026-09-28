import { memo } from 'react'

import Button from '@/components/ui/Button'
import { DEFAULT_PRODUCT_IMAGE, formatCurrency } from '@/utils/product'

function renderStars(rate) {
  const safeRate = Number(rate)
  const stars = Math.max(0, Math.min(5, Math.round(Number.isNaN(safeRate) ? 0 : safeRate)))
  return '★'.repeat(stars) + '☆'.repeat(5 - stars)
}

function ProductCard({ product, onAddToCart, isAdded, isLoading = false }) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft transition hover:-translate-y-0.5 hover:shadow-lg" aria-label={product.title}>
      <div className="aspect-[4/3] overflow-hidden bg-slate-100">
        <img
          src={product.image}
          alt={product.title}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={(event) => {
            event.currentTarget.src = DEFAULT_PRODUCT_IMAGE
          }}
        />
      </div>

      <div className="flex flex-1 flex-col p-4">
        <p className="text-xs uppercase tracking-[0.18em] text-brand-700">{product.category}</p>
        <h2 className="mt-2 line-clamp-2 font-heading text-lg font-semibold text-slate-900">{product.title}</h2>
        {product.description ? (
          <p className="mt-2 line-clamp-2 text-sm text-slate-600">{product.description}</p>
        ) : null}

        <div className="mt-3 flex items-center justify-between">
          <p className="text-lg font-semibold text-slate-900">{formatCurrency(product.price)}</p>
          <p className="text-sm text-amber-600" aria-label={`Rated ${product.rating.rate} out of 5 from ${product.rating.count} reviews`}>
            <span aria-hidden="true">{renderStars(product.rating.rate)}</span>
            <span className="ml-1 text-slate-500">({product.rating.count})</span>
          </p>
        </div>

        <Button
          onClick={() => onAddToCart(product)}
          className="mt-4 w-full"
          variant={isAdded ? 'secondary' : 'primary'}
          aria-pressed={isAdded}
          loading={isLoading}
        >
          {isAdded ? 'Added to Cart' : 'Add to Cart'}
        </Button>
      </div>
    </article>
  )
}

export default memo(ProductCard)
