import { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import logo from '../assets/catalyst-logo.jpg.svg'
import './Navbar.css'

function IconBriefcase() {
  return (
    <svg width="14" height="14" fill="none" viewBox="0 0 24 24"
      stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745
           M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01
           M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  )
}

function IconHome() {
  return (
    <svg width="15" height="15" fill="none" viewBox="0 0 24 24"
      stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3
           m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3
           m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  )
}

function IconLogout() {
  return (
    <svg width="15" height="15" fill="none" viewBox="0 0 24 24"
      stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M17 16l4-4m0 0l-4-4m4 4H7
           m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  )
}

function IconChevron({ rotated }: { rotated: boolean }) {
  return (
    <svg
      className={`navbar__profile-caret${rotated ? ' rotated' : ''}`}
      width="14" height="14" fill="none" viewBox="0 0 24 24"
      stroke="currentColor" strokeWidth="2.5" aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  )
}

function readAuth() {
  return {
    token:    localStorage.getItem('access_token'),
    username: localStorage.getItem('username') ?? '',
    role:     localStorage.getItem('role') ?? '',
  }
}

function clearAuth() {
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
  localStorage.removeItem('username')
  localStorage.removeItem('role')
}

export default function Navbar() {
  const [menuOpen, setMenuOpen]       = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [, setAuthTick]               = useState(0) 

  const profileRef = useRef<HTMLDivElement>(null)
  const navigate   = useNavigate()
  const { token, username, role } = readAuth()
  const isLoggedIn = !!token
  const isEmployer = role === 'EMPLOYER'

  const refreshAuth = useCallback(() => {
    setAuthTick(tick => tick + 1)
  }, [])

  useEffect(() => {
    window.addEventListener('storage', refreshAuth)
    return () => window.removeEventListener('storage', refreshAuth)
  }, [refreshAuth])

  useEffect(() => {
    if (!profileOpen) return

    function handleOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [profileOpen])

  useEffect(() => {
    function handleResize() {
      if (window.innerWidth > 720) setMenuOpen(false)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  async function handleLogout() {
    const refreshToken = localStorage.getItem('refresh_token')

    clearAuth()
    setProfileOpen(false)
    setMenuOpen(false)
    refreshAuth()

    if (refreshToken) {
      try {
        await fetch('http://localhost:8000/api/auth/logout/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh: refreshToken }),
        })
      } catch {
        // Network error — token will expire naturally; local logout already done
      }
    }

    navigate('/')
  }

  return (
    <nav className="navbar">
      <div className="container navbar__inner">

        {/* ── Logo ── */}
        <Link to="/" className="navbar__logo" aria-label="Catalyst Software home">
          <img src={logo} alt="Catalyst Software" height={60} />
        </Link>

        {/* ── Desktop nav links ── */}
        <ul className="navbar__links" role="list">
          <li><a href="#jobs">Open Roles</a></li>
          <li><a href="#about">About Us</a></li>
          {isLoggedIn && isEmployer && (
            <li>
              <Link to="/employer" className="navbar__employer-link">
                <IconBriefcase />
                Dashboard
              </Link>
            </li>
          )}
        </ul>

        {/* ── Desktop auth area ── */}
        <div className="navbar__auth">
          {isLoggedIn ? (
            <div className="navbar__profile" ref={profileRef}>

              {/* Profile trigger button */}
              <button
                className="navbar__profile-btn"
                aria-label="Account menu"
                aria-expanded={profileOpen ? 'true' : 'false'}
                aria-haspopup="true"
                onClick={() => setProfileOpen(open => !open)}
              >
                <span className="navbar__avatar" aria-hidden="true">
                  {username.charAt(0).toUpperCase()}
                </span>
                <span className="navbar__profile-name">{username}</span>
                <IconChevron rotated={profileOpen} />
              </button>

              {/* Dropdown menu */}
              {profileOpen && (
                <div className="navbar__dropdown" role="menu">

                  {/* User info header */}
                  <div className="navbar__dropdown-user">
                    <span className="navbar__dropdown-avatar" aria-hidden="true">
                      {username.charAt(0).toUpperCase()}
                    </span>
                    <div>
                      <div>{username}</div>
                      <div className="navbar__dropdown-role">
                        {isEmployer ? 'Employer' : 'Job Seeker'}
                      </div>
                    </div>
                  </div>

                  {/* Employer-only: dashboard link */}
                  {isEmployer && (
                    <>
                      <hr className="navbar__dropdown-divider" />
                      <Link
                        to="/employer"
                        className="navbar__dropdown-item"
                        role="menuitem"
                        onClick={() => setProfileOpen(false)}
                      >
                        <IconHome />
                        Employer Dashboard
                      </Link>
                    </>
                  )}

                  {/* Log out */}
                  <hr className="navbar__dropdown-divider" />
                  <button
                    className="navbar__dropdown-item navbar__dropdown-item--danger"
                    role="menuitem"
                    onClick={() => void handleLogout()}
                  >
                    <IconLogout />
                    Log out
                  </button>

                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/login"    className="navbar__signin">Sign In</Link>
              <Link to="/register" className="btn btn--primary navbar__cta">Get Started</Link>
            </>
          )}
        </div>

        {/* ── Mobile hamburger ── */}
        <button
          className={`navbar__hamburger${menuOpen ? ' open' : ''}`}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen ? 'true' : 'false'}
          onClick={() => setMenuOpen(open => !open)}
        >
          <span aria-hidden="true" />
          <span aria-hidden="true" />
          <span aria-hidden="true" />
        </button>

      </div>

      {/* ── Mobile drawer ── */}
      {menuOpen && (
        <div className="navbar__drawer" role="navigation" aria-label="Mobile menu">
          <a href="#jobs"  onClick={() => setMenuOpen(false)}>Open Roles</a>
          <a href="#about" onClick={() => setMenuOpen(false)}>About Us</a>
          {isLoggedIn && isEmployer && (
            <Link to="/employer" onClick={() => setMenuOpen(false)}>
              Dashboard
            </Link>
          )}

          <div className="navbar__drawer-auth">
            {isLoggedIn ? (
              <button
                className="btn btn--outline"
                onClick={() => void handleLogout()}
              >
                <IconLogout />
                Log out ({username})
              </button>
            ) : (
              <>
                <Link
                  to="/login"
                  className="btn btn--outline"
                  onClick={() => setMenuOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="btn btn--primary"
                  onClick={() => setMenuOpen(false)}
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}