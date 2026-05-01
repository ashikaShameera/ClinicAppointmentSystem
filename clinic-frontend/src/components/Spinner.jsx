// src/components/Spinner.jsx
// Usage: <Spinner /> or <Spinner size={32} color="#1a3a5c" />

export default function Spinner({ size = 24, color = '#1a3a5c' }) {
  return (
    <span
      style={{
        display:       'inline-block',
        width:         size,
        height:        size,
        border:        `2px solid ${color}22`,
        borderTopColor: color,
        borderRadius:  '50%',
        animation:     'spin .7s linear infinite',
        flexShrink:    0,
      }}
    >
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </span>
  )
}

// Full-page centered loading state
export function PageLoader() {
  return (
    <div style={{
      minHeight:      '60vh',
      display:        'flex',
      flexDirection:  'column',
      alignItems:     'center',
      justifyContent: 'center',
      gap:            '12px',
      color:          '#999',
      fontFamily:     "'Instrument Sans', sans-serif",
      fontSize:       '14px',
    }}>
      <Spinner size={36} />
      Loading...
    </div>
  )
}

// Inline button spinner (white, for dark buttons)
export function BtnSpinner() {
  return (
    <span style={{
      display:        'inline-block',
      width:          '16px',
      height:         '16px',
      border:         '2px solid rgba(255,255,255,.3)',
      borderTopColor: '#fff',
      borderRadius:   '50%',
      animation:      'spin .7s linear infinite',
      flexShrink:     0,
    }} />
  )
}
