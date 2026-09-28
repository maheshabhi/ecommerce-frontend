import { useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import PaginationControls from '@/components/products/PaginationControls'
import ProductCard from '@/components/products/ProductCard'
import ProductsGridSkeleton from '@/components/products/ProductsGridSkeleton'
import Button from '@/components/ui/Button'
import InlineAlert from '@/components/ui/InlineAlert'
import { useCart } from '@/hooks/useCart'
import { useToast } from '@/hooks/useToast'
import { getProducts } from '@/services/api/productApi'
import { getErrorMessage } from '@/utils/apiError'
import { normalizeProduct } from '@/utils/product'

const PAGE_SIZE = 10

function normalizeProducts(response) {
  const rawItems = Array.isArray(response)
    ? response
    : response?.items ?? response?.products ?? response?.data ?? []

  if (!Array.isArray(rawItems)) {
    return []
  }

  return rawItems.map((product, index) => normalizeProduct(product, index))
}

function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { showToast } = useToast()
  const { items, addItem } = useCart()
  const searchTerm = searchParams.get('search') ?? ''
  const deferredSearchTerm = useDeferredValue(searchTerm)
  const selectedCategoryId = searchParams.get('category_id') ?? 'all'
  const [currentPage, setCurrentPage] = useState(1)
  const [products, setProducts] = useState([])
  const [busyProductId, setBusyProductId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  const loadProducts = useCallback(async ({ showLoader = true, page = 1 } = {}) => {
    if (showLoader) {
      setLoading(true)
      setError('')
    }

    try {
      const response = await getProducts({
        keyword: deferredSearchTerm.trim() || undefined,
        category_id: selectedCategoryId !== 'all' ? Number(selectedCategoryId) : undefined,
        in_stock: false,
        sort_by: 'created_at',
        order: 'desc',
        page,
        size: PAGE_SIZE,
      })
      setProducts(normalizeProducts(response))
      setTotal(Number(response?.total ?? 0))
      setTotalPages(Math.max(1, Number(response?.total_pages ?? 1)))
      setError('')
    } catch {
      setProducts([])
      setTotal(0)
      setTotalPages(1)
      setError('We could not load products right now. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [deferredSearchTerm, selectedCategoryId])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadProducts({ showLoader: true, page: currentPage })
    }, 0)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [currentPage, loadProducts])

  useEffect(() => {
    setCurrentPage(1)
  }, [deferredSearchTerm, selectedCategoryId])

  const activePage = Math.min(currentPage, totalPages)

  const addedProductIds = useMemo(() => items.map((item) => item.productId), [items])

  const handleAddToCart = async (product) => {
    setBusyProductId(product.id)

    try {
      await addItem(product)
      showToast({
        title: 'Added to cart',
        message: `${product.title} was added to your cart.`,
        type: 'success',
      })
    } catch (errorResponse) {
      showToast({
        title: 'Unable to add item',
        message: getErrorMessage(errorResponse, 'Unable to add this product to your cart.'),
        type: 'error',
      })
    } finally {
      setBusyProductId(null)
    }
  }

  const hasActiveFilters = searchTerm.trim() || selectedCategoryId !== 'all'

  const handlePageChange = (nextPage) => {
    const clampedPage = Math.max(1, Math.min(totalPages, nextPage))
    setCurrentPage(clampedPage)
  }

  return (
    <section className="space-y-6" aria-labelledby="products-heading">
      {/* <header className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-soft">
        <p className="mt-4 text-sm text-slate-500" role="status" aria-live="polite">
          {loading
            ? 'Loading products...'
            : `Showing ${paginatedProducts.length} of ${filteredProducts.length} products`}
        </p>
      </header> */}

      {loading ? (
        <ProductsGridSkeleton count={PAGE_SIZE} />
      ) : error ? (
        <section className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-800">
          <h2 className="font-heading text-xl font-semibold">Unable to Load Products</h2>
          <InlineAlert message={error} tone="error" />
          <Button
            className="mt-4"
            variant="danger"
            onClick={loadProducts}
          >
            Retry
          </Button>
        </section>
      ) : products.length === 0 ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-soft">
          <h2 className="font-heading text-2xl font-semibold text-slate-900">No matching products</h2>
          <p className="mt-2 text-slate-600">
            Try changing your search term or pick another category.
          </p>
          {hasActiveFilters ? (
            <Button
              className="mt-4"
              onClick={() => {
                const nextParams = new URLSearchParams(searchParams)
                nextParams.delete('search')
                nextParams.delete('category_id')
                setSearchParams(nextParams, { replace: true })
              }}
            >
              Clear filters
            </Button>
          ) : null}
        </section>
      ) : (
        <>
          <p className="text-sm text-slate-500" role="status" aria-live="polite">
            {`Showing ${products.length} of ${total} products`}
          </p>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={handleAddToCart}
                isAdded={addedProductIds.includes(product.id)}
                isLoading={busyProductId === product.id}
              />
            ))}
          </div>
          <PaginationControls
            currentPage={activePage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </>
      )}
    </section>
  )
}

export default ProductsPage
