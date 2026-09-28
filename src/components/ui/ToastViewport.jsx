const toneClassMap = {
  info: 'border-slate-200 bg-white text-slate-800',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  error: 'border-rose-200 bg-rose-50 text-rose-900',
}

function ToastViewport({ toasts, onDismiss }) {
  return (
    <div
      className="pointer-events-none fixed inset-x-3 bottom-3 z-50 flex flex-col gap-2 sm:inset-x-auto sm:right-5 sm:top-5 sm:bottom-auto sm:w-96"
      aria-live="polite"
      aria-atomic="true"
      role="status"
    >
      {toasts.map((toast) => (
        <section
          key={toast.id}
          className={`pointer-events-auto rounded-xl border p-4 shadow-soft ${toneClassMap[toast.type] ?? toneClassMap.info}`}
        >
          {toast.title ? <h3 className="font-heading text-sm font-semibold">{toast.title}</h3> : null}
          {toast.message ? <p className="mt-1 text-sm">{toast.message}</p> : null}
          <button
            type="button"
            className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 hover:text-slate-700"
            onClick={() => onDismiss(toast.id)}
          >
            Dismiss
          </button>
        </section>
      ))}
    </div>
  )
}

export default ToastViewport
