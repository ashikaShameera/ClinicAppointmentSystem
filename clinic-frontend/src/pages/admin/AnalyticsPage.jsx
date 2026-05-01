import { useState, useEffect, useRef } from 'react'
import { getSummary, getByDoctor, getBySpecialty, getPeakHours } from '../../api/analytics'
import { PageLoader } from '../../components/Spinner'
import Navbar from '../../components/Navbar'

export default function AnalyticsPage() {
  const [summary, setSummary]       = useState(null)
  const [doctors, setDoctors]       = useState([])
  const [specialties, setSpecialties] = useState([])
  const [peakHours, setPeakHours]   = useState([])
  const [loading, setLoading]       = useState(true)
  const [activeTab, setActiveTab]   = useState('overview')

  const rateRef    = useRef(null)
  const specRef    = useRef(null)
  const peakRef    = useRef(null)
  const completionRef = useRef(null)
  const charts     = useRef({})

  useEffect(() => {
    Promise.all([
      getSummary().catch(() => null),
      getByDoctor().catch(() => []),
      getBySpecialty().catch(() => []),
      getPeakHours().catch(() => []),
    ]).then(([sum, docs, specs, peak]) => {
      setSummary(sum)
      setDoctors(docs || [])
      setSpecialties(specs || [])
      setPeakHours(peak || [])
    }).finally(() => setLoading(false))
  }, [])

  const loadChartJs = () =>
    import('https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js').then(() => window.Chart)

  // Completion rate by doctor — horizontal bar
  useEffect(() => {
    if (activeTab !== 'doctors' || !doctors.length || !rateRef.current) return
    loadChartJs().then(Chart => {
      if (!Chart) return
      if (charts.current.rate) charts.current.rate.destroy()
      const top = [...doctors].sort((a,b) => b.completion_rate_pct - a.completion_rate_pct).slice(0, 8)
      charts.current.rate = new Chart(rateRef.current, {
        type: 'bar',
        data: {
          labels: top.map(d => d.doctor_name.replace('Dr. ','')),
          datasets: [{
            label: 'Completion rate %',
            data: top.map(d => Number(d.completion_rate_pct || 0).toFixed(1)),
            backgroundColor: top.map(d => d.completion_rate_pct >= 80 ? '#1D9E75' : d.completion_rate_pct >= 50 ? '#BA7517' : '#E24B4A'),
            borderRadius: 4,
          }],
        },
        options: {
          indexAxis: 'y', responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { beginAtZero: true, max: 100, grid: { color: '#f0ede6' }, ticks: { callback: v => v + '%', font: { size: 12 } } },
            y: { grid: { display: false }, ticks: { font: { size: 12 } } },
          },
        },
      })
    })
  }, [activeTab, doctors])

  // Appointments by specialty — doughnut
  useEffect(() => {
    if (activeTab !== 'specialty' || !specialties.length || !specRef.current) return
    loadChartJs().then(Chart => {
      if (!Chart) return
      if (charts.current.spec) charts.current.spec.destroy()
      const filtered = specialties.filter(s => s.total_appointments > 0)
      const COLORS = ['#1D9E75','#378ADD','#E24B4A','#BA7517','#8e44ad','#e67e22','#16a085','#c0392b','#2980b9','#27ae60']
      charts.current.spec = new Chart(specRef.current, {
        type: 'doughnut',
        data: {
          labels: filtered.map(s => s.specialty_name),
          datasets: [{ data: filtered.map(s => s.total_appointments), backgroundColor: COLORS, borderWidth: 2, borderColor: '#fff' }],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { position: 'right', labels: { font: { size: 12 }, boxWidth: 12, padding: 14 } } },
          cutout: '55%',
        },
      })
    })
  }, [activeTab, specialties])

  // Peak hours heatmap (bar)
  useEffect(() => {
    if (activeTab !== 'peak' || !peakHours.length || !peakRef.current) return
    loadChartJs().then(Chart => {
      if (!Chart) return
      if (charts.current.peak) charts.current.peak.destroy()
      const hours = Array.from({ length: 24 }, (_, i) => i)
      const hourCounts = hours.map(h => peakHours.filter(p => p.hour_of_day === h).reduce((s, p) => s + p.booking_count, 0))
      charts.current.peak = new Chart(peakRef.current, {
        type: 'bar',
        data: {
          labels: hours.map(h => `${String(h).padStart(2,'0')}:00`),
          datasets: [{
            label: 'Bookings',
            data: hourCounts,
            backgroundColor: hourCounts.map(c => c === Math.max(...hourCounts) ? '#1a3a5c' : c > 2 ? '#378ADD' : '#E6F1FB'),
            borderRadius: 3,
          }],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { display: false }, ticks: { font: { size: 11 }, maxRotation: 45 } },
            y: { beginAtZero: true, grid: { color: '#f0ede6' }, ticks: { font: { size: 12 }, stepSize: 1 } },
          },
        },
      })
    })
  }, [activeTab, peakHours])

  // Unique patients by doctor
  useEffect(() => {
    if (activeTab !== 'doctors' || !doctors.length || !completionRef.current) return
    loadChartJs().then(Chart => {
      if (!Chart) return
      if (charts.current.completion) charts.current.completion.destroy()
      const top = [...doctors].sort((a,b) => b.unique_patients - a.unique_patients).slice(0, 8)
      charts.current.completion = new Chart(completionRef.current, {
        type: 'bar',
        data: {
          labels: top.map(d => d.doctor_name.replace('Dr. ','')),
          datasets: [
            { label: 'Unique patients', data: top.map(d => d.unique_patients), backgroundColor: '#378ADD', borderRadius: 4 },
            { label: 'Total appointments', data: top.map(d => d.total_appointments), backgroundColor: '#E6F1FB', borderRadius: 4 },
          ],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { position: 'bottom', labels: { font: { size: 12 }, boxWidth: 12 } } },
          scales: {
            x: { grid: { display: false }, ticks: { font: { size: 12 } } },
            y: { beginAtZero: true, grid: { color: '#f0ede6' }, ticks: { font: { size: 12 }, stepSize: 1 } },
          },
        },
      })
    })
  }, [activeTab, doctors])

  if (loading) return (<><Navbar /><PageLoader /></>)

  const TABS = [
    { key: 'overview', label: 'Overview' },
    { key: 'doctors',  label: 'By doctor' },
    { key: 'specialty',label: 'By specialty' },
    { key: 'peak',     label: 'Peak hours' },
  ]

  return (
    <div style={pg}>
      <style>{css}</style>
      <Navbar />

      <div style={wrap}>
        {/* Header */}
        <div>
          <h1 style={h1}>Analytics</h1>
          <p style={sub}>System-wide performance metrics and trends</p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '4px', background: '#fff', border: '0.5px solid #e8e6df', borderRadius: '10px', padding: '4px', width: 'fit-content' }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              style={{ padding: '8px 20px', borderRadius: '7px', border: 'none', fontSize: '13px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', background: activeTab === t.key ? '#1a3a5c' : 'transparent', color: activeTab === t.key ? '#fff' : '#888', transition: 'all .15s' }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW TAB ── */}
        {activeTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px' }}>
              {[
                { label: 'Total patients',     value: summary?.total_patients      ?? '—', icon: '👥', bg: '#E6F1FB', color: '#0C447C' },
                { label: 'Total doctors',      value: summary?.total_doctors       ?? '—', icon: '👨‍⚕️', bg: '#E1F5EE', color: '#085041' },
                { label: 'Total appointments', value: summary?.total_appointments  ?? '—', icon: '📅', bg: '#FAEEDA', color: '#633806' },
                { label: 'This month',         value: summary?.this_month          ?? '—', icon: '📆', bg: '#EEEDFE', color: '#3C3489' },
                { label: 'Cancellation rate',  value: summary?.cancellation_rate_pct != null ? `${summary.cancellation_rate_pct}%` : '—', icon: '❌', bg: '#FCEBEB', color: '#791F1F' },
                { label: 'Completion rate',    value: summary?.completion_rate_pct != null  ? `${summary.completion_rate_pct}%` : '—',  icon: '✅', bg: '#E1F5EE', color: '#085041' },
              ].map((s, i) => (
                <div key={i} style={{ background: s.bg, borderRadius: '12px', padding: '18px' }}>
                  <span style={{ fontSize: '20px' }}>{s.icon}</span>
                  <p style={{ fontSize: '28px', fontWeight: 700, color: s.color, margin: '8px 0 2px', lineHeight: 1 }}>{s.value}</p>
                  <p style={{ fontSize: '12px', color: s.color, opacity: 0.7 }}>{s.label}</p>
                </div>
              ))}
            </div>

            {/* Summary table */}
            <div style={card}>
              <h2 style={cardTitle}>All doctors — at a glance</h2>
              <div style={{ overflowX: 'auto', marginTop: '16px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: '0.5px solid #e8e6df' }}>
                      {['Doctor','Specialty','Total','Completed','Cancelled','No-shows','Rate %','Patients'].map(h => (
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
                        <td style={{ padding: '12px', color: '#888', fontWeight: 500 }}>{d.no_shows}</td>
                        <td style={{ padding: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '60px', height: '5px', background: '#f0ede6', borderRadius: '3px' }}>
                              <div style={{ width: `${Math.min(d.completion_rate_pct || 0, 100)}%`, height: '100%', background: '#1D9E75', borderRadius: '3px' }} />
                            </div>
                            <span>{d.completion_rate_pct ?? 0}%</span>
                          </div>
                        </td>
                        <td style={{ padding: '12px', color: '#666' }}>{d.unique_patients}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── DOCTORS TAB ── */}
        {activeTab === 'doctors' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div style={card}>
              <h2 style={cardTitle}>Completion rate by doctor</h2>
              <p style={cardSub}>Green ≥ 80%, amber 50–79%, red &lt; 50%</p>
              <div style={{ height: '320px', marginTop: '16px' }}><canvas ref={rateRef} /></div>
            </div>
            <div style={card}>
              <h2 style={cardTitle}>Unique patients vs appointments</h2>
              <p style={cardSub}>Top 8 doctors by patient volume</p>
              <div style={{ height: '320px', marginTop: '16px' }}><canvas ref={completionRef} /></div>
            </div>
          </div>
        )}

        {/* ── SPECIALTY TAB ── */}
        {activeTab === 'specialty' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: '20px', alignItems: 'start' }}>
            <div style={card}>
              <h2 style={cardTitle}>Appointments by specialty</h2>
              <div style={{ height: '320px', marginTop: '16px' }}><canvas ref={specRef} /></div>
            </div>
            <div style={card}>
              <h2 style={cardTitle}>Specialty breakdown</h2>
              <div style={{ overflowX: 'auto', marginTop: '16px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: '0.5px solid #e8e6df' }}>
                      {['Specialty','Doctors','Total appts','Last 30 days'].map(h => (
                        <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: '#aaa', textTransform: 'uppercase', letterSpacing: '.06em' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...specialties].sort((a,b) => b.total_appointments - a.total_appointments).map((s, i) => (
                      <tr key={i} style={{ borderBottom: '0.5px solid #f5f3ee' }} className="table-row">
                        <td style={{ padding: '10px 12px', fontWeight: 600, color: '#1a1a2e' }}>{s.specialty_name}</td>
                        <td style={{ padding: '10px 12px', color: '#666' }}>{s.doctor_count}</td>
                        <td style={{ padding: '10px 12px', fontWeight: 500 }}>{s.total_appointments}</td>
                        <td style={{ padding: '10px 12px', color: '#1D9E75', fontWeight: 500 }}>{s.appointments_last_30_days}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── PEAK HOURS TAB ── */}
        {activeTab === 'peak' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={card}>
              <h2 style={cardTitle}>Booking volume by hour of day</h2>
              <p style={cardSub}>Darker blue = peak booking hour. Excludes cancelled and no-show appointments.</p>
              {peakHours.length === 0 ? (
                <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa', fontSize: '14px' }}>No data yet — bookings will appear here</div>
              ) : (
                <div style={{ height: '300px', marginTop: '16px' }}><canvas ref={peakRef} /></div>
              )}
            </div>

            {peakHours.length > 0 && (
              <div style={card}>
                <h2 style={{ ...cardTitle, marginBottom: '14px' }}>Top 10 busiest slots</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: '#f0ede6', borderRadius: '8px', overflow: 'hidden' }}>
                  {[...peakHours].sort((a,b) => b.booking_count - a.booking_count).slice(0, 10).map((h, i) => (
                    <div key={i} style={{ background: '#fff', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#1a3a5c', width: '24px' }}>#{i+1}</span>
                        <span style={{ fontSize: '13px', color: '#555', width: '80px' }}>{h.day_name}</span>
                        <span style={{ fontSize: '13px', fontWeight: 500, color: '#1a1a2e' }}>
                          {String(h.hour_of_day).padStart(2,'0')}:00 – {String(h.hour_of_day + 1).padStart(2,'0')}:00
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '100px', height: '6px', background: '#f0ede6', borderRadius: '3px' }}>
                          <div style={{ width: `${(h.booking_count / peakHours[0]?.booking_count) * 100}%`, height: '100%', background: '#1a3a5c', borderRadius: '3px' }} />
                        </div>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#1a3a5c', width: '24px', textAlign: 'right' }}>{h.booking_count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

const pg       = { background: '#f5f3ee', minHeight: '100vh', fontFamily: "'Instrument Sans','DM Sans',sans-serif" }
const wrap     = { maxWidth: '1200px', margin: '0 auto', padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: '24px' }
const h1       = { fontFamily: "'Instrument Serif',serif", fontSize: '28px', color: '#1a1a2e', fontWeight: 400 }
const sub      = { fontSize: '14px', color: '#888', marginTop: '4px' }
const card     = { background: '#fff', border: '0.5px solid #e8e6df', borderRadius: '14px', padding: '22px' }
const cardTitle = { fontSize: '15px', fontWeight: 600, color: '#1a1a2e' }
const cardSub  = { fontSize: '12px', color: '#aaa', marginTop: '4px' }
const css      = `
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600&family=Instrument+Serif:ital@0;1&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  .table-row:hover{background:#fafaf8}
`
