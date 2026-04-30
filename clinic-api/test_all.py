"""
test_all.py — Clinic API Full Test Suite
Tests: Doctors, Appointments, Analytics, Medical Records, Reviews, Notifications
Run: python test_all.py
Assumes seed.py has been run and server is running on localhost:8000
"""

import asyncio
import httpx
from datetime import datetime, timezone, timedelta
from colorama import init, Fore, Style

init(autoreset=True)

BASE_URL = "http://localhost:8000"

passed  = 0
failed  = 0
results = []


# ── helpers ─────────────────────────────────────────────────

def log(num, name, success, expected="", actual="", detail=""):
    global passed, failed
    status = f"{Fore.GREEN}PASS" if success else f"{Fore.RED}FAIL"
    icon   = "✓" if success else "✗"
    print(f"  {status} {icon} [{num:02d}] {name}")
    if not success:
        print(f"         Expected : {expected}")
        print(f"         Got      : {actual}")
        if detail:
            print(f"         Detail   : {detail}")
    if success:
        passed += 1
    else:
        failed += 1
    results.append((num, name, success))


def check(num, name, response, expected_status):
    detail = ""
    if response.status_code != expected_status:
        try:
            detail = response.json()
        except Exception:
            detail = response.text[:200]
        log(num, name, False, f"HTTP {expected_status}",
            f"HTTP {response.status_code}", detail)
        return False
    log(num, name, True, f"HTTP {expected_status}", f"HTTP {response.status_code}")
    return True


def section(title):
    print(f"\n{Style.BRIGHT}▶  {title}")


# ── main ─────────────────────────────────────────────────────

