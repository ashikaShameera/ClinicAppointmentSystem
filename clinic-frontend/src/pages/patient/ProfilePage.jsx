import { useState, useEffect, useContext } from 'react'
import { AuthContext } from '../../context/AuthContext'
// import { getPatients, updatePatient } from '../../api/patients'
import { getMyProfile, updatePatient } from '../../api/patients'
import { BtnSpinner, PageLoader } from '../../components/Spinner'
import Navbar from '../../components/Navbar'

const GENDERS = ['', 'male', 'female', 'other', 'prefer_not_to_say']
const BLOOD_TYPES = ['', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

export default function ProfilePage() {
  const { user } = useContext(AuthContext)

  const [patient, setPatient] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving]   = useState(false)
  const [saved, setSaved]     = useState(false)
  const [error, setError]     = useState('')
  const [form, setForm]       = useState({})

useEffect(() => {
  getMyProfile()
    .then(p => {
      setPatient(p)
      setForm(toForm(p))
    })
    .catch(() => {})
    .finally(() => setLoading(false))
}, [])


  const toForm = (p) => ({
    full_name:               p.full_name || '',
    date_of_birth:           p.date_of_birth || '',
    gender:                  p.gender || '',
    phone:                   p.phone || '',
    address:                 p.address || '',
    blood_type:              p.blood_type || '',
    allergies:               p.allergies || '',
    emergency_contact_name:  p.emergency_contact_name || '',
    emergency_contact_phone: p.emergency_contact_phone || '',
  })

  const set = (field) => (e) => {
    setForm(f => ({ ...f, [field]: e.target.value }))
    setError('')
  }

  const handleSave = async () => {
    if (!form.full_name.trim()) { setError('Full name is required'); return }
    setSaving(true)
    setError('')
    try {
      const updated = await updatePatient(patient.id, form)
      setPatient(updated)
      setForm(toForm(updated))
      setEditing(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setForm(toForm(patient))
    setEditing(false)
    setError('')
  }

  const age = (dob) => {
    if (!dob) return null
    const diff = Date.now() - new Date(dob).getTime()
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25))
  }

  if (loading) return (<><Navbar /><PageLoader /></>)

  if (!patient) return (
    <div style={pg}><Navbar />
      <div style={{ textAlign: 'center', padding: '80px 24px', fontFamily: "'Instrument Sans',sans-serif" }}>
        <p style={{ fontSize: '16px', color: '#666' }}>No patient profile found.</p>
      </div>
    </div>
  )

  return (
    <div style={pg}>
      <style>{css}</style>
      <Navbar />

      <div style={wrap}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={h1}>My profile</h1>
            <p style={sub}>Manage your personal and medical information</p>
          </div>
          {!editing ? (
            <button onClick={() => setEditing(true)} style={editBtn} className="edit-btn">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              Edit profile
            </button>
          ) : (
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={handleCancel} style={cancelBtn}>Cancel</button>
              <button onClick={handleSave} disabled={saving} style={saveBtn} className="save-btn">
                {saving && <BtnSpinner />}
                {saving ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          )}
        </div>

        {/* Success banner */}
        {saved && (
          <div style={{ background: '#E1F5EE', border: '0.5px solid #9FE1CB', borderRadius: '8px', padding: '12px 16px', fontSize: '14px', color: '#085041', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            Profile updated successfully
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ background: '#FCEBEB', border: '0.5px solid #F7C1C1', borderRadius: '8px', padding: '12px 16px', fontSize: '14px', color: '#791F1F' }}>
            {error}
          </div>
        )}

        {/* Profile hero card */}
        <div style={{ background: 'linear-gradient(135deg,#0d2137,#1a3a5c)', borderRadius: '16px', padding: '32px', display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: 600, color: '#fff', flexShrink: 0 }}>
            {patient.full_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div style={{ color: '#fff', flex: 1 }}>
            <h2 style={{ fontFamily: "'Instrument Serif',serif", fontSize: '28px', fontWeight: 400, marginBottom: '4px' }}>{patient.full_name}</h2>
            <p style={{ color: 'rgba(255,255,255,.65)', fontSize: '14px' }}>
              {patient.date_of_birth && `Age ${age(patient.date_of_birth)} · `}
              {patient.gender && patient.gender.replace('_', ' ') + ' · '}
              {user?.email}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {[
              { label: 'Blood type', value: patient.blood_type || '—', bg: '#FCEBEB', color: '#791F1F' },
              { label: 'Allergies', value: patient.allergies ? 'On record' : 'None', bg: '#E1F5EE', color: '#085041' },
            ].map((item, i) => (
              <div key={i} style={{ background: item.bg, padding: '10px 16px', borderRadius: '10px', textAlign: 'center', minWidth: '80px' }}>
                <p style={{ fontSize: '18px', fontWeight: 700, color: item.color }}>{item.value}</p>
                <p style={{ fontSize: '11px', color: item.color, opacity: 0.7 }}>{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
          {/* Personal info */}
          <Section title="Personal information" icon="👤">
            <Field label="Full name" required>
              {editing
                ? <input className="inp" value={form.full_name} onChange={set('full_name')} style={inp} />
                : <Val>{patient.full_name}</Val>}
            </Field>
            <Field label="Date of birth">
              {editing
                ? <input type="date" className="inp" value={form.date_of_birth} onChange={set('date_of_birth')} style={inp} />
                : <Val>{patient.date_of_birth ? new Date(patient.date_of_birth + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) + ` (age ${age(patient.date_of_birth)})` : '—'}</Val>}
            </Field>
            <Field label="Gender">
              {editing
                ? <select className="inp" value={form.gender} onChange={set('gender')} style={inp}>
                    {GENDERS.map(g => <option key={g} value={g}>{g ? g.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Prefer not to say'}</option>)}
                  </select>
                : <Val>{patient.gender ? patient.gender.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) : '—'}</Val>}
            </Field>
            <Field label="Phone number">
              {editing
                ? <input type="tel" className="inp" placeholder="+44 7700 000000" value={form.phone} onChange={set('phone')} style={inp} />
                : <Val>{patient.phone || '—'}</Val>}
            </Field>
            <Field label="Home address">
              {editing
                ? <textarea className="inp" rows={2} value={form.address} onChange={set('address')} style={{ ...inp, resize: 'vertical' }} />
                : <Val>{patient.address || '—'}</Val>}
            </Field>
          </Section>

          {/* Medical info */}
          <Section title="Medical information" icon="🩺">
            <Field label="Blood type">
              {editing
                ? <select className="inp" value={form.blood_type} onChange={set('blood_type')} style={inp}>
                    {BLOOD_TYPES.map(bt => <option key={bt} value={bt}>{bt || 'Unknown'}</option>)}
                  </select>
                : <Val>{patient.blood_type || 'Unknown'}</Val>}
            </Field>
            <Field label="Known allergies">
              {editing
                ? <textarea className="inp" rows={2} placeholder="e.g. Penicillin, Latex" value={form.allergies} onChange={set('allergies')} style={{ ...inp, resize: 'vertical' }} />
                : <Val>{patient.allergies || 'None recorded'}</Val>}
            </Field>

            <div style={{ borderTop: '0.5px solid #f0ede6', paddingTop: '16px', marginTop: '4px' }}>
              <p style={{ fontSize: '12px', fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '12px' }}>Emergency contact</p>
              <Field label="Contact name">
                {editing
                  ? <input className="inp" placeholder="Full name" value={form.emergency_contact_name} onChange={set('emergency_contact_name')} style={inp} />
                  : <Val>{patient.emergency_contact_name || '—'}</Val>}
              </Field>
              <Field label="Contact phone">
                {editing
                  ? <input type="tel" className="inp" placeholder="+44 7700 000000" value={form.emergency_contact_phone} onChange={set('emergency_contact_phone')} style={inp} />
                  : <Val>{patient.emergency_contact_phone || '—'}</Val>}
              </Field>
            </div>
          </Section>
        </div>

        {/* Account info */}
        <div style={sectionCard}>
          <div style={sectionCardHead}><span>🔐</span><h3 style={sectionTitle}>Account information</h3></div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <Field label="Email address"><Val>{user?.email}</Val></Field>
            <Field label="Account role"><Val style={{ textTransform: 'capitalize' }}>Patient</Val></Field>
            <Field label="Patient ID"><Val style={{ fontFamily: 'monospace', fontSize: '12px' }}>{patient.id?.slice(0, 16)}...</Val></Field>
          </div>
        </div>
      </div>
    </div>
  )
}

function Section({ title, icon, children }) {
  return (
    <div style={sectionCard}>
      <div style={sectionCardHead}>
        <span>{icon}</span>
        <h3 style={sectionTitle}>{title}</h3>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>{children}</div>
    </div>
  )
}

function Field({ label, required, children }) {
  return (
    <div>
      <label style={{ fontSize: '12px', fontWeight: 500, color: '#aaa', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '5px', display: 'block' }}>
        {label}{required && <span style={{ color: '#E24B4A' }}> *</span>}
      </label>
      {children}
    </div>
  )
}

function Val({ children, style = {} }) {
  return <p style={{ fontSize: '14px', color: '#1a1a2e', fontWeight: 500, ...style }}>{children}</p>
}

const pg         = { background: '#f5f3ee', minHeight: '100vh', fontFamily: "'Instrument Sans','DM Sans',sans-serif" }
const wrap       = { maxWidth: '900px', margin: '0 auto', padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: '20px' }
const h1         = { fontFamily: "'Instrument Serif',serif", fontSize: '28px', color: '#1a1a2e', fontWeight: 400 }
const sub        = { fontSize: '14px', color: '#888', marginTop: '4px' }
const sectionCard = { background: '#fff', border: '0.5px solid #e8e6df', borderRadius: '14px', padding: '24px' }
const sectionCardHead = { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', paddingBottom: '14px', borderBottom: '0.5px solid #f0ede6' }
const sectionTitle = { fontSize: '15px', fontWeight: 600, color: '#1a1a2e' }
const editBtn    = { display: 'inline-flex', alignItems: 'center', gap: '7px', background: '#1a3a5c', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', transition: 'background .2s' }
const cancelBtn  = { background: 'transparent', border: '0.5px solid #d0cec7', color: '#666', padding: '10px 18px', borderRadius: '8px', fontSize: '14px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }
const saveBtn    = { background: '#1a3a5c', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '7px', transition: 'background .2s' }
const inp        = { width: '100%', border: '0.5px solid #d0cec7', borderRadius: '7px', padding: '10px 12px', fontSize: '14px', fontFamily: 'inherit', color: '#1a1a2e', background: '#fff', outline: 'none', transition: 'border .2s' }

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600&family=Instrument+Serif:ital@0;1&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  .inp:focus{border-color:#1a3a5c!important;box-shadow:0 0 0 3px rgba(26,58,92,.08)!important;outline:none}
  .edit-btn:hover{background:#0f2740!important}
  .save-btn:hover:not(:disabled){background:#0f2740!important}
`
