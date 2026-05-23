'use client'

import { FormEvent, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { setPasswordAction } from '@/app/actions/auth'
import { useToast } from '@/app/providers/ToastContext'
import { validateRequired } from '@/lib/utils/validation'

export default function SetPasswordForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const toast = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  })

  if (!token) {
    return (
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-8">
        <h1 className="text-2xl font-bold text-center text-red-600">
          Invalid Link
        </h1>
        <p className="text-center text-gray-600 dark:text-gray-400 mt-2">
          This password reset link is invalid or has expired.
        </p>
      </div>
    )
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    newErrors.password = validateRequired(formData.password, 'Password')

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    }

    setErrors(newErrors)
    return Object.values(newErrors).every(err => !err)
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!validateForm()) {
      toast.showError('Please fix the errors above')
      return
    }

    setIsLoading(true)

    try {
      const result = await setPasswordAction(token, formData.password)

      if (result?.error) {
        toast.showError(result.error)
      }
    } catch (error) {
      toast.showError('An error occurred. Please try again.')
      console.error('Set password error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-8">
      <h1 className="text-3xl font-bold text-center mb-2 text-gray-900 dark:text-white">
        Set Password
      </h1>
      <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
        Create a new password for your account
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
              errors.password ? 'border-red-500' : 'border-gray-300'
            }`}
            required
          />
          {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
              errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
            }`}
            required
          />
          {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Setting Password...' : 'Set Password'}
        </button>
      </form>
    </div>
  )
}
