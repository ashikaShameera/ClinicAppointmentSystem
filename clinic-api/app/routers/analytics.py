from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, text
from datetime import datetime, timezone

from app.database.session import get_db
from app.models.appointment import Appointment, AppointmentStatus
from app.models.patient import Patient
from app.models.doctor import Doctor
from app.models.review import Review
from app.models.specialty import Specialty
from app.schemas.analytics import (
    SummaryResponse, DoctorStatResponse,
    SpecialtyStatResponse, PeakHourResponse,
)
from app.utils.dependencies import require_role

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


# ── GET /api/analytics/summary ───────────────────────────────
@router.get("/summary", response_model=SummaryResponse)
async def get_summary(
    db: AsyncSession = Depends(get_db),
    _:  dict         = Depends(require_role("admin")),
):
    # Total patients (not soft-deleted)
    total_patients = (await db.execute(
        select(func.count(Patient.id)).where(Patient.deleted_at.is_(None))
    )).scalar_one()

    # Total doctors (not soft-deleted)
    total_doctors = (await db.execute(
        select(func.count(Doctor.id)).where(Doctor.deleted_at.is_(None))
    )).scalar_one()

    # All appointment counts
    total_appts = (await db.execute(
        select(func.count(Appointment.id))
    )).scalar_one()

    # This month
    now         = datetime.now(timezone.utc)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    this_month  = (await db.execute(
        select(func.count(Appointment.id))
        .where(Appointment.appointment_datetime >= month_start)
    )).scalar_one()

    # Cancellation rate
    cancelled = (await db.execute(
        select(func.count(Appointment.id))
        .where(Appointment.status == AppointmentStatus.cancelled)
    )).scalar_one()

    # Completion rate
    completed = (await db.execute(
        select(func.count(Appointment.id))
        .where(Appointment.status == AppointmentStatus.completed)
    )).scalar_one()

    cancel_rate = round(100.0 * cancelled / total_appts, 2) if total_appts else 0.0
    complete_rate = round(100.0 * completed / total_appts, 2) if total_appts else 0.0

    return SummaryResponse(
        total_patients        = total_patients,
        total_doctors         = total_doctors,
        total_appointments    = total_appts,
        this_month            = this_month,
        cancellation_rate_pct = cancel_rate,
        completion_rate_pct   = complete_rate,
    )


# ── GET /api/analytics/by-doctor ────────────────────────────
@router.get("/by-doctor", response_model=list[DoctorStatResponse])
async def stats_by_doctor(
    db: AsyncSession = Depends(get_db),
    _:  dict         = Depends(require_role("admin")),
):
    rows = (await db.execute(text("""
        SELECT
            d.id                                                        AS doctor_id,
            d.full_name                                                 AS doctor_name,
            s.name                                                      AS specialty,
            COALESCE(d.rating, 0)                                       AS rating,
            COALESCE(d.total_reviews, 0)                                AS total_reviews,
            COUNT(a.id)                                                 AS total_appointments,
            COUNT(a.id) FILTER (WHERE a.status = 'completed')          AS completed,
            COUNT(a.id) FILTER (WHERE a.status = 'cancelled')          AS cancelled,
            COUNT(a.id) FILTER (WHERE a.status = 'no_show')            AS no_shows,
            ROUND(
                100.0 * COUNT(a.id) FILTER (WHERE a.status = 'completed')
                / NULLIF(COUNT(a.id), 0), 2
            )                                                           AS completion_rate_pct,
            COUNT(DISTINCT a.patient_id)                                AS unique_patients
        FROM doctors d
        JOIN specialties s ON s.id = d.specialty_id
        LEFT JOIN appointments a ON a.doctor_id = d.id
        WHERE d.deleted_at IS NULL
        GROUP BY d.id, d.full_name, s.name, d.rating, d.total_reviews
        ORDER BY total_appointments DESC
    """))).mappings().all()

    return [
        DoctorStatResponse(
            doctor_id            = row["doctor_id"],
            doctor_name          = row["doctor_name"],
            specialty            = row["specialty"],
            rating               = float(row["rating"] or 0),
            total_reviews        = row["total_reviews"],
            total_appointments   = row["total_appointments"],
            completed            = row["completed"],
            cancelled            = row["cancelled"],
            no_shows             = row["no_shows"],
            completion_rate_pct  = float(row["completion_rate_pct"] or 0),
            unique_patients      = row["unique_patients"],
        )
        for row in rows
    ]


