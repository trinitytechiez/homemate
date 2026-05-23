'use client'

import { ReactNode } from 'react'
import { ThemeProvider } from './ThemeProvider'
import { ToastProvider } from './ToastContext'
import { ModalProvider } from './ModalContext'

export function RootProvider({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <ToastProvider>
        <ModalProvider>
          {children}
        </ModalProvider>
      </ToastProvider>
    </ThemeProvider>
  )
}
