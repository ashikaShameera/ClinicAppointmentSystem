import { useState, useEffect } from 'react'
import { listDoctors, deleteDoctor, getSpecialties, createDoctor } from '../../api/doctors'
import { createUser } from '../../api/admin'
import { ConfirmModal } from '../../components/Modal'
import Modal from '../../components/Modal'
import Pagination from '../../components/Pagination'
import { PageLoader, BtnSpinner } from '../../components/Spinner'
import { EmptyState } from '../../components/ErrorMessage'
import Navbar from '../../components/Navbar'

const PER_PAGE = 10

export default function AdminDoctorsPage() {
  const [doctors, setDoctors]         = useState([])
  const [specialties, setSpecialties] = useState([])
  const [total, setTotal]             = useState(0)
  const [page, setPage]               = useState(1)
  const [search, setSearch]           = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [specFilter, setSpecFilter]   = useState('')
  const [loading, setLoading]         = useState(true)
  const [expandedId, setExpandedId]   = useState(null)

  // Delete modal
  const [deleteModal, setDeleteModal]   = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting]         = useState(false)

  // Create doctor modal — 2 steps
  const [createModal, setCreateModal]     = useState(false)
  const [createStep, setCreateStep]       = useState(0)
  const [createdUserId, setCreatedUserId] = useState(null)
  const [creating, setCreating]           = useState(false)
  const [createError, setCreateError]     = useState('')
  const [newUser, setNewUser] = useState({ email: '', password: '' })
  const [newDoc, setNewDoc]   = useState({
    full_name: '', specialty_id: '', qualification: '',
    experience_years: 0, consultation_fee: 0, phone: '', bio: '',
  })

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

  // ── Delete ────────────────────────────────────────────────
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

  // ── Create: step 0 — create user account ─────────────────
  const handleCreateUser = async () => {
    if (!newUser.email.trim() || !newUser.password.trim()) {
      setCreateError('Email and password are required')
      return
    }
    if (newUser.password.length < 8) {
      setCreateError('Password must be at least 8 characters')
      return
    }
    setCreating(true)
    setCreateError('')
    try {
      const created = await createUser({ email: newUser.email, password: newUser.password, role: 'doctor' })
      setCreatedUserId(created.id)
      setCreateStep(1)
    } catch (err) {
      setCreateError(err.response?.data?.detail || 'Failed to create account. Email may already be registered.')
    } finally {
      setCreating(false)
    }
  }

  // ── Create: step 1 — create doctor profile ───────────────
  const handleCreateDoctor = async () => {
    if (!newDoc.full_name.trim()) { setCreateError('Full name is required'); return }
    if (!newDoc.specialty_id)     { setCreateError('Please select a specialty'); return }
    setCreating(true)
    setCreateError('')
    try {
      await createDoctor({
        user_id:          createdUserId,
        specialty_id:     Number(newDoc.specialty_id),
        full_name:        newDoc.full_name,
        qualification:    newDoc.qualification,
        experience_years: Number(newDoc.experience_years),
        consultation_fee: Number(newDoc.consultation_fee),
        phone:            newDoc.phone,
        bio:              newDoc.bio,
      })
      // Reset and close
      setCreateModal(false)
      setCreateStep(0)
      setCreatedUserId(null)
      setNewUser({ email: '', password: '' })
      setNewDoc({ full_name: '', specialty_id: '', qualification: '', experience_years: 0, consultation_fee: 0, phone: '', bio: '' })
      load()
    } catch (err) {
      setCreateError(err.response?.data?.detail || 'Failed to create doctor profile.')
    } finally {
      setCreating(false)
    }
  }

  const openCreate = () => {
    setCreateModal(true)
    setCreateStep(0)
    setCreateError('')
    setCreatedUserId(null)
    setNewUser({ email: '', password: '' })
    setNewDoc({ full_name: '', specialty_id: '', qualification: '', experience_years: 0, consultation_fee: 0, phone: '', bio: '' })
  }

  const avatarColors = ['#1a3a5c','#27ae60','#c0392b','#8e44ad','#e67e22','#16a085','#f39c12']
  const avatarBg = (name) => avatarColors[Math.abs(name?.charCodeAt(0) || 0) % avatarColors.length]

  return (
    <div style={pg}>
      <style>{css}</style>
      <Navbar />

      <div style={wrap}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={h1}>Doctors</h1>
            <p style={sub}>{total} doctor{total !== 1 ? 's' : ''} registered</p>
          </div>
          <button onClick={openCreate} style={addBtn} className="add-btn">
            + Add doctor
          </button>
        </div>

        {/* ── Filters ── */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}>
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              className="inp"
              placeholder="Search by name..."
              value={searchInput}
              onChange={e => { setSearchInput(e.target.value); setPage(1) }}
              style={searchInp}
            />
          </div>
          <select
            className="inp"
            value={specFilter}
            onChange={e => { setSpecFilter(e.target.value); setPage(1) }}
            style={selectInp}
          >
            <option value="">All specialties</option>
            {specialties.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        {/* ── Doctor list ── */}
        {loading ? <PageLoader /> : doctors.length === 0 ? (
          <EmptyState icon="👨‍⚕️" message="No doctors found" sub="Try adjusting your filters or add a new doctor" />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: '#e8e6df', borderRadius: '12px', overflow: 'hidden' }}>

            {/* Table header */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr auto', padding: '10px 20px', background: '#f5f3ee' }}>
              {['Doctor','Specialty','Experience','Fee','Accepting','Actions'].map(h => (
                <p key={h} style={{ fontSize: '11px', fontWeight: 600, color: '#aaa', textTransform: 'uppercase', letterSpacing: '.06em' }}>{h}</p>
              ))}
            </div>

            {doctors.map(doc => (
              <div key={doc.id} style={{ background: '#fff' }}>

                {/* Row */}
                <div
                  style={docRow}
                  className="doc-row"
                  onClick={() => setExpandedId(expandedId === doc.id ? null : doc.id)}
                >
                  {/* Doctor name + avatar */}
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

                  <span style={{ fontSize: '12px', fontWeight: 600, color: doc.is_accepting ? '#085041' : '#791F1F', background: doc.is_accepting ? '#E1F5EE' : '#FCEBEB', padding: '3px 10px', borderRadius: '20px', whiteSpace: 'nowrap', width: 'fit-content' }}>
                    {doc.is_accepting ? 'Yes' : 'No'}
                  </span>

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }} onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => { setDeleteTarget(doc); setDeleteModal(true) }}
                      className="del-btn"
                      style={delBtnStyle}
                    >
                      Delete
                    </button>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                      style={{ transform: expandedId === doc.id ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform .2s' }}>
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </div>
                </div>

                {/* Expanded detail */}
                {expandedId === doc.id && (
                  <div style={{ padding: '0 20px 18px', borderTop: '0.5px solid #f5f3ee' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', paddingTop: '16px' }}>
                      {[
                        { label: 'Bio',             value: doc.bio           || '—' },
                        { label: 'Phone',           value: doc.phone         || '—' },
                        { label: 'Clinic address',  value: doc.clinic_address || '—' },
                        { label: 'Rating',          value: doc.total_reviews > 0 ? `${Number(doc.rating).toFixed(1)} ★ (${doc.total_reviews} reviews)` : 'No reviews yet' },
                        { label: 'Available slots', value: doc.slots?.length > 0 ? `${doc.slots.length} slot${doc.slots.length !== 1 ? 's' : ''}` : 'None set' },
                        { label: 'Doctor ID',       value: doc.id?.slice(0, 18) + '...' },
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

        <Pagination page={page} perPage={PER_PAGE} total={total} onPageChange={p => { setPage(p); window.scrollTo(0, 0) }} />
      </div>

      {/* ── Delete modal ── */}
      <ConfirmModal
        open={deleteModal}
        onClose={() => { setDeleteModal(false); setDeleteTarget(null) }}
        onConfirm={handleDelete}
        title="Delete doctor"
        message={<>Soft-delete <strong>{deleteTarget?.full_name}</strong>? They will no longer appear in doctor listings.</>}
        confirmLabel="Yes, delete doctor"
        danger
        loading={deleting}
      />

      {/* ── Create doctor modal ── */}
      <Modal
        open={createModal}
        onClose={() => setCreateModal(false)}
        title={createStep === 0 ? 'Add doctor — Step 1 of 2: Login account' : 'Add doctor — Step 2 of 2: Profile details'}
        width={520}
      >
        {/* Step indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
          {[0, 1].map(i => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: i === 0 ? 'none' : 1 }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 600, background: i < createStep ? '#1D9E75' : i === createStep ? '#1a3a5c' : '#f0ede6', color: i <= createStep ? '#fff' : '#aaa', flexShrink: 0 }}>
                {i < createStep ? '✓' : i + 1}
              </div>
              <span style={{ fontSize: '13px', color: i === createStep ? '#1a1a2e' : '#aaa', fontWeight: i === createStep ? 600 : 400 }}>
                {['Login credentials', 'Doctor profile'][i]}
              </span>
              {i === 0 && <div style={{ flex: 1, height: '1px', background: createStep > 0 ? '#1D9E75' : '#e8e6df', margin: '0 8px' }} />}
            </div>
          ))}
        </div>

        {/* Error banner */}
        {createError && (
          <div style={{ background: '#FCEBEB', border: '0.5px solid #F7C1C1', color: '#791F1F', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            {createError}
          </div>
        )}

        {/* ── STEP 0: account ── */}
        {createStep === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ fontSize: '14px', color: '#666', lineHeight: 1.6 }}>
              Create the doctor's login credentials first. They'll use these to sign in to the system.
            </p>

            <FormField label="Email address" required>
              <input
                type="email"
                placeholder="dr.name@clinic.com"
                value={newUser.email}
                onChange={e => { setNewUser(u => ({ ...u, email: e.target.value })); setCreateError('') }}
                style={modalInp}
                className="inp"
              />
            </FormField>

            <FormField label="Temporary password" required>
              <input
                type="password"
                placeholder="Min. 8 characters"
                value={newUser.password}
                onChange={e => { setNewUser(u => ({ ...u, password: e.target.value })); setCreateError('') }}
                style={modalInp}
                className="inp"
              />
              <p style={{ fontSize: '12px', color: '#aaa', marginTop: '4px' }}>The doctor can change this after first login.</p>
            </FormField>

            <Modal.Footer>
              <button onClick={() => setCreateModal(false)} style={cancelBtnStyle}>Cancel</button>
              <button onClick={handleCreateUser} disabled={creating} style={{ ...confirmBtnStyle, opacity: creating ? 0.75 : 1 }}>
                {creating && <BtnSpinner />}
                {creating ? 'Creating...' : 'Next: Profile →'}
              </button>
            </Modal.Footer>
          </div>
        )}

        {/* ── STEP 1: profile ── */}
        {createStep === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <p style={{ fontSize: '14px', color: '#666', lineHeight: 1.6 }}>
              Now fill in the doctor's professional details. Only name and specialty are required.
            </p>

            <FormField label="Full name" required>
              <input type="text" placeholder="Dr. Jane Smith" value={newDoc.full_name}
                onChange={e => { setNewDoc(d => ({ ...d, full_name: e.target.value })); setCreateError('') }}
                style={modalInp} className="inp" />
            </FormField>

            <FormField label="Specialty" required>
              <select value={newDoc.specialty_id} onChange={e => { setNewDoc(d => ({ ...d, specialty_id: e.target.value })); setCreateError('') }} style={modalInp} className="inp">
                <option value="">Select a specialty</option>
                {specialties.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </FormField>

            <FormField label="Qualifications">
              <input type="text" placeholder="e.g. MBBS, MRCGP" value={newDoc.qualification}
                onChange={e => setNewDoc(d => ({ ...d, qualification: e.target.value }))}
                style={modalInp} className="inp" />
            </FormField>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              <FormField label="Exp. (years)">
                <input type="number" min="0" max="60" value={newDoc.experience_years}
                  onChange={e => setNewDoc(d => ({ ...d, experience_years: e.target.value }))}
                  style={modalInp} className="inp" />
              </FormField>
              <FormField label="Fee (£)">
                <input type="number" min="0" step="0.01" value={newDoc.consultation_fee}
                  onChange={e => setNewDoc(d => ({ ...d, consultation_fee: e.target.value }))}
                  style={modalInp} className="inp" />
              </FormField>
              <FormField label="Phone">
                <input type="tel" placeholder="+44 1904 ..." value={newDoc.phone}
                  onChange={e => setNewDoc(d => ({ ...d, phone: e.target.value }))}
                  style={modalInp} className="inp" />
              </FormField>
            </div>

            <FormField label="Bio">
              <textarea rows={3} placeholder="Brief professional bio..." value={newDoc.bio}
                onChange={e => setNewDoc(d => ({ ...d, bio: e.target.value }))}
                style={{ ...modalInp, resize: 'vertical' }} className="inp" />
            </FormField>

            <Modal.Footer>
              <button onClick={() => { setCreateStep(0); setCreateError('') }} style={cancelBtnStyle}>← Back</button>
              <button onClick={handleCreateDoctor} disabled={creating} style={{ ...confirmBtnStyle, opacity: creating ? 0.75 : 1 }}>
                {creating && <BtnSpinner />}
                {creating ? 'Creating...' : 'Create doctor'}
              </button>
            </Modal.Footer>
          </div>
        )}
      </Modal>
    </div>
  )
}

// ── Small reusable field wrapper ─────────────────────────────
function FormField({ label, required, children }) {
  return (
    <div>
      <label style={{ fontSize: '13px', fontWeight: 500, color: '#444', display: 'block', marginBottom: '6px' }}>
        {label}{required && <span style={{ color: '#E24B4A' }}> *</span>}
      </label>
      {children}
    </div>
  )
}

// ── Styles ───────────────────────────────────────────────────
const pg           = { background: '#f5f3ee', minHeight: '100vh', fontFamily: "'Instrument Sans','DM Sans',sans-serif" }
const wrap         = { maxWidth: '1200px', margin: '0 auto', padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: '20px' }
const h1           = { fontFamily: "'Instrument Serif',serif", fontSize: '28px', color: '#1a1a2e', fontWeight: 400 }
const sub          = { fontSize: '14px', color: '#888', marginTop: '4px' }
const addBtn       = { background: '#1a3a5c', color: '#fff', border: 'none', padding: '10px 22px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'background .2s' }
const searchInp    = { width: '100%', border: '0.5px solid #d0cec7', borderRadius: '8px', padding: '11px 14px 11px 36px', fontSize: '14px', fontFamily: 'inherit', background: '#fff', outline: 'none' }
const selectInp    = { border: '0.5px solid #d0cec7', borderRadius: '8px', padding: '11px 14px', fontSize: '14px', fontFamily: 'inherit', background: '#fff', outline: 'none', minWidth: '180px' }
const docRow       = { display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr auto', padding: '14px 20px', alignItems: 'center', cursor: 'pointer', transition: 'background .15s', gap: '0' }
const delBtnStyle  = { background: '#FCEBEB', color: '#791F1F', border: 'none', padding: '5px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }
const modalInp     = { width: '100%', border: '0.5px solid #d0cec7', borderRadius: '7px', padding: '10px 12px', fontSize: '14px', fontFamily: 'inherit', color: '#1a1a2e', background: '#fff', outline: 'none', transition: 'border .2s' }
const cancelBtnStyle  = { background: 'transparent', border: '0.5px solid #d0cec7', color: '#666', padding: '9px 18px', borderRadius: '7px', fontSize: '14px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }
const confirmBtnStyle = { background: '#1a3a5c', color: '#fff', border: 'none', padding: '9px 20px', borderRadius: '7px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '8px', transition: 'background .2s' }

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600&family=Instrument+Serif:ital@0;1&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  .doc-row:hover{background:#fafaf8!important}
  .inp:focus{border-color:#1a3a5c!important;box-shadow:0 0 0 3px rgba(26,58,92,.08)!important;outline:none}
  .del-btn:hover{background:#F7C1C1!important}
  .add-btn:hover{background:#0f2740!important}
`