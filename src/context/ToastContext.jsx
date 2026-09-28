import { useCallback, useMemo, useState } from 'react'

import ToastViewport from '@/components/ui/ToastViewport'
import { ToastContext } from '@/context/toast-context'

const DEFAULT_DURATION = 3500

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const removeToast = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const showToast = useCallback(({ title, message, type = 'info', duration = DEFAULT_DURATION }) => {
    const id = crypto.randomUUID()

    setToasts((current) => [...current, { id, title, message, type }])

    window.setTimeout(() => {
      removeToast(id)
    }, duration)
  }, [removeToast])

  const value = useMemo(
    () => ({
      showToast,
      removeToast,
    }),
    [showToast, removeToast],
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  )
}
