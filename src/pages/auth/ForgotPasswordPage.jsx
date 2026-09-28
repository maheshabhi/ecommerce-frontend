import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'

import { AuthFormShell } from '@/components/ui/AuthFormShell'
import Button from '@/components/ui/Button'
import { FormInput } from '@/components/ui/FormInput'
import InlineAlert from '@/components/ui/InlineAlert'
import { useToast } from '@/hooks/useToast'
import { forgotPassword } from '@/services/api/authApi'

function ForgotPasswordPage() {
  const [serverMessage, setServerMessage] = useState('')
  const [messageTone, setMessageTone] = useState('info')
  const { showToast } = useToast()
  const navigate = useNavigate()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      email: '',
    },
  })

  const onSubmit = async (values) => {
    setServerMessage('')

    try {
      const response = await forgotPassword(values)
      setMessageTone('success')
      setServerMessage(response?.message ?? 'Reset code sent to your email.')
      showToast({
        title: 'Request received',
        message: 'Check your inbox for reset instructions.',
        type: 'success',
      })
      navigate(`/reset-password?email=${encodeURIComponent(values.email)}`)
    } catch (error) {
      const detail = error?.response?.data?.detail
      setMessageTone('error')
      setServerMessage(
        typeof detail === 'string' ? detail : 'Unable to send reset link right now. Please try again later.',
      )
      showToast({
        title: 'Request failed',
        message: typeof detail === 'string' ? detail : 'Reset instructions could not be sent. Try again soon.',
        type: 'error',
      })
    }
  }

  return (
    <AuthFormShell title="Forgot Password" description="We will send a reset link to your email.">
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

        <InlineAlert message={serverMessage} tone={messageTone} />

        <Button type="submit" loading={isSubmitting} className="w-full">
          {isSubmitting ? 'Sending...' : 'Send reset link'}
        </Button>
      </form>
    </AuthFormShell>
  )
}

export default ForgotPasswordPage
