import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { ModalProvider } from './contexts/ModalContext'
import { ToastProvider } from './contexts/ToastContext'
import { ThemeProvider } from './contexts/ThemeContext'
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute'
import PublicRoute from './components/PublicRoute/PublicRoute'
import DesktopFallback from './components/DesktopFallback/DesktopFallback'
import Login from './pages/Login/index'
import Register from './pages/Register/index'
import SetPassword from './pages/SetPassword/index'
import Dashboard from './pages/Dashboard/index'
import Staff from './pages/Staff/index'
import StaffProfile from './pages/StaffProfile/index'
import Add from './pages/Add/index'
import Settings from './pages/Settings/index'
import Profile from './pages/Profile/index'
import About from './pages/About/index'
import { isAuthenticated } from './utils/auth.utils'
import styles from './App.module.scss'

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <ModalProvider>
          <DesktopFallback>
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
                    isAuthenticated() ? (
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
                    isAuthenticated() ? (
                      <Navigate to="/dashboard" replace />
                    ) : (
                      <Navigate to="/login" replace />
                    )
                  }
                />
              </Routes>
        </div>
      </Router>
          </DesktopFallback>
    </ModalProvider>
    </ToastProvider>
    </ThemeProvider>
  )
}

export default App

