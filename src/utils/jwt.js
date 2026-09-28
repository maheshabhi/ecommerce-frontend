function decodeBase64Url(input) {
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')
  return atob(padded)
}

export function parseJwt(token) {
  if (!token || typeof token !== 'string') {
    return null
  }

  const segments = token.split('.')
  if (segments.length !== 3) {
    return null
  }

  try {
    const payload = decodeBase64Url(segments[1])
    return JSON.parse(payload)
  } catch {
    return null
  }
}

export function isTokenExpired(token) {
  const payload = parseJwt(token)
  if (!payload?.exp) {
    return false
  }

  const nowInSeconds = Math.floor(Date.now() / 1000)
  return nowInSeconds >= payload.exp
}
