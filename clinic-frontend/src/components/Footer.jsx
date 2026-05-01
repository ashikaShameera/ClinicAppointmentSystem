import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer style={{ background: '#0d2137', color: '#fff', padding: '56px 0 0', fontFamily: "'Instrument Sans', 'DM Sans', sans-serif" }}>
      <div style={{ maxWidth: '1120px', margin: '0 auto', padding: '0 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1.5fr', gap: '48px', paddingBottom: '48px', borderBottom: '0.5px solid rgba(255,255,255,0.1)' }}>

          {/* Brand */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{ width: '32px', height: '32px', background: 'rgba(255,255,255,0.1)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7ec8e3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                </svg>
              </div>
              <span style={{ fontFamily: "'Instrument Serif', serif", fontSize: '18px', fontWeight: 400 }}>York Clinic</span>
            </div>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, maxWidth: '280px', marginBottom: '20px' }}>
              Delivering compassionate, expert healthcare to the people of York since 2009.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              {['14 Bootham, York', 'YO30 7BL'].map((line, i) => (
                <span key={i} style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)' }}>{line}{i === 0 ? ' ·' : ''}</span>
              ))}
            </div>
          </div>

          {/* Quick links */}
          <div>
            <p style={{ fontSize: '13px', fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: '16px' }}>Navigation</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[['/', 'Home'], ['/about', 'About us'], ['/contact', 'Contact'], ['/login', 'Log in'], ['/register', 'Register']].map(([to, label]) => (
                <Link key={to} to={to} style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', textDecoration: 'none', transition: 'color .15s' }}
                  onMouseOver={e => e.target.style.color = '#fff'}
                  onMouseOut={e => e.target.style.color = 'rgba(255,255,255,0.6)'}>{label}</Link>
              ))}
            </div>
          </div>

          {/* Specialties */}
          <div>
            <p style={{ fontSize: '13px', fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: '16px' }}>Specialties</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {['General Practice', 'Cardiology', 'Dermatology', 'Neurology', 'Orthopedics'].map(s => (
                <Link key={s} to="/register" style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', textDecoration: 'none', transition: 'color .15s' }}
                  onMouseOver={e => e.target.style.color = '#fff'}
                  onMouseOut={e => e.target.style.color = 'rgba(255,255,255,0.6)'}>{s}</Link>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div>
            <p style={{ fontSize: '13px', fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: '16px' }}>Contact</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { icon: '📞', text: '+44 1904 123456' },
                { icon: '✉️', text: 'hello@yorkclinic.nhs.uk' },
                { icon: '🕐', text: 'Mon–Fri 8:30–18:00' },
                { icon: '🕐', text: 'Sat 9:00–13:00' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px' }}>{item.icon}</span>
                  <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)' }}>{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 0', flexWrap: 'wrap', gap: '12px' }}>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)' }}>© 2024 York Clinic. All rights reserved.</p>
          <div style={{ display: 'flex', gap: '24px' }}>
            {['Privacy policy', 'Terms of service', 'Accessibility'].map(link => (
              <Link key={link} to="/" style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', textDecoration: 'none' }}>{link}</Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
