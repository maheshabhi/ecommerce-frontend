function InlineAlert({ message, tone = 'info' }) {
  if (!message) {
    return null
  }

  const toneClass =
    tone === 'error'
      ? 'border-rose-200 bg-rose-50 text-rose-800'
      : tone === 'success'
        ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
        : 'border-amber-200 bg-amber-50 text-amber-800'

  return (
    <p className={`rounded-md border px-3 py-2 text-sm ${toneClass}`} role="status" aria-live="polite">
      {message}
    </p>
  )
}

export default InlineAlert
