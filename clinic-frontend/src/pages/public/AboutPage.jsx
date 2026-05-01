import { Link } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'

export default function AboutPage() {
  const team = [
    { name: 'Dr. James Smith',  role: 'General Practitioner',  exp: '12 years', qual: 'MBBS, MRCGP',   color: '#2a6496', bio: 'Passionate about preventive care and building long-term relationships with patients across all age groups.' },
    { name: 'Dr. Sarah Jones',  role: 'Consultant Cardiologist', exp: '18 years', qual: 'MBBS, MRCP, MD', color: '#c0392b', bio: 'Specialising in arrhythmia and heart failure management, with a focus on minimally invasive interventions.' },
    { name: 'Dr. Priya Patel',  role: 'Dermatologist',           exp: '9 years',  qual: 'MBBS, MRCP, FRCP', color: '#27ae60', bio: 'Expert in inflammatory skin conditions and early skin cancer detection through advanced imaging techniques.' },
  ]

  const values = [
    {
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
      ),
      title: 'Patient-first',
      desc: 'Every decision we make starts with a single question: is this the best outcome for our patients? Clinical excellence and compassionate care are never in conflict.',
    },
    {
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      ),
      title: 'Transparency',
      desc: 'We believe you deserve clear, honest communication about your health. No jargon, no guessing — just straightforward guidance you can trust.',
    },
    {
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
      ),
      title: 'Data security',
      desc: 'Your medical data is private and sacred. We use industry-leading encryption and follow GDPR and NHS standards to protect every record.',
    },
    {
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
        </svg>
      ),
      title: 'Innovation',
      desc: 'We continuously invest in technology that improves your care — from instant booking to digital health records and smart appointment reminders.',
    },
  ]

  const milestones = [
    { year: '2009', title: 'Founded', desc: 'The clinic opened its doors in York with a team of 3 doctors and a vision for modern, accessible healthcare.' },
    { year: '2013', title: 'Expanded', desc: 'Added cardiology, dermatology, and neurology departments to serve a broader range of patient needs.' },
    { year: '2018', title: 'Digital first', desc: 'Launched our first online booking system, reducing wait times by 40% in the first year alone.' },
    { year: '2022', title: 'New platform', desc: 'Rebuilt our entire patient management system from the ground up for speed, security, and ease of use.' },
    { year: '2024', title: 'Today', desc: '10,000+ patients, 50+ specialists, and a commitment to being York\'s most trusted healthcare provider.' },
  ]

  return (
    <div style={{ fontFamily: "'Instrument Sans', 'DM Sans', sans-serif", color: '#1a1a2e', background: '#fafaf8' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600&family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@400;500&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        .fade-up { animation:fadeUp .6s ease both; }
        .delay-1 { animation-delay:.1s; } .delay-2 { animation-delay:.2s; } .delay-3 { animation-delay:.3s; }
        .container { max-width:1120px; margin:0 auto; padding:0 24px; }
        .section { padding:80px 0; }
        .section-label { font-size:12px; font-weight:600; letter-spacing:.12em; text-transform:uppercase; color:#2a6496; margin-bottom:12px; }
        .section-title { font-family:'Instrument Serif',serif; font-size:clamp(30px,4vw,46px); line-height:1.15; color:#1a1a2e; margin-bottom:16px; }
        .value-card { background:#fff; border:0.5px solid #e8e6df; border-radius:12px; padding:28px; transition:transform .2s,box-shadow .2s; }
        .value-card:hover { transform:translateY(-3px); box-shadow:0 10px 28px rgba(26,58,92,.07); }
        .team-card { background:#fff; border:0.5px solid #e8e6df; border-radius:12px; overflow:hidden; transition:transform .2s,box-shadow .2s; }
        .team-card:hover { transform:translateY(-4px); box-shadow:0 12px 32px rgba(26,58,92,.09); }
        .grid-2 { display:grid; grid-template-columns:repeat(auto-fit,minmax(260px,1fr)); gap:24px; }
        .grid-3 { display:grid; grid-template-columns:repeat(auto-fit,minmax(280px,1fr)); gap:24px; }
        .btn-primary { display:inline-block; background:#1a3a5c; color:#fff; padding:14px 32px; border-radius:6px; font-weight:500; font-size:15px; text-decoration:none; transition:background .2s; }
        .btn-primary:hover { background:#0f2740; }
        .btn-outline { display:inline-block; border:1.5px solid #1a3a5c; color:#1a3a5c; padding:13px 32px; border-radius:6px; font-weight:500; font-size:15px; text-decoration:none; transition:all .2s; }
        .btn-outline:hover { background:#1a3a5c; color:#fff; }
      `}</style>

      <Navbar />

      {/* ── HERO ──────────────────────────────────────────── */}
      <section style={{ background: 'linear-gradient(135deg, #0d2137 0%, #1a3a5c 100%)', color: '#fff', padding: '96px 0 80px' }}>
        <div className="container">
          <div style={{ maxWidth: '680px' }}>
            <p className="fade-up" style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', color: '#7ec8e3', marginBottom: '16px' }}>Our story</p>
            <h1 className="fade-up delay-1" style={{ fontFamily: "'Instrument Serif', serif", fontSize: 'clamp(38px,5vw,60px)', lineHeight: 1.1, marginBottom: '20px' }}>
              Care built on<br /><em style={{ fontStyle: 'italic', color: '#7ec8e3' }}>trust and expertise</em>
            </h1>
            <p className="fade-up delay-2" style={{ fontSize: '18px', lineHeight: 1.7, color: 'rgba(255,255,255,0.75)', marginBottom: '36px' }}>
              Since 2009, we've been delivering exceptional healthcare to the people of York. We combine clinical excellence with a deep commitment to personalised, compassionate care.
            </p>
            <div className="fade-up delay-3" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <Link to="/register" className="btn-primary" style={{ background: '#fff', color: '#1a3a5c' }}>Book appointment</Link>
              <Link to="/contact" className="btn-outline" style={{ borderColor: 'rgba(255,255,255,0.4)', color: '#fff' }}>Get in touch</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── MISSION ───────────────────────────────────────── */}
      <section className="section" style={{ background: '#fff' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'center' }}>
            <div>
              <p className="section-label">Our mission</p>
              <h2 className="section-title">Making great healthcare<br />accessible to everyone</h2>
              <p style={{ fontSize: '16px', lineHeight: 1.75, color: '#555', marginBottom: '20px' }}>
                We believe that quality healthcare should not be a privilege. Our clinic was founded on the principle that every patient deserves timely access to skilled, compassionate doctors who listen and care.
              </p>
              <p style={{ fontSize: '16px', lineHeight: 1.75, color: '#555', marginBottom: '32px' }}>
                We've built a platform that removes friction from the care journey — from the moment you search for a specialist to the moment you receive your diagnosis and follow-up plan.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                {[['10,000+', 'Patients served'], ['50+', 'Specialist doctors'], ['10', 'Medical specialties'], ['98%', 'Patient satisfaction']].map(([v, l], i) => (
                  <div key={i} style={{ background: '#f0f4f8', borderRadius: '10px', padding: '18px 20px' }}>
                    <p style={{ fontFamily: "'Instrument Serif', serif", fontSize: '30px', color: '#1a3a5c' }}>{v}</p>
                    <p style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>{l}</p>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ position: 'relative' }}>
              <div style={{ background: 'linear-gradient(135deg, #1a3a5c, #1d5a8a)', borderRadius: '16px', padding: '48px 40px', color: '#fff' }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#7ec8e3" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '20px' }}>
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                </svg>
                <h3 style={{ fontFamily: "'Instrument Serif', serif", fontSize: '26px', lineHeight: 1.3, marginBottom: '16px' }}>
                  "Our purpose is simple: to provide the care we would want for our own families."
                </h3>
                <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)' }}>— Clinical Director, York Clinic</p>
              </div>
              <div style={{ position: 'absolute', top: '-16px', right: '-16px', width: '80px', height: '80px', background: '#f0f4f8', borderRadius: '50%', zIndex: -1 }} />
              <div style={{ position: 'absolute', bottom: '-20px', left: '-20px', width: '120px', height: '120px', background: '#e8f0f8', borderRadius: '50%', zIndex: -1 }} />
            </div>
          </div>
        </div>
      </section>

      {/* ── VALUES ────────────────────────────────────────── */}
      <section className="section" style={{ background: '#fafaf8' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <p className="section-label">What we stand for</p>
            <h2 className="section-title" style={{ margin: '0 auto' }}>Our core values</h2>
          </div>
          <div className="grid-2">
            {values.map((v, i) => (
              <div key={i} className="value-card fade-up" style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', animationDelay: `${i * .1}s` }}>
                <div style={{ color: '#1a3a5c', flexShrink: 0, background: '#e8f0f8', padding: '12px', borderRadius: '10px' }}>{v.icon}</div>
                <div>
                  <h3 style={{ fontSize: '17px', fontWeight: 600, marginBottom: '8px' }}>{v.title}</h3>
                  <p style={{ fontSize: '14px', color: '#666', lineHeight: 1.65 }}>{v.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TIMELINE ──────────────────────────────────────── */}
      <section className="section" style={{ background: '#fff' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <p className="section-label">Our journey</p>
            <h2 className="section-title" style={{ margin: '0 auto' }}>15 years of growing<br />with our community</h2>
          </div>
          <div style={{ position: 'relative', maxWidth: '700px', margin: '0 auto' }}>
            <div style={{ position: 'absolute', left: '72px', top: 0, bottom: 0, width: '1px', background: '#e8e6df' }} />
            {milestones.map((m, i) => (
              <div key={i} className="fade-up" style={{ display: 'flex', gap: '24px', marginBottom: '36px', animationDelay: `${i * .1}s` }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: i === milestones.length - 1 ? '#1a3a5c' : '#f0f4f8', border: `2px solid ${i === milestones.length - 1 ? '#1a3a5c' : '#e0e8f0'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative', zIndex: 1 }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: i === milestones.length - 1 ? '#fff' : '#1a3a5c' }}>{m.year}</span>
                </div>
                <div style={{ paddingTop: '14px' }}>
                  <h3 style={{ fontSize: '17px', fontWeight: 600, marginBottom: '6px' }}>{m.title}</h3>
                  <p style={{ fontSize: '14px', color: '#666', lineHeight: 1.65 }}>{m.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TEAM ──────────────────────────────────────────── */}
      <section className="section" style={{ background: '#fafaf8' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <p className="section-label">The team</p>
            <h2 className="section-title" style={{ margin: '0 auto' }}>The specialists<br />behind your care</h2>
          </div>
          <div className="grid-3">
            {team.map((m, i) => (
              <div key={i} className="team-card fade-up" style={{ animationDelay: `${i * .1}s` }}>
                <div style={{ background: `linear-gradient(135deg, ${m.color}dd, ${m.color})`, padding: '32px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 600, color: '#fff' }}>
                    {m.name.split(' ').filter(w => w !== 'Dr.').map(w => w[0]).join('')}
                  </div>
                  <div style={{ textAlign: 'center', color: '#fff' }}>
                    <p style={{ fontWeight: 600, fontSize: '17px' }}>{m.name}</p>
                    <p style={{ fontSize: '13px', opacity: 0.75, marginTop: '3px' }}>{m.role}</p>
                  </div>
                </div>
                <div style={{ padding: '22px 24px' }}>
                  <p style={{ fontSize: '14px', color: '#444', lineHeight: 1.65, marginBottom: '16px' }}>{m.bio}</p>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ flex: 1, background: '#f0f4f8', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
                      <p style={{ fontSize: '15px', fontWeight: 600, color: '#1a3a5c' }}>{m.exp}</p>
                      <p style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>Experience</p>
                    </div>
                    <div style={{ flex: 1, background: '#f0f4f8', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
                      <p style={{ fontSize: '12px', fontWeight: 500, color: '#1a3a5c' }}>{m.qual}</p>
                      <p style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>Qualifications</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────── */}
      <section style={{ background: '#1a3a5c', color: '#fff', padding: '80px 0' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 'clamp(28px,3.5vw,42px)', marginBottom: '16px' }}>
            Ready to experience<br />the difference?
          </h2>
          <p style={{ fontSize: '17px', color: 'rgba(255,255,255,0.7)', marginBottom: '36px', maxWidth: '480px', margin: '0 auto 36px' }}>
            Join our growing family of patients and discover healthcare that truly cares.
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/register" style={{ display: 'inline-block', background: '#fff', color: '#1a3a5c', padding: '14px 32px', borderRadius: '6px', fontWeight: 600, textDecoration: 'none' }}>Book your first visit</Link>
            <Link to="/contact" style={{ display: 'inline-block', border: '1.5px solid rgba(255,255,255,0.4)', color: '#fff', padding: '13px 32px', borderRadius: '6px', fontWeight: 500, textDecoration: 'none' }}>Contact us</Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
