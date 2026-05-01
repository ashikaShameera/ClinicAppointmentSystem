import { useState, useEffect, useContext } from 'react'
import { AuthContext } from '../../context/AuthContext'
import { getPatientHistory, updateStatus } from '../../api/appointments'
// import { getPatients } from '../../api/patients'
import { getMyProfile } from '../../api/patients'
import StatusBadge from '../../components/StatusBadge'
import Pagination from '../../components/Pagination'
import { ConfirmModal } from '../../components/Modal'
import { PageLoader } from '../../components/Spinner'
import { EmptyState } from '../../components/ErrorMessage'
import Navbar from '../../components/Navbar'

const STATUSES = ['', 'pending', 'confirmed', 'completed', 'cancelled', 'no_show']

export default function AppointmentHistory() {
  const { user } = useContext(AuthContext)

  const [patientId, setPatientId] = useState(null)
  const [appts, setAppts]         = useState([])
  const [total, setTotal]         = useState(0)
  const [page, setPage]           = useState(1)
  const [status, setStatus]       = useState('')
  const [dateFrom, setDateFrom]   = useState('')
  const [dateTo, setDateTo]       = useState('')
  const [loading, setLoading]     = useState(true)

  const [cancelModal, setCancelModal] = useState(false)
  const [cancelTarget, setCancelTarget] = useState(null)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelling, setCancelling]   = useState(false)

  const [expandedId, setExpandedId] = useState(null)

  const PER_PAGE = 8

  // Get patient ID first
