import { useState, useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthContext } from '../../context/AuthContext'
import api from '../../api/axios'

export default function RegisterPage() {
  const { login } = useContext(AuthContext)
  const navigate   = useNavigate()

  const [step, setStep]         = useState(0)
  const [loading, setLoading]   = useState(false)
  const [apiError, setApiError] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [showPw2, setShowPw2]   = useState(false)
  const [savedToken, setSavedToken] = useState('')

  const [account, setAccount] = useState({ email:'', password:'', confirm:'' })
  const [acErr, setAcErr]     = useState({})

  const [profile, setProfile] = useState({ full_name:'', date_of_birth:'', gender:'', phone:'', address:'', blood_type:'', allergies:'' })
  const [prErr, setPrErr]     = useState({})

  const setAc = (f) => (e) => { setAccount(a => ({...a,[f]:e.target.value})); setAcErr(er=>({...er,[f]:''})); setApiError('') }
  const setPr = (f) => (e) => { setProfile(a => ({...a,[f]:e.target.value})); setPrErr(er=>({...er,[f]:''})) }

  const validateAccount = () => {
    const e = {}
    if (!account.email.trim()) e.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(account.email)) e.email = 'Enter a valid email'
    if (!account.password) e.password = 'Password is required'
    else if (account.password.length < 8) e.password = 'At least 8 characters'
    else if (!/[A-Z]/.test(account.password)) e.password = 'Needs an uppercase letter'
    else if (!/[0-9]/.test(account.password)) e.password = 'Needs a number'
    if (account.confirm !== account.password) e.confirm = 'Passwords do not match'
    if (!account.confirm) e.confirm = 'Please confirm your password'
    return e
  }

  const validateProfile = () => {
    const e = {}
    if (!profile.full_name.trim()) e.full_name = 'Full name is required'
    return e
  }

  const goToStep1 = async (e) => {
    e.preventDefault()
    const errs = validateAccount()
    if (Object.keys(errs).length) { setAcErr(errs); return }
    setStep(1)
  }

  const submitAll = async (skipProfile = false) => {
    if (!skipProfile) {
      const errs = validateProfile()
      if (Object.keys(errs).length) { setPrErr(errs); return }
    }

    setLoading(true)
    setApiError('')

    try {
      // Register user
      let token = savedToken
      if (!token) {
        const regRes = await api.post('/api/auth/register', {
          email:     account.email,
          password:  account.password,
          full_name: skipProfile ? 'Patient' : profile.full_name,
        })
        token = regRes.data.access_token
        setSavedToken(token)
        login(token)
      }

      if (!skipProfile) {
        const profileData = { full_name: profile.full_name }
        if (profile.date_of_birth) profileData.date_of_birth = profile.date_of_birth
        if (profile.gender)        profileData.gender        = profile.gender
        if (profile.phone)         profileData.phone         = profile.phone
        if (profile.address)       profileData.address       = profile.address
        if (profile.blood_type)    profileData.blood_type    = profile.blood_type
        if (profile.allergies)     profileData.allergies     = profile.allergies

        await api.post('/api/patients', profileData)
      }

      setStep(2)
    } catch (err) {
      const msg = err.response?.data?.detail
      setApiError(typeof msg === 'string' ? msg : 'Registration failed. The email may already be registered.')
    } finally {
      setLoading(false)
    }
  }

  const pwStrength = () => {
    const pw = account.password
    if (!pw) return { score:0, label:'', color:'#e0ddd6' }
    let s = 0
    if (pw.length >= 8)          s++
    if (/[A-Z]/.test(pw))        s++
    if (/[0-9]/.test(pw))        s++
    if (/[^A-Za-z0-9]/.test(pw)) s++
    const m = {1:['Weak','#e74c3c'],2:['Fair','#e67e22'],3:['Good','#f1c40f'],4:['Strong','#27ae60']}
    const [label,color] = m[s]||['','#e0ddd6']
    return {score:s,label,color}
  }
  const pw = pwStrength()

  const STEPS = ['Account','Profile','Done']

  return (
    <div style={{display:'flex',minHeight:'100vh',fontFamily:"'Instrument Sans','DM Sans',sans-serif"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600&family=Instrument+Serif:ital@0;1&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fi{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        .fi{animation:fi .4s ease both}
        .inp:focus{border-color:#1a3a5c!important;box-shadow:0 0 0 3px rgba(26,58,92,.1)!important;outline:none}
        .sbtn:hover:not(:disabled){background:#0f2740!important}
        .skip:hover{color:#555!important}
        @media(max-width:768px){.lp{display:none!important}}
      `}</style>

      {/* LEFT */}
      <div className="lp" style={{width:'420px',flexShrink:0,background:'linear-gradient(160deg,#0d2137,#1a3a5c)',padding:'44px 48px',display:'flex',flexDirection:'column',color:'#fff'}}>
        <Link to="/" style={{display:'flex',alignItems:'center',gap:'10px',textDecoration:'none'}}>
          <div style={{width:'34px',height:'34px',background:'rgba(255,255,255,.12)',borderRadius:'8px',display:'flex',alignItems:'center',justifyContent:'center'}}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
          </div>
          <span style={{fontFamily:"'Instrument Serif',serif",fontSize:'18px',fontWeight:400}}>York Clinic</span>
        </Link>

        <div style={{marginTop:'64px',flex:1}}>
          <h1 style={{fontFamily:"'Instrument Serif',serif",fontSize:'36px',lineHeight:1.15,marginBottom:'16px',fontWeight:400}}>
            Join thousands of<br /><em style={{color:'#7ec8e3'}}>healthy patients</em>
          </h1>
          <p style={{fontSize:'15px',color:'rgba(255,255,255,.6)',lineHeight:1.75,marginBottom:'44px'}}>
            Create your free account in under a minute and get instant access to York's best specialists.
          </p>

          {/* Step tracker */}
          {STEPS.map((s,i) => (
            <div key={i} style={{display:'flex',gap:'16px',alignItems:'flex-start',paddingBottom:i<2?'24px':'0',position:'relative'}}>
              {i<2 && <div style={{position:'absolute',left:'14px',top:'28px',bottom:0,width:'1px',background:i<step?'rgba(126,200,227,.5)':'rgba(255,255,255,.1)'}}/>}
              <div style={{width:'28px',height:'28px',borderRadius:'50%',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'12px',fontWeight:600,background:i<step?'#7ec8e3':i===step?'rgba(255,255,255,.9)':'rgba(255,255,255,.1)',color:i<step?'#0d2137':i===step?'#1a3a5c':'rgba(255,255,255,.4)',zIndex:1}}>
                {i<step?'✓':i+1}
              </div>
              <div style={{paddingTop:'4px'}}>
                <p style={{fontSize:'14px',fontWeight:i===step?600:400,color:i<=step?'#fff':'rgba(255,255,255,.4)'}}>{s}</p>
                <p style={{fontSize:'12px',color:'rgba(255,255,255,.35)',marginTop:'2px'}}>
                  {['Email and password','Personal details','Ready to go!'][i]}
                </p>
              </div>
            </div>
          ))}
        </div>
        <p style={{fontSize:'12px',color:'rgba(255,255,255,.28)'}}>© 2024 York Clinic</p>
      </div>

      {/* RIGHT */}
      <div style={{flex:1,background:'#fafaf8',display:'flex',alignItems:'center',justifyContent:'center',padding:'40px 24px'}}>
        <div style={{width:'100%',maxWidth:'460px'}}>

          {/* ── STEP 0 ── */}
          {step===0 && (
            <div className="fi">
              <h2 style={{fontFamily:"'Instrument Serif',serif",fontSize:'30px',color:'#1a1a2e',marginBottom:'6px',fontWeight:400}}>Create your account</h2>
              <p style={{fontSize:'15px',color:'#777',marginBottom:'28px'}}>Start with your email and a secure password</p>

              {apiError && <ErrBanner msg={apiError}/>}

              <form onSubmit={goToStep1} style={{display:'flex',flexDirection:'column',gap:'20px'}}>
                <Field label="Email address" error={acErr.email}>
                  <input type="email" className="inp" placeholder="alice@example.com" value={account.email} onChange={setAc('email')} autoComplete="email" style={{...I, borderColor:acErr.email?'#e74c3c':'#d0cec7'}}/>
                </Field>

                <Field label="Password" error={acErr.password}>
                  <Pw type={showPw?'text':'password'} placeholder="Min. 8 characters" value={account.password} onChange={setAc('password')} borderColor={acErr.password?'#e74c3c':'#d0cec7'} toggle={()=>setShowPw(s=>!s)} visible={showPw}/>
                  {account.password && (
                    <div style={{marginTop:'8px'}}>
                      <div style={{display:'flex',gap:'4px',marginBottom:'4px'}}>
                        {[1,2,3,4].map(i=><div key={i} style={{flex:1,height:'3px',borderRadius:'2px',background:i<=pw.score?pw.color:'#e0ddd6',transition:'background .3s'}}/>)}
                      </div>
                      {pw.label && <p style={{fontSize:'12px',color:pw.color}}>{pw.label} password</p>}
                    </div>
                  )}
                </Field>

                <Field label="Confirm password" error={acErr.confirm}>
                  <Pw type={showPw2?'text':'password'} placeholder="Re-enter your password" value={account.confirm} onChange={setAc('confirm')} borderColor={acErr.confirm?'#e74c3c':'#d0cec7'} toggle={()=>setShowPw2(s=>!s)} visible={showPw2}/>
                </Field>

                <Btn loading={loading} label="Continue →" loadLabel="Checking..."/>
              </form>

              <p style={{textAlign:'center',fontSize:'14px',color:'#777',marginTop:'24px'}}>
                Already have an account?{' '}
                <Link to="/login" style={{color:'#1a3a5c',fontWeight:600,textDecoration:'none'}}>Sign in</Link>
              </p>
            </div>
          )}

          {/* ── STEP 1 ── */}
          {step===1 && (
            <div className="fi">
              <h2 style={{fontFamily:"'Instrument Serif',serif",fontSize:'30px',color:'#1a1a2e',marginBottom:'6px',fontWeight:400}}>Your patient profile</h2>
              <p style={{fontSize:'15px',color:'#777',marginBottom:'28px'}}>Help your doctors know you better. Only name is required.</p>

              {apiError && <ErrBanner msg={apiError}/>}

              <form onSubmit={e=>{e.preventDefault();submitAll(false)}} style={{display:'flex',flexDirection:'column',gap:'18px'}}>
                <Field label={<>Full name <span style={{color:'#e74c3c'}}>*</span></>} error={prErr.full_name}>
                  <input type="text" className="inp" placeholder="Alice Johnson" value={profile.full_name} onChange={setPr('full_name')} autoComplete="name" style={{...I,borderColor:prErr.full_name?'#e74c3c':'#d0cec7'}}/>
                </Field>

                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'14px'}}>
                  <Field label="Date of birth">
                    <input type="date" className="inp" value={profile.date_of_birth} onChange={setPr('date_of_birth')} style={I}/>
                  </Field>
                  <Field label="Gender">
                    <select className="inp" value={profile.gender} onChange={setPr('gender')} style={I}>
                      <option value="">Select</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                      <option value="prefer_not_to_say">Prefer not to say</option>
                    </select>
                  </Field>
                </div>

                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'14px'}}>
                  <Field label="Phone number">
                    <input type="tel" className="inp" placeholder="+44 7700 000000" value={profile.phone} onChange={setPr('phone')} style={I}/>
                  </Field>
                  <Field label="Blood type">
                    <select className="inp" value={profile.blood_type} onChange={setPr('blood_type')} style={I}>
                      <option value="">Unknown</option>
                      {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(bt=><option key={bt} value={bt}>{bt}</option>)}
                    </select>
                  </Field>
                </div>

                <Field label="Home address">
                  <input type="text" className="inp" placeholder="3 Petergate, York, YO1 2EL" value={profile.address} onChange={setPr('address')} style={I}/>
                </Field>

                <Field label="Known allergies">
                  <input type="text" className="inp" placeholder="e.g. Penicillin (leave blank if none)" value={profile.allergies} onChange={setPr('allergies')} style={I}/>
                </Field>

                <div style={{display:'flex',gap:'12px',marginTop:'4px'}}>
                  <button type="button" onClick={()=>setStep(0)} style={{background:'transparent',border:'0.5px solid #d0cec7',color:'#666',padding:'12px 20px',borderRadius:'8px',fontSize:'14px',fontWeight:500,cursor:'pointer',fontFamily:'inherit',flexShrink:0}}>← Back</button>
                  <Btn loading={loading} label="Create account" loadLabel="Creating..." style={{flex:1}}/>
                </div>

                <button type="button" className="skip" onClick={()=>submitAll(true)} disabled={loading}
                  style={{background:'none',border:'none',cursor:'pointer',fontSize:'13px',color:'#bbb',fontFamily:'inherit',transition:'color .15s'}}>
                  Skip for now — fill profile later
                </button>
              </form>
            </div>
          )}

          {/* ── STEP 2 ── */}
          {step===2 && (
            <div className="fi" style={{textAlign:'center'}}>
              <div style={{width:'72px',height:'72px',borderRadius:'50%',background:'linear-gradient(135deg,#1a3a5c,#1d5a8a)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 24px'}}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <h2 style={{fontFamily:"'Instrument Serif',serif",fontSize:'30px',color:'#1a1a2e',marginBottom:'10px',fontWeight:400}}>Welcome to York Clinic!</h2>
              <p style={{fontSize:'16px',color:'#666',lineHeight:1.7,maxWidth:'340px',margin:'0 auto 32px'}}>
                Your account is ready. Book your first appointment or explore your dashboard.
              </p>
              <div style={{display:'flex',flexDirection:'column',gap:'12px',maxWidth:'280px',margin:'0 auto'}}>
                <button onClick={()=>navigate('/patient/dashboard')} style={{background:'#1a3a5c',color:'#fff',border:'none',padding:'13px',borderRadius:'8px',fontSize:'15px',fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>Go to my dashboard</button>
                <button onClick={()=>navigate('/patient/book')} style={{background:'transparent',border:'0.5px solid #1a3a5c',color:'#1a3a5c',padding:'12px',borderRadius:'8px',fontSize:'15px',fontWeight:500,cursor:'pointer',fontFamily:'inherit'}}>Book first appointment</button>
              </div>
              <p style={{fontSize:'13px',color:'#bbb',marginTop:'24px'}}>Signed in as <strong style={{color:'#555'}}>{account.email}</strong></p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Shared components ────────────────────────────────────
const I = {width:'100%',border:'0.5px solid #d0cec7',borderRadius:'8px',padding:'12px 14px',fontSize:'15px',fontFamily:'inherit',color:'#1a1a2e',background:'#fff',transition:'border .2s,box-shadow .2s',outline:'none'}

function Field({label,error,children}){
  return(
    <div>
      <label style={{display:'block',fontSize:'13px',fontWeight:500,color:'#444',marginBottom:'6px'}}>{label}</label>
      {children}
      {error&&<p style={{fontSize:'12px',color:'#e74c3c',marginTop:'5px'}}>{error}</p>}
    </div>
  )
}

function Pw({type,placeholder,value,onChange,borderColor,toggle,visible}){
  return(
    <div style={{position:'relative'}}>
      <input type={type} className="inp" placeholder={placeholder} value={value} onChange={onChange} autoComplete="new-password"
        style={{...I,borderColor,paddingRight:'44px'}}/>
      <button type="button" onClick={toggle} style={{position:'absolute',right:'12px',top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',padding:'4px',display:'flex',alignItems:'center',color:'#999'}}>
        {visible
          ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
          : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
        }
      </button>
    </div>
  )
}

function Btn({loading,label,loadLabel,style={}}){
  return(
    <button type="submit" disabled={loading} className="sbtn"
      style={{background:'#1a3a5c',color:'#fff',border:'none',padding:'13px',borderRadius:'8px',fontSize:'15px',fontWeight:600,cursor:loading?'not-allowed':'pointer',fontFamily:'inherit',transition:'background .2s',display:'flex',alignItems:'center',justifyContent:'center',gap:'8px',opacity:loading?.75:1,...style}}>
      {loading&&<span style={{width:'16px',height:'16px',border:'2px solid rgba(255,255,255,.3)',borderTopColor:'#fff',borderRadius:'50%',display:'inline-block',animation:'spin .7s linear infinite'}}/>}
      {loading?loadLabel:label}
    </button>
  )
}

function ErrBanner({msg}){
  return(
    <div style={{display:'flex',alignItems:'center',gap:'8px',background:'#fef0f0',border:'0.5px solid #f5c0c0',borderRadius:'8px',padding:'12px 14px',fontSize:'14px',color:'#c0392b',marginBottom:'20px'}}>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      {msg}
    </div>
  )
}
