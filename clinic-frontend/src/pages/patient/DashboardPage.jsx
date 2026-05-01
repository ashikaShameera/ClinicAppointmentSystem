import { useState, useEffect, useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthContext } from '../../context/AuthContext'
import { getUpcoming } from '../../api/appointments'
import { getNotifications, markAllRead } from '../../api/notifications'
// import { getPatients } from '../../api/patients'
import { getMyProfile } from '../../api/patients'
import StatusBadge from '../../components/StatusBadge'
import { PageLoader } from '../../components/Spinner'
import Navbar from '../../components/Navbar'

export default function PatientDashboard() {
  const { user } = useContext(AuthContext)
  const navigate  = useNavigate()

  const [upcoming, setUpcoming]       = useState([])
  const [notifs, setNotifs]           = useState([])
  const [patient, setPatient]         = useState(null)
  const [loading, setLoading]         = useState(true)
  const [markingRead, setMarkingRead] = useState(false)

  useEffect(() => {
    Promise.all([
      getUpcoming().catch(() => []),
      getNotifications().catch(() => []),
      // getPatients({ search: user?.email }).catch(() => ({ patients: [] })),
      getMyProfile().catch(() => null),
    ]).then(([appts, notifList, patientData]) => {
      setUpcoming(appts.slice(0, 5))
      setNotifs(notifList.slice(0, 6))
      // setPatient(patientData.patients?.[0] || null)
      setPatient(patientData || null)                  // ← new
    }).finally(() => setLoading(false))
  }, [user])

  const handleMarkAllRead = async () => {
    setMarkingRead(true)
    await markAllRead().catch(() => {})
    setNotifs(n => n.map(x => ({ ...x, is_read: true })))
    setMarkingRead(false)
  }

  const unreadCount = notifs.filter(n => !n.is_read).length

  const fmt = (dt) => {
    if (!dt) return '—'
    const d = new Date(dt)
    return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }) +
      ' at ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  }

  const timeUntil = (dt) => {
    const diff = new Date(dt) - new Date()
    if (diff < 0) return 'Past'
    const days  = Math.floor(diff / 86400000)
    const hours = Math.floor((diff % 86400000) / 3600000)
    if (days > 0) return `In ${days} day${days > 1 ? 's' : ''}`
    if (hours > 0) return `In ${hours}h`
    return 'Soon'
  }

  if (loading) return (<><Navbar /><PageLoader /></>)

  const name = patient?.full_name || user?.email?.split('@')[0] || 'Patient'
  const firstName = name.split(' ')[0]

  return (
    <div style={pg}>
      <style>{css}</style>
      <Navbar />

      <div style={wrap}>
        {/* ── HEADER ─────────────────────────────────── */}
        <div style={header}>
          <div>
            <p style={greeting}>Good {timeOfDay()}</p>
            <h1 style={h1}>{firstName} 👋</h1>
            <p style={sub}>Here's what's coming up for you</p>
          </div>
          <Link to="/patient/book" style={bookBtn} className="book-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Book appointment
          </Link>
        </div>

        {/* ── STATS ROW ──────────────────────────────── */}
        <div style={statsRow}>
          {[
            { label: 'Upcoming', value: upcoming.length, icon: '📅', color: '#E6F1FB', text: '#0C447C' },
            { label: 'Unread notifications', value: unreadCount, icon: '🔔', color: '#FAEEDA', text: '#633806' },
            { label: 'Blood type', value: patient?.blood_type || '—', icon: '🩸', color: '#FCEBEB', text: '#791F1F' },
            { label: 'Allergies', value: patient?.allergies ? 'On record' : 'None', icon: '⚠️', color: '#E1F5EE', text: '#085041' },
          ].map((s, i) => (
            <div key={i} className="stat-card" style={{ background: s.color, borderRadius: '12px', padding: '20px', flex: 1 }}>
              <span style={{ fontSize: '22px' }}>{s.icon}</span>
              <p style={{ fontSize: '26px', fontWeight: 600, color: s.text, margin: '8px 0 2px', lineHeight: 1 }}>{s.value}</p>
              <p style={{ fontSize: '12px', color: s.text, opacity: 0.7 }}>{s.label}</p>
            </div>
          ))}
        </div>

        <div style={grid2}>
          {/* ── UPCOMING APPOINTMENTS ──────────────────── */}
          <div style={card}>
            <div style={cardHead}>
              <h2 style={cardTitle}>Upcoming appointments</h2>
              <Link to="/patient/appointments" style={seeAll}>See all →</Link>
            </div>

            {upcoming.length === 0 ? (
              <div style={empty}>
                <span style={{ fontSize: '32px' }}>📅</span>
                <p style={{ fontWeight: 500, color: '#555' }}>No upcoming appointments</p>
                <p style={{ fontSize: '13px', color: '#999', marginTop: '4px' }}>Book one to get started</p>
                <Link to="/patient/book" style={emptyBtn}>Book now</Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: '#f0ede6', borderRadius: '8px', overflow: 'hidden' }}>
                {upcoming.map((appt, i) => (
                  <div key={appt.id} style={apptRow} className="appt-row">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                      <div style={avatarCircle(i)}>
                        {appt.doctor?.full_name?.split(' ').filter(w => w !== 'Dr.').map(w => w[0]).join('').slice(0, 2) || 'DR'}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontWeight: 600, fontSize: '14px', color: '#1a1a2e', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {appt.doctor?.full_name || 'Doctor'}
                        </p>
                        <p style={{ fontSize: '12px', color: '#888' }}>{fmt(appt.appointment_datetime)}</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                      <span style={{ fontSize: '11px', color: '#2a6496', background: '#E6F1FB', padding: '2px 8px', borderRadius: '20px', fontWeight: 500 }}>
                        {timeUntil(appt.appointment_datetime)}
                      </span>
                      <StatusBadge status={appt.status} size="sm" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── NOTIFICATIONS ──────────────────────────── */}
          <div style={card}>
            <div style={cardHead}>
              <h2 style={cardTitle}>
                Notifications
                {unreadCount > 0 && (
                  <span style={{ background: '#E24B4A', color: '#fff', borderRadius: '20px', fontSize: '11px', fontWeight: 600, padding: '2px 7px', marginLeft: '8px' }}>
                    {unreadCount}
                  </span>
                )}
              </h2>
              {unreadCount > 0 && (
                <button onClick={handleMarkAllRead} disabled={markingRead} style={markAllBtn} className="mark-btn">
                  {markingRead ? 'Marking...' : 'Mark all read'}
                </button>
              )}
            </div>

            {notifs.length === 0 ? (
              <div style={empty}>
                <span style={{ fontSize: '32px' }}>🔔</span>
                <p style={{ fontWeight: 500, color: '#555' }}>You're all caught up</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: '#f0ede6', borderRadius: '8px', overflow: 'hidden' }}>
                {notifs.map(n => (
                  <div key={n.id} style={{ ...notifRow, background: n.is_read ? '#fff' : '#f5f9ff' }}>
                    <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: n.is_read ? '#ddd' : '#378ADD', flexShrink: 0, marginTop: '5px' }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '13px', fontWeight: n.is_read ? 400 : 600, color: '#1a1a2e', marginBottom: '2px' }}>{n.title}</p>
                      <p style={{ fontSize: '12px', color: '#888', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── QUICK LINKS ────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
          {[
            { label: 'My profile',        icon: '👤', to: '/patient/profile',      color: '#E6F1FB' },
            { label: 'Medical records',   icon: '📋', to: '/patient/records',       color: '#E1F5EE' },
            { label: 'Appointment history', icon: '🗂️', to: '/patient/appointments', color: '#FAEEDA' },
            { label: 'Book appointment',  icon: '📅', to: '/patient/book',          color: '#FCEBEB' },
          ].map((item, i) => (
            <Link key={i} to={item.to} style={{ ...quickLink, background: item.color }} className="quick-link">
              <span style={{ fontSize: '24px' }}>{item.icon}</span>
              <span style={{ fontSize: '13px', fontWeight: 500, color: '#1a1a2e' }}>{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

function timeOfDay() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}

const avatarColors = ['#1a3a5c', '#27ae60', '#c0392b', '#8e44ad', '#e67e22']
const avatarCircle = (i) => ({
  width: '38px', height: '38px', borderRadius: '50%',
  background: avatarColors[i % avatarColors.length],
  color: '#fff', display: 'flex', alignItems: 'center',
  justifyContent: 'center', fontSize: '13px', fontWeight: 600, flexShrink: 0,
})

const pg   = { background: '#f5f3ee', minHeight: '100vh', fontFamily: "'Instrument Sans','DM Sans',sans-serif" }
const wrap = { maxWidth: '1100px', margin: '0 auto', padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: '24px' }
const header = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }
const greeting = { fontSize: '13px', color: '#888', marginBottom: '4px', textTransform: 'capitalize' }
const h1 = { fontFamily: "'Instrument Serif',serif", fontSize: '32px', color: '#1a1a2e', fontWeight: 400, margin: '0 0 4px' }
const sub = { fontSize: '14px', color: '#888' }
const bookBtn = { display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#1a3a5c', color: '#fff', padding: '12px 22px', borderRadius: '8px', fontSize: '14px', fontWeight: 600, textDecoration: 'none', transition: 'background .2s' }
const statsRow = { display: 'flex', gap: '14px', flexWrap: 'wrap' }
const grid2 = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }
const card  = { background: '#fff', border: '0.5px solid #e8e6df', borderRadius: '14px', padding: '22px' }
const cardHead = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }
const cardTitle = { fontSize: '16px', fontWeight: 600, color: '#1a1a2e', display: 'flex', alignItems: 'center' }
const seeAll = { fontSize: '13px', color: '#1a3a5c', textDecoration: 'none', fontWeight: 500 }
const apptRow = { padding: '12px 14px', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }
const notifRow = { padding: '12px 14px', display: 'flex', gap: '10px', alignItems: 'flex-start' }
const empty = { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', padding: '32px', textAlign: 'center', color: '#888', fontSize: '14px' }
const emptyBtn = { marginTop: '8px', background: '#1a3a5c', color: '#fff', padding: '9px 20px', borderRadius: '7px', fontSize: '13px', fontWeight: 500, textDecoration: 'none' }
const markAllBtn = { background: 'none', border: 'none', color: '#1a3a5c', fontSize: '12px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', padding: '4px 10px' }
const quickLink = { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '20px 12px', borderRadius: '12px', textDecoration: 'none', transition: 'transform .2s', textAlign: 'center' }

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600&family=Instrument+Serif:ital@0;1&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  .book-btn:hover{background:#0f2740!important}
  .appt-row:hover{background:#fafaf8!important}
  .quick-link:hover{transform:translateY(-3px)}
  .mark-btn:hover{text-decoration:underline}
  .stat-card{transition:transform .2s}
  .stat-card:hover{transform:translateY(-2px)}
`
