import { lazy, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { ModalProvider } from './contexts/ModalContext'
import { ToastProvider } from './contexts/ToastContext'
import { ThemeProvider } from './contexts/ThemeContext'
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute'
import PublicRoute from './components/PublicRoute/PublicRoute'
import DesktopFallback from './components/DesktopFallback/DesktopFallback'
import Shimmer from './components/Shimmer'
import { isAuthenticated } from './utils/auth.utils'
import styles from './App.module.scss'

// Lazy load pages for code splitting
const Login = lazy(() => import('./pages/Login/index'))
const Register = lazy(() => import('./pages/Register/index'))
const SetPassword = lazy(() => import('./pages/SetPassword/index'))
const Dashboard = lazy(() => import('./pages/Dashboard/index'))
const Staff = lazy(() => import('./pages/Staff/index'))
const StaffProfile = lazy(() => import('./pages/StaffProfile/index'))
const Add = lazy(() => import('./pages/Add/index'))
const Settings = lazy(() => import('./pages/Settings/index'))
const Profile = lazy(() => import('./pages/Profile/index'))
const About = lazy(() => import('./pages/About/index'))

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <ModalProvider>
          <DesktopFallback>
            <Router>
        <div className={styles.app}>
              <Suspense fallback={<Shimmer variant="dashboard" count={3} />}>
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
              </Suspense>
        </div>
      </Router>
          </DesktopFallback>
    </ModalProvider>
    </ToastProvider>
    </ThemeProvider>
  )
}

export default App

