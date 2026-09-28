import Spinner from '@/components/ui/Spinner'

function LoadingScreen({ message = 'Loading...' }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-page-glow px-4 font-body text-slate-700">
      <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-soft" role="status" aria-live="polite">
        <Spinner className="h-5 w-5 text-brand-700" />
        <span>{message}</span>
      </div>
    </main>
  )
}

export default LoadingScreen
