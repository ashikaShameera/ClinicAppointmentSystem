// ─── Navbar.jsx ─────────────────────────────────────────────
import { useState, useContext } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'

export default function Navbar() {
  const { user, logout } = useContext(AuthContext)
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()
  const navigate  = useNavigate()

  const isActive = (path) => location.pathname === path

  const dashboardPath = () => {
    if (!user) return '/login'
    if (user.role === 'admin')   return '/admin/dashboard'
    if (user.role === 'doctor')  return '/doctor/dashboard'
    return '/patient/dashboard'
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <nav style={{ background: '#fff', borderBottom: '0.5px solid #e8e6df', position: 'sticky', top: 0, zIndex: 100 }}>
      <style>{`
        .nav-link { text-decoration:none; font-size:14px; font-weight:500; padding:8px 14px; border-radius:6px; transition:background .15s,color .15s; color:#444; }
        .nav-link:hover { background:#f4f2eb; color:#1a1a2e; }
        .nav-link.active { color:#1a3a5c; background:#e8f0f8; }
        .nav-btn { background:#1a3a5c; color:#fff; border:none; padding:9px 20px; border-radius:6px; font-size:14px; font-weight:500; cursor:pointer; font-family:inherit; text-decoration:none; display:inline-block; transition:background .15s; }
        .nav-btn:hover { background:#0f2740; }
        .nav-btn-outline { background:transparent; color:#1a3a5c; border:1px solid #1a3a5c; padding:8px 20px; border-radius:6px; font-size:14px; font-weight:500; cursor:pointer; font-family:inherit; text-decoration:none; display:inline-block; transition:all .15s; margin-right:8px; }
        .nav-btn-outline:hover { background:#1a3a5c; color:#fff; }
        .avatar { width:34px; height:34px; border-radius:50%; background:#1a3a5c; color:#fff; display:flex; align-items:center; justify-content:center; font-size:13px; font-weight:600; cursor:pointer; flex-shrink:0; }
      `}</style>
      <div style={{ maxWidth: '1120px', margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', height: '64px', gap: '32px' }}>
        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', flexShrink: 0 }}>
          <div style={{ width: '32px', height: '32px', background: '#1a3a5c', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
            </svg>
          </div>
          <span style={{ fontFamily: "'Instrument Serif', serif", fontSize: '18px', color: '#1a1a2e', fontWeight: 400 }}>York Clinic</span>
        </Link>

        {/* Nav links */}
        <div style={{ display: 'flex', gap: '4px', flex: 1 }}>
          <Link to="/"        className={`nav-link ${isActive('/') ? 'active' : ''}`}>Home</Link>
          <Link to="/about"   className={`nav-link ${isActive('/about') ? 'active' : ''}`}>About</Link>
          <Link to="/contact" className={`nav-link ${isActive('/contact') ? 'active' : ''}`}>Contact</Link>
        </div>

        {/* Auth area */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          {user ? (
            <>
              <Link to={dashboardPath()} className="nav-btn-outline">Dashboard</Link>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className="avatar">{(user.email || '?')[0].toUpperCase()}</div>
                <button onClick={handleLogout} style={{ background: 'none', border: 'none', fontSize: '13px', color: '#888', cursor: 'pointer', fontFamily: 'inherit' }}>Log out</button>
              </div>
            </>
          ) : (
            <>
              <Link to="/login"    className="nav-btn-outline">Log in</Link>
              <Link to="/register" className="nav-btn">Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
