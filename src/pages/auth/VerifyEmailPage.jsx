import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'

import { AuthFormShell } from '@/components/ui/AuthFormShell'
import Button from '@/components/ui/Button'
import { FormInput } from '@/components/ui/FormInput'
import InlineAlert from '@/components/ui/InlineAlert'
import { useToast } from '@/hooks/useToast'
import { resendOtp, verifyEmail } from '@/services/api/authApi'

function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const defaultEmail = searchParams.get('email') ?? ''
  const [serverMessage, setServerMessage] = useState('')
  const [messageTone, setMessageTone] = useState('info')
  const { showToast } = useToast()

  const {
    register,
    getValues,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      email: defaultEmail,
      otp: '',
    },
  })

  const onSubmit = async (values) => {
    setServerMessage('')

    try {
      const response = await verifyEmail(values)
      setMessageTone('success')
      setServerMessage(response?.message ?? 'Email verified successfully. You can now log in.')
      showToast({
        title: 'Email verified',
        message: 'Your account is now active.',
        type: 'success',
      })
    } catch (error) {
      const detail = error?.response?.data?.detail
      setMessageTone('error')
      setServerMessage(typeof detail === 'string' ? detail : 'Verification failed. Check OTP and try again.')
      showToast({
        title: 'Verification failed',
        message: 'Please verify the code and retry.',
        type: 'error',
      })
    }
  }

  const handleResendOtp = async () => {
    const email = getValues('email')

    if (!email) {
      setMessageTone('error')
      setServerMessage('Please enter your email before requesting a new OTP.')
      return
    }

    try {
      const response = await resendOtp({ email })
      setMessageTone('success')
      setServerMessage(response?.message ?? 'Verification code sent.')
      showToast({
        title: 'OTP sent',
        message: 'A new verification code has been emailed.',
        type: 'success',
      })
    } catch (error) {
      const detail = error?.response?.data?.detail
      setMessageTone('error')
      setServerMessage(typeof detail === 'string' ? detail : 'Unable to resend OTP right now.')
      showToast({
        title: 'OTP resend failed',
        message: 'Please try again shortly.',
        type: 'error',
      })
    }
  }

  return (
    <AuthFormShell title="Verify Email" description="Enter the OTP sent to your email to activate your account.">
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

        <InlineAlert message={serverMessage} tone={messageTone} />

        <div className="grid gap-3 sm:grid-cols-2">
          <Button type="submit" loading={isSubmitting} className="w-full">
            {isSubmitting ? 'Verifying...' : 'Verify Email'}
          </Button>
          <Button type="button" variant="secondary" className="w-full" onClick={handleResendOtp}>
            Resend OTP
          </Button>
        </div>
      </form>

      <p className="text-sm text-slate-600">
        Already verified?{' '}
        <Link className="text-brand-700 underline underline-offset-2" to="/login">
          Go to login
        </Link>
      </p>
    </AuthFormShell>
  )
}

export default VerifyEmailPage
