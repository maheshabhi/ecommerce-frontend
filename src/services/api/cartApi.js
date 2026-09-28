import apiClient from '@/services/api/client'

export async function getCart() {
  const { data } = await apiClient.get('/cart')
  return data
}

export async function addCartItem(payload) {
  const { data } = await apiClient.post('/cart', payload)
  return data
}

export async function clearCart() {
  const { data } = await apiClient.delete('/cart')
  return data
}