'use client'

import { useParams } from 'next/navigation'

export default function StaffDetailPage() {
  const params = useParams()
  const id = params.id

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
        Staff Detail - {id}
      </h1>
      <p className="text-gray-600 dark:text-gray-400">
        Staff detail page coming soon...
      </p>
    </div>
  )
}