useEffect(() => {
  getMyProfile()
    .then(data => setPatientId(data.id))
    .catch(() => {})
}, [])

  // Load appointments
  useEffect(() => {
    if (!patientId) return
    setLoading(true)
    const params = { page, per_page: PER_PAGE }
    if (status)   params.status    = status
    if (dateFrom) params.date_from = dateFrom + 'T00:00:00'
    if (dateTo)   params.date_to   = dateTo   + 'T23:59:59'

    getPatientHistory(patientId, params)
      .then(data => { setAppts(data.appointments || []); setTotal(data.total || 0) })
      .catch(() => { setAppts([]); setTotal(0) })
      .finally(() => setLoading(false))
  }, [patientId, page, status, dateFrom, dateTo])

  const handleCancel = async () => {
    if (!cancelTarget) return
    setCancelling(true)
    try {
      await updateStatus(cancelTarget.id, 'cancelled', cancelReason)
      setAppts(prev => prev.map(a => a.id === cancelTarget.id ? { ...a, status: 'cancelled', cancellation_reason: cancelReason } : a))
      setCancelModal(false)
      setCancelTarget(null)
      setCancelReason('')
    } catch {
      alert('Could not cancel appointment. Please try again.')
    } finally {
      setCancelling(false)
    }
  }

  const fmt = (dt) => {
    if (!dt) return '—'
    return new Date(dt).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) +
      ' · ' + new Date(dt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  }

  const canCancel = (a) => ['pending', 'confirmed'].includes(a.status)

  const resetFilters = () => { setStatus(''); setDateFrom(''); setDateTo(''); setPage(1) }
  const hasFilters   = status || dateFrom || dateTo

  if (!patientId && !loading) return (
    <div style={pg}><Navbar />
      <div style={{ textAlign: 'center', padding: '80px 24px', fontFamily: "'Instrument Sans',sans-serif" }}>
        <p style={{ fontSize: '16px', color: '#666' }}>Patient profile not found. Please complete your profile first.</p>
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
            <h1 style={h1}>Appointment history</h1>
            <p style={sub}>{total} appointment{total !== 1 ? 's' : ''} found</p>
          </div>
        </div>

        {/* Filters */}
        <div style={filterBar}>
          {/* Status tabs */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {STATUSES.map(s => (
              <button
                key={s}
                onClick={() => { setStatus(s); setPage(1) }}
                className="tab-btn"
                style={{ padding: '7px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', border: 'none', transition: 'all .15s', background: status === s ? '#1a3a5c' : '#fff', color: status === s ? '#fff' : '#555', border: status === s ? 'none' : '0.5px solid #e0ddd6' }}
              >
                {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1).replace('_', ' ')}
              </button>
            ))}
          </div>

          {/* Date range */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <input type="date" className="inp" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1) }} style={dateInput} placeholder="From" />
            <span style={{ color: '#aaa', fontSize: '13px' }}>to</span>
            <input type="date" className="inp" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1) }} style={dateInput} placeholder="To" />
            {hasFilters && (
              <button onClick={resetFilters} style={{ background: 'none', border: 'none', color: '#888', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'underline' }}>Clear</button>
            )}
          </div>
        </div>

        {/* List */}
        {loading ? <PageLoader /> : appts.length === 0 ? (
          <EmptyState
            icon="📅"
            message="No appointments found"
            sub={hasFilters ? 'Try adjusting your filters' : 'Book your first appointment to get started'}
            action={!hasFilters ? { label: 'Book appointment', onClick: () => window.location.href = '/patient/book' } : undefined}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: '#e8e6df', borderRadius: '12px', overflow: 'hidden' }}>
            {appts.map(appt => (
              <div key={appt.id} style={{ background: '#fff' }}>
                {/* Row */}
                <div
                  style={apptRow}
                  className="appt-row"
                  onClick={() => setExpandedId(expandedId === appt.id ? null : appt.id)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: 0 }}>
                    <div style={avatar(appt)}>
                      {appt.doctor?.full_name?.split(' ').filter(w => w !== 'Dr.').map(w => w[0]).join('').slice(0, 2) || 'DR'}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontWeight: 600, fontSize: '14px', color: '#1a1a2e', marginBottom: '3px' }}>
                        {appt.doctor?.full_name || 'Doctor'}
                      </p>
                      <p style={{ fontSize: '12px', color: '#888' }}>{fmt(appt.appointment_datetime)}</p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                    {appt.reason && <span style={reasonChip}>{appt.reason.length > 24 ? appt.reason.slice(0, 24) + '…' : appt.reason}</span>}
                    <StatusBadge status={appt.status} size="sm" />
                    {canCancel(appt) && (
                      <button
                        onClick={e => { e.stopPropagation(); setCancelTarget(appt); setCancelModal(true) }}
                        className="cancel-btn"
                        style={cancelBtnStyle}
                      >
                        Cancel
                      </button>
                    )}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: expandedId === appt.id ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform .2s' }}>
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </div>
                </div>

                {/* Expanded detail */}
                {expandedId === appt.id && (
                  <div style={{ padding: '0 20px 18px', borderTop: '0.5px solid #f0ede6', marginTop: '0' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', paddingTop: '16px' }}>
                      {[
                        { label: 'Doctor', value: appt.doctor?.full_name },
                        { label: 'Date & time', value: fmt(appt.appointment_datetime) },
                        { label: 'End time', value: new Date(appt.end_datetime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) },
                        { label: 'Reason', value: appt.reason || '—' },
                        { label: 'First visit', value: appt.is_first_visit ? 'Yes' : 'No' },
                        { label: 'Consultation fee', value: appt.doctor?.consultation_fee ? `£${Number(appt.doctor.consultation_fee).toFixed(2)}` : '—' },
                        ...(appt.consultation_notes ? [{ label: 'Consultation notes', value: appt.consultation_notes }] : []),
                        ...(appt.cancellation_reason ? [{ label: 'Cancellation reason', value: appt.cancellation_reason }] : []),
                      ].map((item, i) => (
                        <div key={i}>
                          <p style={{ fontSize: '11px', color: '#aaa', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '4px' }}>{item.label}</p>
                          <p style={{ fontSize: '14px', color: '#333', fontWeight: 500 }}>{item.value}</p>
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

      {/* Cancel modal */}
      <ConfirmModal
        open={cancelModal}
        onClose={() => { setCancelModal(false); setCancelTarget(null); setCancelReason('') }}
        onConfirm={handleCancel}
        title="Cancel appointment"
        message={
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <p>Are you sure you want to cancel your appointment with <strong>{cancelTarget?.doctor?.full_name}</strong>?</p>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 500, color: '#444', display: 'block', marginBottom: '6px' }}>Reason (optional)</label>
              <input
                type="text"
                placeholder="e.g. Schedule conflict"
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                style={{ width: '100%', border: '0.5px solid #d0cec7', borderRadius: '7px', padding: '10px 12px', fontSize: '14px', fontFamily: 'inherit', outline: 'none' }}
              />
            </div>
          </div>
        }
        confirmLabel="Yes, cancel appointment"
        danger
        loading={cancelling}
      />
    </div>
  )
}

const avatarBg = ['#1a3a5c','#27ae60','#c0392b','#8e44ad','#e67e22']
const avatar = (appt, i = 0) => ({ width: '40px', height: '40px', borderRadius: '50%', background: avatarBg[Math.abs(appt.id?.charCodeAt(0) || 0) % avatarBg.length], color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 600, flexShrink: 0 })

const pg          = { background: '#f5f3ee', minHeight: '100vh', fontFamily: "'Instrument Sans','DM Sans',sans-serif" }
const wrap        = { maxWidth: '900px', margin: '0 auto', padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: '20px' }
const h1          = { fontFamily: "'Instrument Serif',serif", fontSize: '28px', color: '#1a1a2e', fontWeight: 400 }
const sub         = { fontSize: '14px', color: '#888', marginTop: '4px' }
const filterBar   = { background: '#fff', border: '0.5px solid #e8e6df', borderRadius: '12px', padding: '16px 20px', display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between' }
const dateInput   = { border: '0.5px solid #d0cec7', borderRadius: '7px', padding: '8px 10px', fontSize: '13px', fontFamily: 'inherit', color: '#1a1a2e', background: '#fff', outline: 'none' }
const apptRow     = { padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', cursor: 'pointer', transition: 'background .15s' }
const reasonChip  = { background: '#f5f3ee', color: '#666', padding: '3px 9px', borderRadius: '20px', fontSize: '11px', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }
const cancelBtnStyle = { background: '#FCEBEB', color: '#791F1F', border: 'none', padding: '5px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', transition: 'background .15s' }

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600&family=Instrument+Serif:ital@0;1&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  .appt-row:hover{background:#fafaf8!important}
  .cancel-btn:hover{background:#F7C1C1!important}
  .inp:focus{border-color:#1a3a5c!important;outline:none}
  .tab-btn:hover{opacity:.85}
`
