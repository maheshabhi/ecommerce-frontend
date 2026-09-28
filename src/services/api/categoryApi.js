import apiClient from '@/services/api/client'

export async function getCategories() {
  const { data } = await apiClient.get('/categories')
  return data
}