# ── GET /api/analytics/by-specialty ─────────────────────────
@router.get("/by-specialty", response_model=list[SpecialtyStatResponse])
async def stats_by_specialty(
    db: AsyncSession = Depends(get_db),
    _:  dict         = Depends(require_role("admin")),
):
    rows = (await db.execute(text("""
        SELECT
            sp.id                                                           AS specialty_id,
            sp.name                                                         AS specialty_name,
            COUNT(DISTINCT d.id)                                            AS doctor_count,
            COUNT(a.id)                                                     AS total_appointments,
            COUNT(a.id) FILTER (
                WHERE a.appointment_datetime >= NOW() - INTERVAL '30 days'
            )                                                               AS appointments_last_30_days
        FROM specialties sp
        LEFT JOIN doctors      d  ON d.specialty_id = sp.id AND d.deleted_at IS NULL
        LEFT JOIN appointments a  ON a.doctor_id    = d.id
        GROUP BY sp.id, sp.name
        ORDER BY total_appointments DESC
    """))).mappings().all()

    return [
        SpecialtyStatResponse(
            specialty_id              = row["specialty_id"],
            specialty_name            = row["specialty_name"],
            doctor_count              = row["doctor_count"],
            total_appointments        = row["total_appointments"],
            appointments_last_30_days = row["appointments_last_30_days"],
        )
        for row in rows
    ]


# ── GET /api/analytics/peak-hours ───────────────────────────
@router.get("/peak-hours", response_model=list[PeakHourResponse])
async def peak_hours(
    db: AsyncSession = Depends(get_db),
    _:  dict         = Depends(require_role("admin")),
):
    rows = (await db.execute(text("""
        SELECT
            EXTRACT(DOW  FROM appointment_datetime)::INT    AS day_of_week_num,
            TO_CHAR(appointment_datetime, 'Dy')             AS day_name,
            EXTRACT(HOUR FROM appointment_datetime)::INT    AS hour_of_day,
            COUNT(*)                                        AS booking_count
        FROM appointments
        WHERE status NOT IN ('cancelled', 'no_show')
        GROUP BY day_of_week_num, day_name, hour_of_day
        ORDER BY booking_count DESC
        LIMIT 20
    """))).mappings().all()

    return [
        PeakHourResponse(
            day_of_week_num = row["day_of_week_num"],
            day_name        = row["day_name"],
            hour_of_day     = row["hour_of_day"],
            booking_count   = row["booking_count"],
        )
        for row in rows
    ]


# ── GET /api/analytics/doctor-dashboard ─────────────────────
# Doctor's own personal stats — not admin-only
@router.get("/doctor-dashboard")
async def doctor_dashboard(
    db:           AsyncSession = Depends(get_db),
    current_user: dict         = Depends(require_role("doctor")),
):
    result = await db.execute(
        select(Doctor).where(Doctor.user_id == __import__("uuid").UUID(current_user["sub"]))
    )
    doctor = result.scalar_one_or_none()
    if not doctor:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Doctor profile not found")

    total = (await db.execute(
        select(func.count(Appointment.id))
        .where(Appointment.doctor_id == doctor.id)
    )).scalar_one()

    completed = (await db.execute(
        select(func.count(Appointment.id))
        .where(Appointment.doctor_id == doctor.id,
               Appointment.status    == AppointmentStatus.completed)
    )).scalar_one()

    cancelled = (await db.execute(
        select(func.count(Appointment.id))
        .where(Appointment.doctor_id == doctor.id,
               Appointment.status    == AppointmentStatus.cancelled)
    )).scalar_one()

    unique_patients = (await db.execute(
        select(func.count(func.distinct(Appointment.patient_id)))
        .where(Appointment.doctor_id == doctor.id)
    )).scalar_one()

    return {
        "doctor_id":           str(doctor.id),
        "full_name":           doctor.full_name,
        "rating":              float(doctor.rating or 0),
        "total_reviews":       doctor.total_reviews,
        "total_appointments":  total,
        "completed":           completed,
        "cancelled":           cancelled,
        "unique_patients":     unique_patients,
        "completion_rate_pct": round(100.0 * completed / total, 2) if total else 0.0,
    }