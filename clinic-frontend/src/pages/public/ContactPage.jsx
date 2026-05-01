import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'

// Fix Leaflet default marker icons in Vite
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const CLINIC_LAT = 53.9645
const CLINIC_LNG = -1.0810

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [errors, setErrors] = useState({})

  const validate = () => {
    const e = {}
    if (!form.name.trim())    e.name    = 'Name is required'
    if (!form.email.trim())   e.email   = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email'
    if (!form.subject.trim()) e.subject = 'Please select a subject'
    if (!form.message.trim()) e.message = 'Message is required'
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setSubmitting(true)
    await new Promise(r => setTimeout(r, 1200))
    setSubmitting(false)
    setSubmitted(true)
  }

  const locations = [
    { lat: 53.9645, lng: -1.0810, name: 'Main Clinic — Bootham', address: '14 Bootham, York, YO30 7BL', phone: '+44 1904 123456', hours: 'Mon–Fri 8:30–18:00' },
    { lat: 53.9630, lng: -1.0825, name: 'Cardiology Centre', address: '22 St Leonards Place, York, YO1 7HH', phone: '+44 1904 654321', hours: 'Tue/Thu/Sat' },
    { lat: 53.9612, lng: -1.0791, name: 'Skin & Dermatology', address: '5 Gillygate, York, YO31 7EA', phone: '+44 1904 789012', hours: 'Mon/Wed/Fri' },
  ]

  const faqs = [
    { q: 'How do I book an appointment?', a: 'Register for an account, then use the Book Appointment feature to search for a specialist and pick a time slot that suits you.' },
    { q: 'Can I cancel or reschedule?', a: 'Yes. You can cancel or reschedule up to 2 hours before your appointment from your patient dashboard.' },
    { q: 'How do I access my medical records?', a: 'Log in to your patient portal and navigate to Medical Records. All your visit history, diagnoses, and prescriptions are stored securely there.' },
    { q: 'Are your doctors accepting new patients?', a: 'Most of our doctors are currently accepting new patients. You can see live availability when browsing doctor profiles.' },
    { q: 'Do you offer urgent same-day appointments?', a: 'Yes. Our General Practice team keeps a number of same-day slots available for urgent concerns. Call us directly for these.' },
  ]

  const [openFaq, setOpenFaq] = useState(null)

  return (
    <div style={{ fontFamily: "'Instrument Sans', 'DM Sans', sans-serif", color: '#1a1a2e', background: '#fafaf8' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600&family=Instrument+Serif:ital@0;1&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        .fade-up { animation:fadeUp .6s ease both; }
        .container { max-width:1120px; margin:0 auto; padding:0 24px; }
        .section { padding:80px 0; }
        .section-label { font-size:12px; font-weight:600; letter-spacing:.12em; text-transform:uppercase; color:#2a6496; margin-bottom:12px; }
        .section-title { font-family:'Instrument Serif',serif; font-size:clamp(28px,4vw,44px); line-height:1.15; margin-bottom:16px; }
        .input-field { width:100%; border:0.5px solid #d0cec7; border-radius:8px; padding:12px 14px; font-size:15px; font-family:inherit; color:#1a1a2e; background:#fff; transition:border .2s,box-shadow .2s; outline:none; }
        .input-field:focus { border-color:#1a3a5c; box-shadow:0 0 0 3px rgba(26,58,92,.08); }
        .input-error { border-color:#e74c3c !important; }
        .error-text { font-size:12px; color:#e74c3c; margin-top:4px; }
        .label { font-size:13px; font-weight:500; color:#444; margin-bottom:6px; display:block; }
        .info-card { background:#fff; border:0.5px solid #e8e6df; border-radius:12px; padding:24px; }
        .faq-item { border-bottom:0.5px solid #e8e6df; }
        .faq-btn { width:100%; text-align:left; background:none; border:none; padding:18px 0; cursor:pointer; display:flex; justify-content:space-between; align-items:center; font-size:15px; font-weight:500; color:#1a1a2e; font-family:inherit; }
        .faq-btn:hover { color:#1a3a5c; }
        .location-card { background:#fff; border:0.5px solid #e8e6df; border-radius:12px; overflow:hidden; transition:transform .2s,box-shadow .2s; cursor:pointer; }
        .location-card:hover { transform:translateY(-3px); box-shadow:0 10px 28px rgba(26,58,92,.08); }
        .location-card.active { border-color:#1a3a5c; box-shadow:0 0 0 2px rgba(26,58,92,.15); }
        .submit-btn { width:100%; background:#1a3a5c; color:#fff; border:none; padding:14px; border-radius:8px; font-size:15px; font-weight:600; cursor:pointer; font-family:inherit; transition:background .2s; }
        .submit-btn:hover:not(:disabled) { background:#0f2740; }
        .submit-btn:disabled { opacity:.7; cursor:not-allowed; }
      `}</style>

      <Navbar />

      {/* ── HERO ──────────────────────────────────────────── */}
      <section style={{ background: 'linear-gradient(135deg, #0d2137 0%, #1a3a5c 100%)', color: '#fff', padding: '88px 0 72px' }}>
        <div className="container">
          <div style={{ maxWidth: '620px' }}>
            <p className="fade-up" style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', color: '#7ec8e3', marginBottom: '16px' }}>Get in touch</p>
            <h1 className="fade-up" style={{ fontFamily: "'Instrument Serif', serif", fontSize: 'clamp(36px,5vw,56px)', lineHeight: 1.1, marginBottom: '18px', animationDelay: '.1s' }}>
              We're here<br /><em style={{ color: '#7ec8e3' }}>whenever you need us</em>
            </h1>
            <p className="fade-up" style={{ fontSize: '17px', lineHeight: 1.7, color: 'rgba(255,255,255,0.72)', animationDelay: '.2s' }}>
              Whether you have a question, need to book an appointment, or want to know more about our services — our team is ready to help.
            </p>
          </div>
        </div>
      </section>

      {/* ── QUICK CONTACT CARDS ───────────────────────────── */}
      <section style={{ background: '#fff', padding: '0', marginTop: '-1px' }}>
        <div className="container" style={{ paddingTop: '0', paddingBottom: '0' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0', border: '0.5px solid #e8e6df', borderRadius: '12px', overflow: 'hidden', transform: 'translateY(-28px)', background: '#fff', boxShadow: '0 8px 32px rgba(26,58,92,.09)' }}>
            {[
              { icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>, label: 'Phone', value: '+44 1904 123456', sub: 'Mon–Fri 8:30–18:00' },
              { icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>, label: 'Email', value: 'hello@yorkclinic.nhs.uk', sub: 'Reply within 24 hours' },
              { icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>, label: 'Main clinic', value: '14 Bootham', sub: 'York, YO30 7BL' },
              { icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>, label: 'Opening hours', value: 'Mon–Fri 8:30–18:00', sub: 'Sat 9:00–13:00' },
            ].map((item, i) => (
              <div key={i} style={{ padding: '24px 20px', borderRight: i < 3 ? '0.5px solid #e8e6df' : 'none', display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                <div style={{ color: '#1a3a5c', flexShrink: 0, marginTop: '2px' }}>{item.icon}</div>
                <div>
                  <p style={{ fontSize: '12px', color: '#888', marginBottom: '4px', fontWeight: 500 }}>{item.label}</p>
                  <p style={{ fontSize: '14px', fontWeight: 600, color: '#1a1a2e', marginBottom: '2px' }}>{item.value}</p>
                  <p style={{ fontSize: '12px', color: '#999' }}>{item.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MAP + LOCATIONS ───────────────────────────────── */}
      <section className="section" style={{ background: '#fafaf8', paddingTop: '20px' }}>
        <div className="container">
          <div style={{ marginBottom: '40px' }}>
            <p className="section-label">Find us</p>
            <h2 className="section-title">Our clinic locations</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '28px', alignItems: 'start' }}>
            {/* Location cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {locations.map((loc, i) => (
                <div key={i} className={`location-card`} style={{ borderLeft: `3px solid ${i === 0 ? '#1a3a5c' : i === 1 ? '#c0392b' : '#27ae60'}` }}>
                  <div style={{ padding: '18px 20px' }}>
                    <p style={{ fontWeight: 600, fontSize: '15px', marginBottom: '6px' }}>{loc.name}</p>
                    <p style={{ fontSize: '13px', color: '#666', marginBottom: '2px' }}>{loc.address}</p>
                    <p style={{ fontSize: '13px', color: '#666', marginBottom: '2px' }}>{loc.phone}</p>
                    <p style={{ fontSize: '12px', color: '#999', marginTop: '6px' }}>{loc.hours}</p>
                  </div>
                </div>
              ))}
              <Link to="/register" style={{ display: 'block', textAlign: 'center', background: '#1a3a5c', color: '#fff', padding: '13px', borderRadius: '8px', fontSize: '14px', fontWeight: 600, textDecoration: 'none' }}>Book at nearest clinic</Link>
            </div>

            {/* Leaflet map */}
            <div style={{ borderRadius: '12px', overflow: 'hidden', border: '0.5px solid #e8e6df', height: '400px' }}>
              <MapContainer center={[CLINIC_LAT, CLINIC_LNG]} zoom={15} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {locations.map((loc, i) => (
                  <Marker key={i} position={[loc.lat, loc.lng]}>
                    <Popup>
                      <strong>{loc.name}</strong><br />
                      {loc.address}<br />
                      {loc.phone}
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          </div>
        </div>
      </section>

      {/* ── CONTACT FORM ──────────────────────────────────── */}
      <section className="section" style={{ background: '#fff' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: '64px', alignItems: 'start' }}>
            <div>
              <p className="section-label">Send a message</p>
              <h2 className="section-title">Have a question?<br />We'd love to hear from you</h2>
              <p style={{ fontSize: '15px', lineHeight: 1.75, color: '#555', marginBottom: '32px' }}>
                Fill in the form and a member of our team will get back to you within one business day. For urgent matters, please call us directly.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {[
                  { icon: '📋', title: 'General enquiries', desc: 'Questions about our services, pricing, or team' },
                  { icon: '🗓️', title: 'Appointment support', desc: 'Help booking, changing, or cancelling visits' },
                  { icon: '🔒', title: 'Medical records', desc: 'Requests for your health records or data' },
                ].map((item, i) => (
                  <div key={i} className="info-card" style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '22px' }}>{item.icon}</span>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: '14px', marginBottom: '3px' }}>{item.title}</p>
                      <p style={{ fontSize: '13px', color: '#777' }}>{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {submitted ? (
              <div style={{ textAlign: 'center', padding: '60px 40px', background: '#f0f7f0', borderRadius: '16px', border: '0.5px solid #b8ddb8' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#27ae60', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <h3 style={{ fontFamily: "'Instrument Serif', serif", fontSize: '26px', marginBottom: '10px' }}>Message sent!</h3>
                <p style={{ fontSize: '15px', color: '#555', marginBottom: '24px' }}>Thank you for getting in touch. We'll reply to <strong>{form.email}</strong> within one business day.</p>
                <button onClick={() => { setSubmitted(false); setForm({ name: '', email: '', phone: '', subject: '', message: '' }) }} style={{ background: '#1a3a5c', color: '#fff', border: 'none', padding: '12px 28px', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Send another message</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label className="label">Full name *</label>
                    <input className={`input-field ${errors.name ? 'input-error' : ''}`} placeholder="Alice Johnson" value={form.name} onChange={e => { setForm(f => ({ ...f, name: e.target.value })); setErrors(er => ({ ...er, name: '' })) }} />
                    {errors.name && <p className="error-text">{errors.name}</p>}
                  </div>
                  <div>
                    <label className="label">Email address *</label>
                    <input className={`input-field ${errors.email ? 'input-error' : ''}`} type="email" placeholder="alice@example.com" value={form.email} onChange={e => { setForm(f => ({ ...f, email: e.target.value })); setErrors(er => ({ ...er, email: '' })) }} />
                    {errors.email && <p className="error-text">{errors.email}</p>}
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label className="label">Phone number</label>
                    <input className="input-field" placeholder="+44 7700 000000" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                  </div>
                  <div>
                    <label className="label">Subject *</label>
                    <select className={`input-field ${errors.subject ? 'input-error' : ''}`} value={form.subject} onChange={e => { setForm(f => ({ ...f, subject: e.target.value })); setErrors(er => ({ ...er, subject: '' })) }}>
                      <option value="">Select a subject</option>
                      <option value="appointment">Appointment enquiry</option>
                      <option value="records">Medical records</option>
                      <option value="billing">Billing question</option>
                      <option value="general">General enquiry</option>
                      <option value="complaint">Feedback / complaint</option>
                    </select>
                    {errors.subject && <p className="error-text">{errors.subject}</p>}
                  </div>
                </div>
                <div>
                  <label className="label">Message *</label>
                  <textarea className={`input-field ${errors.message ? 'input-error' : ''}`} rows={5} placeholder="Tell us how we can help you..." value={form.message} onChange={e => { setForm(f => ({ ...f, message: e.target.value })); setErrors(er => ({ ...er, message: '' })) }} style={{ resize: 'vertical' }} />
                  {errors.message && <p className="error-text">{errors.message}</p>}
                </div>
                <button type="submit" className="submit-btn" disabled={submitting}>
                  {submitting ? 'Sending...' : 'Send message'}
                </button>
                <p style={{ fontSize: '12px', color: '#999', textAlign: 'center' }}>We typically reply within 1 business day. For urgent matters call us directly.</p>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────── */}
      <section className="section" style={{ background: '#fafaf8' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.8fr', gap: '64px', alignItems: 'start' }}>
            <div>
              <p className="section-label">FAQ</p>
              <h2 className="section-title">Frequently asked questions</h2>
              <p style={{ fontSize: '15px', color: '#666', lineHeight: 1.65, marginBottom: '24px' }}>Can't find the answer? Reach out to our team directly.</p>
              <Link to="/contact" style={{ display: 'inline-block', background: '#1a3a5c', color: '#fff', padding: '12px 24px', borderRadius: '8px', fontSize: '14px', fontWeight: 600, textDecoration: 'none' }}>Contact support</Link>
            </div>
            <div style={{ background: '#fff', border: '0.5px solid #e8e6df', borderRadius: '12px', overflow: 'hidden' }}>
              {faqs.map((faq, i) => (
                <div key={i} className="faq-item" style={{ borderBottom: i < faqs.length - 1 ? '0.5px solid #e8e6df' : 'none' }}>
                  <button className="faq-btn" onClick={() => setOpenFaq(openFaq === i ? null : i)} style={{ padding: '18px 24px' }}>
                    <span>{faq.q}</span>
                    <span style={{ color: '#888', fontSize: '18px', transition: 'transform .2s', transform: openFaq === i ? 'rotate(45deg)' : 'rotate(0)' }}>+</span>
                  </button>
                  {openFaq === i && (
                    <div style={{ padding: '0 24px 18px', fontSize: '14px', color: '#555', lineHeight: 1.7 }}>{faq.a}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── EMERGENCY CTA ─────────────────────────────────── */}
      <section style={{ background: '#c0392b', color: '#fff', padding: '32px 0' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '10px', padding: '10px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
            </div>
            <div>
              <p style={{ fontWeight: 700, fontSize: '16px' }}>Medical emergency?</p>
              <p style={{ fontSize: '14px', opacity: 0.85 }}>Do not use this form — call 999 immediately or visit your nearest A&E.</p>
            </div>
          </div>
          <a href="tel:999" style={{ background: '#fff', color: '#c0392b', padding: '12px 28px', borderRadius: '8px', fontWeight: 700, fontSize: '15px', textDecoration: 'none' }}>Call 999</a>
        </div>
      </section>

      <Footer />
    </div>
  )
}
