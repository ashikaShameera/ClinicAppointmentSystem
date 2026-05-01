// src/components/Modal.jsx
// Usage:
//   <Modal open={open} onClose={() => setOpen(false)} title="Confirm cancellation">
//     <p>Are you sure?</p>
//     <Modal.Footer>
//       <button onClick={() => setOpen(false)}>No</button>
//       <button onClick={handleConfirm}>Yes, cancel</button>
//     </Modal.Footer>
//   </Modal>

import { useEffect } from 'react'

export default function Modal({ open, onClose, title, children, width = 440 }) {
  // Close on Escape key
  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  // Lock body scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <>
      <style>{`
        @keyframes modalIn{from{opacity:0;transform:translateY(-12px) scale(.97)}to{opacity:1;transform:translateY(0) scale(1)}}
        .modal-box{animation:modalIn .2s ease both}
      `}</style>

      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position:   'fixed', inset: 0, zIndex: 200,
          background: 'rgba(13, 33, 55, 0.45)',
          display:    'flex', alignItems: 'center', justifyContent: 'center',
          padding:    '24px',
        }}
      >
        {/* Panel — stop click propagation so clicking inside doesn't close */}
        <div
          className="modal-box"
          onClick={e => e.stopPropagation()}
          style={{
            background:   '#fff',
            borderRadius: '14px',
            width:        '100%',
            maxWidth:     width,
            border:       '0.5px solid #e0ddd6',
            fontFamily:   "'Instrument Sans', 'DM Sans', sans-serif",
            overflow:     'hidden',
          }}
        >
          {/* Header */}
          <div style={{
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'space-between',
            padding:        '18px 22px',
            borderBottom:   '0.5px solid #e8e6df',
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1a1a2e', margin: 0 }}>{title}</h3>
            <button
              onClick={onClose}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#999', padding: '4px', borderRadius: '4px',
                display: 'flex', alignItems: 'center', lineHeight: 1,
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          {/* Body */}
          <div style={{ padding: '20px 22px', fontSize: '14px', color: '#444', lineHeight: 1.65 }}>
            {children}
          </div>
        </div>
      </div>
    </>
  )
}

// Footer sub-component — attach action buttons
Modal.Footer = function ModalFooter({ children }) {
  return (
    <div style={{
      display:        'flex',
      justifyContent: 'flex-end',
      gap:            '10px',
      marginTop:      '20px',
      paddingTop:     '16px',
      borderTop:      '0.5px solid #e8e6df',
    }}>
      {children}
    </div>
  )
}

// Pre-built confirm/cancel dialog
// Usage: <ConfirmModal open={open} onClose={close} onConfirm={fn} title="..." message="..." danger />
export function ConfirmModal({ open, onClose, onConfirm, title, message, confirmLabel = 'Confirm', danger = false, loading = false }) {
  return (
    <Modal open={open} onClose={onClose} title={title} width={400}>
      <p style={{ fontSize: '14px', color: '#555', lineHeight: 1.65 }}>{message}</p>
      <Modal.Footer>
        <button
          onClick={onClose}
          style={{ background: 'transparent', border: '0.5px solid #d0cec7', color: '#555', padding: '9px 18px', borderRadius: '7px', fontSize: '14px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          style={{
            background:  danger ? '#c0392b' : '#1a3a5c',
            color:       '#fff',
            border:      'none',
            padding:     '9px 18px',
            borderRadius:'7px',
            fontSize:    '14px',
            fontWeight:  600,
            cursor:      loading ? 'not-allowed' : 'pointer',
            fontFamily:  'inherit',
            opacity:     loading ? 0.75 : 1,
            display:     'flex',
            alignItems:  'center',
            gap:         '6px',
          }}
        >
          {loading && (
            <span style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin .7s linear infinite' }} />
          )}
          {confirmLabel}
        </button>
      </Modal.Footer>
    </Modal>
  )
}
