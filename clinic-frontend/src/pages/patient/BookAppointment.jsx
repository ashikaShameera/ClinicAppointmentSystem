import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { listDoctors, getSlots, getSpecialties } from '../../api/doctors'
import { bookAppointment } from '../../api/appointments'
import { BtnSpinner } from '../../components/Spinner'
import Navbar from '../../components/Navbar'

const STEPS = ['Find a doctor', 'Pick a slot', 'Confirm']

export default function BookAppointment() {
  const navigate = useNavigate()
  const [step, setStep]       = useState(0)

  // Step 0 — doctor search
  const [doctors, setDoctors]         = useState([])
  const [specialties, setSpecialties] = useState([])
  const [search, setSearch]           = useState('')
  const [specFilter, setSpecFilter]   = useState('')
  const [loadingDocs, setLoadingDocs] = useState(true)
  const [selectedDoc, setSelectedDoc] = useState(null)

  // Step 1 — slot picker
  const [slots, setSlots]         = useState([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [reason, setReason]           = useState('')
  const [isFirstVisit, setIsFirstVisit] = useState(false)

  // Step 2 — confirm
  const [booking, setBooking]   = useState(false)
  const [bookError, setBookError] = useState('')
  const [booked, setBooked]     = useState(null)

  useEffect(() => {
    Promise.all([
      listDoctors({ per_page: 50, is_accepting: true }),
      getSpecialties(),
    ]).then(([docData, specData]) => {
      setDoctors(docData.doctors || [])
      setSpecialties(specData || [])
    }).catch(() => {}).finally(() => setLoadingDocs(false))
  }, [])

  // Load slots when doctor selected
  useEffect(() => {
    if (!selectedDoc) return
    setLoadingSlots(true)
    getSlots(selectedDoc.id)
      .then(setSlots)
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false))
  }, [selectedDoc])

  const filteredDoctors = doctors.filter(d => {
    const matchSearch = !search || d.full_name.toLowerCase().includes(search.toLowerCase())
    const matchSpec   = !specFilter || d.specialty?.name === specFilter
    return matchSearch && matchSpec
  })

  // Build available time slots for selected date
  const availableSlots = () => {
    if (!selectedDate || !slots.length) return []
    const dayName = new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'long' }).toLowerCase()
    const daySlots = slots.filter(s => s.day_of_week === dayName && s.is_active)
    const times = []
    daySlots.forEach(slot => {
      const [sh, sm] = slot.start_time.split(':').map(Number)
      const [eh, em] = slot.end_time.split(':').map(Number)
      let cur = sh * 60 + sm
      const end = eh * 60 + em
      const dur = slot.slot_duration_minutes || 30
      while (cur + dur <= end) {
        const h = String(Math.floor(cur / 60)).padStart(2, '0')
        const m = String(cur % 60).padStart(2, '0')
        times.push(`${h}:${m}`)
        cur += dur
      }
    })
    return [...new Set(times)].sort()
  }

  const minDate = () => {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    return d.toISOString().split('T')[0]
  }

  const maxDate = () => {
    const d = new Date()
    d.setDate(d.getDate() + 60)
    return d.toISOString().split('T')[0]
  }

  const handleBook = async () => {
    if (!selectedDate || !selectedTime) return
    setBooking(true)
    setBookError('')
    try {
      const dt = `${selectedDate}T${selectedTime}:00+00:00`
      const res = await bookAppointment({
        doctor_id:            selectedDoc.id,
        appointment_datetime: dt,
        reason:               reason || undefined,
        is_first_visit:       isFirstVisit,
      })
      setBooked(res)
      setStep(2)
    } catch (err) {
      setBookError(err.response?.data?.detail || 'Booking failed. This slot may already be taken.')
    } finally {
      setBooking(false)
    }
  }

  const fmt = (dt) => new Date(dt).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div style={pg}>
      <style>{css}</style>
      <Navbar />

      <div style={wrap}>
        {/* Progress bar */}
        <div style={{ background: '#fff', border: '0.5px solid #e8e6df', borderRadius: '12px', padding: '20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0' }}>
            {STEPS.map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < 2 ? 1 : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 600, background: i < step ? '#1D9E75' : i === step ? '#1a3a5c' : '#f0ede6', color: i <= step ? '#fff' : '#aaa', transition: 'all .3s' }}>
                    {i < step ? '✓' : i + 1}
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: i === step ? 600 : 400, color: i === step ? '#1a1a2e' : i < step ? '#1D9E75' : '#aaa', transition: 'color .3s' }}>{s}</span>
                </div>
                {i < 2 && <div style={{ flex: 1, height: '1px', background: i < step ? '#1D9E75' : '#e8e6df', margin: '0 16px', transition: 'background .3s' }} />}
              </div>
            ))}
          </div>
        </div>

        {/* ── STEP 0: FIND DOCTOR ─────────────────────── */}
        {step === 0 && (
          <div className="fade-in">
            <div style={sectionHead}>
              <h2 style={h2}>Choose your doctor</h2>
              <p style={subTxt}>Browse our specialists and select the right one for your needs</p>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
              <input
                className="inp" placeholder="Search by name..."
                value={search} onChange={e => setSearch(e.target.value)}
                style={{ ...inputStyle, flex: 1, minWidth: '200px' }}
              />
              <select className="inp" value={specFilter} onChange={e => setSpecFilter(e.target.value)} style={{ ...inputStyle, minWidth: '180px' }}>
                <option value="">All specialties</option>
                {specialties.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
              </select>
            </div>

            {loadingDocs ? (
              <div style={loadingGrid}>
                {[1,2,3,4,5,6].map(i => <div key={i} style={skeleton} />)}
              </div>
            ) : filteredDoctors.length === 0 ? (
              <div style={emptyBox}>
                <span style={{ fontSize: '32px' }}>🔍</span>
                <p style={{ fontWeight: 500 }}>No doctors found</p>
                <p style={{ fontSize: '13px', color: '#999' }}>Try adjusting your search or specialty filter</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                {filteredDoctors.map(doc => (
                  <div
                    key={doc.id}
                    className="doc-card"
                    onClick={() => { setSelectedDoc(doc); setStep(1); setSelectedTime(''); setSelectedDate('') }}
                    style={{ ...docCard, border: selectedDoc?.id === doc.id ? '1.5px solid #1a3a5c' : '0.5px solid #e8e6df' }}
                  >
                    <div style={{ display: 'flex', gap: '14px', marginBottom: '14px' }}>
                      <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: specColor(doc.specialty?.name), color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 600, flexShrink: 0 }}>
                        {doc.full_name.split(' ').filter(w => w !== 'Dr.').map(w => w[0]).join('').slice(0, 2)}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontWeight: 600, fontSize: '15px', color: '#1a1a2e', marginBottom: '2px' }}>{doc.full_name}</p>
                        <p style={{ fontSize: '12px', color: '#888' }}>{doc.specialty?.name}</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
                      <span style={chip}>{doc.experience_years} yrs exp</span>
                      <span style={chip}>£{Number(doc.consultation_fee).toFixed(0)}/visit</span>
                      {doc.total_reviews > 0 && <span style={chip}>★ {Number(doc.rating).toFixed(1)}</span>}
                    </div>
                    <div style={{ padding: '10px 0 0', borderTop: '0.5px solid #f0ede6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', color: doc.is_accepting ? '#1D9E75' : '#E24B4A', fontWeight: 500 }}>
                        {doc.is_accepting ? '● Accepting patients' : '● Not accepting'}
                      </span>
                      <span style={{ fontSize: '12px', color: '#1a3a5c', fontWeight: 500 }}>Select →</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── STEP 1: PICK SLOT ──────────────────────── */}
        {step === 1 && selectedDoc && (
          <div className="fade-in">
            <div style={sectionHead}>
              <h2 style={h2}>Pick a date and time</h2>
              <p style={subTxt}>Choose when you'd like to see {selectedDoc.full_name}</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              {/* Left — doctor summary + reason */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Selected doctor card */}
                <div style={{ background: 'linear-gradient(135deg,#1a3a5c,#1d5a8a)', borderRadius: '12px', padding: '20px', color: '#fff' }}>
                  <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255,255,255,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 600 }}>
                      {selectedDoc.full_name.split(' ').filter(w => w !== 'Dr.').map(w => w[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: '16px' }}>{selectedDoc.full_name}</p>
                      <p style={{ fontSize: '13px', opacity: 0.7 }}>{selectedDoc.specialty?.name} · £{Number(selectedDoc.consultation_fee).toFixed(0)}</p>
                    </div>
                  </div>
                  <button onClick={() => setStep(0)} style={{ marginTop: '14px', background: 'rgba(255,255,255,.12)', border: 'none', color: '#fff', fontSize: '12px', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontFamily: 'inherit' }}>
                    ← Change doctor
                  </button>
                </div>

                {/* Date picker */}
                <div style={formGroup}>
                  <label style={lbl}>Appointment date</label>
                  <input type="date" className="inp" value={selectedDate} onChange={e => { setSelectedDate(e.target.value); setSelectedTime('') }} min={minDate()} max={maxDate()} style={inputStyle} />
                </div>

                {/* Reason */}
                <div style={formGroup}>
                  <label style={lbl}>Reason for visit <span style={{ color: '#aaa', fontWeight: 400 }}>(optional)</span></label>
                  <textarea className="inp" rows={3} placeholder="Brief description of your concern..." value={reason} onChange={e => setReason(e.target.value)} style={{ ...inputStyle, resize: 'vertical' }} />
                </div>

                {/* First visit toggle */}
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '14px', color: '#555' }}>
                  <input type="checkbox" checked={isFirstVisit} onChange={e => setIsFirstVisit(e.target.checked)} style={{ width: '16px', height: '16px', accentColor: '#1a3a5c' }} />
                  This is my first visit with this doctor
                </label>
              </div>

              {/* Right — time slots */}
              <div style={formGroup}>
                <label style={lbl}>
                  {selectedDate ? `Available slots on ${new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' })}` : 'Select a date first'}
                </label>
                {loadingSlots ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                    {[1,2,3,4,5,6].map(i => <div key={i} style={{ height: '40px', background: '#f0ede6', borderRadius: '8px', animation: 'pulse 1.5s infinite' }} />)}
                  </div>
                ) : !selectedDate ? (
                  <div style={emptyBox}>
                    <span style={{ fontSize: '28px' }}>📅</span>
                    <p style={{ fontSize: '14px', color: '#999' }}>Pick a date to see available slots</p>
                  </div>
                ) : availableSlots().length === 0 ? (
                  <div style={emptyBox}>
                    <span style={{ fontSize: '28px' }}>😔</span>
                    <p style={{ fontSize: '14px', color: '#666', fontWeight: 500 }}>No slots available</p>
                    <p style={{ fontSize: '12px', color: '#999' }}>Try a different date</p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                    {availableSlots().map(t => (
                      <button
                        key={t}
                        onClick={() => setSelectedTime(t)}
                        className="time-slot"
                        style={{
                          padding: '10px', borderRadius: '8px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s',
                          background: selectedTime === t ? '#1a3a5c' : '#fff',
                          color:      selectedTime === t ? '#fff' : '#444',
                          border:     selectedTime === t ? '0.5px solid #1a3a5c' : '0.5px solid #e0ddd6',
                        }}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                )}

                {/* Book button */}
                {selectedDate && selectedTime && (
                  <div style={{ marginTop: '20px' }}>
                    {bookError && (
                      <div style={{ background: '#FCEBEB', color: '#791F1F', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '12px' }}>
                        {bookError}
                      </div>
                    )}
                    <button onClick={handleBook} disabled={booking} style={{ ...bookBtnStyle, width: '100%' }} className="book-final-btn">
                      {booking && <BtnSpinner />}
                      {booking ? 'Booking...' : `Book for ${selectedTime} on ${new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 2: SUCCESS ──────────────────────────── */}
        {step === 2 && booked && (
          <div className="fade-in" style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: '#E1F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <h2 style={{ fontFamily: "'Instrument Serif',serif", fontSize: '30px', color: '#1a1a2e', fontWeight: 400, marginBottom: '10px' }}>Appointment booked!</h2>
            <p style={{ fontSize: '15px', color: '#666', marginBottom: '6px' }}>
              You're confirmed with <strong>{selectedDoc?.full_name}</strong>
            </p>
            <p style={{ fontSize: '15px', color: '#1a3a5c', fontWeight: 600, marginBottom: '32px' }}>
              {booked.appointment_datetime ? fmt(booked.appointment_datetime) : ''}
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={() => navigate('/patient/appointments')} style={{ ...bookBtnStyle }}>View my appointments</button>
              <button onClick={() => { setStep(0); setSelectedDoc(null); setSelectedDate(''); setSelectedTime(''); setReason(''); setBooked(null) }} style={{ background: 'transparent', border: '0.5px solid #1a3a5c', color: '#1a3a5c', padding: '12px 24px', borderRadius: '8px', fontSize: '14px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>Book another</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const specColor = (name) => {
  const map = { 'Cardiology': '#c0392b', 'Dermatology': '#27ae60', 'Neurology': '#8e44ad', 'Orthopedics': '#e67e22', 'Pediatrics': '#3498db', 'Psychiatry': '#16a085', 'Gynecology': '#e91e63', 'Ophthalmology': '#1abc9c', 'ENT': '#f39c12' }
  return map[name] || '#1a3a5c'
}

const pg          = { background: '#f5f3ee', minHeight: '100vh', fontFamily: "'Instrument Sans','DM Sans',sans-serif" }
const wrap        = { maxWidth: '1000px', margin: '0 auto', padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: '24px' }
const sectionHead = { marginBottom: '20px' }
const h2          = { fontFamily: "'Instrument Serif',serif", fontSize: '26px', color: '#1a1a2e', fontWeight: 400, marginBottom: '4px' }
const subTxt      = { fontSize: '14px', color: '#888' }
const inputStyle  = { width: '100%', border: '0.5px solid #d0cec7', borderRadius: '8px', padding: '11px 13px', fontSize: '14px', fontFamily: 'inherit', color: '#1a1a2e', background: '#fff', outline: 'none', transition: 'border .2s' }
const formGroup   = { display: 'flex', flexDirection: 'column', gap: '8px' }
const lbl         = { fontSize: '13px', fontWeight: 500, color: '#444' }
const chip        = { background: '#f0f4f8', color: '#1a3a5c', padding: '3px 9px', borderRadius: '20px', fontSize: '11px', fontWeight: 500 }
const docCard     = { background: '#fff', borderRadius: '12px', padding: '18px', cursor: 'pointer', transition: 'transform .2s, box-shadow .2s' }
const skeleton    = { height: '160px', background: 'linear-gradient(90deg,#f0ede6 25%,#e8e5de 50%,#f0ede6 75%)', backgroundSize: '200% 100%', borderRadius: '12px', animation: 'shimmer 1.5s infinite' }
const loadingGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }
const emptyBox    = { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '32px', textAlign: 'center', color: '#666', background: '#f9f7f4', borderRadius: '10px' }
const bookBtnStyle = { background: '#1a3a5c', color: '#fff', border: 'none', padding: '13px 24px', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: '8px', transition: 'background .2s' }

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600&family=Instrument+Serif:ital@0;1&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  @keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
  @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
  .fade-in{animation:fadeIn .4s ease both}
  .inp:focus{border-color:#1a3a5c!important;box-shadow:0 0 0 3px rgba(26,58,92,.08)!important;outline:none}
  .doc-card:hover{transform:translateY(-3px);box-shadow:0 8px 24px rgba(26,58,92,.09)}
  .time-slot:hover{border-color:#1a3a5c!important;color:#1a3a5c!important}
  .book-final-btn:hover{background:#0f2740!important}
`
