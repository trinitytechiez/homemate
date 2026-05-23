'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { setClientToken } from '@/lib/auth/auth'
import { useToast } from '@/app/providers/ToastContext'

export default function LoginPage() {
  const router = useRouter()
  const toast = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        toast.showError(error.error || 'Login failed')
        return
      }

      const data = await response.json()
      setClientToken(data.token)
      toast.showSuccess('Login successful!')
      router.push('/dashboard')
    } catch (error) {
      toast.showError('An error occurred. Please try again.')
      console.error('Login error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-8">
      <h1 className="text-3xl font-bold text-center mb-6 text-gray-900 dark:text-white">
        HomeMate
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            required
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            required
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
        <p>Don&apos;t have an account? <a href="/register" className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">Register</a></p>
      </div>
    </div>
  )
}
