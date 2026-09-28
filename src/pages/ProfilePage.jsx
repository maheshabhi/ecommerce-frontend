import { useCallback, useEffect, useMemo, useState } from 'react'

import Button from '@/components/ui/Button'
import InlineAlert from '@/components/ui/InlineAlert'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import {
  addAddress,
  deleteAddress,
  getAddresses,
  getProfile,
  setAddressAsDefault,
  updateAddress,
  updateProfile,
} from '@/services/api/profileApi'
import { getErrorMessage } from '@/utils/apiError'

const EMPTY_ADDRESS_FORM = {
  full_name: '',
  phone: '',
  address_line1: '',
  address_line2: '',
  city: '',
  state: '',
  country: '',
  postal_code: '',
}

const ADDRESS_FIELDS = [
  { name: 'full_name', label: 'Full Name', required: true },
  { name: 'phone', label: 'Phone', required: true },
  { name: 'address_line1', label: 'Address Line 1', required: true },
  { name: 'address_line2', label: 'Address Line 2', required: false },
  { name: 'city', label: 'City', required: true },
  { name: 'state', label: 'State', required: true },
  { name: 'country', label: 'Country', required: true },
  { name: 'postal_code', label: 'Postal Code', required: true },
]

function getDisplayName(profile) {
  if (!profile) {
    return ''
  }

  if (profile.name) {
    return profile.name
  }

  const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(' ').trim()
  return fullName
}

function normalizeAddresses(response) {
  if (Array.isArray(response)) {
    return response
  }

  if (Array.isArray(response?.items)) {
    return response.items
  }

  if (response && typeof response === 'object') {
    return [response]
  }

  return []
}

function getAddressLabel(address) {
  return [address.city, address.state, address.country].filter(Boolean).join(', ')
}

