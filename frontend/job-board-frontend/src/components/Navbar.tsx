import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import logo from '../assets/catalyst-logo.jpg'
import './Navbar.css'

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [username, setUsername]     = useState('')
  const [profileOpen, setProfileOpen] = useState(false)
  const navigate  = useNavigate()
  const location  = useLocation()

  // Re-check auth state whenever the route changes (e.g. after login redirect)
  const syncAuth = useCallback(() => {
    const token = localStorage.getItem('access_token')
    const user  = localStorage.getItem('username')
    setIsLoggedIn(!!token)
    setUsername(user ?? '')
  }, [])

  useEffect(() => {
    syncAuth()
  }, [location, syncAuth])

  // Close profile dropdown when clicking outside
  useEffect(() => {
    if (!profileOpen) return
    function handleOutside(e: MouseEvent) {
      const target = e.target as HTMLElement
      if (!target.closest('.navbar__profile')) setProfileOpen(false)
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [profileOpen])

  async function handleLogout() {
    const refreshToken = localStorage.getItem('refresh_token')
    const accessToken  = localStorage.getItem('access_token')

    try {
      if (refreshToken && accessToken) {
        await fetch('http://localhost:8000/api/auth/logout/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ refresh: refreshToken }),
        })
      }
    } catch {
      // Ignore network errors — we still clear local state
    } finally {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('username')
      setIsLoggedIn(false)
      setUsername('')
      setProfileOpen(false)
      setMenuOpen(false)
      navigate('/')
    }
  }

  return (
    <nav className="navbar">
      <div className="container navbar__inner">
        {/* Logo */}
        <Link to="/" className="navbar__logo" aria-label="Catalyst Software home">
          <img src={logo} alt="Catalyst Software" height={60} />
        </Link>

        {/* Desktop links */}
        <ul className="navbar__links" role="list">
          <li><a href="#jobs">Open Roles</a></li>
          <li><a href="#about">About Us</a></li>
          <li><a href="#culture">Culture</a></li>
        </ul>

        {/* Desktop auth CTAs */}
        <div className="navbar__auth">
          {isLoggedIn ? (
            /* ── Logged-in: profile icon + dropdown ── */
            <div className="navbar__profile">
              <button
                className="navbar__profile-btn"
                aria-label="Account menu"
                aria-expanded={profileOpen}
                onClick={() => setProfileOpen(o => !o)}
              >
                {/* Avatar circle */}
                <span className="navbar__avatar" aria-hidden="true">
                  {username.charAt(0).toUpperCase()}
                </span>
                <span className="navbar__profile-name">{username}</span>
                <svg
                  className={`navbar__profile-caret${profileOpen ? ' rotated' : ''}`}
                  width="14" height="14" fill="none" viewBox="0 0 24 24"
                  stroke="currentColor" strokeWidth="2.5" aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {profileOpen && (
                <div className="navbar__dropdown" role="menu">
                  <div className="navbar__dropdown-user">
                    <span className="navbar__dropdown-avatar" aria-hidden="true">
                      {username.charAt(0).toUpperCase()}
                    </span>
                    <span>{username}</span>
                  </div>
                  <hr className="navbar__dropdown-divider" />
                  <button
                    className="navbar__dropdown-item navbar__dropdown-item--danger"
                    role="menuitem"
                    onClick={handleLogout}
                  >
                    <svg width="15" height="15" fill="none" viewBox="0 0 24 24"
                      stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Log out
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* ── Logged-out: Sign In + Get Started ── */
            <>
              <Link to="/login" className="navbar__signin">Sign In</Link>
              <Link to="/register" className="btn btn--primary navbar__cta">Get Started</Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className={`navbar__hamburger${menuOpen ? ' open' : ''}`}
          aria-label="Toggle menu"
          onClick={() => setMenuOpen(o => !o)}
        >
          <span /><span /><span />
        </button>
      </div>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="navbar__drawer">
          <a href="#jobs"    onClick={() => setMenuOpen(false)}>Open Roles</a>
          <a href="#about"   onClick={() => setMenuOpen(false)}>About Us</a>
          <a href="#culture" onClick={() => setMenuOpen(false)}>Culture</a>
          <div className="navbar__drawer-auth">
            {isLoggedIn ? (
              <button className="btn btn--outline" onClick={handleLogout}>
                <svg width="15" height="15" fill="none" viewBox="0 0 24 24"
                  stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Log out ({username})
              </button>
            ) : (
              <>
                <Link to="/login" className="btn btn--outline"
                  onClick={() => setMenuOpen(false)}>Sign In</Link>
                <Link to="/register" className="btn btn--primary"
                  onClick={() => setMenuOpen(false)}>Get Started</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
