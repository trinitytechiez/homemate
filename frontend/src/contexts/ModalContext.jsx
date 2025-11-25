import { createContext, useContext, useState, useCallback } from 'react'
import Modal from '../components/Modal/Modal'

const ModalContext = createContext()

export const useModal = () => {
  const context = useContext(ModalContext)
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider')
  }
  return context
}

export const ModalProvider = ({ children }) => {
  const [modalState, setModalState] = useState({
    isOpen: false,
    content: null,
    title: '',
    onClose: null,
    size: 'medium'
  })

  const openModal = useCallback(({ content, title = '', onClose = null, size = 'medium' }) => {
    setModalState({
      isOpen: true,
      content,
      title,
      onClose,
      size
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
      onClose: null,
      size: 'medium'
    })
  }, [modalState.onClose])

  return (
    <ModalContext.Provider value={{ openModal, closeModal, isModalOpen: modalState.isOpen }}>
      {children}
      <Modal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        title={modalState.title}
        size={modalState.size}
      >
        {modalState.content}
      </Modal>
    </ModalContext.Provider>
  )
}

