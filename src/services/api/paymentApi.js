import apiClient from '@/services/api/client'

export async function createRazorpayOrder(payload) {
  const { data } = await apiClient.post('/payments/create-order', payload)
  return data
}

export async function verifyRazorpayPayment(payload) {
  const { data } = await apiClient.post('/payments/verify', payload)
  return data
}

export async function markRazorpayPaymentFailure(payload) {
  const { data } = await apiClient.post('/payments/failure', payload)
  return data
}
