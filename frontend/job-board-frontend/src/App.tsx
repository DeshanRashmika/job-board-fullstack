import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import JobListings from './components/JobListings'
import LoginForm from './components/LoginForm'
import RegisterForm from './components/RegisterForm'
import EmployerDashboard from './components/EmployerDashboard'
import ProtectedRoute from './components/ProtectedRoute'
import './App.css'

/* ── Page layouts ──────────────────────────────────────────────────── */
function HomePage() {
  return (
    <>
      <Hero />
      <main className="main-content">
        <JobListings />
      </main>
      <footer className="site-footer">
        <div className="container site-footer__inner">
          <span className="site-footer__brand">Catalyst Software</span>
          <span className="site-footer__copy">
            © {new Date().getFullYear()} All rights reserved.
          </span>
        </div>
      </footer>
    </>
  )
}

function AuthPage({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth-page">
      <div className="auth-page__card">{children}</div>
    </div>
  )
}

/* ── App ───────────────────────────────────────────────────────────── */
export default function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <Navbar />
        <Routes>
          {/* Public routes */}
          <Route path="/"         element={<HomePage />} />
          <Route path="/login"    element={<AuthPage><LoginForm /></AuthPage>} />
          <Route path="/register" element={<AuthPage><RegisterForm /></AuthPage>} />

          {/* Employer-only protected route */}
          <Route
            path="/employer"
            element={
              <ProtectedRoute requiredRole="EMPLOYER">
                <EmployerDashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </BrowserRouter>
  )
}