function ProfilePage() {
  const { user, setUserProfile } = useAuth()
  const { showToast } = useToast()

  const [isLoading, setIsLoading] = useState(true)
  const [pageError, setPageError] = useState('')

  const [profile, setProfile] = useState(null)
  const [profileName, setProfileName] = useState('')
  const [profileError, setProfileError] = useState('')
  const [isSavingProfile, setIsSavingProfile] = useState(false)

  const [addresses, setAddresses] = useState([])
  const [addressError, setAddressError] = useState('')
  const [addressFormError, setAddressFormError] = useState('')
  const [addressForm, setAddressForm] = useState(EMPTY_ADDRESS_FORM)
  const [editingAddressId, setEditingAddressId] = useState(null)
  const [isAddressSaving, setIsAddressSaving] = useState(false)
  const [defaultingAddressId, setDefaultingAddressId] = useState(null)
  const [deletingAddressId, setDeletingAddressId] = useState(null)

  const orderedAddresses = useMemo(() => {
    return [...addresses].sort((a, b) => Number(Boolean(b.is_default)) - Number(Boolean(a.is_default)))
  }, [addresses])

  const refreshAddresses = useCallback(async () => {
    const response = await getAddresses()
    setAddresses(normalizeAddresses(response))
  }, [])

  const loadProfileAndAddresses = useCallback(async () => {
    setIsLoading(true)
    setPageError('')
    setProfileError('')
    setAddressError('')

    try {
      const [profileResponse, addressesResponse] = await Promise.all([getProfile(), getAddresses()])
      const nextName = getDisplayName(profileResponse)

      setProfile(profileResponse)
      setProfileName(nextName)
      setAddresses(normalizeAddresses(addressesResponse))
      setUserProfile(profileResponse)
    } catch (error) {
      setPageError(getErrorMessage(error, 'Unable to load your profile details right now.'))
    } finally {
      setIsLoading(false)
    }
  }, [setUserProfile])

  useEffect(() => {
    void loadProfileAndAddresses()
  }, [loadProfileAndAddresses])

  const handleProfileSave = async (event) => {
    event.preventDefault()

    const nextName = profileName.trim()

    if (!nextName) {
      setProfileError('Name is required.')
      return
    }

    setProfileError('')
    setIsSavingProfile(true)

    try {
      const updatedProfile = await updateProfile({ name: nextName })
      const normalizedProfile = updatedProfile ?? { ...profile, name: nextName }

      setProfile(normalizedProfile)
      setProfileName(getDisplayName(normalizedProfile) || nextName)
      setUserProfile(normalizedProfile)
      showToast({
        title: 'Profile Updated',
        message: 'Your name was updated successfully.',
        type: 'success',
      })
    } catch (error) {
      const message = getErrorMessage(error, 'Unable to update your profile.')
      setProfileError(message)
      showToast({
        title: 'Update Failed',
        message,
        type: 'error',
      })
    } finally {
      setIsSavingProfile(false)
    }
  }

  const resetAddressForm = () => {
    setAddressForm(EMPTY_ADDRESS_FORM)
    setEditingAddressId(null)
    setAddressFormError('')
  }

  const handleAddressInputChange = (event) => {
    const { name, value } = event.target
    setAddressForm((current) => ({
      ...current,
      [name]: value,
    }))
  }

  const handleAddressSubmit = async (event) => {
    event.preventDefault()

    const requiredField = ADDRESS_FIELDS.find(({ name, required }) => required && !addressForm[name].trim())

    if (requiredField) {
      setAddressFormError(`${requiredField.label} is required.`)
      return
    }

    setAddressFormError('')
    setAddressError('')
    setIsAddressSaving(true)

    try {
      if (editingAddressId) {
        await updateAddress(editingAddressId, addressForm)
        showToast({
          title: 'Address Updated',
          message: 'Address details were updated successfully.',
          type: 'success',
        })
      } else {
        await addAddress(addressForm)
        showToast({
          title: 'Address Added',
          message: 'A new address has been added to your profile.',
          type: 'success',
        })
      }

      await refreshAddresses()
      resetAddressForm()
    } catch (error) {
      const message = getErrorMessage(error, 'Unable to save this address.')
      setAddressError(message)
      showToast({
        title: 'Address Save Failed',
        message,
        type: 'error',
      })
    } finally {
      setIsAddressSaving(false)
    }
  }

  const handleEditAddress = (address) => {
    setAddressForm({
      full_name: address.full_name ?? '',
      phone: address.phone ?? '',
      address_line1: address.address_line1 ?? '',
      address_line2: address.address_line2 ?? '',
      city: address.city ?? '',
      state: address.state ?? '',
      country: address.country ?? '',
      postal_code: address.postal_code ?? '',
    })
    setEditingAddressId(address.id)
    setAddressFormError('')
  }

  const handleSetDefaultAddress = async (addressId) => {
    setAddressError('')
    setDefaultingAddressId(addressId)

    try {
      await setAddressAsDefault(addressId)
      await refreshAddresses()
      showToast({
        title: 'Default Address Updated',
        message: 'Your default address was changed successfully.',
        type: 'success',
      })
    } catch (error) {
      const message = getErrorMessage(error, 'Unable to set this address as default.')
      setAddressError(message)
      showToast({
        title: 'Action Failed',
        message,
        type: 'error',
      })
    } finally {
      setDefaultingAddressId(null)
    }
  }

  const handleDeleteAddress = async (addressId) => {
    const shouldDelete = window.confirm('Delete this address from your profile?')

    if (!shouldDelete) {
      return
    }

    setAddressError('')
    setDeletingAddressId(addressId)

    try {
      await deleteAddress(addressId)
      await refreshAddresses()

      if (editingAddressId === addressId) {
        resetAddressForm()
      }

      showToast({
        title: 'Address Deleted',
        message: 'The address was removed successfully.',
        type: 'success',
      })
    } catch (error) {
      const message = getErrorMessage(error, 'Unable to delete this address.')
      setAddressError(message)
      showToast({
        title: 'Delete Failed',
        message,
        type: 'error',
      })
    } finally {
      setDeletingAddressId(null)
    }
  }

  if (isLoading) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white/90 p-8 shadow-soft">
        <p className="text-sm text-slate-500">Loading your profile...</p>
      </section>
    )
  }

  if (pageError) {
    return (
      <section className="rounded-2xl border border-rose-200 bg-rose-50 p-8 shadow-soft">
        <h1 className="font-heading text-2xl font-semibold text-rose-900">Unable to Load Profile</h1>
        <InlineAlert message={pageError} tone="error" />
        <Button className="mt-4" variant="danger" onClick={loadProfileAndAddresses}>
          Retry
        </Button>
      </section>
    )
  }

  return (
    <section className="space-y-6" aria-labelledby="profile-page-heading">
      <header className="rounded-2xl border border-slate-200 bg-white/95 p-6 shadow-soft">
        <p className="text-sm uppercase tracking-[0.22em] text-brand-700">Account</p>
        <h1 id="profile-page-heading" className="mt-2 font-heading text-3xl font-semibold text-slate-900">
          Profile & Addresses
        </h1>
        <p className="mt-2 text-slate-600">
          Manage your personal details and delivery addresses from one place.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr,1.35fr]">
        <section className="rounded-2xl border border-slate-200 bg-white/95 p-6 shadow-soft">
          <h2 className="font-heading text-xl font-semibold text-slate-900">Profile Details</h2>
          <p className="mt-2 text-sm text-slate-600">Update your display name used across the storefront.</p>

          <form className="mt-5 space-y-4" onSubmit={handleProfileSave} noValidate>
            <label className="block text-sm">
              <span className="mb-1 block text-slate-700">Email</span>
              <input
                type="email"
                value={profile?.email ?? user?.email ?? ''}
                readOnly
                className="w-full cursor-not-allowed rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-slate-600"
              />
            </label>

            <label className="block text-sm">
              <span className="mb-1 block text-slate-700">Name</span>
              <input
                type="text"
                value={profileName}
                onChange={(event) => setProfileName(event.target.value)}
                placeholder="Enter your full name"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              />
            </label>

            <InlineAlert message={profileError} tone="error" />

            <Button type="submit" loading={isSavingProfile}>
              {isSavingProfile ? 'Saving...' : 'Save Name'}
            </Button>
          </form>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white/95 p-6 shadow-soft">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-heading text-xl font-semibold text-slate-900">Address Book</h2>
            <p className="text-sm text-slate-500">{orderedAddresses.length} saved</p>
          </div>

          <InlineAlert message={addressError} tone="error" />

          <div className="mt-4 space-y-3">
            {orderedAddresses.length === 0 ? (
              <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
                No addresses found. Add your first address below.
              </p>
            ) : (
              orderedAddresses.map((address) => (
                <article
                  key={address.id}
                  className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 transition hover:border-brand-200"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-slate-900">{address.full_name}</h3>
                      <p className="text-sm text-slate-600">{address.phone}</p>
                    </div>
                    {address.is_default ? (
                      <span className="rounded-full border border-brand-200 bg-brand-50 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-brand-700">
                        Default
                      </span>
                    ) : null}
                  </div>

                  <p className="mt-3 text-sm text-slate-700">
                    {address.address_line1}
                    {address.address_line2 ? `, ${address.address_line2}` : ''}
                  </p>
                  <p className="text-sm text-slate-700">{getAddressLabel(address)}</p>
                  <p className="text-sm text-slate-700">{address.postal_code}</p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => handleEditAddress(address)}
                    >
                      Edit
                    </Button>
                    {!address.is_default ? (
                      <Button
                        type="button"
                        variant="secondary"
                        loading={defaultingAddressId === address.id}
                        onClick={() => handleSetDefaultAddress(address.id)}
                      >
                        Set Default
                      </Button>
                    ) : null}
                    <Button
                      type="button"
                      variant="danger"
                      loading={deletingAddressId === address.id}
                      onClick={() => handleDeleteAddress(address.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </article>
              ))
            )}
          </div>

          <section className="mt-6 rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="font-semibold text-slate-900">
              {editingAddressId ? 'Update Address' : 'Add New Address'}
            </h3>
            <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={handleAddressSubmit} noValidate>
              {ADDRESS_FIELDS.map((field) => (
                <label key={field.name} className={`block text-sm ${field.name === 'address_line1' || field.name === 'address_line2' ? 'sm:col-span-2' : ''}`}>
                  <span className="mb-1 block text-slate-700">
                    {field.label}
                    {field.required ? ' *' : ''}
                  </span>
                  <input
                    name={field.name}
                    type="text"
                    value={addressForm[field.name]}
                    onChange={handleAddressInputChange}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                  />
                </label>
              ))}

              <div className="sm:col-span-2">
                <InlineAlert message={addressFormError} tone="error" />
              </div>

              <div className="sm:col-span-2 flex flex-wrap gap-2">
                <Button type="submit" loading={isAddressSaving}>
                  {isAddressSaving ? 'Saving...' : editingAddressId ? 'Update Address' : 'Add Address'}
                </Button>
                {editingAddressId ? (
                  <Button type="button" variant="secondary" onClick={resetAddressForm}>
                    Cancel Edit
                  </Button>
                ) : null}
              </div>
            </form>
          </section>
        </section>
      </div>
    </section>
  )
}

export default ProfilePage
