import { useState, useEffect, useContext } from 'react'
import { AuthContext } from '../../context/AuthContext'
import { getPatientRecords } from '../../api/medicalRecords'
// import { getPatients } from '../../api/patients'
import { getMyProfile } from '../../api/patients'
import { PageLoader } from '../../components/Spinner'
import { EmptyState } from '../../components/ErrorMessage'
import Navbar from '../../components/Navbar'

export default function MedicalRecords() {
  const { user } = useContext(AuthContext)

  const [patientId, setPatientId] = useState(null)
  const [records, setRecords]     = useState([])
  const [loading, setLoading]     = useState(true)
  const [selected, setSelected]   = useState(null)

  // useEffect(() => {
  //   getPatients({ search: user?.email })
  //     .then(data => {
  //       const pid = data.patients?.[0]?.id
  //       if (!pid) return
  //       setPatientId(pid)
  //       return getPatientRecords(pid)
  //     })
  //     .then(recs => { if (recs) setRecords(recs) })
  //     .catch(() => {})
  //     .finally(() => setLoading(false))
  // }, [user])

  useEffect(() => {
  getMyProfile()
    .then(p => {
      setPatientId(p.id)
      return getPatientRecords(p.id)
    })
    .then(recs => { if (recs) setRecords(recs) })
    .catch(() => {})
    .finally(() => setLoading(false))
}, [])

  const fmt = (dt) => {
    if (!dt) return '—'
    return new Date(dt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  if (loading) return (<><Navbar /><PageLoader /></>)

  return (
    <div style={pg}>
      <style>{css}</style>
      <Navbar />

      <div style={wrap}>
        {/* Header */}
        <div>
          <h1 style={h1}>Medical records</h1>
          <p style={sub}>{records.length} record{records.length !== 1 ? 's' : ''} on file</p>
        </div>

        {records.length === 0 ? (
          <EmptyState
            icon="📋"
            message="No medical records yet"
            sub="Records appear here after your appointments are completed and your doctor adds notes."
          />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 1.4fr' : '1fr', gap: '20px', alignItems: 'start' }}>

            {/* Record list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: '#e8e6df', borderRadius: '12px', overflow: 'hidden' }}>
              {records.map((rec, i) => (
                <div
                  key={rec.id}
                  className="rec-row"
                  onClick={() => setSelected(selected?.id === rec.id ? null : rec)}
                  style={{ ...recRow, background: selected?.id === rec.id ? '#EEF4FB' : '#fff', borderLeft: selected?.id === rec.id ? '3px solid #1a3a5c' : '3px solid transparent' }}
                >
                  {/* Icon */}
                  <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: recColor(i), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>
                    📋
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 600, fontSize: '14px', color: '#1a1a2e', marginBottom: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {rec.diagnosis || 'Consultation notes'}
                    </p>
                    <p style={{ fontSize: '12px', color: '#888' }}>
                      {fmt(rec.created_at)}
                      {rec.follow_up_date && ` · Follow-up: ${fmt(rec.follow_up_date)}`}
                    </p>
                  </div>

                  <div style={{ flexShrink: 0 }}>
                    {rec.follow_up_date && new Date(rec.follow_up_date) > new Date() && (
                      <span style={{ background: '#FAEEDA', color: '#633806', padding: '3px 9px', borderRadius: '20px', fontSize: '11px', fontWeight: 500 }}>
                        Follow-up due
                      </span>
                    )}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '10px', transform: selected?.id === rec.id ? 'rotate(90deg)' : 'rotate(0)', transition: 'transform .2s' }}>
                      <polyline points="9 18 15 12 9 6"/>
                    </svg>
                  </div>
                </div>
              ))}
            </div>

            {/* Detail panel */}
            {selected && (
              <div className="fade-in" style={{ background: '#fff', border: '0.5px solid #e8e6df', borderRadius: '14px', overflow: 'hidden', position: 'sticky', top: '80px' }}>
                {/* Panel header */}
                <div style={{ background: 'linear-gradient(135deg,#0d2137,#1a3a5c)', padding: '24px', color: '#fff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <p style={{ fontSize: '11px', color: 'rgba(255,255,255,.5)', textTransform: 'uppercase', letterSpacing: '.08em' }}>Medical record</p>
                    <button onClick={() => setSelected(null)} style={{ background: 'rgba(255,255,255,.1)', border: 'none', color: '#fff', width: '28px', height: '28px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  </div>
                  <h2 style={{ fontFamily: "'Instrument Serif',serif", fontSize: '22px', fontWeight: 400, lineHeight: 1.3 }}>
                    {selected.diagnosis || 'Consultation notes'}
                  </h2>
                  <p style={{ fontSize: '13px', color: 'rgba(255,255,255,.6)', marginTop: '6px' }}>{fmt(selected.created_at)}</p>
                </div>

                {/* Panel body */}
                <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {[
                    { label: 'Diagnosis', value: selected.diagnosis, icon: '🔍' },
                    { label: 'Prescription', value: selected.prescription, icon: '💊' },
                  ].map((item, i) => item.value && (
                    <div key={i}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <span style={{ fontSize: '16px' }}>{item.icon}</span>
                        <p style={{ fontSize: '12px', fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '.06em' }}>{item.label}</p>
                      </div>
                      <div style={{ background: '#f9f7f4', borderRadius: '8px', padding: '14px 16px', fontSize: '14px', color: '#333', lineHeight: 1.7, borderLeft: '3px solid #1a3a5c' }}>
                        {item.value}
                      </div>
                    </div>
                  ))}

                  {/* Follow-up date */}
                  {selected.follow_up_date && (
                    <div style={{ background: new Date(selected.follow_up_date) > new Date() ? '#FAEEDA' : '#f0f0f0', borderRadius: '10px', padding: '14px 16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <span style={{ fontSize: '20px' }}>📅</span>
                      <div>
                        <p style={{ fontSize: '12px', color: '#888', marginBottom: '2px' }}>Follow-up appointment</p>
                        <p style={{ fontSize: '14px', fontWeight: 600, color: new Date(selected.follow_up_date) > new Date() ? '#633806' : '#555' }}>
                          {fmt(selected.follow_up_date)}
                          {new Date(selected.follow_up_date) > new Date()
                            ? ` · ${Math.ceil((new Date(selected.follow_up_date) - new Date()) / 86400000)} days remaining`
                            : ' · Past due'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Meta */}
                  <div style={{ borderTop: '0.5px solid #f0ede6', paddingTop: '16px' }}>
                    <p style={{ fontSize: '12px', fontWeight: 600, color: '#aaa', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '12px' }}>Record details</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {[
                        { label: 'Record ID', value: selected.id?.slice(0, 18) + '...' },
                        { label: 'Created', value: fmt(selected.created_at) },
                        { label: 'Last updated', value: fmt(selected.updated_at) },
                      ].map((item, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '13px', color: '#aaa' }}>{item.label}</span>
                          <span style={{ fontSize: '13px', color: '#555', fontFamily: item.label === 'Record ID' ? 'monospace' : 'inherit' }}>{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Book follow-up CTA */}
                  {selected.follow_up_date && new Date(selected.follow_up_date) > new Date() && (
                    <a href="/patient/book" style={{ display: 'block', textAlign: 'center', background: '#1a3a5c', color: '#fff', padding: '12px', borderRadius: '8px', fontSize: '14px', fontWeight: 600, textDecoration: 'none' }}>
                      Book follow-up appointment
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

const recColors = ['#E6F1FB', '#E1F5EE', '#FAEEDA', '#FCEBEB', '#EEEDFE']
const recColor  = (i) => recColors[i % recColors.length]

const pg    = { background: '#f5f3ee', minHeight: '100vh', fontFamily: "'Instrument Sans','DM Sans',sans-serif" }
const wrap  = { maxWidth: '1000px', margin: '0 auto', padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: '20px' }
const h1    = { fontFamily: "'Instrument Serif',serif", fontSize: '28px', color: '#1a1a2e', fontWeight: 400 }
const sub   = { fontSize: '14px', color: '#888', marginTop: '4px' }
const recRow = { padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer', transition: 'background .15s' }

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600&family=Instrument+Serif:ital@0;1&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  @keyframes fadeIn{from{opacity:0;transform:translateX(10px)}to{opacity:1;transform:translateX(0)}}
  .fade-in{animation:fadeIn .25s ease both}
  .rec-row:hover{background:#f9f7f4!important}
`
