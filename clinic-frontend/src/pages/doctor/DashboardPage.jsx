import { useState, useEffect, useContext } from 'react'
import { Link } from 'react-router-dom'
import { AuthContext } from '../../context/AuthContext'
import { getDoctorDashboard } from '../../api/analytics'
import { getToday, getUpcoming } from '../../api/appointments'
import { getNotifications } from '../../api/notifications'
import StatusBadge from '../../components/StatusBadge'
import { PageLoader } from '../../components/Spinner'
import Navbar from '../../components/Navbar'

export default function DoctorDashboard() {
  const { user } = useContext(AuthContext)

  const [stats, setStats]       = useState(null)
  const [today, setToday]       = useState([])
  const [upcoming, setUpcoming] = useState([])
  const [notifs, setNotifs]     = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    Promise.all([
      getDoctorDashboard().catch(() => null),
      getToday().catch(() => []),
      getUpcoming().catch(() => []),
      getNotifications().catch(() => []),
    ]).then(([statsData, todayData, upcomingData, notifData]) => {
      setStats(statsData)
      setToday(todayData || [])
      setUpcoming((upcomingData || []).slice(0, 5))
      setNotifs((notifData || []).slice(0, 5))
    }).finally(() => setLoading(false))
  }, [])

  const fmt = (dt) => {
    if (!dt) return '—'
    return new Date(dt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  }

  const fmtFull = (dt) => {
    if (!dt) return '—'
    return new Date(dt).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }) + ' · ' + fmt(dt)
  }

  const timeOfDay = () => {
    const h = new Date().getHours()
    if (h < 12) return 'morning'
    if (h < 17) return 'afternoon'
    return 'evening'
  }

  const todayStr = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })

  if (loading) return (<><Navbar /><PageLoader /></>)

  const name = stats?.full_name || user?.email?.split('@')[0] || 'Doctor'
  const firstName = name.replace('Dr. ', '').split(' ')[0]

  return (
    <div style={pg}>
      <style>{css}</style>
      <Navbar />

      <div style={wrap}>
        {/* ── HEADER ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <p style={{ fontSize: '13px', color: '#888', marginBottom: '4px' }}>Good {timeOfDay()}</p>
            <h1 style={h1}>Dr. {firstName} 👨‍⚕️</h1>
            <p style={{ fontSize: '14px', color: '#888' }}>{todayStr}</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <Link to="/doctor/schedule"     style={outlineBtn}>View schedule</Link>
            <Link to="/doctor/availability" style={primaryBtn}>Manage availability</Link>
          </div>
        </div>

        {/* ── STATS ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px' }}>
          {[
            { label: 'Total appointments', value: stats?.total_appointments ?? '—', icon: '📅', bg: '#E6F1FB', color: '#0C447C' },
            { label: 'Completed',          value: stats?.completed           ?? '—', icon: '✅', bg: '#E1F5EE', color: '#085041' },
            { label: 'Unique patients',    value: stats?.unique_patients     ?? '—', icon: '👥', bg: '#EEEDFE', color: '#3C3489' },
            { label: 'Completion rate',    value: stats?.completion_rate_pct != null ? `${stats.completion_rate_pct}%` : '—', icon: '📊', bg: '#FAEEDA', color: '#633806' },
            { label: 'Rating',             value: stats?.rating != null ? `${Number(stats.rating).toFixed(1)} ★` : '—', icon: '⭐', bg: '#FCEBEB', color: '#791F1F' },
            { label: 'Reviews',            value: stats?.total_reviews       ?? '—', icon: '💬', bg: '#F1EFE8', color: '#5F5E5A' },
          ].map((s, i) => (
            <div key={i} className="stat-card" style={{ background: s.bg, borderRadius: '12px', padding: '18px' }}>
              <span style={{ fontSize: '20px' }}>{s.icon}</span>
              <p style={{ fontSize: '26px', fontWeight: 600, color: s.color, margin: '8px 0 2px', lineHeight: 1 }}>{s.value}</p>
              <p style={{ fontSize: '12px', color: s.color, opacity: 0.7 }}>{s.label}</p>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>

          {/* ── TODAY'S SCHEDULE ── */}
          <div style={card}>
            <div style={cardHead}>
              <div>
                <h2 style={cardTitle}>Today's schedule</h2>
                <p style={{ fontSize: '12px', color: '#aaa', marginTop: '2px' }}>{today.length} appointment{today.length !== 1 ? 's' : ''}</p>
              </div>
              <Link to="/doctor/schedule" style={seeAll}>Full schedule →</Link>
            </div>

            {today.length === 0 ? (
              <div style={empty}>
                <span style={{ fontSize: '32px' }}>🌟</span>
                <p style={{ fontWeight: 500, color: '#555' }}>No appointments today</p>
                <p style={{ fontSize: '13px', color: '#999' }}>Enjoy your day off!</p>
              </div>
            ) : (
              <div style={listWrap}>
                {today.map((appt, i) => (
                  <div key={appt.id} style={apptRow} className="appt-row">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: '14px', fontWeight: 700, color: '#1a3a5c' }}>{fmt(appt.appointment_datetime)}</p>
                        <p style={{ fontSize: '11px', color: '#bbb' }}>{fmt(appt.end_datetime)}</p>
                      </div>
                      <div style={{ width: '1px', height: '32px', background: '#e8e6df', margin: '0 12px' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 600, fontSize: '14px', color: '#1a1a2e', marginBottom: '2px' }}>
                        {appt.patient?.full_name || 'Patient'}
                      </p>
                      <p style={{ fontSize: '12px', color: '#888', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {appt.reason || 'No reason provided'}
                      </p>
                    </div>
                    <StatusBadge status={appt.status} size="sm" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── UPCOMING ── */}
          <div style={card}>
            <div style={cardHead}>
              <div>
                <h2 style={cardTitle}>Upcoming (7 days)</h2>
                <p style={{ fontSize: '12px', color: '#aaa', marginTop: '2px' }}>{upcoming.length} appointment{upcoming.length !== 1 ? 's' : ''}</p>
              </div>
            </div>

            {upcoming.length === 0 ? (
              <div style={empty}>
                <span style={{ fontSize: '32px' }}>📅</span>
                <p style={{ fontWeight: 500, color: '#555' }}>Nothing upcoming</p>
              </div>
            ) : (
              <div style={listWrap}>
                {upcoming.map(appt => (
                  <div key={appt.id} style={apptRow} className="appt-row">
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 600, fontSize: '14px', color: '#1a1a2e', marginBottom: '2px' }}>
                        {appt.patient?.full_name || 'Patient'}
                      </p>
                      <p style={{ fontSize: '12px', color: '#888' }}>{fmtFull(appt.appointment_datetime)}</p>
                    </div>
                    <StatusBadge status={appt.status} size="sm" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── QUICK LINKS ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
          {[
            { label: 'My schedule',       icon: '🗓️', to: '/doctor/schedule',     bg: '#E6F1FB' },
            { label: 'Manage slots',      icon: '⏰', to: '/doctor/availability', bg: '#E1F5EE' },
            { label: 'My profile',        icon: '👤', to: '/doctor/profile',      bg: '#FAEEDA' },
          ].map((item, i) => (
            <Link key={i} to={item.to} style={{ ...quickLink, background: item.bg }} className="quick-link">
              <span style={{ fontSize: '24px' }}>{item.icon}</span>
              <span style={{ fontSize: '13px', fontWeight: 500, color: '#1a1a2e' }}>{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

const pg        = { background: '#f5f3ee', minHeight: '100vh', fontFamily: "'Instrument Sans','DM Sans',sans-serif" }
const wrap      = { maxWidth: '1100px', margin: '0 auto', padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: '24px' }
const h1        = { fontFamily: "'Instrument Serif',serif", fontSize: '32px', color: '#1a1a2e', fontWeight: 400, margin: '0 0 4px' }
const card      = { background: '#fff', border: '0.5px solid #e8e6df', borderRadius: '14px', padding: '22px' }
const cardHead  = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }
const cardTitle = { fontSize: '16px', fontWeight: 600, color: '#1a1a2e' }
const seeAll    = { fontSize: '13px', color: '#1a3a5c', textDecoration: 'none', fontWeight: 500, flexShrink: 0 }
const listWrap  = { display: 'flex', flexDirection: 'column', gap: '1px', background: '#f0ede6', borderRadius: '8px', overflow: 'hidden' }
const apptRow   = { padding: '12px 14px', background: '#fff', display: 'flex', alignItems: 'center', gap: '10px' }
const empty     = { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', padding: '32px', textAlign: 'center' }
const quickLink = { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '20px 12px', borderRadius: '12px', textDecoration: 'none', transition: 'transform .2s', textAlign: 'center' }
const primaryBtn = { display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#1a3a5c', color: '#fff', padding: '10px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }
const outlineBtn = { display: 'inline-flex', alignItems: 'center', gap: '8px', border: '0.5px solid #1a3a5c', color: '#1a3a5c', padding: '10px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 500, textDecoration: 'none' }

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600&family=Instrument+Serif:ital@0;1&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  .stat-card{transition:transform .2s}.stat-card:hover{transform:translateY(-2px)}
  .appt-row:hover{background:#fafaf8!important}
  .quick-link:hover{transform:translateY(-3px)}
`
