import { useState, useEffect } from 'react'
import { listDoctors, deleteDoctor, getSpecialties } from '../../api/doctors'
import { ConfirmModal } from '../../components/Modal'
import Pagination from '../../components/Pagination'
import { PageLoader } from '../../components/Spinner'
import { EmptyState } from '../../components/ErrorMessage'
import Navbar from '../../components/Navbar'

const PER_PAGE = 10

export default function AdminDoctorsPage() {
  const [doctors, setDoctors]       = useState([])
  const [specialties, setSpecialties] = useState([])
  const [total, setTotal]           = useState(0)
  const [page, setPage]             = useState(1)
  const [search, setSearch]         = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [specFilter, setSpecFilter] = useState('')
  const [loading, setLoading]       = useState(true)
  const [expandedId, setExpandedId] = useState(null)

  const [deleteModal, setDeleteModal]   = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting]         = useState(false)

  useEffect(() => {
    getSpecialties().then(setSpecialties).catch(() => {})
  }, [])

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 400)
    return () => clearTimeout(t)
  }, [searchInput])

  useEffect(() => { load() }, [page, search, specFilter])

  const load = () => {
    setLoading(true)
    const params = { page, per_page: PER_PAGE }
    if (search)     params.search       = search
    if (specFilter) params.specialty_id = specFilter
    listDoctors(params)
      .then(data => { setDoctors(data.doctors || []); setTotal(data.total || 0) })
      .catch(() => { setDoctors([]); setTotal(0) })
      .finally(() => setLoading(false))
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await deleteDoctor(deleteTarget.id)
      setDoctors(prev => prev.filter(d => d.id !== deleteTarget.id))
      setTotal(t => t - 1)
      setDeleteModal(false)
      setDeleteTarget(null)
    } catch {
      alert('Failed to delete doctor.')
    } finally {
      setDeleting(false)
    }
  }

  const avatarColors = ['#1a3a5c','#27ae60','#c0392b','#8e44ad','#e67e22','#16a085','#f39c12']
  const avatarBg = (name) => avatarColors[Math.abs(name?.charCodeAt(0) || 0) % avatarColors.length]

  return (
    <div style={pg}>
      <style>{css}</style>
      <Navbar />

      <div style={wrap}>
        {/* Header */}
        <div>
          <h1 style={h1}>Doctors</h1>
          <p style={sub}>{total} doctor{total !== 1 ? 's' : ''} registered</p>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}>
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input className="inp" placeholder="Search by name..." value={searchInput} onChange={e => { setSearchInput(e.target.value); setPage(1) }}
              style={{ width: '100%', border: '0.5px solid #d0cec7', borderRadius: '8px', padding: '11px 14px 11px 36px', fontSize: '14px', fontFamily: 'inherit', background: '#fff', outline: 'none' }} />
          </div>
          <select className="inp" value={specFilter} onChange={e => { setSpecFilter(e.target.value); setPage(1) }}
            style={{ border: '0.5px solid #d0cec7', borderRadius: '8px', padding: '11px 14px', fontSize: '14px', fontFamily: 'inherit', background: '#fff', outline: 'none', minWidth: '180px' }}>
            <option value="">All specialties</option>
            {specialties.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        {/* List */}
        {loading ? <PageLoader /> : doctors.length === 0 ? (
          <EmptyState icon="👨‍⚕️" message="No doctors found" sub="Try adjusting your filters" />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: '#e8e6df', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr auto', padding: '10px 20px', background: '#f5f3ee' }}>
              {['Doctor','Specialty','Experience','Fee','Accepting','Actions'].map(h => (
                <p key={h} style={{ fontSize: '11px', fontWeight: 600, color: '#aaa', textTransform: 'uppercase', letterSpacing: '.06em' }}>{h}</p>
              ))}
            </div>

            {doctors.map(doc => (
              <div key={doc.id} style={{ background: '#fff' }}>
                <div style={docRow} className="doc-row" onClick={() => setExpandedId(expandedId === doc.id ? null : doc.id)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: avatarBg(doc.full_name), color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 600, flexShrink: 0 }}>
                      {doc.full_name?.split(' ').filter(w => w !== 'Dr.').map(w => w[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: '14px', color: '#1a1a2e', marginBottom: '1px' }}>{doc.full_name}</p>
                      {doc.qualification && <p style={{ fontSize: '12px', color: '#aaa' }}>{doc.qualification}</p>}
                    </div>
                  </div>
                  <p style={{ fontSize: '13px', color: '#555' }}>{doc.specialty?.name || '—'}</p>
                  <p style={{ fontSize: '13px', color: '#555' }}>{doc.experience_years} yrs</p>
                  <p style={{ fontSize: '13px', color: '#555' }}>£{Number(doc.consultation_fee).toFixed(0)}</p>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: doc.is_accepting ? '#085041' : '#791F1F', background: doc.is_accepting ? '#E1F5EE' : '#FCEBEB', padding: '3px 10px', borderRadius: '20px', whiteSpace: 'nowrap' }}>
                    {doc.is_accepting ? 'Yes' : 'No'}
                  </span>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }} onClick={e => e.stopPropagation()}>
                    <button onClick={() => { setDeleteTarget(doc); setDeleteModal(true) }} className="del-btn"
                      style={{ background: '#FCEBEB', color: '#791F1F', border: 'none', padding: '5px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
                      Delete
                    </button>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                      style={{ transform: expandedId === doc.id ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform .2s' }}>
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </div>
                </div>

                {expandedId === doc.id && (
                  <div style={{ padding: '0 20px 18px', borderTop: '0.5px solid #f5f3ee' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', paddingTop: '16px' }}>
                      {[
                        { label: 'Bio', value: doc.bio || '—' },
                        { label: 'Phone', value: doc.phone || '—' },
                        { label: 'Clinic address', value: doc.clinic_address || '—' },
                        { label: 'Rating', value: doc.total_reviews > 0 ? `${Number(doc.rating).toFixed(1)} ★ (${doc.total_reviews} reviews)` : 'No reviews yet' },
                        { label: 'Available slots', value: doc.slots?.length > 0 ? `${doc.slots.length} slot${doc.slots.length !== 1 ? 's' : ''}` : 'None set' },
                        { label: 'Doctor ID', value: doc.id?.slice(0, 18) + '...' },
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
        open={deleteModal}
        onClose={() => { setDeleteModal(false); setDeleteTarget(null) }}
        onConfirm={handleDelete}
        title="Delete doctor"
        message={<>Soft-delete <strong>{deleteTarget?.full_name}</strong>? They will no longer appear in doctor listings.</>}
        confirmLabel="Yes, delete doctor"
        danger loading={deleting}
      />
    </div>
  )
}

const pg     = { background: '#f5f3ee', minHeight: '100vh', fontFamily: "'Instrument Sans','DM Sans',sans-serif" }
const wrap   = { maxWidth: '1200px', margin: '0 auto', padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: '20px' }
const h1     = { fontFamily: "'Instrument Serif',serif", fontSize: '28px', color: '#1a1a2e', fontWeight: 400 }
const sub    = { fontSize: '14px', color: '#888', marginTop: '4px' }
const docRow = { display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr auto', padding: '14px 20px', alignItems: 'center', cursor: 'pointer', transition: 'background .15s', gap: '0' }
const css    = `
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600&family=Instrument+Serif:ital@0;1&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  .doc-row:hover{background:#fafaf8!important}
  .inp:focus{border-color:#1a3a5c!important;outline:none}
  .del-btn:hover{background:#F7C1C1!important}
`
