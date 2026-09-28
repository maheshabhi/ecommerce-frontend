import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'

import { AuthFormShell } from '@/components/ui/AuthFormShell'
import Button from '@/components/ui/Button'
import { FormInput } from '@/components/ui/FormInput'
import InlineAlert from '@/components/ui/InlineAlert'
import { useToast } from '@/hooks/useToast'
import { register as registerRequest } from '@/services/api/authApi'

function RegisterPage() {
  const [serverMessage, setServerMessage] = useState('')
  const [messageTone, setMessageTone] = useState('info')
  const { showToast } = useToast()
  const navigate = useNavigate()
  const {
    register,
    getValues,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      phone_number: '',
      password: '',
      confirmPassword: '',
    },
  })

  const onSubmit = async (values) => {
    setServerMessage('')

    try {
      await registerRequest({
        first_name: values.first_name,
        last_name: values.last_name,
        email: values.email,
        phone_number: values.phone_number || null,
        password: values.password,
      })
      setMessageTone('success')
      setServerMessage('Account created successfully. Verify your email to continue.')
      showToast({
        title: 'Registration complete',
        message: 'Check your email for OTP verification.',
        type: 'success',
      })
      navigate(`/verify-email?email=${encodeURIComponent(values.email)}`)
    } catch (error) {
      const detail = error?.response?.data?.detail
      setMessageTone('error')
      setServerMessage(
        typeof detail === 'string' ? detail : 'Unable to register. Please review your details and try again.',
      )
      showToast({
        title: 'Registration failed',
        message:
          typeof detail === 'string'
            ? detail
            : 'Please correct any issues and submit the form again.',
        type: 'error',
      })
    }
  }

  return (
    <AuthFormShell title="Register" description="Create a new account for faster checkout.">
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <FormInput
          label="First Name"
          autoComplete="given-name"
          placeholder="Jane"
          registration={register('first_name', {
            required: 'First name is required',
            minLength: {
              value: 2,
              message: 'First name must be at least 2 characters',
            },
          })}
          error={errors.first_name}
        />

        <FormInput
          label="Last Name"
          autoComplete="family-name"
          placeholder="Doe"
          registration={register('last_name', {
            required: 'Last name is required',
            minLength: {
              value: 1,
              message: 'Last name is required',
            },
          })}
          error={errors.last_name}
        />

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
          label="Phone Number (optional)"
          autoComplete="tel"
          placeholder="+1 123 456 7890"
          registration={register('phone_number')}
          error={errors.phone_number}
        />

        <FormInput
          label="Password"
          type="password"
          autoComplete="new-password"
          placeholder="Create a strong password"
          registration={register('password', {
            required: 'Password is required',
            minLength: {
              value: 8,
              message: 'Password must be at least 8 characters',
            },
            pattern: {
              value: /^(?=.*[A-Za-z])(?=.*\d).+$/,
              message: 'Password must include letters and numbers',
            },
          })}
          error={errors.password}
        />

        <FormInput
          label="Confirm Password"
          type="password"
          autoComplete="new-password"
          placeholder="Re-enter your password"
          registration={register('confirmPassword', {
            required: 'Please confirm your password',
            validate: (value) => value === getValues('password') || 'Passwords do not match',
          })}
          error={errors.confirmPassword}
        />

        <InlineAlert message={serverMessage} tone={messageTone} />

        <Button type="submit" loading={isSubmitting} className="w-full">
          {isSubmitting ? 'Creating account...' : 'Create account'}
        </Button>
      </form>

      <p className="text-sm text-slate-600">
        Already have an account?{' '}
        <Link className="text-brand-700 underline underline-offset-2" to="/login">
          Login
        </Link>
      </p>
    </AuthFormShell>
  )
}

export default RegisterPage
