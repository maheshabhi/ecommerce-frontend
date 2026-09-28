export function AuthFormShell({ title, description, children }) {
  return (
    <section>
      <h2 className="font-heading text-xl font-semibold text-slate-900">{title}</h2>
      <p className="mt-1 text-sm text-slate-600">{description}</p>
      <div className="mt-6 space-y-4">{children}</div>
    </section>
  )
}
