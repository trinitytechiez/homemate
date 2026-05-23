'use client'

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react'

interface Toast {
  id: string | number
  message: string
  type: 'info' | 'success' | 'error' | 'warning'
  duration: number
}

interface ToastContextType {
  showToast: (message: string, type?: Toast['type'], duration?: number) => void
  showSuccess: (message: string, duration?: number) => void
  showError: (message: string, duration?: number) => void
  showWarning: (message: string, duration?: number) => void
  showInfo: (message: string, duration?: number) => void
  removeToast: (id: string | number) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((message: string, type: Toast['type'] = 'info', duration: number = 2000) => {
    const id = Date.now() + Math.random()
    const newToast = { id, message, type, duration }

    setToasts(prev => [...prev, newToast])

    return id
  }, [])

  const removeToast = useCallback((id: string | number) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const showSuccess = useCallback((message: string, duration: number = 2000) => {
    return showToast(message, 'success', duration)
  }, [showToast])

  const showError = useCallback((message: string, duration: number = 2000) => {
    return showToast(message, 'error', duration)
  }, [showToast])

  const showWarning = useCallback((message: string, duration: number = 2000) => {
    return showToast(message, 'warning', duration)
  }, [showToast])

  const showInfo = useCallback((message: string, duration: number = 2000) => {
    return showToast(message, 'info', duration)
  }, [showToast])

  return (
    <ToastContext.Provider value={{ showToast, showSuccess, showError, showWarning, showInfo, removeToast }}>
      {children}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 10000, pointerEvents: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', padding: '10px' }}>
        {toasts.map((toast) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const [isExiting, setIsExiting] = useState(false)

  const handleClose = () => {
    setIsExiting(true)
    setTimeout(onClose, 300)
  }

  // Auto-dismiss
  useEffect(() => {
    const timer = setTimeout(handleClose, toast.duration)
    return () => clearTimeout(timer)
  }, [toast.duration])

  const typeStyles: Record<Toast['type'], string> = {
    info: 'bg-blue-500',
    success: 'bg-green-500',
    error: 'bg-red-500',
    warning: 'bg-yellow-500',
  }

  return (
    <div
      style={{
        pointerEvents: 'auto',
        opacity: isExiting ? 0 : 1,
        transition: 'opacity 300ms ease-out',
      }}
      className={`${typeStyles[toast.type]} text-white px-4 py-3 rounded shadow-lg max-w-md`}
    >
      <div className="flex justify-between items-center">
        <span>{toast.message}</span>
        <button
          onClick={handleClose}
          className="ml-3 text-white hover:text-gray-200"
        >
          ×
        </button>
      </div>
    </div>
  )
}
