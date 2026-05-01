// src/components/ErrorMessage.jsx
// Usage: <ErrorMessage message="Something went wrong" onRetry={refetch} />

export default function ErrorMessage({ message = 'Something went wrong', onRetry }) {
  return (
    <div style={{
      display:        'flex',
      flexDirection:  'column',
      alignItems:     'center',
      justifyContent: 'center',
      padding:        '48px 24px',
      gap:            '14px',
      fontFamily:     "'Instrument Sans', sans-serif",
    }}>
      <div style={{
        width:        '48px',
        height:       '48px',
        borderRadius: '50%',
        background:   '#FCEBEB',
        display:      'flex',
        alignItems:   'center',
        justifyContent: 'center',
      }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#E24B4A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      </div>
      <p style={{ fontSize: '14px', color: '#666', textAlign: 'center', maxWidth: '300px' }}>{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            background:   'transparent',
            border:       '0.5px solid #d0cec7',
            color:        '#444',
            padding:      '8px 18px',
            borderRadius: '7px',
            fontSize:     '13px',
            fontWeight:   500,
            cursor:       'pointer',
            fontFamily:   'inherit',
          }}
        >
          Try again
        </button>
      )}
    </div>
  )
}


// src/components/EmptyState.jsx
// Usage: <EmptyState message="No appointments yet" action={{ label: 'Book one', onClick: fn }} />

export function EmptyState({ icon, message = 'Nothing here yet', sub, action }) {
  return (
    <div style={{
      display:        'flex',
      flexDirection:  'column',
      alignItems:     'center',
      justifyContent: 'center',
      padding:        '56px 24px',
      gap:            '12px',
      fontFamily:     "'Instrument Sans', sans-serif",
      textAlign:      'center',
    }}>
      <div style={{
        width:        '56px',
        height:       '56px',
        borderRadius: '50%',
        background:   '#f0f4f8',
        display:      'flex',
        alignItems:   'center',
        justifyContent: 'center',
        fontSize:     '24px',
        marginBottom: '4px',
      }}>
        {icon || (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        )}
      </div>
      <p style={{ fontSize: '15px', fontWeight: 500, color: '#333', margin: 0 }}>{message}</p>
      {sub && <p style={{ fontSize: '13px', color: '#888', margin: 0, maxWidth: '280px' }}>{sub}</p>}
      {action && (
        <button
          onClick={action.onClick}
          style={{
            background:   '#1a3a5c',
            color:        '#fff',
            border:       'none',
            padding:      '10px 22px',
            borderRadius: '8px',
            fontSize:     '14px',
            fontWeight:   500,
            cursor:       'pointer',
            fontFamily:   'inherit',
            marginTop:    '8px',
          }}
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
