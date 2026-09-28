import apiClient from '@/services/api/client'

export async function checkoutOrder(payload) {
  const { data } = await apiClient.post('/orders/checkout', payload)
  return data
}

export async function getOrders() {
  const { data } = await apiClient.get('/orders/')
  return data
}