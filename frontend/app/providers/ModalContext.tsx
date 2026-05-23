'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

interface ModalConfig {
  content: ReactNode
  title?: string
  onClose?: () => void
  size?: 'small' | 'medium' | 'large' | 'fullscreen'
}

interface ModalContextType {
  openModal: (config: ModalConfig) => void
  closeModal: () => void
  isModalOpen: boolean
}

const ModalContext = createContext<ModalContextType | undefined>(undefined)

export const useModal = () => {
  const context = useContext(ModalContext)
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider')
  }
  return context
}

export const ModalProvider = ({ children }: { children: ReactNode }) => {
  const [modalState, setModalState] = useState<ModalConfig & { isOpen: boolean }>({
    isOpen: false,
    content: null,
    title: '',
    onClose: undefined,
    size: 'medium',
  })

  const openModal = useCallback((config: ModalConfig) => {
    setModalState({
      isOpen: true,
      content: config.content,
      title: config.title || '',
      onClose: config.onClose,
      size: config.size || 'medium',
    })
  }, [])

  const closeModal = useCallback(() => {
    if (modalState.onClose) {
      modalState.onClose()
    }
    setModalState({
      isOpen: false,
      content: null,
      title: '',
      onClose: undefined,
      size: 'medium',
    })
  }, [modalState.onClose])

  return (
    <ModalContext.Provider value={{ openModal, closeModal, isModalOpen: modalState.isOpen }}>
      {children}
      {modalState.isOpen && (
        <Modal
          isOpen={modalState.isOpen}
          onClose={closeModal}
          title={modalState.title}
          size={modalState.size}
        >
          {modalState.content}
        </Modal>
      )}
    </ModalContext.Provider>
  )
}

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  size?: string
  children: ReactNode
}

function Modal({ isOpen, onClose, title, size = 'medium', children }: ModalProps) {
  if (!isOpen) return null

  const sizeClasses: Record<string, string> = {
    small: 'max-w-sm',
    medium: 'max-w-md',
    large: 'max-w-lg',
    fullscreen: 'max-w-full h-full',
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
      style={{ pointerEvents: 'auto' }}
    >
      <div
        className={`bg-white rounded-lg shadow-lg ${sizeClasses[size]}`}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="flex justify-between items-center p-6 border-b">
            <h2 className="text-xl font-semibold">{title}</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
            >
              ×
            </button>
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}
