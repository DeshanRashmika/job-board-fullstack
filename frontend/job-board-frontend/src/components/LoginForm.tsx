import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import './Auth.css'

type Status = 'idle' | 'loading' | 'error'

export default function LoginForm() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [status, setStatus]     = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  // Redirect back to the page they tried to access, or home
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')

    try {
      const res = await fetch('http://localhost:8000/api/auth/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.detail || 'Invalid username or password.')
      }

      // Store tokens, username, and role
      localStorage.setItem('access_token',  data.access)
      localStorage.setItem('refresh_token', data.refresh)
      localStorage.setItem('username',      data.username ?? username)
      localStorage.setItem('role',          data.role ?? '')

      navigate(from, { replace: true })
    } catch (err: unknown) {
      setStatus('error')
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong.')
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      <div>
        <h1 className="auth-form__heading">Welcome back</h1>
        <p className="auth-form__sub">Sign in to your Catalyst account</p>
      </div>

      {status === 'error' && (
        <p className="auth-form__error" role="alert">
          <svg width="15" height="15" fill="none" viewBox="0 0 24 24"
            stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          {errorMsg}
        </p>
      )}

      {/* Username */}
      <div className="auth-field">
        <label className="auth-label" htmlFor="login-username">Username</label>
        <div className="auth-input-wrap">
          <span className="auth-input-icon" aria-hidden="true">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24"
              stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </span>
          <input
            id="login-username"
            className="auth-input"
            type="text"
            placeholder="username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            autoComplete="username"
            required
          />
        </div>
      </div>

      {/* Password */}
      <div className="auth-field">
        <label className="auth-label" htmlFor="login-password">Password</label>
        <div className="auth-input-wrap">
          <span className="auth-input-icon" aria-hidden="true">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24"
              stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </span>
          <input
            id="login-password"
            className="auth-input"
            type={showPw ? 'text' : 'password'}
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
          <button
            type="button"
            className="auth-pw-toggle"
            onClick={() => setShowPw(v => !v)}
            aria-label={showPw ? 'Hide password' : 'Show password'}
          >
            {showPw ? (
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24"
                stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            ) : (
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24"
                stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        </div>
      </div>

      <button
        type="submit"
        className="btn btn--primary auth-form__submit"
        disabled={status === 'loading'}
      >
        {status === 'loading' ? (
          <><span className="auth-spinner" aria-hidden="true" /> Signing in…</>
        ) : 'Sign In'}
      </button>

      <p className="auth-form__switch">
        Don't have an account?{' '}
        <Link to="/register">Create one free</Link>
      </p>
    </form>
  )
}
