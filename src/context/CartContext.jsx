import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useAuth } from '@/hooks/useAuth'
import { addCartItem, clearCart, getCart } from '@/services/api/cartApi'
import { checkoutOrder } from '@/services/api/orderApi'
import { CartContext } from '@/context/cart-context'
import { getErrorMessage } from '@/utils/apiError'
import { buildProductSnapshot, resolveProductImage } from '@/utils/product'

const CART_PRODUCT_DETAILS_KEY = 'shopfront-cart-product-details'

function readStoredProductDetails() {
  try {
    const rawValue = localStorage.getItem(CART_PRODUCT_DETAILS_KEY)
    const parsedValue = rawValue ? JSON.parse(rawValue) : {}

    return parsedValue && typeof parsedValue === 'object' ? parsedValue : {}
  } catch {
    return {}
  }
}

function isCartEmptyError(error) {
  const statusCode = error?.response?.status
  const detail = `${error?.response?.data?.detail ?? ''}`.toLowerCase()

  return (
    (statusCode === 400 || statusCode === 404) &&
    (detail.includes('cart is empty') || detail.includes('cart is already empty'))
  )
}

function normalizeCartItem(item, productDetails) {
  const productId = Number(item?.product_id ?? item?.id ?? 0)
  const quantity = Number(item?.quantity ?? 0)
  const price = Number(item?.price ?? productDetails?.price ?? 0)

  return {
    productId,
    title: item?.name ?? productDetails?.title ?? 'Product',
    quantity,
    price,
    subtotal: Number(item?.subtotal ?? price * quantity),
    image: resolveProductImage(productDetails?.image),
    category: productDetails?.category ?? 'Featured',
    brand: productDetails?.brand ?? '',
  }
}

function normalizeCartResponse(response, detailsMap) {
  const rawItems = Array.isArray(response?.items) ? response.items : []
  const items = rawItems.map((item) => normalizeCartItem(item, detailsMap[String(item.product_id)]))
  const grandTotal = Number(
    response?.grand_total ?? items.reduce((total, item) => total + Number(item.subtotal ?? 0), 0),
  )

  return {
    items,
    grandTotal,
  }
}

export function CartProvider({ children }) {
  const { isAuthenticated } = useAuth()
  const [productDetails, setProductDetails] = useState(() => readStoredProductDetails())
  const productDetailsRef = useRef(productDetails)

  const [items, setItems] = useState([])
  const [grandTotal, setGrandTotal] = useState(0)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isMutating, setIsMutating] = useState(false)

  useEffect(() => {
    productDetailsRef.current = productDetails
    localStorage.setItem(CART_PRODUCT_DETAILS_KEY, JSON.stringify(productDetails))
  }, [productDetails])

  const syncCart = useCallback(async (detailsOverride = productDetailsRef.current) => {
    if (!isAuthenticated) {
      setItems([])
      setGrandTotal(0)
      setError('')
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const response = await getCart()
      const normalizedCart = normalizeCartResponse(response, detailsOverride)

      setItems(normalizedCart.items)
      setGrandTotal(normalizedCart.grandTotal)
    } catch (errorResponse) {
      if (isCartEmptyError(errorResponse)) {
        setItems([])
        setGrandTotal(0)
        setError('')
      } else {
        setItems([])
        setGrandTotal(0)
        setError(getErrorMessage(errorResponse, 'Unable to load your cart.'))
      }
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    void syncCart()
  }, [syncCart])

  const rememberProduct = useCallback((product) => {
    const snapshot = buildProductSnapshot(product)
    const nextDetails = {
      ...productDetailsRef.current,
      [String(snapshot.id)]: snapshot,
    }

    productDetailsRef.current = nextDetails
    setProductDetails(nextDetails)

    return nextDetails
  }, [])

  const replaceCartItems = useCallback(async (nextItems) => {
    setIsMutating(true)
    setError('')

    try {
      try {
        await clearCart()
      } catch (errorResponse) {
        if (!isCartEmptyError(errorResponse)) {
          throw errorResponse
        }
      }

      for (const item of nextItems) {
        await addCartItem({
          product_id: Number(item.productId),
          quantity: Number(item.quantity),
        })
      }

      await syncCart()
    } catch (errorResponse) {
      const message = getErrorMessage(errorResponse, 'Unable to update your cart.')
      setError(message)
      throw new Error(message)
    } finally {
      setIsMutating(false)
    }
  }, [syncCart])

  const addItem = useCallback(async (product, quantity = 1) => {
    const safeQuantity = Math.max(1, Number(quantity) || 1)
    const nextDetails = rememberProduct(product)

    setIsMutating(true)
    setError('')

    try {
      await addCartItem({
        product_id: Number(product.id),
        quantity: safeQuantity,
      })
      await syncCart(nextDetails)
    } catch (errorResponse) {
      const message = getErrorMessage(errorResponse, 'Unable to add this product to your cart.')
      setError(message)
      throw new Error(message)
    } finally {
      setIsMutating(false)
    }
  }, [rememberProduct, syncCart])

  const updateQuantity = useCallback(async (productId, quantity) => {
    const safeQuantity = Math.max(0, Number(quantity) || 0)

    if (safeQuantity === 0) {
      const remainingItems = items.filter((item) => item.productId !== productId)
      await replaceCartItems(remainingItems)
      return
    }

    const nextItems = items.map((item) =>
      item.productId === productId ? { ...item, quantity: safeQuantity } : item,
    )

    await replaceCartItems(nextItems)
  }, [items, replaceCartItems])

  const removeItem = useCallback(async (productId) => {
    const remainingItems = items.filter((item) => item.productId !== productId)
    await replaceCartItems(remainingItems)
  }, [items, replaceCartItems])

  const clearAllItems = useCallback(async () => {
    setIsMutating(true)
    setError('')

    try {
      try {
        await clearCart()
      } catch (errorResponse) {
        if (!isCartEmptyError(errorResponse)) {
          throw errorResponse
        }
      }

      setItems([])
      setGrandTotal(0)
    } catch (errorResponse) {
      const message = getErrorMessage(errorResponse, 'Unable to clear your cart.')
      setError(message)
      throw new Error(message)
    } finally {
      setIsMutating(false)
    }
  }, [])

  const checkout = useCallback(async ({ addressId, paymentMethod }) => {
    setIsMutating(true)
    setError('')

    try {
      const orderResponse = await checkoutOrder({
        address_id: Number(addressId),
        payment_method: paymentMethod,
      })

      setItems([])
      setGrandTotal(0)
      await syncCart()

      return orderResponse
    } catch (errorResponse) {
      const message = getErrorMessage(errorResponse, 'Unable to complete checkout.')
      setError(message)
      throw new Error(message)
    } finally {
      setIsMutating(false)
    }
  }, [syncCart])

  const itemCount = useMemo(
    () => items.reduce((total, item) => total + Number(item.quantity || 0), 0),
    [items],
  )

  const value = useMemo(() => ({
    items,
    grandTotal,
    itemCount,
    error,
    isLoading,
    isMutating,
    addItem,
    updateQuantity,
    removeItem,
    clearAllItems,
    checkout,
    refreshCart: syncCart,
  }), [addItem, checkout, clearAllItems, error, grandTotal, isLoading, isMutating, itemCount, items, removeItem, syncCart, updateQuantity])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}