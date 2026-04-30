"""
seed.py — Clinic Appointment System
Run: python seed.py
Truncates ALL tables then inserts fresh demo data every time.
"""

import asyncio
import uuid
from datetime import datetime, timedelta, date, time, timezone

import bcrypt
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

# ── change this to match your .env ──────────────────────────
DATABASE_URL = "postgresql+asyncpg://postgres:lucifer@localhost:5432/clinic_db"
# ────────────────────────────────────────────────────────────

engine = create_async_engine(DATABASE_URL, echo=False)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


def hash_pw(plain: str) -> str:
    return bcrypt.hashpw(plain.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


async def truncate_all(db: AsyncSession):
    print("🗑️  Truncating all tables...")
    await db.execute(text("SET session_replication_role = 'replica'"))
    tables = [
        "audit_log", "notifications", "reviews",
        "medical_records", "appointments",
        "availability_slots", "doctors", "patients",
        "users", "specialties",
    ]
    for t in tables:
        await db.execute(text(f"TRUNCATE TABLE {t} CASCADE"))
    await db.execute(text("SET session_replication_role = 'origin'"))
    await db.commit()
    print("✅  All tables truncated\n")


async def seed(db: AsyncSession):

    # ── 1. SPECIALTIES ──────────────────────────────────────
    print("🌱  Seeding specialties...")
    await db.execute(text("""
        INSERT INTO specialties (id, name, description) VALUES
        (1,  'General Practice',  'Primary care and general health consultations'),
        (2,  'Cardiology',        'Heart and cardiovascular system'),
        (3,  'Dermatology',       'Skin, hair and nails'),
        (4,  'Neurology',         'Brain and nervous system'),
        (5,  'Orthopedics',       'Bones, joints and muscles'),
        (6,  'Pediatrics',        'Children and adolescent health'),
        (7,  'Psychiatry',        'Mental health and behavioral disorders'),
        (8,  'Gynecology',        'Female reproductive health'),
        (9,  'Ophthalmology',     'Eyes and vision'),
        (10, 'ENT',               'Ear, nose and throat')
        ON CONFLICT (name) DO NOTHING
    """))
    await db.commit()
    print("   ✓ 10 specialties")

    # ── 2. USERS ────────────────────────────────────────────
    print("🌱  Seeding users...")

    admin_id    = uuid.UUID("00000000-0000-0000-0000-000000000001")
    dr_smith_id = uuid.UUID("00000000-0000-0000-0000-000000000002")
    dr_jones_id = uuid.UUID("00000000-0000-0000-0000-000000000003")
    dr_patel_id = uuid.UUID("00000000-0000-0000-0000-000000000004")
    alice_id    = uuid.UUID("00000000-0000-0000-0000-000000000005")
    bob_id      = uuid.UUID("00000000-0000-0000-0000-000000000006")
    carol_id    = uuid.UUID("00000000-0000-0000-0000-000000000007")
    dave_id     = uuid.UUID("00000000-0000-0000-0000-000000000008")
    eve_id      = uuid.UUID("00000000-0000-0000-0000-000000000009")

    pw = hash_pw("Password@123")

    # KEY FIX: cast the enum value in Python, pass as plain string
    # Use CAST($4 AS user_role) instead of $4::user_role to avoid
    # asyncpg misreading the colon as a SQLAlchemy bind parameter
    users = [
        (admin_id,    "admin@clinic.com",    pw, "admin"),
        (dr_smith_id, "dr.smith@clinic.com", pw, "doctor"),
        (dr_jones_id, "dr.jones@clinic.com", pw, "doctor"),
        (dr_patel_id, "dr.patel@clinic.com", pw, "doctor"),
        (alice_id,    "alice@example.com",   pw, "patient"),
        (bob_id,      "bob@example.com",     pw, "patient"),
        (carol_id,    "carol@example.com",   pw, "patient"),
        (dave_id,     "dave@example.com",    pw, "patient"),
        (eve_id,      "eve@example.com",     pw, "patient"),
    ]

    for uid, email, password_hash, role in users:
        await db.execute(text("""
            INSERT INTO users (id, email, password_hash, role, is_active)
            VALUES (:id, :email, :pw, CAST(:role AS user_role), true)
        """), {"id": uid, "email": email, "pw": password_hash, "role": role})

    await db.commit()
    print(f"   ✓ {len(users)} users  (password for all: Password@123)")

    # ── 3. DOCTORS ──────────────────────────────────────────
    print("🌱  Seeding doctors...")

    doc_smith_id = uuid.UUID("10000000-0000-0000-0000-000000000001")
    doc_jones_id = uuid.UUID("10000000-0000-0000-0000-000000000002")
    doc_patel_id = uuid.UUID("10000000-0000-0000-0000-000000000003")

    doctors = [
        {
            "id": doc_smith_id, "user_id": dr_smith_id, "specialty_id": 1,
            "full_name": "Dr. James Smith",
            "bio": "Experienced GP with a focus on preventive care and chronic disease management.",
            "qualification": "MBBS, MRCGP", "experience_years": 12,
            "consultation_fee": 50.00, "clinic_address": "14 Bootham, York, YO30 7BL",
            "clinic_lat": 53.9645, "clinic_lng": -1.0810, "phone": "+44 1904 123456",
        },
        {
            "id": doc_jones_id, "user_id": dr_jones_id, "specialty_id": 2,
            "full_name": "Dr. Sarah Jones",
            "bio": "Consultant cardiologist specialising in arrhythmia and heart failure.",
            "qualification": "MBBS, MRCP, MD", "experience_years": 18,
            "consultation_fee": 120.00, "clinic_address": "22 St Leonards Place, York, YO1 7HH",
            "clinic_lat": 53.9630, "clinic_lng": -1.0825, "phone": "+44 1904 654321",
        },
        {
            "id": doc_patel_id, "user_id": dr_patel_id, "specialty_id": 3,
            "full_name": "Dr. Priya Patel",
            "bio": "Dermatologist with expertise in inflammatory skin conditions and skin cancer detection.",
            "qualification": "MBBS, MRCP, FRCP", "experience_years": 9,
            "consultation_fee": 90.00, "clinic_address": "5 Gillygate, York, YO31 7EA",
            "clinic_lat": 53.9612, "clinic_lng": -1.0791, "phone": "+44 1904 789012",
        },
    ]

    for d in doctors:
        await db.execute(text("""
            INSERT INTO doctors (
                id, user_id, specialty_id, full_name, bio, qualification,
                experience_years, consultation_fee, clinic_address,
                clinic_lat, clinic_lng, phone, is_accepting, rating, total_reviews
            ) VALUES (
                :id, :user_id, :specialty_id, :full_name, :bio, :qualification,
                :experience_years, :consultation_fee, :clinic_address,
                :clinic_lat, :clinic_lng, :phone, true, 0.00, 0
            )
        """), d)

    await db.commit()
    print(f"   ✓ {len(doctors)} doctors")

    # ── 4. PATIENTS ─────────────────────────────────────────
    print("🌱  Seeding patients...")

    pat_alice_id = uuid.UUID("20000000-0000-0000-0000-000000000001")
    pat_bob_id   = uuid.UUID("20000000-0000-0000-0000-000000000002")
    pat_carol_id = uuid.UUID("20000000-0000-0000-0000-000000000003")
    pat_dave_id  = uuid.UUID("20000000-0000-0000-0000-000000000004")
    pat_eve_id   = uuid.UUID("20000000-0000-0000-0000-000000000005")

    patients = [
        {
            "id": pat_alice_id, "user_id": alice_id,
            "full_name": "Alice Johnson", "dob": date(1990, 4, 15), "gender": "female",
            "phone": "+44 7700 900001", "address": "3 Petergate, York, YO1 2EL",
            "blood_type": "A+", "allergies": "Penicillin",
            "ec_name": "John Johnson", "ec_phone": "+44 7700 800001",
        },
        {
            "id": pat_bob_id, "user_id": bob_id,
            "full_name": "Bob Williams", "dob": date(1985, 11, 22), "gender": "male",
            "phone": "+44 7700 900002", "address": "7 Micklegate, York, YO1 6JH",
            "blood_type": "O-", "allergies": None,
            "ec_name": "Mary Williams", "ec_phone": "+44 7700 800002",
        },
        {
            "id": pat_carol_id, "user_id": carol_id,
            "full_name": "Carol Davis", "dob": date(1978, 7, 30), "gender": "female",
            "phone": "+44 7700 900003", "address": "12 Stonegate, York, YO1 8AS",
            "blood_type": "B+", "allergies": "Aspirin, Ibuprofen",
            "ec_name": "Tom Davis", "ec_phone": "+44 7700 800003",
        },
        {
            "id": pat_dave_id, "user_id": dave_id,
            "full_name": "Dave Wilson", "dob": date(1995, 3, 10), "gender": "male",
            "phone": "+44 7700 900004", "address": "9 Goodramgate, York, YO1 7LW",
            "blood_type": "AB+", "allergies": None,
            "ec_name": "Sue Wilson", "ec_phone": "+44 7700 800004",
        },
        {
            "id": pat_eve_id, "user_id": eve_id,
            "full_name": "Eve Martinez", "dob": date(2000, 9, 5), "gender": "female",
            "phone": "+44 7700 900005", "address": "2 Gillygate, York, YO31 7EQ",
            "blood_type": "O+", "allergies": "Latex",
            "ec_name": "Carlos Martinez", "ec_phone": "+44 7700 800005",
        },
    ]

    for p in patients:
        await db.execute(text("""
            INSERT INTO patients (
                id, user_id, full_name, date_of_birth, gender, phone,
                address, blood_type, allergies,
                emergency_contact_name, emergency_contact_phone
            ) VALUES (
                :id, :user_id, :full_name, :dob,
                CAST(:gender AS gender_type),
                :phone, :address, :blood_type, :allergies,
                :ec_name, :ec_phone
            )
        """), p)

    await db.commit()
    print(f"   ✓ {len(patients)} patients")

    # ── 5. AVAILABILITY SLOTS ────────────────────────────────
    print("🌱  Seeding availability slots...")

    slots = [
        # Dr. Smith — Mon/Tue/Thu morning + afternoon, Wed/Fri morning
        (doc_smith_id, "monday",    "09:00", "12:00", 30),
        (doc_smith_id, "monday",    "13:00", "17:00", 30),
        (doc_smith_id, "tuesday",   "09:00", "12:00", 30),
        (doc_smith_id, "tuesday",   "13:00", "17:00", 30),
        (doc_smith_id, "wednesday", "09:00", "12:00", 30),
        (doc_smith_id, "thursday",  "09:00", "12:00", 30),
        (doc_smith_id, "thursday",  "13:00", "17:00", 30),
        (doc_smith_id, "friday",    "09:00", "16:00", 30),
        # Dr. Jones — Tue/Thu/Sat with 45-min slots
        (doc_jones_id, "tuesday",   "10:00", "14:00", 45),
        (doc_jones_id, "thursday",  "10:00", "16:00", 45),
        (doc_jones_id, "saturday",  "09:00", "13:00", 45),
        # Dr. Patel — Mon/Wed/Fri
        (doc_patel_id, "monday",    "11:00", "15:00", 30),
        (doc_patel_id, "wednesday", "09:00", "13:00", 30),
        (doc_patel_id, "friday",    "13:00", "17:00", 30),
    ]

    for doctor_id, day, start, end, duration in slots:
            # asyncpg requires actual time objects, not strings
            start_time = time.fromisoformat(start)
            end_time   = time.fromisoformat(end)

            await db.execute(text("""
                INSERT INTO availability_slots (
                    id, doctor_id, day_of_week, start_time,
                    end_time, slot_duration_minutes, is_active
                ) VALUES (
                    :id, :doctor_id,
                    CAST(:day AS day_of_week_enum),
                    :start,
                    :end,
                    :duration, true
                )
            """), {
                "id":        uuid.uuid4(),
                "doctor_id": doctor_id,
                "day":       day,
                "start":     start_time,
                "end":       end_time,
                "duration":  duration,
            })

    await db.commit()
    print(f"   ✓ {len(slots)} availability slots")

    # ── 6. APPOINTMENTS ──────────────────────────────────────
    print("🌱  Seeding appointments...")

    now = datetime.now(timezone.utc)

    def dt(days_offset: int, hour: int, minute: int = 0) -> datetime:
        return (now + timedelta(days=days_offset)).replace(
            hour=hour, minute=minute, second=0, microsecond=0
        )

    appt_1_id = uuid.uuid4()
    appt_2_id = uuid.uuid4()
    appt_3_id = uuid.uuid4()
    appt_4_id = uuid.uuid4()
    appt_5_id = uuid.uuid4()
    appt_6_id = uuid.uuid4()
    appt_7_id = uuid.uuid4()
    appt_8_id = uuid.uuid4()

    appointments = [
        # Future confirmed
        {"id": appt_1_id, "patient": pat_alice_id, "doctor": doc_smith_id,
         "start": dt(2, 9, 0),   "end": dt(2, 9, 30),
         "status": "confirmed",  "reason": "Annual health check",          "first": True},
        {"id": appt_2_id, "patient": pat_bob_id,   "doctor": doc_smith_id,
         "start": dt(2, 10, 0),  "end": dt(2, 10, 30),
         "status": "confirmed",  "reason": "Follow-up for hypertension",   "first": False},
        # Future pending
        {"id": appt_3_id, "patient": pat_carol_id, "doctor": doc_jones_id,
         "start": dt(4, 10, 0),  "end": dt(4, 10, 45),
         "status": "pending",    "reason": "Chest palpitations",           "first": True},
        {"id": appt_4_id, "patient": pat_dave_id,  "doctor": doc_patel_id,
         "start": dt(5, 11, 0),  "end": dt(5, 11, 30),
         "status": "pending",    "reason": "Persistent skin rash",         "first": True},
        {"id": appt_5_id, "patient": pat_eve_id,   "doctor": doc_jones_id,
         "start": dt(6, 10, 45), "end": dt(6, 11, 30),
         "status": "confirmed",  "reason": "Blood pressure monitoring",    "first": False},
        # Past completed
        {"id": appt_6_id, "patient": pat_alice_id, "doctor": doc_patel_id,
         "start": dt(-10, 11, 0),"end": dt(-10, 11, 30),
         "status": "completed",  "reason": "Skin rash assessment",         "first": False},
        {"id": appt_7_id, "patient": pat_bob_id,   "doctor": doc_smith_id,
         "start": dt(-7, 9, 0),  "end": dt(-7, 9, 30),
         "status": "completed",  "reason": "Blood pressure review",        "first": False},
        # Past cancelled
        {"id": appt_8_id, "patient": pat_carol_id, "doctor": doc_smith_id,
         "start": dt(-3, 10, 0), "end": dt(-3, 10, 30),
         "status": "cancelled",  "reason": "Routine check",                "first": False},
    ]

    for a in appointments:
        cancelled_at     = now if a["status"] == "cancelled" else None
        cancel_reason    = "Patient requested cancellation" if a["status"] == "cancelled" else None
        cancelled_by_id  = alice_id if a["status"] == "cancelled" else None

        await db.execute(text("""
            INSERT INTO appointments (
                id, patient_id, doctor_id,
                appointment_datetime, end_datetime,
                status, reason, is_first_visit,
                cancelled_at, cancellation_reason, cancelled_by
            ) VALUES (
                :id, :patient, :doctor,
                :start, :end,
                CAST(:status AS appointment_status),
                :reason, :first,
                :cancelled_at, :cancel_reason, :cancelled_by
            )
        """), {
            "id":           a["id"],
            "patient":      a["patient"],
            "doctor":       a["doctor"],
            "start":        a["start"],
            "end":          a["end"],
            "status":       a["status"],
            "reason":       a["reason"],
            "first":        a["first"],
            "cancelled_at": cancelled_at,
            "cancel_reason":cancel_reason,
            "cancelled_by": cancelled_by_id,
        })

    await db.commit()
    print(f"   ✓ {len(appointments)} appointments "
          "(3 confirmed, 2 pending, 2 completed, 1 cancelled)")

    # ── 7. MEDICAL RECORDS ───────────────────────────────────
    print("🌱  Seeding medical records...")

    records = [
        {
            "id":         uuid.uuid4(),
            "appt_id":    appt_6_id,
            "patient_id": pat_alice_id,
            "doctor_id":  doc_patel_id,
            "diagnosis":  "Mild eczema — triggered by contact allergen",
            "rx":         "Hydrocortisone 1% cream — apply twice daily for 2 weeks.",
            "follow_up":  (now + timedelta(days=20)).date(),
        },
        {
            "id":         uuid.uuid4(),
            "appt_id":    appt_7_id,
            "patient_id": pat_bob_id,
            "doctor_id":  doc_smith_id,
            "diagnosis":  "Stage 1 hypertension — lifestyle factors identified",
            "rx":         "Amlodipine 5mg once daily. Reduce sodium. 30 min exercise daily.",
            "follow_up":  (now + timedelta(days=30)).date(),
        },
    ]

    for r in records:
        await db.execute(text("""
            INSERT INTO medical_records (
                id, appointment_id, patient_id, doctor_id,
                diagnosis, prescription, follow_up_date
            ) VALUES (
                :id, :appt_id, :patient_id, :doctor_id,
                :diagnosis, :rx, :follow_up
            )
        """), r)

        await db.execute(text("""
            UPDATE appointments
            SET consultation_notes = :notes
            WHERE id = :appt_id
        """), {"notes": r["diagnosis"], "appt_id": r["appt_id"]})

    await db.commit()
    print(f"   ✓ {len(records)} medical records")

    # ── 8. REVIEWS ───────────────────────────────────────────
    print("🌱  Seeding reviews...")

    reviews = [
        {
            "id":         uuid.uuid4(),
            "appt_id":    appt_6_id,
            "patient_id": pat_alice_id,
            "doctor_id":  doc_patel_id,
            "rating":     5,
            "comment":    "Dr. Patel was thorough and explained everything clearly.",
        },
        {
            "id":         uuid.uuid4(),
            "appt_id":    appt_7_id,
            "patient_id": pat_bob_id,
            "doctor_id":  doc_smith_id,
            "rating":     4,
            "comment":    "Very professional. Clear advice on managing blood pressure.",
        },
    ]

    for r in reviews:
        await db.execute(text("""
            INSERT INTO reviews (
                id, appointment_id, patient_id, doctor_id, rating, comment
            ) VALUES (
                :id, :appt_id, :patient_id, :doctor_id, :rating, :comment
            )
        """), r)

    await db.commit()
    print(f"   ✓ {len(reviews)} reviews  (doctor ratings auto-updated by DB trigger)")

    # ── 9. NOTIFICATIONS ─────────────────────────────────────
    print("🌱  Seeding notifications...")

    notifs = [
        (alice_id, "booking_confirmed", "Appointment confirmed",
         "Your appointment with Dr. Smith is confirmed.", appt_1_id),
        (bob_id,   "booking_confirmed", "Appointment confirmed",
         "Your appointment with Dr. Smith is confirmed.", appt_2_id),
        (carol_id, "booking_confirmed", "Appointment pending",
         "Your appointment with Dr. Jones is pending confirmation.", appt_3_id),
        (carol_id, "booking_cancelled", "Appointment cancelled",
         "Your appointment has been cancelled.", appt_8_id),
        (alice_id, "reminder",          "Appointment reminder",
         "Reminder: You have an appointment with Dr. Smith tomorrow at 09:00.", appt_1_id),
    ]

    for user_id, ntype, title, message, appt_id in notifs:
        await db.execute(text("""
            INSERT INTO notifications (
                id, user_id, type, title, message, is_read, appointment_id
            ) VALUES (
                :id, :user_id,
                CAST(:ntype AS notification_type),
                :title, :message, false, :appt_id
            )
        """), {
            "id":      uuid.uuid4(),
            "user_id": user_id,
            "ntype":   ntype,
            "title":   title,
            "message": message,
            "appt_id": appt_id,
        })

    await db.commit()
    print(f"   ✓ {len(notifs)} notifications")


async def main():
    print("\n" + "="*55)
    print("  CLINIC API — DATABASE SEED")
    print("="*55 + "\n")

    async with AsyncSessionLocal() as db:
        await truncate_all(db)
        await seed(db)

    print("\n" + "="*55)
    print("  ✅  SEED COMPLETE")
    print("="*55)
    print("\n📋  TEST CREDENTIALS  (all passwords: Password@123)")
    print("  admin@clinic.com          → admin")
    print("  dr.smith@clinic.com       → doctor  (General Practice)")
    print("  dr.jones@clinic.com       → doctor  (Cardiology)")
    print("  dr.patel@clinic.com       → doctor  (Dermatology)")
    print("  alice@example.com         → patient (completed appt + record + review)")
    print("  bob@example.com           → patient (completed appt + record + review)")
    print("  carol@example.com         → patient (pending + cancelled appt)")
    print("  dave@example.com          → patient (1 pending appt)")
    print("  eve@example.com           → patient (1 confirmed appt)")
    print("\n📅  APPOINTMENT SUMMARY")
    print("  +2 days  → Alice  + Dr. Smith  (confirmed)")
    print("  +2 days  → Bob    + Dr. Smith  (confirmed)")
    print("  +4 days  → Carol  + Dr. Jones  (pending)")
    print("  +5 days  → Dave   + Dr. Patel  (pending)")
    print("  +6 days  → Eve    + Dr. Jones  (confirmed)")
    print("  -10 days → Alice  + Dr. Patel  (completed + record + review)")
    print("  -7 days  → Bob    + Dr. Smith  (completed + record + review)")
    print("  -3 days  → Carol  + Dr. Smith  (cancelled)\n")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())