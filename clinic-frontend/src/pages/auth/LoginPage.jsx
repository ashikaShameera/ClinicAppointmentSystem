import { useState, useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthContext } from '../../context/AuthContext'
import api from '../../api/axios'

export default function LoginPage() {
  const { login } = useContext(AuthContext)
  const navigate   = useNavigate()

  const [form, setForm]         = useState({ email: '', password: '' })
  const [errors, setErrors]     = useState({})
  const [loading, setLoading]   = useState(false)
  const [apiError, setApiError] = useState('')
  const [showPw, setShowPw]     = useState(false)

  const validate = () => {
    const e = {}
    if (!form.email.trim())    e.email    = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email'
    if (!form.password.trim()) e.password = 'Password is required'
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setLoading(true)
    setApiError('')
    try {
      const res = await api.post('/api/auth/login', form)
      const { access_token, role } = res.data
      login(access_token)
      if (role === 'admin')       navigate('/admin/dashboard')
      else if (role === 'doctor') navigate('/doctor/dashboard')
      else                        navigate('/patient/dashboard')
    } catch (err) {
      setApiError(err.response?.data?.detail || 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  const set = (field) => (e) => {
    setForm(f => ({ ...f, [field]: e.target.value }))
    setErrors(er => ({ ...er, [field]: '' }))
    setApiError('')
  }

  const fillDemo = (email) => {
    setForm({ email, password: 'Password@123' })
    setErrors({})
    setApiError('')
  }

  return (
    <div style={{ display:'flex', minHeight:'100vh', fontFamily:"'Instrument Sans','DM Sans',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600&family=Instrument+Serif:ital@0;1&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        .fi{animation:fadeIn .5s ease both}
        .inp:focus{border-color:#1a3a5c!important;box-shadow:0 0 0 3px rgba(26,58,92,.1)!important;outline:none}
        .sbtn:hover:not(:disabled){background:#0f2740!important}
        .dbtn:hover{background:#f0f4f8!important;border-color:#c0d4e8!important}
        .sw-link:hover{text-decoration:underline}
        @media(max-width:768px){.left-panel{display:none!important}}
      `}</style>

      {/* ── LEFT PANEL ─────────────────────────────── */}
      <div className="left-panel" style={{ width:'420px', flexShrink:0, background:'linear-gradient(160deg,#0d2137 0%,#1a3a5c 100%)', padding:'44px 48px', display:'flex', flexDirection:'column', color:'#fff' }}>
        <Link to="/" style={{ display:'flex', alignItems:'center', gap:'10px', textDecoration:'none' }}>
          <div style={{ width:'34px', height:'34px', background:'rgba(255,255,255,0.12)', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
          </div>
          <span style={{ fontFamily:"'Instrument Serif',serif", fontSize:'18px', fontWeight:400 }}>York Clinic</span>
        </Link>

        <div style={{ marginTop:'64px', flex:1 }}>
          <h1 style={{ fontFamily:"'Instrument Serif',serif", fontSize:'38px', lineHeight:1.15, marginBottom:'16px', fontWeight:400 }}>
            Your health,<br /><em style={{ fontStyle:'italic', color:'#7ec8e3' }}>our priority</em>
          </h1>
          <p style={{ fontSize:'15px', color:'rgba(255,255,255,0.6)', lineHeight:1.75, marginBottom:'40px' }}>
            Sign in to manage appointments, access medical records, and connect with your care team.
          </p>
          {[
            { icon:'📅', text:'Book and manage appointments' },
            { icon:'📋', text:'View your medical records' },
            { icon:'🔔', text:'Get smart appointment reminders' },
            { icon:'⭐', text:'Rate and review your doctors' },
          ].map((item, i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'14px' }}>
              <div style={{ width:'36px', height:'36px', background:'rgba(255,255,255,0.08)', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px', flexShrink:0 }}>{item.icon}</div>
              <span style={{ fontSize:'14px', color:'rgba(255,255,255,0.68)' }}>{item.text}</span>
            </div>
          ))}
        </div>

        <p style={{ fontSize:'12px', color:'rgba(255,255,255,0.28)' }}>© 2024 York Clinic · All rights reserved</p>
      </div>

      {/* ── RIGHT PANEL ────────────────────────────── */}
      <div style={{ flex:1, background:'#fafaf8', display:'flex', alignItems:'center', justifyContent:'center', padding:'40px 24px' }}>
        <div className="fi" style={{ width:'100%', maxWidth:'420px' }}>

          <h2 style={{ fontFamily:"'Instrument Serif',serif", fontSize:'30px', color:'#1a1a2e', marginBottom:'6px', fontWeight:400 }}>Welcome back</h2>
          <p style={{ fontSize:'15px', color:'#777', marginBottom:'28px' }}>Sign in to your account to continue</p>

          {/* Error banner */}
          {apiError && (
            <div style={{ display:'flex', alignItems:'center', gap:'8px', background:'#fef0f0', border:'0.5px solid #f5c0c0', borderRadius:'8px', padding:'12px 14px', fontSize:'14px', color:'#c0392b', marginBottom:'20px' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'20px' }}>

            {/* Email */}
            <div>
              <label style={{ display:'block', fontSize:'13px', fontWeight:500, color:'#444', marginBottom:'6px' }}>Email address</label>
              <input
                type="email"
                className="inp"
                placeholder="alice@example.com"
                value={form.email}
                onChange={set('email')}
                autoComplete="email"
                style={{ width:'100%', border:`0.5px solid ${errors.email ? '#e74c3c' : '#d0cec7'}`, borderRadius:'8px', padding:'12px 14px', fontSize:'15px', fontFamily:'inherit', color:'#1a1a2e', background:'#fff', transition:'border .2s,box-shadow .2s' }}
              />
              {errors.email && <p style={{ fontSize:'12px', color:'#e74c3c', marginTop:'5px' }}>{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label style={{ display:'block', fontSize:'13px', fontWeight:500, color:'#444', marginBottom:'6px' }}>Password</label>
              <div style={{ position:'relative' }}>
                <input
                  type={showPw ? 'text' : 'password'}
                  className="inp"
                  placeholder="Your password"
                  value={form.password}
                  onChange={set('password')}
                  autoComplete="current-password"
                  style={{ width:'100%', border:`0.5px solid ${errors.password ? '#e74c3c' : '#d0cec7'}`, borderRadius:'8px', padding:'12px 44px 12px 14px', fontSize:'15px', fontFamily:'inherit', color:'#1a1a2e', background:'#fff', transition:'border .2s,box-shadow .2s' }}
                />
                <button type="button" onClick={() => setShowPw(s => !s)} style={{ position:'absolute', right:'12px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', padding:'4px', display:'flex', alignItems:'center', color:'#999' }}>
                  {showPw
                    ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>
              {errors.password && <p style={{ fontSize:'12px', color:'#e74c3c', marginTop:'5px' }}>{errors.password}</p>}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="sbtn"
              style={{ width:'100%', background:'#1a3a5c', color:'#fff', border:'none', padding:'13px', borderRadius:'8px', fontSize:'15px', fontWeight:600, cursor: loading ? 'not-allowed' : 'pointer', fontFamily:'inherit', transition:'background .2s', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', opacity: loading ? 0.75 : 1, marginTop:'4px' }}
            >
              {loading && <span style={{ width:'16px', height:'16px', border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'#fff', borderRadius:'50%', display:'inline-block', animation:'spin .7s linear infinite' }} />}
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          {/* Divider */}
          <div style={{ display:'flex', alignItems:'center', gap:'12px', margin:'24px 0' }}>
            <div style={{ flex:1, height:'0.5px', background:'#e0ddd6' }} />
            <span style={{ fontSize:'12px', color:'#bbb' }}>quick access</span>
            <div style={{ flex:1, height:'0.5px', background:'#e0ddd6' }} />
          </div>

          {/* Demo credentials */}
          <div style={{ background:'#fff', border:'0.5px solid #e8e6df', borderRadius:'10px', padding:'16px', marginBottom:'24px' }}>
            <p style={{ fontSize:'11px', fontWeight:600, color:'#888', marginBottom:'10px', textTransform:'uppercase', letterSpacing:'.08em' }}>Demo accounts — click to fill</p>
            <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
              {[
                { role:'Patient', email:'alice@example.com',    color:'#1d5a8a' },
                { role:'Doctor',  email:'dr.smith@clinic.com',  color:'#27ae60' },
                { role:'Admin',   email:'admin@clinic.com',     color:'#8e44ad' },
              ].map(({ role, email, color }) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => fillDemo(email)}
                  className="dbtn"
                  style={{ width:'100%', background:'transparent', border:'0.5px solid #e8e6df', borderRadius:'7px', padding:'9px 12px', cursor:'pointer', display:'flex', alignItems:'center', gap:'10px', fontFamily:'inherit', transition:'all .15s' }}
                >
                  <span style={{ fontSize:'11px', fontWeight:600, background:`${color}18`, color, padding:'2px 8px', borderRadius:'4px', flexShrink:0 }}>{role}</span>
                  <span style={{ fontSize:'13px', color:'#555' }}>{email}</span>
                  <span style={{ marginLeft:'auto', fontSize:'11px', color:'#bbb' }}>fill →</span>
                </button>
              ))}
            </div>
          </div>

          <p style={{ textAlign:'center', fontSize:'14px', color:'#777' }}>
            Don't have an account?{' '}
            <Link to="/register" className="sw-link" style={{ color:'#1a3a5c', fontWeight:600, textDecoration:'none' }}>Create one free</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
