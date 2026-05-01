import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import api from '../../api/axios'

export default function HomePage() {
  const [doctors, setDoctors] = useState([])
  const [specialties, setSpecialties] = useState([])
  const [loadingDoctors, setLoadingDoctors] = useState(true)

  useEffect(() => {
    api.get('/api/doctors?per_page=6&is_accepting=true')
      .then(r => setDoctors(r.data.doctors || []))
      .catch(() => setDoctors([]))
      .finally(() => setLoadingDoctors(false))

    api.get('/api/doctors/specialties/all')
      .then(r => setSpecialties(r.data || []))
      .catch(() => setSpecialties([]))
  }, [])

  const stats = [
    { value: '50+', label: 'Specialist doctors' },
    { value: '10k+', label: 'Patients served' },
    { value: '15+', label: 'Years of care' },
    { value: '98%', label: 'Satisfaction rate' },
  ]

  const features = [
    {
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
      ),
      title: 'Easy booking',
      desc: 'Book appointments online in seconds. Choose your doctor, pick a time slot, and confirm — no phone calls needed.',
    },
    {
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
        </svg>
      ),
      title: 'Medical records',
      desc: 'Access your full health history, prescriptions, and diagnoses securely from anywhere at any time.',
    },
    {
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      ),
      title: 'Top specialists',
      desc: 'Our team includes board-certified specialists across 10 medical disciplines, all committed to your wellbeing.',
    },
    {
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/>
        </svg>
      ),
      title: 'Smart reminders',
      desc: 'Never miss an appointment. Get timely notifications and reminders for upcoming visits and follow-ups.',
    },
    {
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
      ),
      title: 'Secure & private',
      desc: 'Your health data is encrypted and protected. We follow the highest standards of medical data privacy.',
    },
    {
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
        </svg>
      ),
      title: 'Real-time availability',
      desc: 'See live slot availability for every doctor. No more guessing — book only slots that are actually open.',
    },
  ]

  const testimonials = [
    { name: 'Sarah Mitchell', role: 'Patient since 2022', rating: 5, text: 'Booking was effortless and Dr. Smith was incredibly thorough. I had my diagnosis and prescription within the hour.' },
    { name: 'James Okonkwo', role: 'Patient since 2021', rating: 5, text: 'The online records system is a game changer. I can see all my past visits and share them with other doctors easily.' },
    { name: 'Emily Barker', role: 'Patient since 2023', rating: 5, text: "I was nervous about switching clinics, but the team here made it completely seamless. Best healthcare experience I've had." },
  ]

  const specialtyIcons = {
    'General Practice': '🩺', 'Cardiology': '❤️', 'Dermatology': '🔬',
    'Neurology': '🧠', 'Orthopedics': '🦴', 'Pediatrics': '👶',
    'Psychiatry': '💭', 'Gynecology': '🌸', 'Ophthalmology': '👁️', 'ENT': '👂',
  }

  return (
    <div style={{ fontFamily: "'Instrument Sans', 'DM Sans', sans-serif", color: '#1a1a2e', background: '#fafaf8' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600&family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        .fade-up { animation: fadeUp .7s ease both; }
        .delay-1 { animation-delay: .1s; }
        .delay-2 { animation-delay: .2s; }
        .delay-3 { animation-delay: .3s; }
        .btn-primary { display:inline-block; background:#1a3a5c; color:#fff; padding:14px 32px; border-radius:6px; font-weight:500; font-size:15px; text-decoration:none; transition:background .2s, transform .15s; }
        .btn-primary:hover { background:#0f2740; transform:translateY(-1px); }
        .btn-outline { display:inline-block; border:1.5px solid #1a3a5c; color:#1a3a5c; padding:13px 32px; border-radius:6px; font-weight:500; font-size:15px; text-decoration:none; transition:all .2s; }
        .btn-outline:hover { background:#1a3a5c; color:#fff; }
        .feature-card { background:#fff; border:0.5px solid #e8e6df; border-radius:12px; padding:28px; transition:transform .2s, box-shadow .2s; }
        .feature-card:hover { transform:translateY(-4px); box-shadow:0 12px 32px rgba(26,58,92,.08); }
        .doctor-card { background:#fff; border:0.5px solid #e8e6df; border-radius:12px; overflow:hidden; transition:transform .2s, box-shadow .2s; }
        .doctor-card:hover { transform:translateY(-4px); box-shadow:0 12px 32px rgba(26,58,92,.08); }
        .specialty-chip { background:#fff; border:0.5px solid #e8e6df; border-radius:8px; padding:14px 18px; text-align:center; cursor:pointer; transition:all .2s; text-decoration:none; color:inherit; display:flex; flex-direction:column; align-items:center; gap:6px; }
        .specialty-chip:hover { background:#1a3a5c; color:#fff; border-color:#1a3a5c; }
        .stat-card { text-align:center; }
        .section { padding:80px 0; }
        .container { max-width:1120px; margin:0 auto; padding:0 24px; }
        .grid-2 { display:grid; grid-template-columns:repeat(auto-fit,minmax(280px,1fr)); gap:24px; }
        .grid-3 { display:grid; grid-template-columns:repeat(auto-fit,minmax(300px,1fr)); gap:24px; }
        .grid-4 { display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:20px; }
        .section-label { font-size:12px; font-weight:600; letter-spacing:.12em; text-transform:uppercase; color:#2a6496; margin-bottom:12px; }
        .section-title { font-family:'Instrument Serif', serif; font-size:clamp(32px,4vw,48px); line-height:1.15; color:#1a1a2e; margin-bottom:16px; }
        .section-sub { font-size:17px; color:#555; line-height:1.7; max-width:560px; }
        .avatar-circle { width:64px; height:64px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:22px; font-weight:600; color:#fff; flex-shrink:0; }
        .star { color:#e8a020; }
      `}</style>

      <Navbar />

      {/* ── HERO ──────────────────────────────────────────── */}
      <section style={{ background: 'linear-gradient(135deg, #0d2137 0%, #1a3a5c 60%, #1d5a8a 100%)', color: '#fff', padding: '100px 0 80px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, right: 0, width: '50%', height: '100%', background: 'url("data:image/svg+xml,%3Csvg width=\'600\' height=\'600\' viewBox=\'0 0 600 600\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' stroke=\'rgba(255,255,255,0.04)\' stroke-width=\'1\'%3E%3Ccircle cx=\'300\' cy=\'300\' r=\'150\'/%3E%3Ccircle cx=\'300\' cy=\'300\' r=\'250\'/%3E%3Ccircle cx=\'300\' cy=\'300\' r=\'350\'/%3E%3C/g%3E%3C/svg%3E") center/cover', opacity: 0.6 }} />
        <div className="container" style={{ position: 'relative', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '60px', alignItems: 'center' }}>
          <div>
            <p className="fade-up" style={{ fontSize: '13px', fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', color: '#7ec8e3', marginBottom: '16px' }}>York's leading clinic</p>
            <h1 className="fade-up delay-1" style={{ fontFamily: "'Instrument Serif', serif", fontSize: 'clamp(38px, 5vw, 60px)', lineHeight: 1.1, marginBottom: '20px' }}>
              Healthcare that<br /><em style={{ fontStyle: 'italic', color: '#7ec8e3' }}>puts you first</em>
            </h1>
            <p className="fade-up delay-2" style={{ fontSize: '18px', lineHeight: 1.7, color: 'rgba(255,255,255,0.75)', marginBottom: '36px', maxWidth: '460px' }}>
              Book appointments with top specialists, manage your health records, and get the care you deserve — all in one place.
            </p>
            <div className="fade-up delay-3" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <Link to="/register" className="btn-primary" style={{ background: '#fff', color: '#1a3a5c' }}>Book appointment</Link>
              <Link to="/about" className="btn-outline" style={{ borderColor: 'rgba(255,255,255,0.4)', color: '#fff' }}>Learn more</Link>
            </div>
          </div>

          {/* Hero card */}
          <div className="fade-up delay-2" style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{ background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(10px)', border: '0.5px solid rgba(255,255,255,0.15)', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '380px', animation: 'float 4s ease-in-out infinite' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px' }}>
                <div style={{ background: 'rgba(126,200,227,0.2)', borderRadius: '10px', padding: '10px' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7ec8e3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                </div>
                <div>
                  <p style={{ fontWeight: 600, fontSize: '15px' }}>Next appointment</p>
                  <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>Tomorrow at 09:00</p>
                </div>
              </div>
              {[{ name: 'Dr. James Smith', spec: 'General Practice', color: '#2a6496' }, { name: 'Dr. Sarah Jones', spec: 'Cardiology', color: '#c0392b' }, { name: 'Dr. Priya Patel', spec: 'Dermatology', color: '#27ae60' }].map((d, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: i < 2 ? '0.5px solid rgba(255,255,255,0.1)' : 'none' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: d.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 600, color: '#fff', flexShrink: 0 }}>
                    {d.name.split(' ')[1][0]}{d.name.split(' ')[2][0]}
                  </div>
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: 500 }}>{d.name}</p>
                    <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.55)' }}>{d.spec}</p>
                  </div>
                  <div style={{ marginLeft: 'auto', background: 'rgba(126,200,227,0.15)', color: '#7ec8e3', fontSize: '11px', padding: '3px 10px', borderRadius: '20px' }}>Available</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ─────────────────────────────────────────── */}
      <section style={{ background: '#fff', padding: '48px 0', borderBottom: '0.5px solid #e8e6df' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
            {stats.map((s, i) => (
              <div key={i} className="stat-card fade-up" style={{ animationDelay: `${i * .1}s` }}>
                <p style={{ fontFamily: "'Instrument Serif', serif", fontSize: '40px', color: '#1a3a5c', fontWeight: 400 }}>{s.value}</p>
                <p style={{ fontSize: '14px', color: '#888', marginTop: '4px' }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ──────────────────────────────────────── */}
      <section className="section" style={{ background: '#fafaf8' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <p className="section-label">Why choose us</p>
            <h2 className="section-title" style={{ margin: '0 auto 16px' }}>Everything you need<br />in one platform</h2>
            <p className="section-sub" style={{ margin: '0 auto' }}>From booking to records, we've built a seamless experience that makes managing your health simple and stress-free.</p>
          </div>
          <div className="grid-3">
            {features.map((f, i) => (
              <div key={i} className="feature-card fade-up" style={{ animationDelay: `${i * .08}s` }}>
                <div style={{ color: '#1a3a5c', marginBottom: '16px' }}>{f.icon}</div>
                <h3 style={{ fontSize: '17px', fontWeight: 600, marginBottom: '8px', color: '#1a1a2e' }}>{f.title}</h3>
                <p style={{ fontSize: '14px', color: '#666', lineHeight: 1.65 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SPECIALTIES ───────────────────────────────────── */}
      <section className="section" style={{ background: '#fff' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <p className="section-label">Our specialties</p>
              <h2 className="section-title" style={{ marginBottom: 0 }}>Expert care across<br />every discipline</h2>
            </div>
            <Link to="/register" style={{ fontSize: '14px', color: '#1a3a5c', fontWeight: 500, textDecoration: 'none' }}>Book a specialist →</Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '14px' }}>
            {specialties.map((s, i) => (
              <Link to="/register" key={i} className="specialty-chip fade-up" style={{ animationDelay: `${i * .05}s` }}>
                <span style={{ fontSize: '24px' }}>{specialtyIcons[s.name] || '🏥'}</span>
                <span style={{ fontSize: '13px', fontWeight: 500 }}>{s.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── DOCTORS ───────────────────────────────────────── */}
      <section className="section" style={{ background: '#fafaf8' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <p className="section-label">Our team</p>
              <h2 className="section-title" style={{ marginBottom: 0 }}>Meet our specialists</h2>
            </div>
            <Link to="/register" style={{ fontSize: '14px', color: '#1a3a5c', fontWeight: 500, textDecoration: 'none' }}>View all doctors →</Link>
          </div>
          {loadingDoctors ? (
            <div style={{ display: 'flex', gap: '24px' }}>
              {[1, 2, 3].map(i => (
                <div key={i} style={{ flex: 1, background: '#fff', borderRadius: '12px', height: '220px', animation: 'pulse 1.5s infinite', border: '0.5px solid #e8e6df' }} />
              ))}
            </div>
          ) : (
            <div className="grid-3">
              {doctors.map((d, i) => (
                <div key={d.id} className="doctor-card fade-up" style={{ animationDelay: `${i * .08}s` }}>
                  <div style={{ background: 'linear-gradient(135deg, #1a3a5c, #1d5a8a)', padding: '28px 24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div className="avatar-circle" style={{ background: 'rgba(255,255,255,0.15)', fontSize: '20px' }}>
                      {d.full_name.split(' ').filter(w => w !== 'Dr.').map(w => w[0]).join('')}
                    </div>
                    <div style={{ color: '#fff' }}>
                      <p style={{ fontWeight: 600, fontSize: '16px' }}>{d.full_name}</p>
                      <p style={{ fontSize: '13px', opacity: 0.7, marginTop: '2px' }}>{d.specialty?.name}</p>
                    </div>
                  </div>
                  <div style={{ padding: '20px 24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <div style={{ textAlign: 'center' }}>
                        <p style={{ fontSize: '18px', fontWeight: 600, color: '#1a3a5c' }}>{d.experience_years}</p>
                        <p style={{ fontSize: '12px', color: '#888' }}>years exp.</p>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <p style={{ fontSize: '18px', fontWeight: 600, color: '#1a3a5c' }}>£{Number(d.consultation_fee).toFixed(0)}</p>
                        <p style={{ fontSize: '12px', color: '#888' }}>per visit</p>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <p style={{ fontSize: '18px', fontWeight: 600, color: '#1a3a5c' }}>
                          {d.total_reviews > 0 ? Number(d.rating).toFixed(1) : '—'}
                        </p>
                        <p style={{ fontSize: '12px', color: '#888' }}>rating</p>
                      </div>
                    </div>
                    {d.qualification && <p style={{ fontSize: '13px', color: '#666', marginBottom: '14px' }}>{d.qualification}</p>}
                    <Link to="/register" style={{ display: 'block', textAlign: 'center', background: '#1a3a5c', color: '#fff', padding: '10px', borderRadius: '6px', fontSize: '14px', fontWeight: 500, textDecoration: 'none', transition: 'background .2s' }}
                      onMouseOver={e => e.target.style.background = '#0f2740'}
                      onMouseOut={e => e.target.style.background = '#1a3a5c'}>
                      Book appointment
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────── */}
      <section className="section" style={{ background: '#1a3a5c', color: '#fff' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <p style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', color: '#7ec8e3', marginBottom: '12px' }}>Simple process</p>
            <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 'clamp(30px,4vw,44px)', marginBottom: '12px' }}>Book in 3 easy steps</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '40px', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '28px', left: '33%', right: '33%', height: '1px', background: 'rgba(255,255,255,0.15)' }} />
            {[
              { step: '01', title: 'Create account', desc: 'Register in seconds and complete your patient profile with your health information.' },
              { step: '02', title: 'Choose a doctor', desc: 'Browse specialists by specialty or name and view their availability and ratings.' },
              { step: '03', title: 'Confirm booking', desc: 'Pick a time slot, add a reason for your visit, and receive instant confirmation.' },
            ].map((s, i) => (
              <div key={i} style={{ textAlign: 'center', padding: '0 16px' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(126,200,227,0.15)', border: '1px solid rgba(126,200,227,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: '15px', fontWeight: 600, color: '#7ec8e3' }}>{s.step}</div>
                <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '10px' }}>{s.title}</h3>
                <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.65)', lineHeight: 1.65 }}>{s.desc}</p>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: '48px' }}>
            <Link to="/register" style={{ display: 'inline-block', background: '#fff', color: '#1a3a5c', padding: '14px 36px', borderRadius: '6px', fontWeight: 600, fontSize: '15px', textDecoration: 'none' }}>Get started now</Link>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ──────────────────────────────────── */}
      <section className="section" style={{ background: '#fff' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <p className="section-label">Patient stories</p>
            <h2 className="section-title" style={{ margin: '0 auto' }}>What our patients say</h2>
          </div>
          <div className="grid-3">
            {testimonials.map((t, i) => (
              <div key={i} style={{ background: '#fafaf8', border: '0.5px solid #e8e6df', borderRadius: '12px', padding: '28px' }}>
                <div style={{ display: 'flex', gap: '4px', marginBottom: '16px' }}>
                  {Array(t.rating).fill(0).map((_, j) => <span key={j} className="star" style={{ fontSize: '16px' }}>★</span>)}
                </div>
                <p style={{ fontSize: '15px', lineHeight: 1.7, color: '#444', marginBottom: '20px', fontStyle: 'italic' }}>"{t.text}"</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div className="avatar-circle" style={{ width: '42px', height: '42px', background: '#1a3a5c', fontSize: '14px' }}>
                    {t.name.split(' ').map(w => w[0]).join('')}
                  </div>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: '14px' }}>{t.name}</p>
                    <p style={{ fontSize: '12px', color: '#888' }}>{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────── */}
      <section style={{ background: '#f0f4f8', padding: '80px 0' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <p className="section-label">Start today</p>
          <h2 className="section-title" style={{ margin: '0 auto 16px' }}>Ready to take control<br />of your health?</h2>
          <p className="section-sub" style={{ margin: '0 auto 36px' }}>Join thousands of patients who manage their healthcare effortlessly with our platform.</p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/register" className="btn-primary">Create free account</Link>
            <Link to="/contact" className="btn-outline">Contact us</Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
