import Spinner from '@/components/ui/Spinner'

function Button({
  children,
  type = 'button',
  loading = false,
  disabled = false,
  variant = 'primary',
  className = '',
  ...props
}) {
  const baseClass =
    'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:cursor-not-allowed disabled:opacity-70'

  const variantClass =
    variant === 'secondary'
      ? 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
      : variant === 'danger'
        ? 'bg-rose-700 text-white hover:bg-rose-800'
        : 'bg-brand-700 text-white hover:bg-brand-800'

  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`${baseClass} ${variantClass} ${className}`.trim()}
      aria-busy={loading}
      {...props}
    >
      {loading ? <Spinner /> : null}
      <span>{children}</span>
    </button>
  )
}

export default Button
