import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

import Button from '@/components/ui/Button'
import InlineAlert from '@/components/ui/InlineAlert'
import { useToast } from '@/hooks/useToast'
import { getOrders } from '@/services/api/orderApi'
import { createRazorpayOrder, markRazorpayPaymentFailure, verifyRazorpayPayment } from '@/services/api/paymentApi'
import { getErrorMessage } from '@/utils/apiError'
import { formatCurrency } from '@/utils/product'

function normalizeOrders(response) {
  if (Array.isArray(response)) {
    return response
  }

  if (Array.isArray(response?.items)) {
    return response.items
  }

  if (response && typeof response === 'object') {
    return [response]
  }

  return []
}

function OrdersPage() {
  const location = useLocation()
  const { showToast } = useToast()
  const [orders, setOrders] = useState([])
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [activeOrderId, setActiveOrderId] = useState(null)

  const highlightedOrderNumber = location.state?.orderNumber ?? ''

  const loadOrders = async () => {
    setIsLoading(true)
    setError('')

    try {
      const response = await getOrders()
      setOrders(normalizeOrders(response))
    } catch (errorResponse) {
      const statusCode = errorResponse?.response?.status
      const detail = `${errorResponse?.response?.data?.detail ?? ''}`.toLowerCase()

      if (statusCode === 404 && detail.includes('no orders found')) {
        setOrders([])
        setError('')
      } else {
        setOrders([])
        setError(getErrorMessage(errorResponse, 'Unable to load your orders.'))
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadOrders()
  }, [])

  const orderedResults = useMemo(() => [...orders].reverse(), [orders])

  const shouldShowPayNow = (order) => {
    const paymentMethod = `${order?.payment_method ?? ''}`.toUpperCase()
    const paymentStatus = `${order?.payment_status ?? ''}`.toUpperCase()
    const orderStatus = `${order?.order_status ?? ''}`.toUpperCase()

    return paymentMethod === 'RAZORPAY' && paymentStatus !== 'SUCCESS' && orderStatus !== 'CANCELLED'
  }

  const reportPaymentFailure = async ({ orderId, razorpayOrderId, razorpayPaymentId, error }) => {
    try {
      await markRazorpayPaymentFailure({
        order_id: orderId,
        razorpay_order_id: razorpayOrderId,
        razorpay_payment_id: razorpayPaymentId,
        error_code: error?.code,
        error_description: error?.description,
      })
    } catch {
      // Ignore failure update errors to avoid masking the original payment failure to the user.
    }
  }

  const handlePayNow = async (order) => {
    const orderId = order?.order_id
    const orderNumber = order?.order_number ?? orderId ?? ''

    if (!orderId) {
      showToast({
        title: 'Unable to pay',
        message: 'Order details are incomplete. Refresh orders and try again.',
        type: 'error',
      })
      return
    }

    if (!window.Razorpay || !import.meta.env.VITE_RAZORPAY_KEY_ID) {
      showToast({
        title: 'Razorpay unavailable',
        message: 'Razorpay is not configured in the frontend environment.',
        type: 'error',
      })
      return
    }

    setActiveOrderId(orderId)

    try {
      const razorpayData = await createRazorpayOrder({ order_id: orderId })

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: Math.round(Number(razorpayData.amount || 0) * 100),
        currency: 'INR',
        name: 'E-commerce App',
        description: `Payment for order ${orderNumber}`,
        order_id: razorpayData.razorpay_order_id,
        handler: async (response) => {
          try {
            await verifyRazorpayPayment({
              order_id: orderId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            })

            showToast({
              title: 'Payment successful',
              message: orderNumber ? `Order ${orderNumber} has been paid successfully.` : 'Payment completed successfully.',
              type: 'success',
            })
          } catch (errorResponse) {
            showToast({
              title: 'Payment verification failed',
              message: getErrorMessage(errorResponse, 'Payment received but verification failed. Contact support.'),
              type: 'error',
            })
          } finally {
            setActiveOrderId(null)
            await loadOrders()
          }
        },
        modal: {
          ondismiss: async () => {
            await reportPaymentFailure({
              orderId,
              razorpayOrderId: razorpayData.razorpay_order_id,
            })

            showToast({
              title: 'Payment cancelled',
              message: 'Payment window was closed. You can try paying again from orders.',
              type: 'error',
            })

            setActiveOrderId(null)
            await loadOrders()
          },
        },
        theme: { color: '#1d4ed8' },
      }

      const rzp = new window.Razorpay(options)

      rzp.on('payment.failed', async (response) => {
        await reportPaymentFailure({
          orderId,
          razorpayOrderId: razorpayData.razorpay_order_id,
          razorpayPaymentId: response?.error?.metadata?.payment_id,
          error: response?.error,
        })

        showToast({
          title: 'Payment failed',
          message: response?.error?.description ?? 'Payment failed. Please try again.',
          type: 'error',
        })

        setActiveOrderId(null)
        await loadOrders()
      })

      rzp.open()
    } catch (errorResponse) {
      setActiveOrderId(null)
      showToast({
        title: 'Unable to start payment',
        message: getErrorMessage(errorResponse, 'Unable to initiate Razorpay payment.'),
        type: 'error',
      })
    }
  }

  if (isLoading) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white/95 p-8 shadow-soft">
        <h1 className="font-heading text-3xl font-semibold text-slate-900">Orders</h1>
        <p className="mt-2 text-sm text-slate-500">Loading your orders...</p>
      </section>
    )
  }

  return (
    <section className="space-y-6" aria-labelledby="orders-page-heading">
      <header className="rounded-2xl border border-slate-200 bg-white/95 p-6 shadow-soft">
        <p className="text-sm uppercase tracking-[0.22em] text-brand-700">Orders</p>
        <h1 id="orders-page-heading" className="mt-2 font-heading text-3xl font-semibold text-slate-900">
          Track your recent purchases
        </h1>
        <p className="mt-2 text-slate-600">Review ordered products, totals, and current payment status.</p>
        {highlightedOrderNumber ? (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
            Order {highlightedOrderNumber} was placed successfully.
          </div>
        ) : null}
        {error ? <InlineAlert message={error} tone="error" /> : null}
      </header>

      {!orderedResults.length ? (
        <section className="rounded-2xl border border-slate-200 bg-white/95 p-8 text-center shadow-soft">
          <h2 className="font-heading text-2xl font-semibold text-slate-900">No orders yet</h2>
          <p className="mt-2 text-slate-600">Complete checkout from your cart to see order history here.</p>
          <Button className="mt-5" onClick={loadOrders}>
            Refresh orders
          </Button>
        </section>
      ) : (
        <div className="space-y-4">
          {orderedResults.map((order) => (
            <article key={order.order_id ?? order.order_number} className="rounded-2xl border border-slate-200 bg-white/95 p-6 shadow-soft">
              <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.16em] text-brand-700">Order</p>
                  <h2 className="mt-1 font-heading text-2xl font-semibold text-slate-900">{order.order_number}</h2>
                </div>
                <div className="grid gap-2 text-sm text-slate-600 sm:grid-cols-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Order status</p>
                    <p className="mt-1 font-semibold text-slate-900">{order.order_status}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Payment status</p>
                    <p className="mt-1 font-semibold text-slate-900">{order.payment_status}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Method</p>
                    <p className="mt-1 font-semibold text-slate-900">{order.payment_method}</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {order.items?.map((item) => (
                  <div key={`${order.order_number}-${item.product_id}`} className="flex items-start justify-between gap-4 text-sm">
                    <div>
                      <p className="font-semibold text-slate-900">{item.product_name}</p>
                      <p className="mt-1 text-slate-500">Qty {item.quantity}</p>
                    </div>
                    <p className="font-semibold text-slate-900">{formatCurrency(item.subtotal)}</p>
                  </div>
                ))}
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-slate-200 pt-4 text-base font-semibold text-slate-900">
                <span>Total amount</span>
                <span>{formatCurrency(order.total_amount)}</span>
              </div>

              {shouldShowPayNow(order) ? (
                <div className="mt-4">
                  <Button
                    onClick={() => {
                      void handlePayNow(order)
                    }}
                    loading={activeOrderId === order.order_id}
                    disabled={activeOrderId !== null}
                  >
                    Pay now
                  </Button>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      )}

      <p className="text-sm text-slate-500">
        Need to place a new order? Return to <Link className="text-brand-700 underline underline-offset-2" to="/products">products</Link> or review your <Link className="text-brand-700 underline underline-offset-2" to="/cart">cart</Link>.
      </p>
    </section>
  )
}

export default OrdersPage