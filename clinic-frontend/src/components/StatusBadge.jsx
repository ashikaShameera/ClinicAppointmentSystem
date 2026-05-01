// src/components/StatusBadge.jsx
// Usage: <StatusBadge status="confirmed" />

const CONFIG = {
  pending:   { label: 'Pending',   bg: '#FAEEDA', color: '#633806', dot: '#BA7517' },
  confirmed: { label: 'Confirmed', bg: '#E1F5EE', color: '#085041', dot: '#1D9E75' },
  completed: { label: 'Completed', bg: '#E6F1FB', color: '#0C447C', dot: '#378ADD' },
  cancelled: { label: 'Cancelled', bg: '#FCEBEB', color: '#791F1F', dot: '#E24B4A' },
  no_show:   { label: 'No show',   bg: '#F1EFE8', color: '#5F5E5A', dot: '#888780' },
}

export default function StatusBadge({ status, size = 'md' }) {
  const cfg = CONFIG[status] || CONFIG.pending
  const pad = size === 'sm' ? '2px 8px' : '4px 10px'
  const fs  = size === 'sm' ? '11px' : '12px'

  return (
    <span style={{
      display:       'inline-flex',
      alignItems:    'center',
      gap:           '5px',
      background:    cfg.bg,
      color:         cfg.color,
      padding:       pad,
      borderRadius:  '20px',
      fontSize:      fs,
      fontWeight:    500,
      whiteSpace:    'nowrap',
      fontFamily:    "'Instrument Sans', sans-serif",
    }}>
      <span style={{
        width:        '6px',
        height:       '6px',
        borderRadius: '50%',
        background:   cfg.dot,
        flexShrink:   0,
      }} />
      {cfg.label}
    </span>
  )
}
