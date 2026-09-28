import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useParams, useSearchParams } from 'react-router-dom'

import { AuthFormShell } from '@/components/ui/AuthFormShell'
import Button from '@/components/ui/Button'
import { FormInput } from '@/components/ui/FormInput'
import InlineAlert from '@/components/ui/InlineAlert'
import { useToast } from '@/hooks/useToast'
import { resetPassword } from '@/services/api/authApi'

function ResetPasswordPage() {
  const [serverMessage, setServerMessage] = useState('')
  const [messageTone, setMessageTone] = useState('info')
  const { token } = useParams()
  const [searchParams] = useSearchParams()
  const defaultEmail = searchParams.get('email') ?? ''
  const { showToast } = useToast()
  const {
    register,
    getValues,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      email: defaultEmail,
      otp: token ?? '',
      password: '',
      confirmPassword: '',
    },
  })

  const onSubmit = async (values) => {
    setServerMessage('')

    try {
      const response = await resetPassword({
        email: values.email,
        otp: values.otp,
        new_password: values.password,
      })
      setMessageTone('success')
      setServerMessage(response?.message ?? 'Password reset complete. You can now sign in.')
      showToast({
        title: 'Password updated',
        message: 'Your password has been changed successfully.',
        type: 'success',
      })
    } catch (error) {
      const detail = error?.response?.data?.detail
      setMessageTone('error')
      setServerMessage(
        typeof detail === 'string' ? detail : 'Unable to reset password right now. Please retry your reset link.',
      )
      showToast({
        title: 'Reset failed',
        message: typeof detail === 'string' ? detail : 'The reset link may be invalid or expired.',
        type: 'error',
      })
    }
  }

  return (
    <AuthFormShell title="Reset Password" description="Set a new password for your account.">
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
          label="OTP"
          type="text"
          autoComplete="one-time-code"
          placeholder="Enter 6-digit OTP"
          registration={register('otp', {
            required: 'OTP is required',
            pattern: {
              value: /^\d{6}$/,
              message: 'OTP must be a 6-digit number',
            },
          })}
          error={errors.otp}
        />

        <FormInput
          label="New Password"
          type="password"
          autoComplete="new-password"
          placeholder="Enter a new password"
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
          placeholder="Re-enter your new password"
          registration={register('confirmPassword', {
            required: 'Please confirm your password',
            validate: (value) => value === getValues('password') || 'Passwords do not match',
          })}
          error={errors.confirmPassword}
        />

        <InlineAlert message={serverMessage} tone={messageTone} />

        <Button type="submit" loading={isSubmitting} className="w-full">
          {isSubmitting ? 'Updating...' : 'Update password'}
        </Button>
      </form>

      <p className="text-sm text-slate-600">
        Need a new OTP?{' '}
        <Link className="text-brand-700 underline underline-offset-2" to="/forgot-password">
          Request password reset
        </Link>
      </p>
    </AuthFormShell>
  )
}

export default ResetPasswordPage
