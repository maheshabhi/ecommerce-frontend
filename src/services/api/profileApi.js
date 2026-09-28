import apiClient from '@/services/api/client'

export async function getProfile() {
  const { data } = await apiClient.get('/user/profile')
  return data
}

export async function updateProfile(payload) {
  const { data } = await apiClient.put('/user/profile', payload)
  return data
}

export async function getAddresses() {
  const { data } = await apiClient.get('/user/addresses')
  return data
}

export async function addAddress(payload) {
  const { data } = await apiClient.post('/user/addresses', payload)
  return data
}

export async function updateAddress(addressId, payload) {
  const { data } = await apiClient.put(`/user/addresses/${addressId}`, payload)
  return data
}

export async function setAddressAsDefault(addressId) {
  const { data } = await apiClient.put(`/user/addresses/${addressId}/default`)
  return data
}

export async function deleteAddress(addressId) {
  const { data } = await apiClient.delete(`/user/addresses/${addressId}`)
  return data
}
