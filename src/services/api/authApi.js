import apiClient from '@/services/api/client'

export async function login(payload) {
  const { data } = await apiClient.post('/auth/login', payload)
  return data
}

export async function register(payload) {
  const { data } = await apiClient.post('/auth/register', payload)
  return data
}

export async function verifyEmail(payload) {
  const { data } = await apiClient.post('/auth/verify-email', payload)
  return data
}

export async function resendOtp(payload) {
  const { data } = await apiClient.post('/auth/resend-otp', payload)
  return data
}

export async function forgotPassword(payload) {
  const { data } = await apiClient.post('/auth/forgot-password', payload)
  return data
}

export async function resetPassword(payload) {
  const { data } = await apiClient.post('/auth/reset-password', payload)
  return data
}
