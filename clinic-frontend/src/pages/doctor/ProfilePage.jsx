import { useState, useEffect, useContext } from 'react'
import { AuthContext } from '../../context/AuthContext'
import { getDoctorDashboard } from '../../api/analytics'
import { getDoctor, updateDoctor, getSpecialties } from '../../api/doctors'
import { BtnSpinner, PageLoader } from '../../components/Spinner'
import Navbar from '../../components/Navbar'

export default function DoctorProfile() {
  const { user } = useContext(AuthContext)

  const [doctor, setDoctor]       = useState(null)
  const [specialties, setSpecialties] = useState([])
  const [loading, setLoading]     = useState(true)
  const [editing, setEditing]     = useState(false)
  const [saving, setSaving]       = useState(false)
  const [saved, setSaved]         = useState(false)
  const [error, setError]         = useState('')
  const [form, setForm]           = useState({})
  const [doctorId, setDoctorId]   = useState(null)

  useEffect(() => {
    Promise.all([
      getDoctorDashboard(),
      getSpecialties(),
    ]).then(([dashData, specData]) => {
      setDoctorId(dashData.doctor_id)
      setSpecialties(specData || [])
      return getDoctor(dashData.doctor_id)
    }).then(doc => {
      setDoctor(doc)
      setForm(toForm(doc))
    }).catch(() => {})
    .finally(() => setLoading(false))
  }, [])

  const toForm = (d) => ({
    full_name:        d.full_name || '',
    specialty_id:     d.specialty?.id || '',
    bio:              d.bio || '',
    qualification:    d.qualification || '',
    experience_years: d.experience_years ?? 0,
    consultation_fee: d.consultation_fee ?? 0,
    phone:            d.phone || '',
    clinic_address:   d.clinic_address || '',
    clinic_lat:       d.clinic_lat ?? '',
    clinic_lng:       d.clinic_lng ?? '',
    is_accepting:     d.is_accepting ?? true,
  })

  const set = (field) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm(f => ({ ...f, [field]: val }))
    setError('')
  }

  const handleSave = async () => {
    if (!form.full_name.trim()) { setError('Full name is required'); return }
    setSaving(true)
    setError('')
    try {
      const payload = {
        ...form,
        experience_years: Number(form.experience_years),
        consultation_fee: Number(form.consultation_fee),
        clinic_lat:       form.clinic_lat !== '' ? Number(form.clinic_lat) : null,
        clinic_lng:       form.clinic_lng !== '' ? Number(form.clinic_lng) : null,
        specialty_id:     Number(form.specialty_id),
      }
      const updated = await updateDoctor(doctorId, payload)
      setDoctor(updated)
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
    setForm(toForm(doctor))
    setEditing(false)
    setError('')
  }

  const specName = doctor?.specialty?.name || specialties.find(s => s.id === Number(form.specialty_id))?.name || '—'

  if (loading) return (<><Navbar /><PageLoader /></>)
  if (!doctor) return (
    <div style={pg}><Navbar />
      <div style={{ textAlign: 'center', padding: '80px', fontFamily: "'Instrument Sans',sans-serif", color: '#666' }}>
        Doctor profile not found.
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
            <p style={sub}>Manage your professional details and clinic information</p>
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

        {saved && (
          <div style={successBanner}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            Profile updated successfully
          </div>
        )}
        {error && <div style={errBanner}>{error}</div>}

        {/* Hero card */}
        <div style={{ background: 'linear-gradient(135deg,#0d2137,#1a3a5c)', borderRadius: '16px', padding: '32px', display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap', color: '#fff' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: 600, flexShrink: 0 }}>
            {doctor.full_name?.split(' ').filter(w => w !== 'Dr.').map(w => w[0]).join('').slice(0, 2)}
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontFamily: "'Instrument Serif',serif", fontSize: '28px', fontWeight: 400, marginBottom: '4px' }}>{doctor.full_name}</h2>
            <p style={{ color: 'rgba(255,255,255,.65)', fontSize: '14px' }}>{specName} · {doctor.qualification}</p>
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {[
              { label: 'Experience', value: `${doctor.experience_years} yrs` },
              { label: 'Rating', value: doctor.total_reviews > 0 ? `${Number(doctor.rating).toFixed(1)} ★` : '—' },
              { label: 'Accepting', value: doctor.is_accepting ? 'Yes' : 'No', warn: !doctor.is_accepting },
            ].map((item, i) => (
              <div key={i} style={{ background: item.warn ? '#FCEBEB' : 'rgba(255,255,255,.1)', padding: '10px 16px', borderRadius: '10px', textAlign: 'center' }}>
                <p style={{ fontSize: '17px', fontWeight: 700, color: item.warn ? '#791F1F' : '#fff' }}>{item.value}</p>
                <p style={{ fontSize: '11px', color: item.warn ? '#791F1F' : 'rgba(255,255,255,.6)', marginTop: '2px' }}>{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>

          {/* Professional info */}
          <Section title="Professional details" icon="👨‍⚕️">
            <Field label="Full name" required>
              {editing
                ? <input className="inp" value={form.full_name} onChange={set('full_name')} style={inp} />
                : <Val>{doctor.full_name}</Val>}
            </Field>
            <Field label="Specialty">
              {editing
                ? <select className="inp" value={form.specialty_id} onChange={set('specialty_id')} style={inp}>
                    {specialties.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                : <Val>{specName}</Val>}
            </Field>
            <Field label="Qualifications">
              {editing
                ? <input className="inp" placeholder="e.g. MBBS, MRCGP" value={form.qualification} onChange={set('qualification')} style={inp} />
                : <Val>{doctor.qualification || '—'}</Val>}
            </Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <Field label="Experience (years)">
                {editing
                  ? <input type="number" className="inp" min="0" max="60" value={form.experience_years} onChange={set('experience_years')} style={inp} />
                  : <Val>{doctor.experience_years} years</Val>}
              </Field>
              <Field label="Consultation fee (£)">
                {editing
                  ? <input type="number" className="inp" min="0" step="0.01" value={form.consultation_fee} onChange={set('consultation_fee')} style={inp} />
                  : <Val>£{Number(doctor.consultation_fee).toFixed(2)}</Val>}
              </Field>
            </div>
            <Field label="Bio">
              {editing
                ? <textarea className="inp" rows={4} placeholder="Tell patients about yourself..." value={form.bio} onChange={set('bio')} style={{ ...inp, resize: 'vertical' }} />
                : <Val style={{ lineHeight: 1.65, color: '#555' }}>{doctor.bio || '—'}</Val>}
            </Field>
            <Field label="Phone number">
              {editing
                ? <input type="tel" className="inp" placeholder="+44 1904 000000" value={form.phone} onChange={set('phone')} style={inp} />
                : <Val>{doctor.phone || '—'}</Val>}
            </Field>
            <Field label="Accepting new patients">
              {editing
                ? <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '14px', color: '#555' }}>
                    <input type="checkbox" checked={form.is_accepting} onChange={set('is_accepting')} style={{ width: '16px', height: '16px', accentColor: '#1a3a5c' }} />
                    Currently accepting new patients
                  </label>
                : <Val style={{ color: doctor.is_accepting ? '#085041' : '#791F1F' }}>
                    {doctor.is_accepting ? '● Yes, accepting patients' : '● Not accepting new patients'}
                  </Val>}
            </Field>
          </Section>

          {/* Clinic / location */}
          <Section title="Clinic location" icon="📍">
            <Field label="Clinic address">
              {editing
                ? <textarea className="inp" rows={2} placeholder="Full clinic address" value={form.clinic_address} onChange={set('clinic_address')} style={{ ...inp, resize: 'vertical' }} />
                : <Val>{doctor.clinic_address || '—'}</Val>}
            </Field>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <Field label="Latitude (for map)">
                {editing
                  ? <input type="number" className="inp" step="0.0001" placeholder="e.g. 53.9645" value={form.clinic_lat} onChange={set('clinic_lat')} style={inp} />
                  : <Val style={{ fontFamily: 'monospace', fontSize: '13px' }}>{doctor.clinic_lat || '—'}</Val>}
              </Field>
              <Field label="Longitude (for map)">
                {editing
                  ? <input type="number" className="inp" step="0.0001" placeholder="e.g. -1.0810" value={form.clinic_lng} onChange={set('clinic_lng')} style={inp} />
                  : <Val style={{ fontFamily: 'monospace', fontSize: '13px' }}>{doctor.clinic_lng || '—'}</Val>}
              </Field>
            </div>

            {/* Map preview */}
            {doctor.clinic_lat && doctor.clinic_lng && (
              <div>
                <p style={{ fontSize: '12px', color: '#aaa', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '.06em', fontWeight: 600 }}>Map preview</p>
                <MapPreview lat={Number(doctor.clinic_lat)} lng={Number(doctor.clinic_lng)} name={doctor.full_name} />
              </div>
            )}

            {(!doctor.clinic_lat || !doctor.clinic_lng) && !editing && (
              <div style={{ background: '#f9f7f4', borderRadius: '8px', padding: '20px', textAlign: 'center', color: '#aaa', fontSize: '13px' }}>
                <p>No location set. Click Edit to add coordinates.</p>
              </div>
            )}
          </Section>
        </div>

        {/* Reviews summary */}
        <div style={sectionCard}>
          <div style={sectionHead}><span>⭐</span><h3 style={sectionTitle}>Reviews & ratings</h3></div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px' }}>
            {[
              { label: 'Average rating', value: doctor.total_reviews > 0 ? `${Number(doctor.rating).toFixed(1)} / 5` : 'No ratings yet' },
              { label: 'Total reviews', value: doctor.total_reviews },
              { label: 'Profile status', value: doctor.is_accepting ? 'Active' : 'Paused' },
            ].map((item, i) => (
              <div key={i} style={{ background: '#f9f7f4', borderRadius: '8px', padding: '14px' }}>
                <p style={{ fontSize: '11px', color: '#aaa', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '6px' }}>{item.label}</p>
                <p style={{ fontSize: '16px', fontWeight: 600, color: '#1a1a2e' }}>{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// Leaflet map preview component
function MapPreview({ lat, lng, name }) {
  useEffect(() => {
    // Lazy-load Leaflet only when needed
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
    document.head.appendChild(link)

    const script = document.createElement('script')
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    script.onload = () => {
      const L = window.L
      if (!L) return
      const mapEl = document.getElementById('doc-profile-map')
      if (!mapEl || mapEl._leaflet_id) return

      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      const map = L.map('doc-profile-map').setView([lat, lng], 15)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
      }).addTo(map)
      L.marker([lat, lng]).addTo(map).bindPopup(name).openPopup()
    }
    document.head.appendChild(script)
  }, [lat, lng])

  return <div id="doc-profile-map" style={{ height: '220px', borderRadius: '10px', overflow: 'hidden', border: '0.5px solid #e8e6df' }} />
}

function Section({ title, icon, children }) {
  return (
    <div style={sectionCard}>
      <div style={sectionHead}><span>{icon}</span><h3 style={sectionTitle}>{title}</h3></div>
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

const pg          = { background: '#f5f3ee', minHeight: '100vh', fontFamily: "'Instrument Sans','DM Sans',sans-serif" }
const wrap        = { maxWidth: '900px', margin: '0 auto', padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: '20px' }
const h1          = { fontFamily: "'Instrument Serif',serif", fontSize: '28px', color: '#1a1a2e', fontWeight: 400 }
const sub         = { fontSize: '14px', color: '#888', marginTop: '4px' }
const sectionCard = { background: '#fff', border: '0.5px solid #e8e6df', borderRadius: '14px', padding: '24px' }
const sectionHead = { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', paddingBottom: '14px', borderBottom: '0.5px solid #f0ede6' }
const sectionTitle = { fontSize: '15px', fontWeight: 600, color: '#1a1a2e' }
const editBtn     = { display: 'inline-flex', alignItems: 'center', gap: '7px', background: '#1a3a5c', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', transition: 'background .2s' }
const cancelBtn   = { background: 'transparent', border: '0.5px solid #d0cec7', color: '#666', padding: '10px 18px', borderRadius: '8px', fontSize: '14px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }
const saveBtn     = { background: '#1a3a5c', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '7px', transition: 'background .2s' }
const inp         = { width: '100%', border: '0.5px solid #d0cec7', borderRadius: '7px', padding: '10px 12px', fontSize: '14px', fontFamily: 'inherit', color: '#1a1a2e', background: '#fff', outline: 'none', transition: 'border .2s' }
const successBanner = { background: '#E1F5EE', border: '0.5px solid #9FE1CB', borderRadius: '8px', padding: '12px 16px', fontSize: '14px', color: '#085041', display: 'flex', alignItems: 'center', gap: '8px' }
const errBanner   = { background: '#FCEBEB', border: '0.5px solid #F7C1C1', borderRadius: '8px', padding: '12px 16px', fontSize: '14px', color: '#791F1F' }

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600&family=Instrument+Serif:ital@0;1&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  .inp:focus{border-color:#1a3a5c!important;box-shadow:0 0 0 3px rgba(26,58,92,.08)!important;outline:none}
  .edit-btn:hover{background:#0f2740!important}
  .save-btn:hover:not(:disabled){background:#0f2740!important}
`
