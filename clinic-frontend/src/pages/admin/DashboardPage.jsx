import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { getSummary, getByDoctor, getBySpecialty } from '../../api/analytics'
import { PageLoader } from '../../components/Spinner'
import Navbar from '../../components/Navbar'

export default function AdminDashboard() {
  const [summary, setSummary]       = useState(null)
  const [doctors, setDoctors]       = useState([])
  const [specialties, setSpecialties] = useState([])
  const [loading, setLoading]       = useState(true)

  const barRef  = useRef(null)
  const pieRef  = useRef(null)
  const barChart  = useRef(null)
  const pieChart  = useRef(null)

  useEffect(() => {
    Promise.all([
      getSummary().catch(() => null),
      getByDoctor().catch(() => []),
      getBySpecialty().catch(() => []),
    ]).then(([sum, docs, specs]) => {
      setSummary(sum)
      setDoctors(docs || [])
      setSpecialties((specs || []).filter(s => s.total_appointments > 0))
    }).finally(() => setLoading(false))
  }, [])

  // Build bar chart — appointments by doctor
  useEffect(() => {
    if (!doctors.length || !barRef.current) return
    import('https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js').then(() => {
      const { Chart } = window
      if (!Chart) return
      if (barChart.current) barChart.current.destroy()
      const top = doctors.slice(0, 8)
      barChart.current = new Chart(barRef.current, {
        type: 'bar',
        data: {
          labels:   top.map(d => d.doctor_name.replace('Dr. ', '')),
          datasets: [
            { label: 'Completed', data: top.map(d => d.completed),  backgroundColor: '#1D9E75', borderRadius: 4 },
            { label: 'Cancelled', data: top.map(d => d.cancelled),  backgroundColor: '#E24B4A', borderRadius: 4 },
            { label: 'Pending',   data: top.map(d => d.total_appointments - d.completed - d.cancelled), backgroundColor: '#BA7517', borderRadius: 4 },
          ],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { position: 'bottom', labels: { font: { size: 12 }, boxWidth: 12, padding: 16 } } },
          scales: {
            x: { stacked: true, grid: { display: false }, ticks: { font: { size: 12 } } },
            y: { stacked: true, beginAtZero: true, grid: { color: '#f0ede6' }, ticks: { font: { size: 12 }, stepSize: 1 } },
          },
        },
      })
    })
  }, [doctors])

  // Build pie chart — appointments by specialty
  useEffect(() => {
    if (!specialties.length || !pieRef.current) return
    import('https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js').then(() => {
      const { Chart } = window
      if (!Chart) return
      if (pieChart.current) pieChart.current.destroy()
      const COLORS = ['#1D9E75','#378ADD','#E24B4A','#BA7517','#8e44ad','#e67e22','#16a085','#c0392b','#2980b9','#27ae60']
      pieChart.current = new Chart(pieRef.current, {
        type: 'doughnut',
        data: {
          labels:   specialties.map(s => s.specialty_name),
          datasets: [{ data: specialties.map(s => s.total_appointments), backgroundColor: COLORS, borderWidth: 2, borderColor: '#fff' }],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: {
            legend: { position: 'right', labels: { font: { size: 12 }, boxWidth: 12, padding: 12 } },
          },
          cutout: '60%',
        },
      })
    })
  }, [specialties])

  if (loading) return (<><Navbar /><PageLoader /></>)

  const stats = [
    { label: 'Total patients',      value: summary?.total_patients       ?? '—', icon: '👥', bg: '#E6F1FB', color: '#0C447C', to: '/admin/patients' },
    { label: 'Total doctors',       value: summary?.total_doctors        ?? '—', icon: '👨‍⚕️', bg: '#E1F5EE', color: '#085041', to: '/admin/doctors' },
    { label: 'Total appointments',  value: summary?.total_appointments   ?? '—', icon: '📅', bg: '#FAEEDA', color: '#633806', to: '/admin/appointments' },
    { label: 'This month',          value: summary?.this_month           ?? '—', icon: '📆', bg: '#EEEDFE', color: '#3C3489', to: '/admin/appointments' },
    { label: 'Cancellation rate',   value: summary?.cancellation_rate_pct != null ? `${summary.cancellation_rate_pct}%` : '—', icon: '❌', bg: '#FCEBEB', color: '#791F1F', to: '/admin/analytics' },
    { label: 'Completion rate',     value: summary?.completion_rate_pct  != null ? `${summary.completion_rate_pct}%`  : '—', icon: '✅', bg: '#E1F5EE', color: '#085041', to: '/admin/analytics' },
    { label: 'User accounts', icon: '🔐', to: '/admin/users', bg: '#FCEBEB' }
  ]

  return (
    <div style={pg}>
      <style>{css}</style>
      <Navbar />
      
      <div style={wrap}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <p style={{ fontSize: '13px', color: '#888', marginBottom: '4px' }}>Admin panel</p>
            <h1 style={h1}>Dashboard overview</h1>
            <p style={{ fontSize: '14px', color: '#888' }}>{new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
          <Link to="/admin/analytics" style={primaryBtn}>View full analytics →</Link>
        </div>

        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px' }}>
          {stats.map((s, i) => (
            <Link key={i} to={s.to} style={{ textDecoration: 'none' }}>
              <div className="stat-card" style={{ background: s.bg, borderRadius: '12px', padding: '18px' }}>
                <span style={{ fontSize: '20px' }}>{s.icon}</span>
                <p style={{ fontSize: '26px', fontWeight: 700, color: s.color, margin: '8px 0 2px', lineHeight: 1 }}>{s.value}</p>
                <p style={{ fontSize: '12px', color: s.color, opacity: 0.7 }}>{s.label}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* Charts */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '20px' }}>
          {/* Bar chart */}
          <div style={card}>
            <div style={cardHead}>
              <h2 style={cardTitle}>Appointments by doctor</h2>
              <Link to="/admin/analytics" style={seeAll}>Details →</Link>
            </div>
            {doctors.length === 0 ? (
              <div style={empty}>No data available</div>
            ) : (
              <div style={{ height: '280px', position: 'relative' }}>
                <canvas ref={barRef} />
              </div>
            )}
          </div>

          {/* Pie chart */}
          <div style={card}>
            <div style={cardHead}>
              <h2 style={cardTitle}>By specialty</h2>
            </div>
            {specialties.length === 0 ? (
              <div style={empty}>No data available</div>
            ) : (
              <div style={{ height: '280px', position: 'relative' }}>
                <canvas ref={pieRef} />
              </div>
            )}
          </div>
        </div>

        {/* Doctor table */}
        <div style={card}>
          <div style={cardHead}>
            <h2 style={cardTitle}>Doctor performance</h2>
            <Link to="/admin/doctors" style={seeAll}>Manage doctors →</Link>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '0.5px solid #e8e6df' }}>
                  {['Doctor','Specialty','Total','Completed','Cancelled','Rate','Patients'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: '#aaa', textTransform: 'uppercase', letterSpacing: '.06em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {doctors.map((d, i) => (
                  <tr key={i} style={{ borderBottom: '0.5px solid #f5f3ee' }} className="table-row">
                    <td style={{ padding: '12px', fontWeight: 600, color: '#1a1a2e' }}>{d.doctor_name}</td>
                    <td style={{ padding: '12px', color: '#666' }}>{d.specialty}</td>
                    <td style={{ padding: '12px', fontWeight: 500 }}>{d.total_appointments}</td>
                    <td style={{ padding: '12px', color: '#1D9E75', fontWeight: 500 }}>{d.completed}</td>
                    <td style={{ padding: '12px', color: '#E24B4A', fontWeight: 500 }}>{d.cancelled}</td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ flex: 1, height: '5px', background: '#f0ede6', borderRadius: '3px', minWidth: '60px' }}>
                          <div style={{ width: `${Math.min(d.completion_rate_pct || 0, 100)}%`, height: '100%', background: '#1D9E75', borderRadius: '3px' }} />
                        </div>
                        <span style={{ fontSize: '12px', color: '#555', whiteSpace: 'nowrap' }}>{d.completion_rate_pct ?? 0}%</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px', color: '#666' }}>{d.unique_patients}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick links */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
          {[
            { label: 'Manage patients',     icon: '👥', to: '/admin/patients',     bg: '#E6F1FB' },
            { label: 'Manage doctors',      icon: '👨‍⚕️', to: '/admin/doctors',      bg: '#E1F5EE' },
            { label: 'All appointments',    icon: '📅', to: '/admin/appointments', bg: '#FAEEDA' },
            { label: 'Analytics',           icon: '📊', to: '/admin/analytics',    bg: '#EEEDFE' },
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
const wrap      = { maxWidth: '1200px', margin: '0 auto', padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: '24px' }
const h1        = { fontFamily: "'Instrument Serif',serif", fontSize: '32px', color: '#1a1a2e', fontWeight: 400, margin: '0 0 4px' }
const card      = { background: '#fff', border: '0.5px solid #e8e6df', borderRadius: '14px', padding: '22px' }
const cardHead  = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }
const cardTitle = { fontSize: '15px', fontWeight: 600, color: '#1a1a2e' }
const seeAll    = { fontSize: '13px', color: '#1a3a5c', textDecoration: 'none', fontWeight: 500 }
const empty     = { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', color: '#aaa', fontSize: '14px' }
const quickLink = { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '20px 12px', borderRadius: '12px', textDecoration: 'none', transition: 'transform .2s', textAlign: 'center' }
const primaryBtn = { display: 'inline-flex', background: '#1a3a5c', color: '#fff', padding: '10px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600&family=Instrument+Serif:ital@0;1&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  .stat-card{transition:transform .15s;cursor:pointer}.stat-card:hover{transform:translateY(-2px)}
  .table-row:hover{background:#fafaf8}
  .quick-link:hover{transform:translateY(-3px)}
`
