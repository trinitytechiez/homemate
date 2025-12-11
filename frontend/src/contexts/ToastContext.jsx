import { createContext, useContext, useState, useCallback } from 'react'
import Toast from '../components/Toast/Toast'

const ToastContext = createContext()

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([])

  const showToast = useCallback((message, type = 'info', duration = 2000) => {
    const id = Date.now() + Math.random()
    const newToast = { id, message, type, duration }
    
    setToasts(prev => [...prev, newToast])
    
    return id
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const showSuccess = useCallback((message, duration = 2000) => {
    return showToast(message, 'success', duration)
  }, [showToast])

  const showError = useCallback((message, duration = 2000) => {
    return showToast(message, 'error', duration)
  }, [showToast])

  const showWarning = useCallback((message, duration = 2000) => {
    return showToast(message, 'warning', duration)
  }, [showToast])

  const showInfo = useCallback((message, duration = 2000) => {
    return showToast(message, 'info', duration)
  }, [showToast])

  return (
    <ToastContext.Provider value={{ showToast, showSuccess, showError, showWarning, showInfo, removeToast }}>
      {children}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 10000, pointerEvents: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {toasts.map((toast, index) => (
          <div
            key={toast.id}
            style={{
              pointerEvents: 'auto',
              marginTop: index > 0 ? '10px' : '0'
            }}
          >
            <Toast
              message={toast.message}
              type={toast.type}
              duration={toast.duration}
              onClose={() => removeToast(toast.id)}
            />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

