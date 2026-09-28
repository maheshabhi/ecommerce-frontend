import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'

import { AuthFormShell } from '@/components/ui/AuthFormShell'
import Button from '@/components/ui/Button'
import { FormInput } from '@/components/ui/FormInput'
import InlineAlert from '@/components/ui/InlineAlert'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { login as loginRequest } from '@/services/api/authApi'

function LoginPage() {
  const [serverMessage, setServerMessage] = useState('')
  const navigate = useNavigate()
  const location = useLocation()
  const { showToast } = useToast()
  const { login } = useAuth()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = async (values) => {
    setServerMessage('')
    const params = new URLSearchParams(location.search)
    const requestedPath = params.get('redirect')
    const redirectTo = requestedPath || location.state?.from?.pathname || '/products'

    try {
      const response = await loginRequest(values)

      if (!response?.access_token) {
        throw new Error('Missing access token in login response')
      }

      login(response?.access_token, response?.user)
      showToast({
        title: 'Welcome back',
        message: 'You have signed in successfully.',
        type: 'success',
      })
      navigate(redirectTo, { replace: true })
    } catch (error) {
      const detail = error?.response?.data?.detail
      setServerMessage(typeof detail === 'string' ? detail : 'Unable to sign in. Verify your credentials or backend auth service.')
      showToast({
        title: 'Sign in failed',
        message:
          typeof detail === 'string'
            ? detail
            : 'Please review your email and password and try again.',
        type: 'error',
      })
    }
  }

  return (
    <AuthFormShell title="Login" description="Sign in to continue shopping and manage orders.">
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <FormInput
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          registration={register('email', {
            required: 'Email is required',
            pattern: {
              value: /\S+@\S+\.\S+/,
              message: 'Please enter a valid email',
            },
          })}
          error={errors.email}
        />

        <FormInput
          label="Password"
          type="password"
          autoComplete="current-password"
          placeholder="Enter your password"
          registration={register('password', {
            required: 'Password is required',
            minLength: {
              value: 8,
              message: 'Password must be at least 8 characters',
            },
          })}
          error={errors.password}
        />

        <p className="text-sm text-slate-600">
          <Link className="text-brand-700 underline underline-offset-2" to="/forgot-password">
            Forgot password?
          </Link>
        </p>

        <InlineAlert message={serverMessage} tone="error" />

        <Button type="submit" loading={isSubmitting} className="w-full">
          {isSubmitting ? 'Signing in...' : 'Sign in'}
        </Button>
      </form>

      <p className="text-sm text-slate-600">
        New user?{' '}
        <Link className="text-brand-700 underline underline-offset-2" to="/register">
          Register here
        </Link>
      </p>
    </AuthFormShell>
  )
}

export default LoginPage
