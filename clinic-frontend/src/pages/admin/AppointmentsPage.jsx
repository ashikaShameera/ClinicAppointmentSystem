import { useState, useEffect } from 'react'
import { getAppointments, updateStatus } from '../../api/appointments'
import StatusBadge from '../../components/StatusBadge'
import Pagination from '../../components/Pagination'
import { ConfirmModal } from '../../components/Modal'
import { PageLoader } from '../../components/Spinner'
import { EmptyState } from '../../components/ErrorMessage'
import Navbar from '../../components/Navbar'

const STATUSES  = ['', 'pending', 'confirmed', 'completed', 'cancelled', 'no_show']
const PER_PAGE  = 12

export default function AdminAppointmentsPage() {
  const [appts, setAppts]         = useState([])
  const [total, setTotal]         = useState(0)
  const [page, setPage]           = useState(1)
  const [status, setStatus]       = useState('')
  const [dateFrom, setDateFrom]   = useState('')
  const [dateTo, setDateTo]       = useState('')
  const [loading, setLoading]     = useState(true)
  const [expandedId, setExpandedId] = useState(null)

  const [statusModal, setStatusModal]   = useState(false)
  const [statusTarget, setStatusTarget] = useState(null)
  const [newStatus, setNewStatus]       = useState('')
  const [cancelReason, setCancelReason] = useState('')
  const [updating, setUpdating]         = useState(false)

  useEffect(() => { load() }, [page, status, dateFrom, dateTo])

  const load = () => {
    setLoading(true)
    const params = { page, per_page: PER_PAGE }
    if (status)   params.status    = status
    if (dateFrom) params.date_from = dateFrom + 'T00:00:00'
    if (dateTo)   params.date_to   = dateTo   + 'T23:59:59'
    getAppointments(params)
      .then(data => { setAppts(data.appointments || []); setTotal(data.total || 0) })
      .catch(() => { setAppts([]); setTotal(0) })
      .finally(() => setLoading(false))
  }

  const openStatusModal = (appt, s) => {
    setStatusTarget(appt)
    setNewStatus(s)
    setCancelReason('')
    setStatusModal(true)
  }

  const handleStatusUpdate = async () => {
    setUpdating(true)
    try {
      const updated = await updateStatus(statusTarget.id, newStatus,
        newStatus === 'cancelled' ? cancelReason : undefined)
      setAppts(prev => prev.map(a => a.id === updated.id ? updated : a))
      setStatusModal(false)
    } catch { alert('Failed to update status.') }
    finally { setUpdating(false) }
  }

  const fmt = (dt) => {
    if (!dt) return '—'
    return new Date(dt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) +
      ' · ' + new Date(dt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  }

  const resetFilters = () => { setStatus(''); setDateFrom(''); setDateTo(''); setPage(1) }
  const hasFilters   = status || dateFrom || dateTo

  const actionColors = { confirmed: '#1a3a5c', completed: '#1D9E75', cancelled: '#c0392b', no_show: '#888' }
  const actionLabels = { confirmed: 'Confirm', completed: 'Complete', cancelled: 'Cancel', no_show: 'No show' }

  const availableActions = (appt) => {
    if (appt.status === 'pending')   return ['confirmed', 'cancelled', 'no_show']
    if (appt.status === 'confirmed') return ['completed', 'cancelled', 'no_show']
    return []
  }

  const avatarColors = ['#1a3a5c','#27ae60','#c0392b','#8e44ad','#e67e22']
  const avatarBg = (name) => avatarColors[Math.abs(name?.charCodeAt(0) || 0) % avatarColors.length]

  return (
    <div style={pg}>
      <style>{css}</style>
      <Navbar />

      <div style={wrap}>
        {/* Header */}
        <div>
          <h1 style={h1}>Appointments</h1>
          <p style={sub}>{total} appointment{total !== 1 ? 's' : ''} found</p>
        </div>

        {/* Filters */}
        <div style={{ background: '#fff', border: '0.5px solid #e8e6df', borderRadius: '12px', padding: '16px 20px', display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {STATUSES.map(s => (
              <button key={s} onClick={() => { setStatus(s); setPage(1) }}
                style={{ padding: '7px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', border: 'none', background: status === s ? '#1a3a5c' : '#fff', color: status === s ? '#fff' : '#555', border: status === s ? 'none' : '0.5px solid #e0ddd6', transition: 'all .15s' }}>
                {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1).replace('_', ' ')}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <input type="date" className="inp" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1) }}
              style={{ border: '0.5px solid #d0cec7', borderRadius: '7px', padding: '8px 10px', fontSize: '13px', fontFamily: 'inherit', background: '#fff', outline: 'none' }} />
            <span style={{ color: '#aaa', fontSize: '13px' }}>to</span>
            <input type="date" className="inp" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1) }}
              style={{ border: '0.5px solid #d0cec7', borderRadius: '7px', padding: '8px 10px', fontSize: '13px', fontFamily: 'inherit', background: '#fff', outline: 'none' }} />
            {hasFilters && <button onClick={resetFilters} style={{ background: 'none', border: 'none', color: '#888', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'underline' }}>Clear</button>}
          </div>
        </div>

        {/* List */}
        {loading ? <PageLoader /> : appts.length === 0 ? (
          <EmptyState icon="📅" message="No appointments found" sub={hasFilters ? 'Try adjusting your filters' : 'No appointments in the system'} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: '#e8e6df', borderRadius: '12px', overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.5fr 1.5fr 1fr auto', padding: '10px 20px', background: '#f5f3ee' }}>
              {['Patient','Doctor','Date & time','Status','Actions'].map(h => (
                <p key={h} style={{ fontSize: '11px', fontWeight: 600, color: '#aaa', textTransform: 'uppercase', letterSpacing: '.06em' }}>{h}</p>
              ))}
            </div>

            {appts.map(appt => (
              <div key={appt.id} style={{ background: '#fff' }}>
                <div style={apptRow} className="appt-row" onClick={() => setExpandedId(expandedId === appt.id ? null : appt.id)}>
                  {/* Patient */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: avatarBg(appt.patient?.full_name), color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 600, flexShrink: 0 }}>
                      {appt.patient?.full_name?.split(' ').map(w => w[0]).join('').slice(0, 2) || 'PT'}
                    </div>
                    <p style={{ fontSize: '13px', fontWeight: 600, color: '#1a1a2e', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{appt.patient?.full_name || '—'}</p>
                  </div>
                  {/* Doctor */}
                  <p style={{ fontSize: '13px', color: '#555', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{appt.doctor?.full_name || '—'}</p>
                  {/* Date */}
                  <p style={{ fontSize: '13px', color: '#555' }}>{fmt(appt.appointment_datetime)}</p>
                  {/* Status */}
                  <StatusBadge status={appt.status} size="sm" />
                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }} onClick={e => e.stopPropagation()}>
                    {availableActions(appt).map(s => (
                      <button key={s} onClick={() => openStatusModal(appt, s)}
                        style={{ background: `${actionColors[s]}15`, color: actionColors[s], border: `0.5px solid ${actionColors[s]}40`, padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}
                        className="action-btn">
                        {actionLabels[s]}
                      </button>
                    ))}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                      style={{ transform: expandedId === appt.id ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform .2s', cursor: 'pointer' }}>
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </div>
                </div>

                {expandedId === appt.id && (
                  <div style={{ padding: '0 20px 18px', borderTop: '0.5px solid #f5f3ee' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', paddingTop: '16px' }}>
                      {[
                        { label: 'Appointment ID', value: appt.id?.slice(0, 18) + '...' },
                        { label: 'Reason', value: appt.reason || '—' },
                        { label: 'Patient notes', value: appt.notes || '—' },
                        { label: 'Consultation notes', value: appt.consultation_notes || '—' },
                        { label: 'First visit', value: appt.is_first_visit ? 'Yes' : 'No' },
                        { label: 'End time', value: new Date(appt.end_datetime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) },
                        { label: 'Duration', value: `${Math.round((new Date(appt.end_datetime) - new Date(appt.appointment_datetime)) / 60000)} min` },
                        { label: 'Booked at', value: fmt(appt.created_at) },
                        ...(appt.cancellation_reason ? [{ label: 'Cancellation reason', value: appt.cancellation_reason }] : []),
                      ].map((item, i) => (
                        <div key={i}>
                          <p style={{ fontSize: '11px', color: '#aaa', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '4px' }}>{item.label}</p>
                          <p style={{ fontSize: '13px', color: '#333', fontWeight: 500, lineHeight: 1.5 }}>{item.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <Pagination page={page} perPage={PER_PAGE} total={total} onPageChange={p => { setPage(p); window.scrollTo(0,0) }} />
      </div>

      <ConfirmModal
        open={statusModal}
        onClose={() => setStatusModal(false)}
        onConfirm={handleStatusUpdate}
        title={`Mark as ${newStatus?.replace('_', ' ')}`}
        message={
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <p>Update <strong>{statusTarget?.patient?.full_name}</strong>'s appointment to <strong>{newStatus?.replace('_', ' ')}</strong>?</p>
            {newStatus === 'cancelled' && (
              <div>
                <label style={{ fontSize: '13px', fontWeight: 500, color: '#444', display: 'block', marginBottom: '6px' }}>Reason (optional)</label>
                <input type="text" placeholder="e.g. Doctor unavailable" value={cancelReason} onChange={e => setCancelReason(e.target.value)}
                  style={{ width: '100%', border: '0.5px solid #d0cec7', borderRadius: '7px', padding: '10px 12px', fontSize: '14px', fontFamily: 'inherit', outline: 'none' }} />
              </div>
            )}
          </div>
        }
        confirmLabel={`Confirm: ${newStatus?.replace('_', ' ')}`}
        danger={newStatus === 'cancelled'}
        loading={updating}
      />
    </div>
  )
}

const pg      = { background: '#f5f3ee', minHeight: '100vh', fontFamily: "'Instrument Sans','DM Sans',sans-serif" }
const wrap    = { maxWidth: '1200px', margin: '0 auto', padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: '20px' }
const h1      = { fontFamily: "'Instrument Serif',serif", fontSize: '28px', color: '#1a1a2e', fontWeight: 400 }
const sub     = { fontSize: '14px', color: '#888', marginTop: '4px' }
const apptRow = { display: 'grid', gridTemplateColumns: '1.5fr 1.5fr 1.5fr 1fr auto', padding: '13px 20px', alignItems: 'center', cursor: 'pointer', transition: 'background .15s', gap: '0' }
const css     = `
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600&family=Instrument+Serif:ital@0;1&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  .appt-row:hover{background:#fafaf8!important}
  .inp:focus{border-color:#1a3a5c!important;outline:none}
  .action-btn:hover{opacity:.8}
`
