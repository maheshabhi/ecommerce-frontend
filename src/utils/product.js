export const DEFAULT_PRODUCT_IMAGE = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" fill="none">
  <rect width="800" height="600" fill="#F4F1E8"/>
  <rect x="58" y="58" width="684" height="484" rx="36" fill="#FFFDF8" stroke="#D8D1C2" stroke-width="10"/>
  <circle cx="258" cy="248" r="94" fill="#D9A15B" opacity="0.9"/>
  <path d="M192 372L282 276L376 366L438 312L548 430H192V372Z" fill="#315C4A" opacity="0.88"/>
  <rect x="184" y="422" width="432" height="24" rx="12" fill="#D8D1C2"/>
  <rect x="236" y="470" width="220" height="18" rx="9" fill="#E7E1D4"/>
  <text x="400" y="132" text-anchor="middle" fill="#274236" font-family="Arial, sans-serif" font-size="38" font-weight="700">Shopfront</text>
  <text x="400" y="176" text-anchor="middle" fill="#7B6A58" font-family="Arial, sans-serif" font-size="24">Default product image</text>
</svg>
`)}`

function toNumber(value, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

export function resolveProductImage(image) {
  return typeof image === 'string' && image.trim() ? image : DEFAULT_PRODUCT_IMAGE
}

export function formatCurrency(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(toNumber(value))
}

export function normalizeProduct(product, index = 0) {
  const id = toNumber(product?.id, index + 1)
  const title = product?.name ?? product?.title ?? 'Untitled product'
  const category = product?.category?.name ?? product?.category ?? product?.brand ?? 'Featured'
  const price = toNumber(product?.discount_price ?? product?.price, 0)

  return {
    id,
    title,
    category,
    price,
    image: resolveProductImage(product?.image ?? product?.thumbnail ?? product?.photo_url),
    rating: {
      rate: toNumber(product?.rating?.rate ?? product?.rating, 0),
      count: toNumber(product?.rating?.count ?? product?.rating_count, 0),
    },
    description: product?.description ?? '',
    brand: product?.brand ?? '',
    stockQuantity: toNumber(product?.stock_quantity, 0),
  }
}

export function buildProductSnapshot(product) {
  const normalizedProduct = normalizeProduct(product)

  return {
    id: normalizedProduct.id,
    title: normalizedProduct.title,
    image: normalizedProduct.image,
    category: normalizedProduct.category,
    brand: normalizedProduct.brand,
    price: normalizedProduct.price,
  }
}