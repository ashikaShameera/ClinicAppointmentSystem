import { useState, useEffect } from 'react'
import { getToday, getUpcoming, getPatientHistory, updateStatus } from '../../api/appointments'
import { getDoctorDashboard } from '../../api/analytics'
import StatusBadge from '../../components/StatusBadge'
import Pagination from '../../components/Pagination'
import { ConfirmModal } from '../../components/Modal'
import { PageLoader } from '../../components/Spinner'
import { EmptyState } from '../../components/ErrorMessage'
import Navbar from '../../components/Navbar'

const STATUSES = ['', 'pending', 'confirmed', 'completed', 'cancelled', 'no_show']
const PER_PAGE = 10

export default function SchedulePage() {
  const [appts, setAppts]         = useState([])
  const [total, setTotal]         = useState(0)
  const [page, setPage]           = useState(1)
  const [statusFilter, setStatus] = useState('')
  const [view, setView]           = useState('upcoming') // today | upcoming | all
  const [loading, setLoading]     = useState(true)
  const [expandedId, setExpandedId] = useState(null)

  // Status update modal
  const [modal, setModal]       = useState(false)
  const [modalAppt, setModalAppt] = useState(null)
  const [modalStatus, setModalStatus] = useState('')
  const [modalNote, setModalNote]   = useState('')
  const [updating, setUpdating]     = useState(false)

  // Notes modal (consultation notes)
  const [notesModal, setNotesModal]   = useState(false)
  const [notesAppt, setNotesAppt]     = useState(null)
  const [notesText, setNotesText]     = useState('')
  const [savingNotes, setSavingNotes] = useState(false)

  useEffect(() => {
    load()
  }, [view, statusFilter, page])

  const load = async () => {
    setLoading(true)
    try {
      if (view === 'today') {
        const data = await getToday()
        const filtered = statusFilter ? (data || []).filter(a => a.status === statusFilter) : (data || [])
        setAppts(filtered)
        setTotal(filtered.length)
      } else if (view === 'upcoming') {
        const data = await getUpcoming()
        const filtered = statusFilter ? (data || []).filter(a => a.status === statusFilter) : (data || [])
        setAppts(filtered.slice((page-1)*PER_PAGE, page*PER_PAGE))
        setTotal(filtered.length)
      }
    } catch {
      setAppts([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }

  const openStatusModal = (appt, newStatus) => {
    setModalAppt(appt)
    setModalStatus(newStatus)
    setModalNote('')
    setModal(true)
  }

  const handleStatusUpdate = async () => {
    if (!modalAppt) return
    setUpdating(true)
    try {
      const updated = await updateStatus(modalAppt.id, modalStatus,
        modalStatus === 'cancelled' ? modalNote : undefined)
      setAppts(prev => prev.map(a => a.id === updated.id ? updated : a))
      setModal(false)
    } catch {
      alert('Failed to update status. Please try again.')
    } finally {
      setUpdating(false)
    }
  }

  const handleSaveNotes = async () => {
    if (!notesAppt) return
    setSavingNotes(true)
    try {
      const { updateAppointment } = await import('../../api/appointments')
      const updated = await updateAppointment(notesAppt.id, { consultation_notes: notesText })
      setAppts(prev => prev.map(a => a.id === updated.id ? updated : a))
      setNotesModal(false)
    } catch {
      alert('Failed to save notes.')
    } finally {
      setSavingNotes(false)
    }
  }

  const fmt = (dt) => {
    if (!dt) return '—'
    return new Date(dt).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }) +
      ' · ' + new Date(dt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  }

  const statusActions = (appt) => {
    const s = appt.status
    if (s === 'pending')   return ['confirmed', 'cancelled', 'no_show']
    if (s === 'confirmed') return ['completed', 'cancelled', 'no_show']
    return []
  }

  const actionLabel = { confirmed: 'Confirm', completed: 'Complete', cancelled: 'Cancel', no_show: 'No show' }
  const actionColor = { confirmed: '#1a3a5c', completed: '#1D9E75', cancelled: '#c0392b', no_show: '#888' }

  return (
    <div style={pg}>
      <style>{css}</style>
      <Navbar />

      <div style={wrap}>
        {/* Header */}
        <div>
          <h1 style={h1}>My schedule</h1>
          <p style={sub}>Manage and update your appointments</p>
        </div>

        {/* View tabs + status filter */}
        <div style={filterBar}>
          <div style={{ display: 'flex', gap: '4px', background: '#f5f3ee', borderRadius: '8px', padding: '4px' }}>
            {[
              { key: 'today',    label: "Today" },
              { key: 'upcoming', label: '7 days' },
            ].map(v => (
              <button key={v.key} onClick={() => { setView(v.key); setPage(1) }} style={{ padding: '7px 16px', borderRadius: '6px', border: 'none', fontSize: '13px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', background: view === v.key ? '#fff' : 'transparent', color: view === v.key ? '#1a1a2e' : '#888', boxShadow: view === v.key ? '0 1px 4px rgba(0,0,0,.08)' : 'none', transition: 'all .15s' }}>
                {v.label}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {STATUSES.map(s => (
              <button key={s} onClick={() => { setStatus(s); setPage(1) }}
                style={{ padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', border: 'none', background: statusFilter === s ? '#1a3a5c' : '#fff', color: statusFilter === s ? '#fff' : '#666', border: statusFilter === s ? 'none' : '0.5px solid #e0ddd6', transition: 'all .15s' }}>
                {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1).replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        {loading ? <PageLoader /> : appts.length === 0 ? (
          <EmptyState icon="📅" message="No appointments found" sub="Try switching views or clearing filters" />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: '#e8e6df', borderRadius: '12px', overflow: 'hidden' }}>
            {appts.map(appt => (
              <div key={appt.id} style={{ background: '#fff' }}>
                {/* Row */}
                <div style={apptRow} className="appt-row" onClick={() => setExpandedId(expandedId === appt.id ? null : appt.id)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: 0 }}>
                    <div style={avatar(appt)}>
                      {appt.patient?.full_name?.split(' ').map(w => w[0]).join('').slice(0, 2) || 'PT'}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontWeight: 600, fontSize: '14px', color: '#1a1a2e', marginBottom: '3px' }}>
                        {appt.patient?.full_name || 'Patient'}
                      </p>
                      <p style={{ fontSize: '12px', color: '#888' }}>{fmt(appt.appointment_datetime)}</p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                    {/* Status action buttons */}
                    {statusActions(appt).map(s => (
                      <button key={s} onClick={() => openStatusModal(appt, s)}
                        style={{ background: `${actionColor[s]}15`, color: actionColor[s], border: `0.5px solid ${actionColor[s]}40`, padding: '5px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s' }}
                        className="action-btn">
                        {actionLabel[s]}
                      </button>
                    ))}

                    {/* Add notes button */}
                    {['confirmed', 'completed'].includes(appt.status) && (
                      <button onClick={() => { setNotesAppt(appt); setNotesText(appt.consultation_notes || ''); setNotesModal(true) }}
                        style={{ background: '#f5f3ee', color: '#555', border: '0.5px solid #e0ddd6', padding: '5px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
                        📝 Notes
                      </button>
                    )}

                    <StatusBadge status={appt.status} size="sm" />
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                      style={{ transform: expandedId === appt.id ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform .2s', cursor: 'pointer' }}
                      onClick={() => setExpandedId(expandedId === appt.id ? null : appt.id)}>
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </div>
                </div>

                {/* Expanded detail */}
                {expandedId === appt.id && (
                  <div style={{ padding: '0 20px 18px', borderTop: '0.5px solid #f0ede6' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', paddingTop: '16px' }}>
                      {[
                        { label: 'Patient', value: appt.patient?.full_name },
                        { label: 'Phone', value: appt.patient?.phone || '—' },
                        { label: 'Blood type', value: appt.patient?.blood_type || '—' },
                        { label: 'Time', value: fmt(appt.appointment_datetime) },
                        { label: 'Duration', value: `${Math.round((new Date(appt.end_datetime) - new Date(appt.appointment_datetime)) / 60000)} min` },
                        { label: 'First visit', value: appt.is_first_visit ? 'Yes' : 'No' },
                        { label: 'Reason', value: appt.reason || '—' },
                        ...(appt.notes ? [{ label: 'Patient notes', value: appt.notes }] : []),
                        ...(appt.consultation_notes ? [{ label: 'Consultation notes', value: appt.consultation_notes }] : []),
                      ].map((item, i) => (
                        <div key={i}>
                          <p style={{ fontSize: '11px', color: '#aaa', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '4px' }}>{item.label}</p>
                          <p style={{ fontSize: '13px', color: '#333', fontWeight: 500 }}>{item.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <Pagination page={page} perPage={PER_PAGE} total={total} onPageChange={setPage} />
      </div>

      {/* Status update modal */}
      <ConfirmModal
        open={modal}
        onClose={() => setModal(false)}
        onConfirm={handleStatusUpdate}
        title={`Mark as ${actionLabel[modalStatus]}`}
        message={
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <p>Update <strong>{modalAppt?.patient?.full_name || 'this patient'}</strong>'s appointment status to <strong>{modalStatus?.replace('_', ' ')}</strong>?</p>
            {modalStatus === 'cancelled' && (
              <div>
                <label style={{ fontSize: '13px', fontWeight: 500, color: '#444', display: 'block', marginBottom: '6px' }}>Reason (optional)</label>
                <input type="text" placeholder="e.g. Doctor unavailable" value={modalNote} onChange={e => setModalNote(e.target.value)}
                  style={{ width: '100%', border: '0.5px solid #d0cec7', borderRadius: '7px', padding: '10px 12px', fontSize: '14px', fontFamily: 'inherit', outline: 'none' }} />
              </div>
            )}
          </div>
        }
        confirmLabel={`Yes, mark as ${modalStatus?.replace('_', ' ')}`}
        danger={modalStatus === 'cancelled'}
        loading={updating}
      />

      {/* Consultation notes modal */}
      {notesModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(13,33,55,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ background: '#fff', borderRadius: '14px', width: '100%', maxWidth: '500px', overflow: 'hidden', fontFamily: "'Instrument Sans',sans-serif" }}>
            <div style={{ padding: '18px 22px', borderBottom: '0.5px solid #e8e6df', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600 }}>Consultation notes</h3>
              <button onClick={() => setNotesModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999', fontSize: '18px', lineHeight: 1 }}>✕</button>
            </div>
            <div style={{ padding: '20px 22px' }}>
              <p style={{ fontSize: '13px', color: '#888', marginBottom: '12px' }}>
                Patient: <strong style={{ color: '#333' }}>{notesAppt?.patient?.full_name}</strong>
              </p>
              <textarea value={notesText} onChange={e => setNotesText(e.target.value)} rows={6} placeholder="Enter diagnosis, treatment plan, and any follow-up instructions..."
                style={{ width: '100%', border: '0.5px solid #d0cec7', borderRadius: '8px', padding: '12px', fontSize: '14px', fontFamily: 'inherit', resize: 'vertical', outline: 'none', lineHeight: 1.6 }} />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                <button onClick={() => setNotesModal(false)} style={{ background: 'transparent', border: '0.5px solid #d0cec7', color: '#666', padding: '9px 18px', borderRadius: '7px', fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                <button onClick={handleSaveNotes} disabled={savingNotes} style={{ background: '#1a3a5c', color: '#fff', border: 'none', padding: '9px 20px', borderRadius: '7px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: savingNotes ? 0.7 : 1 }}>
                  {savingNotes ? 'Saving...' : 'Save notes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const avatarColors = ['#1a3a5c','#27ae60','#c0392b','#8e44ad','#e67e22']
const avatar = (appt) => ({ width: '40px', height: '40px', borderRadius: '50%', background: avatarColors[Math.abs((appt.patient?.full_name?.charCodeAt(0) || 0)) % avatarColors.length], color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 600, flexShrink: 0 })

const pg        = { background: '#f5f3ee', minHeight: '100vh', fontFamily: "'Instrument Sans','DM Sans',sans-serif" }
const wrap      = { maxWidth: '1000px', margin: '0 auto', padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: '20px' }
const h1        = { fontFamily: "'Instrument Serif',serif", fontSize: '28px', color: '#1a1a2e', fontWeight: 400 }
const sub       = { fontSize: '14px', color: '#888', marginTop: '4px' }
const filterBar = { background: '#fff', border: '0.5px solid #e8e6df', borderRadius: '12px', padding: '14px 18px', display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between' }
const apptRow   = { padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', cursor: 'pointer', transition: 'background .15s' }

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600&family=Instrument+Serif:ital@0;1&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  .appt-row:hover{background:#fafaf8!important}
  .action-btn:hover{opacity:.8}
`
