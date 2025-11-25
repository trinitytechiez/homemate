import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { ModalProvider } from './contexts/ModalContext'
import { ToastProvider } from './contexts/ToastContext'
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute'
import PublicRoute from './components/PublicRoute/PublicRoute'
import Login from './pages/Login/Login'
import Register from './pages/Register/Register'
import SetPassword from './pages/SetPassword/SetPassword'
import Dashboard from './pages/Dashboard/Dashboard'
import Staff from './pages/Staff/Staff'
import StaffProfile from './pages/StaffProfile/StaffProfile'
import Add from './pages/Add/Add'
import Settings from './pages/Settings/Settings'
import Profile from './pages/Profile/Profile'
import About from './pages/About/About'
import styles from './App.module.scss'

function App() {
  return (
    <ToastProvider>
      <ModalProvider>
        <Router>
        <div className={styles.app}>
              <Routes>
                {/* Public routes - redirect to dashboard if authenticated */}
                <Route
                  path="/login"
                  element={
                    <PublicRoute>
                      <Login />
                    </PublicRoute>
                  }
                />
                <Route
                  path="/register"
                  element={
                    <PublicRoute>
                      <Register />
                    </PublicRoute>
                  }
                />
                <Route
                  path="/set-password"
                  element={
                    <PublicRoute>
                      <SetPassword />
                    </PublicRoute>
                  }
                />
                
                {/* Protected routes - redirect to login if not authenticated */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/staff"
                  element={
                    <ProtectedRoute>
                      <Staff />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/staff/:id"
                  element={
                    <ProtectedRoute>
                      <StaffProfile />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/add"
                  element={
                    <ProtectedRoute>
                      <Add />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute>
                      <Settings />
                    </ProtectedRoute>
                  }
                />
                      <Route
                        path="/profile"
                        element={
                          <ProtectedRoute>
                            <Profile />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/about"
                        element={
                          <ProtectedRoute>
                            <About />
                          </ProtectedRoute>
                        }
                      />
                      
                      {/* Default route - redirect based on auth status */}
                <Route
                  path="/"
                  element={
                    localStorage.getItem('token') ? (
                      <Navigate to="/dashboard" replace />
                    ) : (
                      <Navigate to="/login" replace />
                    )
                  }
                />
                
                {/* Catch-all route - redirect based on auth status */}
                <Route
                  path="*"
                  element={
                    localStorage.getItem('token') ? (
                      <Navigate to="/dashboard" replace />
                    ) : (
                      <Navigate to="/login" replace />
                    )
                  }
                />
              </Routes>
        </div>
      </Router>
    </ModalProvider>
    </ToastProvider>
  )
}

export default App

