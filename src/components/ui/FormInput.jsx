import { useId } from 'react'

export function FormInput({
  label,
  type = 'text',
  placeholder,
  error,
  registration,
  autoComplete,
}) {
  const generatedId = useId()
  const inputId = registration?.name ? `field-${registration.name}` : generatedId
  const errorId = `${inputId}-error`

  return (
    <label className="block text-sm" htmlFor={inputId}>
      <span className="mb-1 block font-medium text-slate-700">{label}</span>
      <input
        id={inputId}
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        {...registration}
      />
      {error ? (
        <span id={errorId} className="mt-1 block text-xs text-rose-600">
          {error.message}
        </span>
      ) : null}
    </label>
  )
}
