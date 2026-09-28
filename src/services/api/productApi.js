import apiClient from '@/services/api/client'

export async function getProducts(params = {}) {
  const { data } = await apiClient.get('/products', { params })
  return data
}
