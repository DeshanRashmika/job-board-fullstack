import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import '../styles/Auth.css'

type Status = 'idle' | 'loading' | 'error' | 'success'

interface FormData {
  first_name: string
  last_name: string
  username: string
  email: string
  password: string
  confirm_password: string
  role: 'JOB_SEEKER' | 'EMPLOYER'
}

const INITIAL: FormData = {
  first_name: '',
  last_name: '',
  username: '',
  email: '',
  password: '',
  confirm_password: '',
  role: 'JOB_SEEKER',
}

export default function RegisterForm() {
  const navigate = useNavigate()
  const [form, setForm]         = useState<FormData>(INITIAL)
  const [showPw, setShowPw]     = useState(false)
  const [status, setStatus]     = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  function set(field: keyof FormData) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [field]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrorMsg('')

    if (form.password !== form.confirm_password) {
      setStatus('error')
      setErrorMsg('Passwords do not match.')
      return
    }
    if (form.password.length < 6) {
      setStatus('error')
      setErrorMsg('Password must be at least 6 characters.')
      return
    }

    setStatus('loading')

    try {
      const res = await fetch('http://localhost:8000/api/auth/register/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: form.first_name,
          last_name:  form.last_name,
          username:   form.username,
          email:      form.email,
          password:   form.password,
          role:       form.role,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        const msg =
          data?.detail ||
          Object.entries(data)
            .map(([k, v]) => `${k}: ${(v as string[]).join(' ')}`)
            .join('  •  ')
        throw new Error(msg || 'Registration failed.')
      }

      setStatus('success')
      setTimeout(() => navigate('/login'), 1800)
    } catch (err: unknown) {
      setStatus('error')
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong.')
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      <div>
        <h1 className="auth-form__heading">Create your account</h1>
        <p className="auth-form__sub">Join Catalyst and start your journey</p>
      </div>

      {/* Error banner */}
      {status === 'error' && (
        <p className="auth-form__error" role="alert">
          <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          {errorMsg}
        </p>
      )}

      {/* Success banner */}
      {status === 'success' && (
        <p className="auth-form__success" role="status">
          <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Account created! Redirecting to sign in…
        </p>
      )}

      {/* First + Last name */}
      <div className="auth-form__row">
        <div className="auth-field">
          <label className="auth-label" htmlFor="reg-first">First Name</label>
          <div className="auth-input-wrap">
            <span className="auth-input-icon" aria-hidden="true">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </span>
            <input id="reg-first" className="auth-input" type="text" 
              value={form.first_name} onChange={set('first_name')} required />
          </div>
        </div>
        <div className="auth-field">
          <label className="auth-label" htmlFor="reg-last">Last Name</label>
          <div className="auth-input-wrap">
            <span className="auth-input-icon" aria-hidden="true">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </span>
            <input id="reg-last" className="auth-input" type="text" 
              value={form.last_name} onChange={set('last_name')} required />
          </div>
        </div>
      </div>

      {/* Username */}
      <div className="auth-field">
        <label className="auth-label" htmlFor="reg-username">Username</label>
        <div className="auth-input-wrap">
          <span className="auth-input-icon" aria-hidden="true">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </span>
          <input id="reg-username" className="auth-input" type="text" 
            value={form.username} onChange={set('username')} autoComplete="username" required />
        </div>
      </div>

      {/* Email */}
      <div className="auth-field">
        <label className="auth-label" htmlFor="reg-email">Email Address</label>
        <div className="auth-input-wrap">
          <span className="auth-input-icon" aria-hidden="true">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </span>
          <input id="reg-email" className="auth-input" type="email" 
            value={form.email} onChange={set('email')} autoComplete="email" required />
        </div>
      </div>

      {/* Role */}
      <div className="auth-field">
        <label className="auth-label" htmlFor="reg-role">I am a…</label>
        <div className="auth-input-wrap">
          <span className="auth-input-icon" aria-hidden="true">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </span>
          <select id="reg-role" className="auth-select" value={form.role} onChange={set('role')}>
            <option value="JOB_SEEKER">Job Seeker</option>
            <option value="EMPLOYER">Employer</option>
          </select>
        </div>
      </div>

      {/* Password */}
      <div className="auth-field">
        <label className="auth-label" htmlFor="reg-password">Password</label>
        <div className="auth-input-wrap">
          <span className="auth-input-icon" aria-hidden="true">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </span>
          <input id="reg-password" className="auth-input" type={showPw ? 'text' : 'password'}
            placeholder="Min. 6 characters" value={form.password} onChange={set('password')}
            autoComplete="new-password" required />
          <button type="button" className="auth-pw-toggle"
            onClick={() => setShowPw(v => !v)}
            aria-label={showPw ? 'Hide password' : 'Show password'}>
            {showPw ? (
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            ) : (
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Confirm password */}
      <div className="auth-field">
        <label className="auth-label" htmlFor="reg-confirm">Confirm Password</label>
        <div className="auth-input-wrap">
          <span className="auth-input-icon" aria-hidden="true">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </span>
          <input id="reg-confirm" className="auth-input"
            type={showPw ? 'text' : 'password'}
            placeholder="Re-enter password"
            value={form.confirm_password} onChange={set('confirm_password')}
            autoComplete="new-password" required />
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        className="btn btn--primary auth-form__submit"
        disabled={status === 'loading' || status === 'success'}
      >
        {status === 'loading' ? (
          <><span className="auth-spinner" aria-hidden="true" /> Creating account…</>
        ) : (
          'Create Account'
        )}
      </button>

      {/* Switch to login */}
      <p className="auth-form__switch">
        Already have an account?{' '}
        <Link to="/login">Sign in</Link>
      </p>
    </form>
  )
}
