import { ReactNode } from 'react'

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col pb-24 md:pb-0">
      <main className="flex-1 px-4 py-6">
        {children}
      </main>
      {/* BottomNavigation will be added here once migrated */}
    </div>
  )
}