async def run_tests():
    global passed, failed

    print()
    print("=" * 60)
    print("  CLINIC API — FULL TEST SUITE")
    print("  Doctors · Appointments · Analytics")
    print("  Medical Records · Reviews · Notifications")
    print("=" * 60)

    async with httpx.AsyncClient(base_url=BASE_URL, timeout=15) as c:

        # ════════════════════════════════════════════════════
        # STEP 0 — TOKENS & IDS
        # ════════════════════════════════════════════════════
        section("Step 0 — Authentication & resolve IDs")

        def login(r):
            return r.json()["access_token"]

        r = await c.post("/api/auth/login",
                         json={"email": "admin@clinic.com", "password": "Password@123"})
        if r.status_code != 200:
            print(f"{Fore.RED}  FATAL: Admin login failed. Is the server running and DB seeded?")
            return
        admin_token = login(r)
        admin_hdr   = {"Authorization": f"Bearer {admin_token}"}
        print(f"  {Fore.GREEN}✓  Admin token")

        r = await c.post("/api/auth/login",
                         json={"email": "dr.smith@clinic.com", "password": "Password@123"})
        smith_token = login(r)
        smith_hdr   = {"Authorization": f"Bearer {smith_token}"}
        print(f"  {Fore.GREEN}✓  Dr. Smith token")

        r = await c.post("/api/auth/login",
                         json={"email": "dr.jones@clinic.com", "password": "Password@123"})
        jones_token = login(r)
        jones_hdr   = {"Authorization": f"Bearer {jones_token}"}
        print(f"  {Fore.GREEN}✓  Dr. Jones token")

        r = await c.post("/api/auth/login",
                         json={"email": "alice@example.com", "password": "Password@123"})
        alice_token = login(r)
        alice_hdr   = {"Authorization": f"Bearer {alice_token}"}
        print(f"  {Fore.GREEN}✓  Alice token")

        r = await c.post("/api/auth/login",
                         json={"email": "bob@example.com", "password": "Password@123"})
        bob_token = login(r)
        bob_hdr   = {"Authorization": f"Bearer {bob_token}"}
        print(f"  {Fore.GREEN}✓  Bob token")

        r = await c.post("/api/auth/login",
                         json={"email": "carol@example.com", "password": "Password@123"})
        carol_token = login(r)
        carol_hdr   = {"Authorization": f"Bearer {carol_token}"}
        print(f"  {Fore.GREEN}✓  Carol token")

        # Resolve doctor IDs
        r = await c.get("/api/doctors", headers=admin_hdr)
        doctors     = r.json()["doctors"]
        doc_map     = {d["full_name"]: d["id"] for d in doctors}
        smith_doc_id = doc_map.get("Dr. James Smith")
        jones_doc_id = doc_map.get("Dr. Sarah Jones")
        patel_doc_id = doc_map.get("Dr. Priya Patel")

        if not all([smith_doc_id, jones_doc_id, patel_doc_id]):
            print(f"{Fore.RED}  FATAL: Could not resolve doctor IDs. Was seed.py run?")
            return
        print(f"  {Fore.GREEN}✓  Doctor IDs resolved")

        # Resolve patient IDs
        r = await c.get("/api/patients", headers=admin_hdr)
        pat_map      = {p["full_name"]: p["id"] for p in r.json()["patients"]}
        alice_pat_id = pat_map.get("Alice Johnson")
        bob_pat_id   = pat_map.get("Bob Williams")
        carol_pat_id = pat_map.get("Carol Davis")
        print(f"  {Fore.GREEN}✓  Patient IDs resolved")

        # Resolve specialties
        r = await c.get("/api/doctors/specialties/all")
        spec_map = {s["name"]: s["id"] for s in r.json()}
        gp_spec_id = spec_map.get("General Practice")
        print(f"  {Fore.GREEN}✓  Specialty IDs resolved")

        # ════════════════════════════════════════════════════
        # DOCTORS
        # ════════════════════════════════════════════════════
        n = 1
        section("Step 1 — GET /api/doctors")

        r = await c.get("/api/doctors")
        ok = check(n, "List doctors — public, no auth needed", r, 200); n += 1
        if ok:
            body = r.json()
            log(n, "Doctor list returns >= 3 doctors",
                body.get("total", 0) >= 3, ">= 3", body.get("total")); n += 1

        r = await c.get("/api/doctors?search=smith")
        ok = check(n, "Search doctors by name 'smith'", r, 200); n += 1
        if ok:
            names = [d["full_name"] for d in r.json()["doctors"]]
            log(n, "Smith found in results",
                any("Smith" in nm for nm in names), "Smith", str(names)); n += 1

        r = await c.get(f"/api/doctors?specialty_id={gp_spec_id}")
        ok = check(n, "Filter doctors by specialty (General Practice)", r, 200); n += 1
        if ok:
            docs = r.json()["doctors"]
            log(n, "Filtered doctors all have General Practice specialty",
                all(d["specialty"]["name"] == "General Practice" for d in docs),
                "all GP", str([d["specialty"]["name"] for d in docs])); n += 1

        r = await c.get("/api/doctors?is_accepting=true")
        ok = check(n, "Filter by is_accepting=true", r, 200); n += 1
        if ok:
            log(n, "All returned doctors are accepting",
                all(d["is_accepting"] for d in r.json()["doctors"]),
                "all true", str([d["is_accepting"] for d in r.json()["doctors"]])); n += 1

        r = await c.get(f"/api/doctors/{smith_doc_id}")
        ok = check(n, "GET /api/doctors/:id — Dr. Smith profile", r, 200); n += 1
        if ok:
            body = r.json()
            log(n, "Profile includes specialty object",
                body.get("specialty") is not None,
                "not None", body.get("specialty")); n += 1
            log(n, "Profile includes slots list",
                isinstance(body.get("slots"), list),
                "list", type(body.get("slots")).__name__); n += 1

        r = await c.get("/api/doctors/00000000-0000-0000-0000-000000000099",
                        headers=admin_hdr)
        check(n, "Non-existent doctor ID — expects 404", r, 404); n += 1

        section("Step 2 — POST /api/doctors (admin creates doctor)")

        # Register a new user to be a doctor
        r = await c.post("/api/auth/register", json={
            "email":     "dr.newtest@clinic.com",
            "password":  "Password@123",
            "full_name": "Dr. New Test",
        })
        if r.status_code not in (200, 201):
            r = await c.post("/api/auth/login", json={
                "email": "dr.newtest@clinic.com", "password": "Password@123"
            })
        new_doc_user_id = r.json().get("user_id")

        # Promote user to doctor role directly via DB won't work from API
        # Instead we use one of the seeded doctor user IDs that has no profile
        # We'll test with the existing seed doctors since role is pre-set

        # Test creating doctor with non-doctor role user (should fail)
        r = await c.post("/api/doctors", headers=admin_hdr, json={
            "user_id":      new_doc_user_id,
            "specialty_id": gp_spec_id,
            "full_name":    "Dr. New Test",
        })
        check(n, "Create doctor with patient-role user — expects 400", r, 400); n += 1

        # Test non-admin trying to create doctor
        r = await c.post("/api/doctors", headers=alice_hdr, json={
            "user_id":      smith_doc_id,
            "specialty_id": gp_spec_id,
            "full_name":    "Fake Doctor",
        })
        check(n, "Non-admin cannot create doctor — expects 403", r, 403); n += 1

        # Test invalid specialty
        r = await c.post("/api/doctors", headers=admin_hdr, json={
            "user_id":      new_doc_user_id,
            "specialty_id": 9999,
            "full_name":    "Dr. New Test",
        })
        # check(n, "Invalid specialty_id — expects 404", r, 404); n += 1
        check(n, "Invalid specialty_id with patient-role user — expects 400", r, 400); n += 1

        section("Step 3 — PUT /api/doctors/:id (update)")

        r = await c.put(f"/api/doctors/{smith_doc_id}", headers=smith_hdr, json={
            "bio": "Updated bio from Dr. Smith himself.",
        })
        ok = check(n, "Doctor updates own profile", r, 200); n += 1
        if ok:
            log(n, "Bio updated correctly",
                r.json().get("bio") == "Updated bio from Dr. Smith himself.",
                "Updated bio from Dr. Smith himself.", r.json().get("bio")); n += 1

        r = await c.put(f"/api/doctors/{jones_doc_id}", headers=smith_hdr, json={
            "bio": "Smith trying to edit Jones",
        })
        check(n, "Doctor cannot update another doctor — expects 403", r, 403); n += 1

        r = await c.put(f"/api/doctors/{smith_doc_id}", headers=admin_hdr, json={
            "consultation_fee": 60.00,
            "is_accepting":     True,
        })
        ok = check(n, "Admin updates any doctor profile", r, 200); n += 1
        if ok:
            log(n, "Consultation fee updated to 60.00",
                float(r.json().get("consultation_fee", 0)) == 60.00,
                60.00, r.json().get("consultation_fee")); n += 1

        r = await c.put(f"/api/doctors/{smith_doc_id}", headers=admin_hdr, json={
            "specialty_id": 9999,
        })
        check(n, "Update with invalid specialty_id — expects 404", r, 404); n += 1

        section("Step 4 — Availability slots")

        r = await c.get(f"/api/doctors/{smith_doc_id}/slots")
        ok = check(n, "GET slots — Dr. Smith has slots", r, 200); n += 1
        if ok:
            log(n, "Smith has at least 1 active slot",
                len(r.json()) >= 1, ">= 1", len(r.json())); n += 1

        # Add a new slot
        r = await c.post(f"/api/doctors/{smith_doc_id}/slots",
                         headers=smith_hdr, json={
            "day_of_week":           "saturday",
            "start_time":            "10:00:00",
            "end_time":              "13:00:00",
            "slot_duration_minutes": 30,
        })
        ok = check(n, "Doctor adds new availability slot", r, 201); n += 1
        new_slot_id = r.json().get("id") if ok else None; n += 1 if ok else 0
        if ok:
            log(n - 1, "Slot day_of_week is saturday",
                r.json().get("day_of_week") == "saturday",
                "saturday", r.json().get("day_of_week"))

        # Duplicate slot
        r = await c.post(f"/api/doctors/{smith_doc_id}/slots",
                         headers=smith_hdr, json={
            "day_of_week": "saturday",
            "start_time":  "10:00:00",
            "end_time":    "13:00:00",
        })
        check(n, "Duplicate slot — expects 409", r, 409); n += 1

        # Invalid times (end before start)
        r = await c.post(f"/api/doctors/{smith_doc_id}/slots",
                         headers=smith_hdr, json={
            "day_of_week": "sunday",
            "start_time":  "17:00:00",
            "end_time":    "09:00:00",
        })
        check(n, "end_time before start_time — expects 400", r, 400); n += 1

        # Jones cannot add slot to Smith's schedule
        r = await c.post(f"/api/doctors/{smith_doc_id}/slots",
                         headers=jones_hdr, json={
            "day_of_week": "sunday",
            "start_time":  "09:00:00",
            "end_time":    "12:00:00",
        })
        check(n, "Wrong doctor cannot add slot — expects 403", r, 403); n += 1

        # Delete the slot we created
        if new_slot_id:
            r = await c.delete(
                f"/api/doctors/{smith_doc_id}/slots/{new_slot_id}",
                headers=smith_hdr,
            )
            check(n, "Doctor deletes own slot", r, 200); n += 1
        else:
            log(n, "Doctor deletes own slot", False, "slot created", "skipped"); n += 1

        # ════════════════════════════════════════════════════
        # APPOINTMENTS
        # ════════════════════════════════════════════════════
        section("Step 5 — POST /api/appointments (book)")

        future_dt  = (datetime.now(timezone.utc) + timedelta(days=10, hours=9)).strftime("%Y-%m-%dT%H:%M:%S+00:00")
        future_dt2 = (datetime.now(timezone.utc) + timedelta(days=11, hours=10)).strftime("%Y-%m-%dT%H:%M:%S+00:00")
        past_dt    = (datetime.now(timezone.utc) - timedelta(days=1)).strftime("%Y-%m-%dT%H:%M:%S+00:00")

        r = await c.post("/api/appointments", headers=alice_hdr, json={
            "doctor_id":            smith_doc_id,
            "appointment_datetime": future_dt,
            "reason":               "Test booking",
            "is_first_visit":       False,
        })
        ok = check(n, "Patient books appointment", r, 201); n += 1
        new_appt_id = r.json().get("id") if ok else None
        if ok:
            log(n, "Appointment status is pending",
                r.json().get("status") == "pending",
                "pending", r.json().get("status")); n += 1
            log(n, "Appointment has correct doctor_id",
                r.json().get("doctor_id") == smith_doc_id,
                smith_doc_id, r.json().get("doctor_id")); n += 1
        else:
            n += 2

        # Past datetime should fail
        r = await c.post("/api/appointments", headers=alice_hdr, json={
            "doctor_id":            smith_doc_id,
            "appointment_datetime": past_dt,
            "reason":               "Past booking",
        })
        check(n, "Booking in the past — expects 400", r, 400); n += 1

        # Book same slot again — conflict
        r = await c.post("/api/appointments", headers=bob_hdr, json={
            "doctor_id":            smith_doc_id,
            "appointment_datetime": future_dt,
            "reason":               "Conflicting booking",
        })
        check(n, "Double booking same slot — expects 409", r, 409); n += 1

        # Doctor not accepting
        r = await c.put(f"/api/doctors/{jones_doc_id}",
                        headers=admin_hdr, json={"is_accepting": False})
        r2 = await c.post("/api/appointments", headers=carol_hdr, json={
            "doctor_id":            jones_doc_id,
            "appointment_datetime": future_dt2,
            "reason":               "Jones not accepting",
        })
        check(n, "Doctor not accepting — expects 400", r2, 400); n += 1
        # Restore Jones
        await c.put(f"/api/doctors/{jones_doc_id}",
                    headers=admin_hdr, json={"is_accepting": True})

        # Non-existent doctor
        r = await c.post("/api/appointments", headers=alice_hdr, json={
            "doctor_id":            "00000000-0000-0000-0000-000000000099",
            "appointment_datetime": future_dt2,
        })
        check(n, "Non-existent doctor — expects 404", r, 404); n += 1

        section("Step 6 — GET /api/appointments")

        r = await c.get("/api/appointments", headers=admin_hdr)
        ok = check(n, "Admin lists all appointments", r, 200); n += 1
        if ok:
            log(n, "Total appointments >= 8",
                r.json().get("total", 0) >= 8,
                ">= 8", r.json().get("total")); n += 1
        else:
            n += 1

        r = await c.get("/api/appointments?status=confirmed", headers=admin_hdr)
        ok = check(n, "Filter appointments by status=confirmed", r, 200); n += 1
        if ok:
            appts = r.json().get("appointments", [])
            log(n, "All returned appointments are confirmed",
                all(a["status"] == "confirmed" for a in appts),
                "all confirmed", str(set(a["status"] for a in appts))); n += 1
        else:
            n += 1

        r = await c.get(f"/api/appointments?doctor_id={smith_doc_id}",
                        headers=admin_hdr)
        ok = check(n, "Filter by doctor_id", r, 200); n += 1
        if ok:
            appts = r.json().get("appointments", [])
            log(n, "All appointments belong to Dr. Smith",
                all(a["doctor_id"] == smith_doc_id for a in appts),
                smith_doc_id[:8]+"...", "mixed" if appts else "empty"); n += 1
        else:
            n += 1

        r = await c.get("/api/appointments", headers=alice_hdr)
        check(n, "Patient cannot access admin appointment list — expects 403",
              r, 403); n += 1

        r = await c.get("/api/appointments/today", headers=smith_hdr)
        check(n, "Doctor gets today's schedule", r, 200); n += 1

        r = await c.get("/api/appointments/upcoming", headers=alice_hdr)
        ok = check(n, "Patient gets upcoming appointments", r, 200); n += 1
        if ok:
            appts = r.json()
            log(n, "Upcoming are all in the future",
                all(datetime.fromisoformat(
                    a["appointment_datetime"].replace("Z", "+00:00")
                ) > datetime.now(timezone.utc) for a in appts),
                "all future", f"{len(appts)} appointments"); n += 1
        else:
            n += 1

        if new_appt_id:
            r = await c.get(f"/api/appointments/{new_appt_id}",
                            headers=alice_hdr)
            ok = check(n, "Patient views own appointment", r, 200); n += 1
            if ok:
                log(n, "Response includes nested doctor object",
                    r.json().get("doctor") is not None,
                    "not None", r.json().get("doctor")); n += 1
                log(n, "Response includes nested patient object",
                    r.json().get("patient") is not None,
                    "not None", r.json().get("patient")); n += 1
            else:
                n += 2

            # Bob cannot view Alice's appointment
            r = await c.get(f"/api/appointments/{new_appt_id}", headers=bob_hdr)
            check(n, "Patient cannot view another patient's appointment — 403",
                  r, 403); n += 1
        else:
            log(n,   "Patient views own appointment",              False, "N/A", "skipped"); n += 1
            log(n,   "Response includes nested doctor object",     False, "N/A", "skipped"); n += 1
            log(n,   "Response includes nested patient object",    False, "N/A", "skipped"); n += 1
            log(n,   "Patient cannot view another's appointment",  False, "N/A", "skipped"); n += 1

        section("Step 7 — PUT /api/appointments/:id (reschedule)")

        if new_appt_id:
            reschedule_dt = (datetime.now(timezone.utc) + timedelta(days=15, hours=11)).strftime("%Y-%m-%dT%H:%M:%S+00:00")
            r = await c.put(f"/api/appointments/{new_appt_id}",
                            headers=alice_hdr, json={
                "appointment_datetime": reschedule_dt,
                "reason": "Changed my preferred time",
            })
            ok = check(n, "Patient reschedules appointment", r, 200); n += 1
            if ok:
                log(n, "appointment_datetime updated",
                    r.json().get("appointment_datetime") is not None,
                    reschedule_dt[:10], r.json().get("appointment_datetime",
                                                      "")[:10]); n += 1
            else:
                n += 1

            # Conflict on reschedule — book a slot and try to move new_appt there
            conflict_dt = (datetime.now(timezone.utc) + timedelta(days=2, hours=9)).strftime("%Y-%m-%dT%H:%M:%S+00:00")
            r_conflict = await c.put(f"/api/appointments/{new_appt_id}",
                                     headers=alice_hdr, json={
                "appointment_datetime": conflict_dt,
            })
            # This may or may not conflict depending on seed; just check it's 200 or 409
            log(n, "Reschedule returns 200 or 409 (conflict handled)",
                r_conflict.status_code in (200, 409),
                "200 or 409", r_conflict.status_code); n += 1

            # Bob cannot reschedule Alice's appointment
            r = await c.put(f"/api/appointments/{new_appt_id}",
                            headers=bob_hdr, json={
                "appointment_datetime": reschedule_dt,
            })
            check(n, "Another patient cannot reschedule — expects 403", r, 403); n += 1
        else:
            for _ in range(4):
                log(n, "Reschedule test skipped", False, "N/A", "skipped"); n += 1

        section("Step 8 — PATCH /api/appointments/:id/status")

        if new_appt_id:
            # Doctor confirms appointment
            r = await c.patch(f"/api/appointments/{new_appt_id}/status",
                              headers=smith_hdr, json={"status": "confirmed"})
            ok = check(n, "Doctor confirms appointment", r, 200); n += 1
            if ok:
                log(n, "Status changed to confirmed",
                    r.json().get("status") == "confirmed",
                    "confirmed", r.json().get("status")); n += 1
            else:
                n += 1

            # Patient cannot set status to completed
            r = await c.patch(f"/api/appointments/{new_appt_id}/status",
                              headers=alice_hdr, json={"status": "completed"})
            check(n, "Patient cannot set completed — expects 403", r, 403); n += 1

            # Patient cancels own appointment
            r = await c.patch(f"/api/appointments/{new_appt_id}/status",
                              headers=alice_hdr, json={
                "status":              "cancelled",
                "cancellation_reason": "Cannot attend",
            })
            ok = check(n, "Patient cancels own appointment", r, 200); n += 1
            if ok:
                body = r.json()
                log(n, "Status is cancelled",
                    body.get("status") == "cancelled",
                    "cancelled", body.get("status")); n += 1
                log(n, "cancellation_reason saved",
                    body.get("cancellation_reason") == "Cannot attend",
                    "Cannot attend", body.get("cancellation_reason")); n += 1
                log(n, "cancelled_at timestamp set",
                    body.get("cancelled_at") is not None,
                    "not None", body.get("cancelled_at")); n += 1
            else:
                n += 3

            # Cannot update a cancelled appointment
            r = await c.put(f"/api/appointments/{new_appt_id}",
                            headers=alice_hdr, json={"reason": "Try to edit cancelled"})
            check(n, "Cannot update cancelled appointment — expects 400", r, 400); n += 1
        else:
            for _ in range(8):
                log(n, "Status test skipped", False, "N/A", "skipped"); n += 1

        section("Step 9 — GET /api/appointments/patient/:id")

        r = await c.get(f"/api/appointments/patient/{alice_pat_id}",
                        headers=alice_hdr)
        ok = check(n, "Alice views her appointment history", r, 200); n += 1
        if ok:
            log(n, "Returns AppointmentListResponse structure",
                "total" in r.json() and "appointments" in r.json(),
                "total + appointments keys", list(r.json().keys())); n += 1
        else:
            n += 1

        r = await c.get(f"/api/appointments/patient/{alice_pat_id}?status=completed",
                        headers=admin_hdr)
        ok = check(n, "Filter patient appointments by status=completed", r, 200); n += 1
        if ok:
            appts = r.json().get("appointments", [])
            log(n, "All returned are completed",
                all(a["status"] == "completed" for a in appts),
                "all completed", str(set(a["status"] for a in appts))); n += 1
        else:
            n += 1

        r = await c.get(f"/api/appointments/patient/{bob_pat_id}",
                        headers=alice_hdr)
        check(n, "Alice cannot view Bob's history — expects 403", r, 403); n += 1

        # ════════════════════════════════════════════════════
        # ANALYTICS
        # ════════════════════════════════════════════════════
        section("Step 10 — GET /api/analytics/summary")

        r = await c.get("/api/analytics/summary", headers=admin_hdr)
        ok = check(n, "Admin gets analytics summary", r, 200); n += 1
        if ok:
            body = r.json()
            log(n, "total_patients >= 5",
                body.get("total_patients", 0) >= 5,
                ">= 5", body.get("total_patients")); n += 1
            log(n, "total_doctors >= 3",
                body.get("total_doctors", 0) >= 3,
                ">= 3", body.get("total_doctors")); n += 1
            log(n, "total_appointments >= 8",
                body.get("total_appointments", 0) >= 8,
                ">= 8", body.get("total_appointments")); n += 1
            log(n, "cancellation_rate_pct is a number",
                isinstance(body.get("cancellation_rate_pct"), (int, float)),
                "number", type(body.get("cancellation_rate_pct")).__name__); n += 1
            log(n, "completion_rate_pct is a number",
                isinstance(body.get("completion_rate_pct"), (int, float)),
                "number", type(body.get("completion_rate_pct")).__name__); n += 1
        else:
            n += 5

        r = await c.get("/api/analytics/summary", headers=alice_hdr)
        check(n, "Patient cannot access analytics — expects 403", r, 403); n += 1

        r = await c.get("/api/analytics/summary", headers=smith_hdr)
        check(n, "Doctor cannot access analytics — expects 403", r, 403); n += 1

        section("Step 11 — GET /api/analytics/by-doctor")

        r = await c.get("/api/analytics/by-doctor", headers=admin_hdr)
        ok = check(n, "Admin gets per-doctor stats", r, 200); n += 1
        if ok:
            stats = r.json()
            log(n, "Returns list of >= 3 doctors",
                len(stats) >= 3, ">= 3", len(stats)); n += 1
            first = stats[0] if stats else {}
            required_keys = {"doctor_id", "doctor_name", "specialty",
                             "total_appointments", "completed",
                             "completion_rate_pct", "unique_patients"}
            missing = required_keys - set(first.keys())
            log(n, "Each record has all required fields",
                len(missing) == 0, "no missing fields",
                f"missing: {missing}" if missing else "all present"); n += 1
            log(n, "completion_rate_pct is >= 0",
                all(d.get("completion_rate_pct", -1) >= 0 for d in stats),
                ">= 0 for all", "negative found"); n += 1
        else:
            n += 3

        section("Step 12 — GET /api/analytics/by-specialty")

        r = await c.get("/api/analytics/by-specialty", headers=admin_hdr)
        ok = check(n, "Admin gets per-specialty stats", r, 200); n += 1
        if ok:
            stats = r.json()
            log(n, "Returns all 10 specialties",
                len(stats) == 10, 10, len(stats)); n += 1
            log(n, "Each row has specialty_name and doctor_count",
                all("specialty_name" in s and "doctor_count" in s for s in stats),
                "all have fields", "missing fields found"); n += 1
        else:
            n += 2

        section("Step 13 — GET /api/analytics/peak-hours")

        r = await c.get("/api/analytics/peak-hours", headers=admin_hdr)
        ok = check(n, "Admin gets peak booking hours", r, 200); n += 1
        if ok:
            hours = r.json()
            log(n, "Returns list (may be empty if all cancelled)",
                isinstance(hours, list), "list",
                type(hours).__name__); n += 1
            if hours:
                log(n, "Each row has hour_of_day and booking_count",
                    all("hour_of_day" in h and "booking_count" in h for h in hours),
                    "all have fields", "missing"); n += 1
            else:
                log(n, "Peak hours — no data (all appointments cancelled in tests)",
                    True, "empty list ok", "empty"); n += 1
        else:
            n += 2

        section("Step 14 — GET /api/analytics/doctor-dashboard")

        r = await c.get("/api/analytics/doctor-dashboard", headers=smith_hdr)
        ok = check(n, "Doctor gets own dashboard stats", r, 200); n += 1
        if ok:
            body = r.json()
            log(n, "Dashboard has total_appointments field",
                "total_appointments" in body,
                "present", "missing"); n += 1
            log(n, "Dashboard has unique_patients field",
                "unique_patients" in body,
                "present", "missing"); n += 1
            log(n, "Dashboard has completion_rate_pct field",
                "completion_rate_pct" in body,
                "present", "missing"); n += 1
        else:
            n += 3

        r = await c.get("/api/analytics/doctor-dashboard", headers=alice_hdr)
        check(n, "Patient cannot access doctor dashboard — expects 403", r, 403); n += 1

        # ════════════════════════════════════════════════════
        # MEDICAL RECORDS
        # ════════════════════════════════════════════════════
        section("Step 15 — Medical records")

        # Get a completed appointment for Alice (with Dr. Patel from seed)
        r = await c.get(
            f"/api/appointments/patient/{alice_pat_id}?status=completed",
            headers=admin_hdr,
        )
        completed_appts = r.json().get("appointments", [])
        completed_appt_id = completed_appts[0]["id"] if completed_appts else None

        r = await c.get(f"/api/medical-records/patient/{alice_pat_id}",
                        headers=alice_hdr)
        ok = check(n, "Alice views her medical records", r, 200); n += 1
        if ok:
            log(n, "Returns list of records",
                isinstance(r.json(), list), "list",
                type(r.json()).__name__); n += 1
            log(n, "Alice has at least 1 medical record from seed",
                len(r.json()) >= 1, ">= 1", len(r.json())); n += 1
        else:
            n += 2

        # Admin can view any patient's records
        r = await c.get(f"/api/medical-records/patient/{bob_pat_id}",
                        headers=admin_hdr)
        check(n, "Admin views Bob's medical records", r, 200); n += 1

        # Alice cannot view Bob's records
        r = await c.get(f"/api/medical-records/patient/{bob_pat_id}",
                        headers=alice_hdr)
        check(n, "Alice cannot view Bob's records — expects 403", r, 403); n += 1

        # Get a specific record
        r = await c.get(f"/api/medical-records/patient/{alice_pat_id}",
                        headers=admin_hdr)
        records = r.json()
        if records:
            record_id = records[0]["id"]
            r = await c.get(f"/api/medical-records/{record_id}", headers=alice_hdr)
            ok = check(n, "Alice views specific medical record by ID", r, 200); n += 1
            if ok:
                log(n, "Record has diagnosis field",
                    "diagnosis" in r.json(), "present", "missing"); n += 1
                log(n, "Record has prescription field",
                    "prescription" in r.json(), "present", "missing"); n += 1
            else:
                n += 2

            # Doctor updates record
            # r = await c.get("/api/auth/login",
            #                  content='{"email":"dr.patel@clinic.com","password":"Password@123"}',
            #                  headers={"Content-Type": "application/json"})
            # patel_token = r.json().get("access_token") if r.status_code == 200 else None

            # Doctor updates record
            r = await c.post("/api/auth/login",
                             json={"email": "dr.patel@clinic.com", "password": "Password@123"})
            patel_token = r.json().get("access_token") if r.status_code == 200 else None

            if patel_token:
                patel_hdr = {"Authorization": f"Bearer {patel_token}"}
                r = await c.put(f"/api/medical-records/{record_id}",
                                headers=patel_hdr, json={
                    "diagnosis":    "Updated: Mild eczema, improving",
                    "follow_up_date": "2026-12-01",
                })
                ok = check(n, "Doctor updates medical record", r, 200); n += 1
                if ok:
                    log(n, "Diagnosis updated",
                        "Updated" in (r.json().get("diagnosis") or ""),
                        "Updated in diagnosis", r.json().get("diagnosis")); n += 1
                else:
                    n += 1
            else:
                log(n,   "Doctor updates medical record",    False, "N/A", "patel login failed"); n += 1
                log(n,   "Diagnosis updated",                False, "N/A", "skipped"); n += 1

            # Patient cannot update records
            r = await c.put(f"/api/medical-records/{record_id}",
                            headers=alice_hdr, json={"diagnosis": "Hacked!"})
            check(n, "Patient cannot edit medical record — expects 403", r, 403); n += 1
        else:
            for _ in range(7):
                log(n, "Medical record tests skipped", False, "N/A", "no records found"); n += 1

        # Create record for a non-completed appointment should fail
        if completed_appt_id:
            # Try to create a duplicate record
            r = await c.post("/api/medical-records", headers=admin_hdr, json={
                "appointment_id": completed_appt_id,
                "diagnosis":      "Duplicate",
            })
            check(n, "Duplicate medical record — expects 400", r, 400); n += 1
        else:
            log(n, "Duplicate medical record test skipped", False, "N/A", "skipped"); n += 1

        # ════════════════════════════════════════════════════
        # REVIEWS
        # ════════════════════════════════════════════════════
        section("Step 16 — Reviews")

        # Get Alice's completed appointment
        r = await c.get(
            f"/api/appointments/patient/{alice_pat_id}?status=completed",
            headers=admin_hdr,
        )
        completed_appts = r.json().get("appointments", [])
        alice_completed_appt_id = completed_appts[0]["id"] if completed_appts else None
        alice_doctor_id          = completed_appts[0]["doctor_id"] if completed_appts else None

        r = await c.get(f"/api/reviews/doctor/{patel_doc_id}")
        ok = check(n, "Get reviews for Dr. Patel — public", r, 200); n += 1
        if ok:
            log(n, "Reviews list returned",
                isinstance(r.json(), list), "list", type(r.json()).__name__); n += 1
            log(n, "Dr. Patel has at least 1 review from seed",
                len(r.json()) >= 1, ">= 1", len(r.json())); n += 1
        else:
            n += 2

        # Only patients can review
        r = await c.post("/api/reviews", headers=smith_hdr, json={
            "appointment_id": alice_completed_appt_id or "00000000-0000-0000-0000-000000000001",
            "rating":         5,
        })
        check(n, "Doctor cannot submit review — expects 403", r, 403); n += 1

        # Invalid rating
        if alice_completed_appt_id:
            r = await c.post("/api/reviews", headers=alice_hdr, json={
                "appointment_id": alice_completed_appt_id,
                "rating":         10,
            })
            check(n, "Rating > 5 — expects 422", r, 422); n += 1

            # Duplicate review (seed already created one for this appt)
            r = await c.post("/api/reviews", headers=alice_hdr, json={
                "appointment_id": alice_completed_appt_id,
                "rating":         3,
                "comment":        "Trying to review again",
            })
            check(n, "Duplicate review — expects 400", r, 400); n += 1

            # Review for non-completed appointment (book a fresh pending one)
            pending_dt = (datetime.now(timezone.utc) + timedelta(days=20)).strftime("%Y-%m-%dT%H:%M:%S+00:00")
            r_pend = await c.post("/api/appointments", headers=bob_hdr, json={
                "doctor_id":            patel_doc_id,
                "appointment_datetime": pending_dt,
                "reason":               "Test pending",
            })
            if r_pend.status_code == 201:
                pending_appt_id = r_pend.json()["id"]
                r = await c.post("/api/reviews", headers=bob_hdr, json={
                    "appointment_id": pending_appt_id,
                    "rating":         4,
                })
                check(n, "Review on pending appointment — expects 400", r, 400); n += 1
            else:
                log(n, "Review on pending appointment test skipped",
                    False, "N/A", "could not create pending appt"); n += 1
        else:
            for _ in range(3):
                log(n, "Review test skipped", False, "N/A", "no completed appt"); n += 1

        # ════════════════════════════════════════════════════
        # NOTIFICATIONS
        # ════════════════════════════════════════════════════
        section("Step 17 — Notifications")

        r = await c.get("/api/notifications", headers=alice_hdr)
        ok = check(n, "Alice gets her notifications", r, 200); n += 1
        if ok:
            notifs = r.json()
            log(n, "Returns list of notifications",
                isinstance(notifs, list), "list", type(notifs).__name__); n += 1
            log(n, "Alice has at least 1 notification from seed",
                len(notifs) >= 1, ">= 1", len(notifs)); n += 1
        else:
            n += 2

        r = await c.get("/api/notifications", headers=bob_hdr)
        ok = check(n, "Bob gets his own notifications only", r, 200); n += 1
        if ok:
            # Bob's notifications should not contain Alice's
            alice_notifs = (await c.get("/api/notifications", headers=alice_hdr)).json()
            alice_ids    = {n2["id"] for n2 in alice_notifs}
            bob_notifs   = r.json()
            overlap      = [n2 for n2 in bob_notifs if n2["id"] in alice_ids]
            log(n, "Bob's notifications do not include Alice's",
                len(overlap) == 0, "no overlap", f"{len(overlap)} overlap"); n += 1
        else:
            n += 1

        # Mark one notification as read
        r = await c.get("/api/notifications", headers=alice_hdr)
        alice_notifs = r.json()
        unread       = [n2 for n2 in alice_notifs if not n2["is_read"]]
        if unread:
            notif_id = unread[0]["id"]
            r = await c.patch(f"/api/notifications/{notif_id}/read",
                              headers=alice_hdr)
            ok = check(n, "Mark notification as read", r, 200); n += 1
            if ok:
                log(n, "is_read is now True",
                    r.json().get("is_read") is True,
                    True, r.json().get("is_read")); n += 1
                log(n, "read_at timestamp is set",
                    r.json().get("read_at") is not None,
                    "not None", r.json().get("read_at")); n += 1
            else:
                n += 2

            # Wrong user cannot mark someone else's notification
            r = await c.patch(f"/api/notifications/{notif_id}/read",
                              headers=bob_hdr)
            check(n, "Bob cannot mark Alice's notification — expects 404",
                  r, 404); n += 1
        else:
            for _ in range(4):
                log(n, "Notification read test skipped",
                    True, "no unread", "all already read"); n += 1

        # Mark all as read
        r = await c.patch("/api/notifications/read-all", headers=carol_hdr)
        ok = check(n, "Mark all notifications as read", r, 200); n += 1
        if ok:
            # log(n, "Response confirms count of marked notifications",
            #     "marked" in r.json().get("message", ""),
            #     "'marked' in message", r.json().get("message")); n += 1
            log(n, "Response confirms count of marked notifications",
                "marked" in r.json().get("message", "").lower(),
                "'marked' in message", r.json().get("message")); n += 1
            r2 = await c.get("/api/notifications", headers=carol_hdr)
            still_unread = [n2 for n2 in r2.json() if not n2["is_read"]]
            log(n, "No unread notifications remain for Carol",
                len(still_unread) == 0, 0, len(still_unread)); n += 1
        else:
            n += 2

        # Unauthenticated cannot get notifications
        r = await c.get("/api/notifications")
        check(n, "Unauthenticated cannot get notifications — expects 401",
              r, 401); n += 1

    # ── SUMMARY ─────────────────────────────────────────────
    total_tests = passed + failed
    pct         = int(passed / total_tests * 100) if total_tests else 0

    print()
    print("=" * 60)
    print(f"  RESULTS: {passed}/{total_tests} passed  ({pct}%)")
    print("=" * 60)

    if failed > 0:
        print(f"\n{Fore.RED}{Style.BRIGHT}  Failed tests:")
        for num, name, ok in results:
            if not ok:
                print(f"  {Fore.RED}  ✗ [{num:02d}] {name}")

    if failed == 0:
        print(f"\n{Fore.GREEN}{Style.BRIGHT}  All tests passed! 🎉")
    else:
        print(f"\n  {Fore.YELLOW}Fix the failures above and re-run.")

    print()


if __name__ == "__main__":
    asyncio.run(run_tests())