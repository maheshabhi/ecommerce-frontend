import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import Button from '@/components/ui/Button'
import InlineAlert from '@/components/ui/InlineAlert'
import { useCart } from '@/hooks/useCart'
import { useToast } from '@/hooks/useToast'
import { getAddresses } from '@/services/api/profileApi'
import { createRazorpayOrder, verifyRazorpayPayment } from '@/services/api/paymentApi'
import { getErrorMessage } from '@/utils/apiError'
import { formatCurrency } from '@/utils/product'

const PAYMENT_METHODS = [
  {
    value: 'COD',
    title: 'Cash on delivery',
    description: 'Collect payment when the order reaches the customer.',
  },
  {
    value: 'STRIPE',
    title: 'Stripe',
    description: 'Submit the selected method to the backend for online payment handling.',
  },
  {
    value: 'RAZORPAY',
    title: 'Razorpay',
    description: 'Use this if your backend environment is configured for Razorpay orders.',
  },
  {
    value: 'PAYPAL',
    title: 'PayPal',
    description: 'Submit the order with PayPal as the recorded payment method.',
  },
]

function normalizeAddresses(response) {
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

function getAddressSummary(address) {
  return [address.address_line1, address.address_line2, address.city, address.state, address.country, address.postal_code]
    .filter(Boolean)
    .join(', ')
}

function CheckoutPage() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { items, grandTotal, checkout, isLoading: isCartLoading, isMutating, error: cartError } = useCart()

  const [addresses, setAddresses] = useState([])
  const [selectedAddressId, setSelectedAddressId] = useState('')
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(PAYMENT_METHODS[0].value)
  const [pageError, setPageError] = useState('')
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function loadAddresses() {
      setIsLoadingAddresses(true)
      setPageError('')

      try {
        const response = await getAddresses()
        const normalizedAddresses = normalizeAddresses(response)

        if (!isMounted) {
          return
        }

        setAddresses(normalizedAddresses)

        const defaultAddress = normalizedAddresses.find((address) => address.is_default) ?? normalizedAddresses[0]
        setSelectedAddressId(defaultAddress?.id ? String(defaultAddress.id) : '')
      } catch (errorResponse) {
        if (!isMounted) {
          return
        }

        setPageError(getErrorMessage(errorResponse, 'Unable to load your delivery addresses.'))
      } finally {
        if (isMounted) {
          setIsLoadingAddresses(false)
        }
      }
    }

    void loadAddresses()

    return () => {
      isMounted = false
    }
  }, [])

  const totalQuantity = useMemo(
    () => items.reduce((total, item) => total + Number(item.quantity || 0), 0),
    [items],
  )

  const handlePlaceOrder = async (event) => {
    event.preventDefault()

    if (!selectedAddressId) {
      setPageError('Choose a delivery address before placing the order.')
      return
    }

    setPageError('')

    try {
      const orderResponse = await checkout({
        addressId: selectedAddressId,
        paymentMethod: selectedPaymentMethod,
      })

      if (selectedPaymentMethod === 'RAZORPAY') {
        await initiateRazorpayPayment(orderResponse)
        return
      }

      const orderNumber = orderResponse?.order_number ?? orderResponse?.id ?? ''

      showToast({
        title: 'Order placed',
        message: orderNumber ? `Order ${orderNumber} has been created successfully.` : 'Your order has been created successfully.',
        type: 'success',
      })

      navigate('/orders', {
        replace: true,
        state: { orderNumber },
      })
    } catch (errorResponse) {
      setPageError(errorResponse.message || 'Unable to place your order.')
    }
  }

  const initiateRazorpayPayment = async (order) => {
    const orderId = order?.id
    const orderNumber = order?.order_number ?? orderId ?? ''

    let razorpayData
    try {
      razorpayData = await createRazorpayOrder({ order_id: orderId })
    } catch (errorResponse) {
      setPageError(getErrorMessage(errorResponse, 'Unable to initiate Razorpay payment.'))
      return
    }

    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: razorpayData.amount * 100,
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
            message: orderNumber ? `Order ${orderNumber} has been paid successfully.` : 'Your payment was successful.',
            type: 'success',
          })

          navigate('/orders', { replace: true, state: { orderNumber } })
        } catch (errorResponse) {
          showToast({
            title: 'Payment verification failed',
            message: getErrorMessage(errorResponse, 'Payment was received but verification failed. Contact support.'),
            type: 'error',
          })
          navigate('/orders', { replace: true, state: { orderNumber } })
        }
      },
      modal: {
        ondismiss: () => {
          showToast({
            title: 'Payment cancelled',
            message: 'You closed the payment window. Your order has been created but not paid.',
            type: 'error',
          })
          navigate('/orders', { replace: true, state: { orderNumber } })
        },
      },
      theme: { color: '#1d4ed8' },
    }

    const rzp = new window.Razorpay(options)

    rzp.on('payment.failed', (response) => {
      showToast({
        title: 'Payment failed',
        message: response?.error?.description ?? 'Payment failed. Please try again from your orders.',
        type: 'error',
      })
      navigate('/orders', { replace: true, state: { orderNumber } })
    })

    rzp.open()
  }

  if (isCartLoading || isLoadingAddresses) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white/95 p-8 shadow-soft">
        <h1 className="font-heading text-3xl font-semibold text-slate-900">Payment</h1>
        <p className="mt-2 text-sm text-slate-500">Preparing your checkout details...</p>
      </section>
    )
  }

  if (!items.length) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white/95 p-8 text-center shadow-soft">
        <p className="text-sm uppercase tracking-[0.22em] text-brand-700">Payment</p>
        <h1 className="mt-2 font-heading text-3xl font-semibold text-slate-900">Nothing to pay for yet</h1>
        <p className="mt-3 text-slate-600">Your cart is empty. Add products before continuing to payment.</p>
        {cartError ? <InlineAlert message={cartError} tone="error" /> : null}
        <Button className="mt-5" onClick={() => navigate('/products')}>
          Back to products
        </Button>
      </section>
    )
  }

  const hasAddresses = addresses.length > 0

  return (
    <section className="space-y-6" aria-labelledby="checkout-page-heading">
      <header className="rounded-2xl border border-slate-200 bg-white/95 p-6 shadow-soft">
        <p className="text-sm uppercase tracking-[0.22em] text-brand-700">Payment</p>
        <h1 id="checkout-page-heading" className="mt-2 font-heading text-3xl font-semibold text-slate-900">
          Choose address and payment method
        </h1>
        <p className="mt-2 text-slate-600">Review delivery details and submit the order to the backend checkout endpoint.</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.2fr,0.9fr]">
        <form className="space-y-6" onSubmit={handlePlaceOrder}>
          <section className="rounded-2xl border border-slate-200 bg-white/95 p-6 shadow-soft">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-heading text-2xl font-semibold text-slate-900">Delivery address</h2>
                <p className="mt-1 text-sm text-slate-600">Select the address that should be attached to this order.</p>
              </div>
              <Link className="text-sm font-semibold text-brand-700 underline underline-offset-2" to="/profile">
                Manage addresses
              </Link>
            </div>

            {pageError ? <InlineAlert message={pageError} tone="error" /> : null}

            {!hasAddresses ? (
              <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                No saved address found. Add one in your profile before placing an order.
              </div>
            ) : (
              <div className="mt-5 space-y-3">
                {addresses.map((address) => (
                  <label
                    key={address.id}
                    className="flex cursor-pointer gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 transition hover:border-brand-300"
                  >
                    <input
                      type="radio"
                      name="address"
                      value={String(address.id)}
                      checked={selectedAddressId === String(address.id)}
                      onChange={(event) => setSelectedAddressId(event.target.value)}
                      className="mt-1"
                    />
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-slate-900">{address.full_name}</p>
                        {address.is_default ? (
                          <span className="rounded-full border border-brand-200 bg-brand-50 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-brand-700">
                            Default
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-sm text-slate-600">{address.phone}</p>
                      <p className="mt-2 text-sm text-slate-600">{getAddressSummary(address)}</p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white/95 p-6 shadow-soft">
            <h2 className="font-heading text-2xl font-semibold text-slate-900">Payment method</h2>
            <p className="mt-1 text-sm text-slate-600">Choose how this order should be recorded in the backend.</p>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {PAYMENT_METHODS.map((method) => (
                <label
                  key={method.value}
                  className={`cursor-pointer rounded-2xl border p-4 transition ${selectedPaymentMethod === method.value ? 'border-brand-500 bg-brand-50/70' : 'border-slate-200 bg-slate-50/70 hover:border-brand-200'}`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={method.value}
                    checked={selectedPaymentMethod === method.value}
                    onChange={(event) => setSelectedPaymentMethod(event.target.value)}
                    className="sr-only"
                  />
                  <p className="font-semibold text-slate-900">{method.title}</p>
                  <p className="mt-2 text-sm text-slate-600">{method.description}</p>
                </label>
              ))}
            </div>
          </section>

          <Button type="submit" className="w-full md:w-auto" loading={isMutating} disabled={!hasAddresses}>
            Place order
          </Button>
        </form>

        <aside className="rounded-2xl border border-slate-200 bg-white/95 p-6 shadow-soft lg:sticky lg:top-6 lg:self-start">
          <h2 className="font-heading text-2xl font-semibold text-slate-900">Order summary</h2>
          <div className="mt-5 space-y-4">
            {items.map((item) => (
              <div key={item.productId} className="flex items-start justify-between gap-4 text-sm">
                <div>
                  <p className="font-semibold text-slate-900">{item.title}</p>
                  <p className="mt-1 text-slate-500">Qty {item.quantity}</p>
                </div>
                <p className="font-semibold text-slate-900">{formatCurrency(item.subtotal)}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 space-y-3 border-t border-slate-200 pt-4 text-sm text-slate-600">
            <div className="flex items-center justify-between">
              <span>Total quantity</span>
              <span>{totalQuantity}</span>
            </div>
            <div className="flex items-center justify-between text-base font-semibold text-slate-900">
              <span>Grand total</span>
              <span>{formatCurrency(grandTotal)}</span>
            </div>
          </div>
        </aside>
      </div>
    </section>
  )
}

export default CheckoutPage