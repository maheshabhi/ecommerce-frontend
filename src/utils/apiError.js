export function getErrorMessage(error, fallbackMessage = 'Something went wrong. Please try again.') {
  const responseData = error?.response?.data

  if (typeof responseData?.detail === 'string' && responseData.detail.trim()) {
    return responseData.detail
  }

  if (Array.isArray(responseData?.detail) && responseData.detail.length > 0) {
    const firstDetail = responseData.detail[0]

    if (typeof firstDetail?.msg === 'string' && firstDetail.msg.trim()) {
      return firstDetail.msg
    }

    if (typeof firstDetail === 'string' && firstDetail.trim()) {
      return firstDetail
    }
  }

  if (typeof responseData?.message === 'string' && responseData.message.trim()) {
    return responseData.message
  }

  if (typeof error?.message === 'string' && error.message.trim()) {
    return error.message
  }

  return fallbackMessage
}
