import { useState, useEffect } from 'react'
import { getPatients, deletePatient } from '../../api/patients'
import StatusBadge from '../../components/StatusBadge'
import Pagination from '../../components/Pagination'
import { ConfirmModal } from '../../components/Modal'
import { PageLoader } from '../../components/Spinner'
import { EmptyState } from '../../components/ErrorMessage'
import Navbar from '../../components/Navbar'

const PER_PAGE = 12

export default function AdminPatientsPage() {
  const [patients, setPatients]   = useState([])
  const [total, setTotal]         = useState(0)
  const [page, setPage]           = useState(1)
  const [search, setSearch]       = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [loading, setLoading]     = useState(true)
  const [expandedId, setExpandedId] = useState(null)

  const [deleteModal, setDeleteModal]   = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting]         = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 400)
    return () => clearTimeout(t)
  }, [searchInput])

  useEffect(() => {
    load()
  }, [page, search])

  const load = async () => {
    setLoading(true)
    const params = { page, per_page: PER_PAGE }
    if (search) params.search = search
    getPatients(params)
      .then(data => { setPatients(data.patients || []); setTotal(data.total || 0) })
      .catch(() => { setPatients([]); setTotal(0) })
      .finally(() => setLoading(false))
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deletePatient(deleteTarget.id)
      setPatients(prev => prev.filter(p => p.id !== deleteTarget.id))
      setTotal(t => t - 1)
      setDeleteModal(false)
      setDeleteTarget(null)
    } catch {
      alert('Failed to delete patient.')
    } finally {
      setDeleting(false)
    }
  }

  const age = (dob) => {
    if (!dob) return null
    return Math.floor((Date.now() - new Date(dob)) / (1000 * 60 * 60 * 24 * 365.25))
  }

  const avatarColors = ['#1a3a5c','#27ae60','#c0392b','#8e44ad','#e67e22','#16a085']
  const avatarBg = (name) => avatarColors[Math.abs(name?.charCodeAt(0) || 0) % avatarColors.length]

  return (
    <div style={pg}>
      <style>{css}</style>
      <Navbar />

      <div style={wrap}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={h1}>Patients</h1>
            <p style={sub}>{total} patient{total !== 1 ? 's' : ''} registered</p>
          </div>
        </div>

        {/* Search bar */}
        <div style={{ position: 'relative' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            className="inp"
            placeholder="Search by name or email..."
            value={searchInput}
            onChange={e => { setSearchInput(e.target.value); setPage(1) }}
            style={{ width: '100%', border: '0.5px solid #d0cec7', borderRadius: '10px', padding: '12px 14px 12px 40px', fontSize: '14px', fontFamily: 'inherit', background: '#fff', outline: 'none' }}
          />
          {searchInput && (
            <button onClick={() => { setSearchInput(''); setSearch(''); setPage(1) }}
              style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#bbb', fontSize: '16px' }}>✕</button>
          )}
        </div>

        {/* Patient grid */}
        {loading ? <PageLoader /> : patients.length === 0 ? (
          <EmptyState icon="👥" message="No patients found" sub={search ? 'Try a different search term' : 'No patients registered yet'} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: '#e8e6df', borderRadius: '12px', overflow: 'hidden' }}>
            {/* Table header */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: '0', background: '#f5f3ee', padding: '10px 20px' }}>
              {['Patient', 'DOB / Age', 'Blood type', 'Phone', 'Actions'].map(h => (
                <p key={h} style={{ fontSize: '11px', fontWeight: 600, color: '#aaa', textTransform: 'uppercase', letterSpacing: '.06em' }}>{h}</p>
              ))}
            </div>

            {patients.map(pat => (
              <div key={pat.id} style={{ background: '#fff' }}>
                <div style={patRow} className="pat-row" onClick={() => setExpandedId(expandedId === pat.id ? null : pat.id)}>
                  {/* Name + avatar */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: avatarBg(pat.full_name), color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 600, flexShrink: 0 }}>
                      {pat.full_name?.split(' ').map(w => w[0]).join('').slice(0, 2)}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontWeight: 600, fontSize: '14px', color: '#1a1a2e', marginBottom: '1px' }}>{pat.full_name}</p>
                      {pat.gender && <p style={{ fontSize: '12px', color: '#aaa', textTransform: 'capitalize' }}>{pat.gender.replace('_', ' ')}</p>}
                    </div>
                  </div>
                  {/* DOB */}
                  <p style={{ fontSize: '13px', color: '#555' }}>{pat.date_of_birth ? `${new Date(pat.date_of_birth + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} (${age(pat.date_of_birth)} yrs)` : '—'}</p>
                  {/* Blood type */}
                  <p style={{ fontSize: '13px', color: '#555' }}>
                    {pat.blood_type ? <span style={{ background: '#FCEBEB', color: '#791F1F', padding: '2px 8px', borderRadius: '20px', fontSize: '12px', fontWeight: 600 }}>{pat.blood_type}</span> : '—'}
                  </p>
                  {/* Phone */}
                  <p style={{ fontSize: '13px', color: '#555' }}>{pat.phone || '—'}</p>
                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }} onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => { setDeleteTarget(pat); setDeleteModal(true) }}
                      className="del-btn"
                      style={{ background: '#FCEBEB', color: '#791F1F', border: 'none', padding: '5px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                      Delete
                    </button>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                      style={{ transform: expandedId === pat.id ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform .2s', cursor: 'pointer' }}>
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </div>
                </div>

                {/* Expanded */}
                {expandedId === pat.id && (
                  <div style={{ padding: '0 20px 18px', borderTop: '0.5px solid #f5f3ee' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', paddingTop: '16px' }}>
                      {[
                        { label: 'Patient ID', value: pat.id?.slice(0, 18) + '...' },
                        { label: 'Address', value: pat.address || '—' },
                        { label: 'Allergies', value: pat.allergies || 'None recorded' },
                        { label: 'Emergency contact', value: pat.emergency_contact_name || '—' },
                        { label: 'Emergency phone', value: pat.emergency_contact_phone || '—' },
                        { label: 'Deleted', value: pat.deleted_at ? 'Yes' : 'Active' },
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

        <Pagination page={page} perPage={PER_PAGE} total={total} onPageChange={p => { setPage(p); window.scrollTo(0,0) }} />
      </div>

      <ConfirmModal
        open={deleteModal}
        onClose={() => { setDeleteModal(false); setDeleteTarget(null) }}
        onConfirm={handleDelete}
        title="Delete patient"
        message={<>Soft-delete <strong>{deleteTarget?.full_name}</strong>? Their data will be preserved but they won't appear in patient lists.</>}
        confirmLabel="Yes, delete patient"
        danger
        loading={deleting}
      />
    </div>
  )
}

const pg     = { background: '#f5f3ee', minHeight: '100vh', fontFamily: "'Instrument Sans','DM Sans',sans-serif" }
const wrap   = { maxWidth: '1100px', margin: '0 auto', padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: '20px' }
const h1     = { fontFamily: "'Instrument Serif',serif", fontSize: '28px', color: '#1a1a2e', fontWeight: 400 }
const sub    = { fontSize: '14px', color: '#888', marginTop: '4px' }
const patRow = { display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: '0', padding: '14px 20px', alignItems: 'center', cursor: 'pointer', transition: 'background .15s' }
const css    = `
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600&family=Instrument+Serif:ital@0;1&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  .pat-row:hover{background:#fafaf8!important}
  .inp:focus{border-color:#1a3a5c!important;outline:none}
  .del-btn:hover{background:#F7C1C1!important}
`
