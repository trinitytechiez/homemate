'use client'

import { useAuth } from '@/lib/auth/auth'

export default function DashboardPage() {
  const { logout } = useAuth()

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Dashboard
        </h1>
        <button
          onClick={logout}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Logout
        </button>
      </div>
      <p className="text-gray-600 dark:text-gray-400">
        Dashboard content coming soon...
      </p>
    </div>
  )
}
