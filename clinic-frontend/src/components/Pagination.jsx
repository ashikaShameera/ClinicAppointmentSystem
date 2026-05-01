// src/components/Pagination.jsx
// Usage:
//   <Pagination page={page} perPage={10} total={total} onPageChange={setPage} />

export default function Pagination({ page, perPage, total, onPageChange }) {
  const totalPages = Math.ceil(total / perPage)
  if (totalPages <= 1) return null

  const from = (page - 1) * perPage + 1
  const to   = Math.min(page * perPage, total)

  // Build page number array with ellipsis
  const buildPages = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
    if (page <= 4) return [1, 2, 3, 4, 5, '...', totalPages]
    if (page >= totalPages - 3) return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
    return [1, '...', page - 1, page, page + 1, '...', totalPages]
  }

  const pages = buildPages()

  return (
    <div style={{
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'space-between',
      flexWrap:       'wrap',
      gap:            '12px',
      fontFamily:     "'Instrument Sans', 'DM Sans', sans-serif",
      fontSize:       '13px',
      color:          '#888',
      marginTop:      '20px',
    }}>
      {/* Result count */}
      <span>
        Showing <strong style={{ color: '#1a1a2e' }}>{from}–{to}</strong> of <strong style={{ color: '#1a1a2e' }}>{total}</strong> results
      </span>

      {/* Page buttons */}
      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>

        {/* Prev */}
        <PageBtn
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          label={
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          }
        />

        {/* Page numbers */}
        {pages.map((p, i) =>
          p === '...'
            ? <span key={`e-${i}`} style={{ padding: '0 6px', color: '#ccc', fontSize: '14px' }}>…</span>
            : <PageBtn
                key={p}
                onClick={() => onPageChange(p)}
                active={p === page}
                label={p}
              />
        )}

        {/* Next */}
        <PageBtn
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          label={
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          }
        />
      </div>
    </div>
  )
}

function PageBtn({ onClick, disabled, active, label }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        minWidth:     '34px',
        height:       '34px',
        padding:      '0 6px',
        border:       active ? '0.5px solid #1a3a5c' : '0.5px solid #e0ddd6',
        borderRadius: '6px',
        background:   active ? '#1a3a5c' : disabled ? '#fafaf8' : '#fff',
        color:        active ? '#fff' : disabled ? '#ccc' : '#444',
        fontSize:     '13px',
        fontWeight:   active ? 600 : 400,
        cursor:       disabled ? 'not-allowed' : 'pointer',
        display:      'flex',
        alignItems:   'center',
        justifyContent: 'center',
        fontFamily:   'inherit',
        transition:   'all .15s',
      }}
    >
      {label}
    </button>
  )
}
