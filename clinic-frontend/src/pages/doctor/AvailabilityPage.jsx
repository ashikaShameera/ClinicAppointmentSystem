import { useState, useEffect, useContext } from 'react'
import { AuthContext } from '../../context/AuthContext'
import { getDoctorDashboard } from '../../api/analytics'
import { listDoctors, getSlots, addSlot, deleteSlot } from '../../api/doctors'
import { ConfirmModal } from '../../components/Modal'
import { BtnSpinner, PageLoader } from '../../components/Spinner'
import Navbar from '../../components/Navbar'

const DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday']
const DAY_LABELS = { monday:'Mon',tuesday:'Tue',wednesday:'Wed',thursday:'Thu',friday:'Fri',saturday:'Sat',sunday:'Sun' }
const DURATIONS = [15, 20, 30, 45, 60]

export default function AvailabilityPage() {
  const { user } = useContext(AuthContext)

  const [doctorId, setDoctorId] = useState(null)
  const [slots, setSlots]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [saveError, setSaveError] = useState('')
  const [saved, setSaved]       = useState(false)

  // Delete confirm modal
  const [deleteModal, setDeleteModal]   = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting]         = useState(false)

  // New slot form
  const [showForm, setShowForm] = useState(false)
  const [newSlot, setNewSlot]   = useState({ day_of_week: 'monday', start_time: '09:00', end_time: '12:00', slot_duration_minutes: 30 })
  const [formError, setFormError] = useState('')

  useEffect(() => {
    getDoctorDashboard()
      .then(data => {
        setDoctorId(data.doctor_id)
        return getSlots(data.doctor_id)
      })
      .then(data => setSlots(data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const slotsForDay = (day) => slots.filter(s => s.day_of_week === day).sort((a,b) => a.start_time.localeCompare(b.start_time))

  const handleAddSlot = async (e) => {
    e.preventDefault()
    setFormError('')
    if (newSlot.end_time <= newSlot.start_time) {
      setFormError('End time must be after start time')
      return
    }
    setSaving(true)
    try {
      const created = await addSlot(doctorId, { ...newSlot, start_time: newSlot.start_time + ':00', end_time: newSlot.end_time + ':00' })
      setSlots(prev => [...prev, created])
      setShowForm(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      setFormError(err.response?.data?.detail || 'Failed to add slot. It may already exist.')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteSlot = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteSlot(doctorId, deleteTarget.id)
      setSlots(prev => prev.filter(s => s.id !== deleteTarget.id))
      setDeleteModal(false)
      setDeleteTarget(null)
    } catch {
      alert('Failed to delete slot.')
    } finally {
      setDeleting(false)
    }
  }

  const totalSlots = slots.length
  const totalHours = slots.reduce((acc, s) => {
    const [sh, sm] = s.start_time.split(':').map(Number)
    const [eh, em] = s.end_time.split(':').map(Number)
    return acc + ((eh * 60 + em) - (sh * 60 + sm)) / 60
  }, 0).toFixed(1)

  const durationLabel = { 15:'15 min', 20:'20 min', 30:'30 min', 45:'45 min', 60:'1 hour' }

  if (loading) return (<><Navbar /><PageLoader /></>)

  return (
    <div style={pg}>
      <style>{css}</style>
      <Navbar />

      <div style={wrap}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={h1}>Availability</h1>
            <p style={sub}>Set your weekly schedule so patients can book appointments</p>
          </div>
          <button onClick={() => { setShowForm(!showForm); setFormError('') }} style={showForm ? cancelAddBtn : addBtn} className="add-btn">
            {showForm ? 'Cancel' : '+ Add time slot'}
          </button>
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
          {[
            { label: 'Active slots', value: totalSlots, bg: '#E6F1FB', color: '#0C447C' },
            { label: 'Hours per week', value: totalHours, bg: '#E1F5EE', color: '#085041' },
            { label: 'Days active', value: [...new Set(slots.map(s => s.day_of_week))].length, bg: '#FAEEDA', color: '#633806' },
          ].map((s, i) => (
            <div key={i} style={{ background: s.bg, borderRadius: '10px', padding: '16px 20px', display: 'flex', gap: '14px', alignItems: 'center' }}>
              <p style={{ fontSize: '24px', fontWeight: 700, color: s.color }}>{s.value}</p>
              <p style={{ fontSize: '12px', color: s.color, opacity: 0.75 }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Success */}
        {saved && (
          <div style={{ background: '#E1F5EE', border: '0.5px solid #9FE1CB', borderRadius: '8px', padding: '12px 16px', fontSize: '14px', color: '#085041', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            Slot added successfully
          </div>
        )}

        {/* Add slot form */}
        {showForm && (
          <div className="fade-in" style={{ background: '#fff', border: '1.5px solid #1a3a5c', borderRadius: '14px', padding: '24px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '18px', color: '#1a1a2e' }}>Add new time slot</h3>
            <form onSubmit={handleAddSlot}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={lbl}>Day of week</label>
                  <select className="inp" value={newSlot.day_of_week} onChange={e => setNewSlot(f => ({...f, day_of_week: e.target.value}))} style={inp}>
                    {DAYS.map(d => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Start time</label>
                  <input type="time" className="inp" value={newSlot.start_time} onChange={e => setNewSlot(f => ({...f, start_time: e.target.value}))} style={inp} />
                </div>
                <div>
                  <label style={lbl}>End time</label>
                  <input type="time" className="inp" value={newSlot.end_time} onChange={e => setNewSlot(f => ({...f, end_time: e.target.value}))} style={inp} />
                </div>
                <div>
                  <label style={lbl}>Slot duration</label>
                  <select className="inp" value={newSlot.slot_duration_minutes} onChange={e => setNewSlot(f => ({...f, slot_duration_minutes: Number(e.target.value)}))} style={inp}>
                    {DURATIONS.map(d => <option key={d} value={d}>{durationLabel[d]}</option>)}
                  </select>
                </div>
              </div>
              {formError && <p style={{ fontSize: '13px', color: '#c0392b', marginBottom: '12px' }}>{formError}</p>}
              <button type="submit" disabled={saving} style={{ ...addBtn, display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                {saving && <BtnSpinner />}
                {saving ? 'Adding...' : 'Add slot'}
              </button>
            </form>
          </div>
        )}

        {/* Weekly grid */}
        <div style={{ background: '#fff', border: '0.5px solid #e8e6df', borderRadius: '14px', overflow: 'hidden' }}>
          <div style={{ padding: '18px 22px', borderBottom: '0.5px solid #e8e6df' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#1a1a2e' }}>Weekly schedule</h2>
            <p style={{ fontSize: '12px', color: '#aaa', marginTop: '2px' }}>Click the × to remove a slot</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '0.5px solid #f0ede6' }}>
            {DAYS.map(day => (
              <div key={day} style={{ padding: '10px 6px', textAlign: 'center', borderRight: '0.5px solid #f5f3ee', background: '#fafaf8' }}>
                <p style={{ fontSize: '12px', fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '.06em' }}>{DAY_LABELS[day]}</p>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', minHeight: '200px' }}>
            {DAYS.map(day => {
              const daySlots = slotsForDay(day)
              return (
                <div key={day} style={{ padding: '10px 6px', borderRight: '0.5px solid #f5f3ee', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {daySlots.length === 0 ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60px' }}>
                      <p style={{ fontSize: '11px', color: '#ddd', textAlign: 'center' }}>No slots</p>
                    </div>
                  ) : (
                    daySlots.map(slot => (
                      <div key={slot.id} className="slot-chip" style={{ background: '#E6F1FB', borderRadius: '6px', padding: '6px 8px', position: 'relative', fontSize: '11px' }}>
                        <p style={{ fontWeight: 600, color: '#0C447C', fontSize: '12px' }}>
                          {slot.start_time.slice(0,5)}–{slot.end_time.slice(0,5)}
                        </p>
                        <p style={{ color: '#378ADD', fontSize: '10px', marginTop: '1px' }}>
                          {durationLabel[slot.slot_duration_minutes] || `${slot.slot_duration_minutes}m`}
                        </p>
                        <button
                          onClick={() => { setDeleteTarget(slot); setDeleteModal(true) }}
                          className="delete-slot-btn"
                          style={{ position: 'absolute', top: '3px', right: '3px', background: 'none', border: 'none', cursor: 'pointer', color: '#378ADD', fontSize: '14px', lineHeight: 1, padding: '2px', borderRadius: '3px', opacity: 0 }}
                        >×</button>
                      </div>
                    ))
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Slot list */}
        {slots.length > 0 && (
          <div style={{ background: '#fff', border: '0.5px solid #e8e6df', borderRadius: '14px', overflow: 'hidden' }}>
            <div style={{ padding: '16px 22px', borderBottom: '0.5px solid #e8e6df' }}>
              <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#1a1a2e' }}>All slots ({slots.length})</h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: '#f0ede6' }}>
              {slots.sort((a,b) => DAYS.indexOf(a.day_of_week) - DAYS.indexOf(b.day_of_week) || a.start_time.localeCompare(b.start_time)).map(slot => (
                <div key={slot.id} style={{ background: '#fff', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className="slot-row">
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <span style={{ width: '60px', fontSize: '13px', fontWeight: 600, color: '#1a3a5c', textTransform: 'capitalize' }}>{DAY_LABELS[slot.day_of_week]}</span>
                    <span style={{ fontSize: '13px', color: '#555' }}>{slot.start_time.slice(0,5)} – {slot.end_time.slice(0,5)}</span>
                    <span style={{ background: '#E6F1FB', color: '#0C447C', padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 500 }}>
                      {durationLabel[slot.slot_duration_minutes]}
                    </span>
                  </div>
                  <button onClick={() => { setDeleteTarget(slot); setDeleteModal(true) }}
                    style={{ background: '#FCEBEB', color: '#791F1F', border: 'none', padding: '5px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}
                    className="del-btn">
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        open={deleteModal}
        onClose={() => { setDeleteModal(false); setDeleteTarget(null) }}
        onConfirm={handleDeleteSlot}
        title="Remove time slot"
        message={`Remove the ${deleteTarget?.day_of_week} slot (${deleteTarget?.start_time?.slice(0,5)}–${deleteTarget?.end_time?.slice(0,5)})? Existing bookings will not be affected.`}
        confirmLabel="Yes, remove slot"
        danger
        loading={deleting}
      />
    </div>
  )
}

const pg           = { background: '#f5f3ee', minHeight: '100vh', fontFamily: "'Instrument Sans','DM Sans',sans-serif" }
const wrap         = { maxWidth: '1000px', margin: '0 auto', padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: '20px' }
const h1           = { fontFamily: "'Instrument Serif',serif", fontSize: '28px', color: '#1a1a2e', fontWeight: 400 }
const sub          = { fontSize: '14px', color: '#888', marginTop: '4px' }
const addBtn       = { background: '#1a3a5c', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'background .2s' }
const cancelAddBtn = { background: 'transparent', border: '0.5px solid #d0cec7', color: '#666', padding: '10px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }
const lbl          = { fontSize: '13px', fontWeight: 500, color: '#444', marginBottom: '6px', display: 'block' }
const inp          = { width: '100%', border: '0.5px solid #d0cec7', borderRadius: '7px', padding: '10px 12px', fontSize: '14px', fontFamily: 'inherit', color: '#1a1a2e', background: '#fff', outline: 'none' }

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600&family=Instrument+Serif:ital@0;1&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  @keyframes fadeIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
  .fade-in{animation:fadeIn .25s ease both}
  .inp:focus{border-color:#1a3a5c!important;box-shadow:0 0 0 3px rgba(26,58,92,.08)!important;outline:none}
  .add-btn:hover{background:#0f2740!important}
  .slot-chip:hover .delete-slot-btn{opacity:1!important}
  .del-btn:hover{background:#F7C1C1!important}
  .slot-row:hover{background:#fafaf8!important}
`
