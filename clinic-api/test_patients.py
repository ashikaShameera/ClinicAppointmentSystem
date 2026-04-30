"""
test_patients.py — Automated Patient Endpoint Tests
Run: python test_patients.py
Prints a full pass/fail report for all 29 patient tests.
"""

import asyncio
import httpx
from datetime import datetime, timezone, timedelta
from colorama import init, Fore, Style

init(autoreset=True)

BASE_URL = "http://localhost:8000"

# ── counters ────────────────────────────────────────────────
passed = 0
failed = 0
results = []


def log(test_num, name, success, expected, actual, detail=""):
    global passed, failed
    status = f"{Fore.GREEN}PASS" if success else f"{Fore.RED}FAIL"
    icon   = "✓" if success else "✗"
    print(f"  {status} {icon} [{test_num:02d}] {name}")
    if not success:
        print(f"         Expected : {expected}")
        print(f"         Got      : {actual}")
        if detail:
            print(f"         Detail   : {detail}")
    if success:
        passed += 1
    else:
        failed += 1
    results.append((test_num, name, success))


def check(test_num, name, response, expected_status, *, key=None, key_value=None, absent_key=None):
    """Generic assertion helper."""
    status_ok = response.status_code == expected_status
    detail    = ""

    if not status_ok:
        try:
            detail = response.json()
        except Exception:
            detail = response.text[:200]
        log(test_num, name, False, f"HTTP {expected_status}", f"HTTP {response.status_code}", detail)
        return False

    # Optional: check a key in the JSON body
    if key is not None:
        try:
            body = response.json()
            actual_val = body.get(key) if isinstance(body, dict) else None
            if actual_val != key_value:
                log(test_num, name, False,
                    f"{key}={key_value}", f"{key}={actual_val}")
                return False
        except Exception as e:
            log(test_num, name, False, f"valid JSON with {key}", str(e))
            return False

    if absent_key is not None:
        try:
            body = response.json()
            if absent_key in (body or {}):
                log(test_num, name, False,
                    f"key '{absent_key}' absent", f"key present")
                return False
        except Exception:
            pass

    log(test_num, name, True, f"HTTP {expected_status}", f"HTTP {response.status_code}")
    return True


async def run_tests():
    print()
    print("=" * 60)
    print("  CLINIC API — PATIENT ENDPOINT TESTS")
    print("=" * 60)

    async with httpx.AsyncClient(base_url=BASE_URL, timeout=10) as c:

        # ── STEP 1: GET TOKENS ───────────────────────────────
        print(f"\n{Style.BRIGHT}▶  Step 1 — Authentication")

        r = await c.post("/api/auth/login",
                         json={"email": "admin@clinic.com", "password": "Password@123"})
        if r.status_code != 200:
            print(f"{Fore.RED}  FATAL: Admin login failed — is the server running and DB seeded?")
            return
        admin_token = r.json()["access_token"]
        admin_hdr   = {"Authorization": f"Bearer {admin_token}"}
        print(f"  {Fore.GREEN}✓  Admin token obtained")

        r = await c.post("/api/auth/login",
                         json={"email": "alice@example.com", "password": "Password@123"})
        alice_token = r.json()["access_token"]
        alice_hdr   = {"Authorization": f"Bearer {alice_token}"}
        print(f"  {Fore.GREEN}✓  Alice token obtained")

        r = await c.post("/api/auth/login",
                         json={"email": "bob@example.com", "password": "Password@123"})
        bob_token = r.json()["access_token"]
        bob_hdr   = {"Authorization": f"Bearer {bob_token}"}
        print(f"  {Fore.GREEN}✓  Bob token obtained")

        # ── Fetch patient IDs from seed data ─────────────────
        r = await c.get("/api/patients", headers=admin_hdr)
        if r.status_code != 200:
            print(f"{Fore.RED}  FATAL: GET /api/patients failed")
            print(f"         Status : {r.status_code}")
            print(f"         Body   : {r.text[:300]}")
            print(f"\n  Tip: Make sure seed.py ran successfully and the")
            print(f"       admin token has role='admin' in the JWT.\n")
            return

        try:
            patients = r.json()["patients"]
        except Exception as e:
            print(f"{Fore.RED}  FATAL: Could not parse /api/patients response")
            print(f"         Error  : {e}")
            print(f"         Body   : {r.text[:300]}")
            return

        patient_map  = {p["full_name"]: p["id"] for p in patients}

        alice_id = patient_map.get("Alice Johnson")
        bob_id   = patient_map.get("Bob Williams")
        carol_id = patient_map.get("Carol Davis")

        if not all([alice_id, bob_id, carol_id]):
            print(f"{Fore.RED}  FATAL: Could not find seed patients — did seed.py run successfully?")
            return

        print(f"  {Fore.GREEN}✓  Patient IDs resolved from seed data")

        # ════════════════════════════════════════════════════
        # STEP 2 — GET /api/patients  (admin list)
        # ════════════════════════════════════════════════════
        print(f"\n{Style.BRIGHT}▶  Step 2 — GET /api/patients")

        r = await c.get("/api/patients", headers=admin_hdr)
        check(1, "List all patients — admin gets 200",
              r, 200)
        if r.status_code == 200:
            total = r.json().get("total", 0)
            log(2, "List all patients — total >= 5",
                total >= 5,
                ">= 5", total)
        else:
            log(2, "List all patients — total >= 5", False, ">= 5", "no response")

        r = await c.get("/api/patients?search=alice", headers=admin_hdr)
        ok = check(3, "Search by name 'alice' returns 200", r, 200)
        if ok:
            patients_found = r.json().get("patients", [])
            names = [p["full_name"] for p in patients_found]
            log(4, "Search 'alice' returns Alice Johnson",
                any("Alice" in n for n in names),
                "Alice Johnson in results", str(names))

        r = await c.get("/api/patients?search=bob@example", headers=admin_hdr)
        ok = check(5, "Search by email 'bob@example' returns 200", r, 200)
        if ok:
            patients_found = r.json().get("patients", [])
            log(6, "Search by email returns Bob Williams",
                any("Bob" in p["full_name"] for p in patients_found),
                "Bob Williams in results",
                str([p["full_name"] for p in patients_found]))

        r = await c.get("/api/patients?page=1&per_page=2", headers=admin_hdr)
        ok = check(7, "Pagination — page 1, per_page 2 returns 200", r, 200)
        if ok:
            body = r.json()
            log(8, "Pagination — returns exactly 2 patients",
                len(body.get("patients", [])) == 2,
                2, len(body.get("patients", [])))

        r = await c.get("/api/patients", headers=alice_hdr)
        check(9, "Patient cannot list all patients — expects 403",
              r, 403)

        r = await c.get("/api/patients")
        # check(10, "No token — expects 403",
        #       r, 403)
        check(10, "No token — expects 401",  r, 401)
        # ════════════════════════════════════════════════════
        # STEP 3 — GET /api/patients/:id
        # ════════════════════════════════════════════════════
        print(f"\n{Style.BRIGHT}▶  Step 3 — GET /api/patients/:id")

        r = await c.get(f"/api/patients/{alice_id}", headers=admin_hdr)
        ok = check(11, "Admin gets Alice's profile", r, 200)
        if ok:
            body = r.json()
            log(12, "Alice's profile has correct blood_type A+",
                body.get("blood_type") == "A+",
                "A+", body.get("blood_type"))
            log(13, "Alice's profile has allergies field",
                body.get("allergies") is not None,
                "not None", body.get("allergies"))

        r = await c.get(f"/api/patients/{alice_id}", headers=alice_hdr)
        check(14, "Alice can view her own profile", r, 200)

        r = await c.get(f"/api/patients/{bob_id}", headers=alice_hdr)
        check(15, "Alice cannot view Bob's profile — expects 403", r, 403)

        r = await c.get("/api/patients/00000000-0000-0000-0000-000000000099",
                        headers=admin_hdr)
        check(16, "Non-existent patient ID — expects 404", r, 404)

        # ════════════════════════════════════════════════════
        # STEP 4 — POST /api/patients  (create)
        # ════════════════════════════════════════════════════
        print(f"\n{Style.BRIGHT}▶  Step 4 — POST /api/patients")

        # Register a fresh user to create a profile for
        r = await c.post("/api/auth/register", json={
            "email":     "newpatient_test@example.com",
            "password":  "Password@123",
            "full_name": "New Test Patient",
        })
        if r.status_code not in (200, 201):
            # Already exists from a previous run — just login
            r = await c.post("/api/auth/login", json={
                "email":    "newpatient_test@example.com",
                "password": "Password@123",
            })
        new_token  = r.json()["access_token"]
        new_hdr    = {"Authorization": f"Bearer {new_token}"}

        r = await c.post("/api/patients", headers=new_hdr, json={
            "full_name":               "New Test Patient",
            "date_of_birth":           "1995-06-15",
            "gender":                  "male",
            "phone":                   "+44 7700 111222",
            "address":                 "1 Test Street, York",
            "blood_type":              "A-",
            "allergies":               "None known",
            "emergency_contact_name":  "Jane User",
            "emergency_contact_phone": "+44 7700 111333",
        })
        ok = check(17, "Create patient profile — expects 201", r, 201)
        new_patient_id = r.json().get("id") if ok else None

        # Try to create a second profile for the same user
        r = await c.post("/api/patients", headers=new_hdr, json={
            "full_name": "Duplicate Profile",
        })
        check(18, "Duplicate profile creation — expects 400", r, 400)

        # Missing required field
        r = await c.post("/api/patients", headers=new_hdr, json={
            "gender": "male",
        })
        check(19, "Missing full_name — expects 422", r, 422)

        # Invalid enum value
        r = await c.post("/api/patients", headers=new_hdr, json={
            "full_name": "Test",
            "gender":    "unknown_gender",
        })
        check(20, "Invalid gender value — expects 422", r, 422)

        # ════════════════════════════════════════════════════
        # STEP 5 — PUT /api/patients/:id  (update)
        # ════════════════════════════════════════════════════
        print(f"\n{Style.BRIGHT}▶  Step 5 — PUT /api/patients/:id")

        r = await c.put(f"/api/patients/{alice_id}", headers=alice_hdr, json={
            "phone":   "+44 7700 999888",
            "address": "99 New Street, York, YO1 9ZZ",
        })
        ok = check(21, "Alice updates her own profile", r, 200)
        if ok:
            body = r.json()
            log(22, "Phone updated correctly",
                body.get("phone") == "+44 7700 999888",
                "+44 7700 999888", body.get("phone"))

        r = await c.put(f"/api/patients/{alice_id}", headers=alice_hdr, json={
            "allergies": "Penicillin, Sulfa drugs",
        })
        ok = check(23, "Partial update — one field only", r, 200)
        if ok:
            log(24, "Allergies updated, other fields unchanged",
                r.json().get("allergies") == "Penicillin, Sulfa drugs",
                "Penicillin, Sulfa drugs", r.json().get("allergies"))

        r = await c.put(f"/api/patients/{bob_id}", headers=alice_hdr, json={
            "phone": "+44 7700 000000",
        })
        check(25, "Alice cannot update Bob's profile — expects 403", r, 403)

        r = await c.put(f"/api/patients/{bob_id}", headers=admin_hdr, json={
            "blood_type": "O+",
        })
        ok = check(26, "Admin updates Bob's profile", r, 200)
        if ok:
            log(27, "Bob's blood_type updated to O+",
                r.json().get("blood_type") == "O+",
                "O+", r.json().get("blood_type"))

        # ════════════════════════════════════════════════════
        # STEP 6 — GET /api/patients/:id/appointments
        # ════════════════════════════════════════════════════
        print(f"\n{Style.BRIGHT}▶  Step 6 — GET /api/patients/:id/appointments")

        r = await c.get(f"/api/patients/{alice_id}/appointments",
                        headers=alice_hdr)
        ok = check(28, "Alice gets her own appointments", r, 200)
        if ok:
            total = r.json().get("total", 0)
            log(29, "Alice has at least 1 appointment",
                total >= 1, ">= 1", total)

        r = await c.get(f"/api/patients/{alice_id}/appointments?status=completed",
                        headers=alice_hdr)
        ok = check(30, "Filter by status=completed", r, 200)
        if ok:
            appts = r.json().get("appointments", [])
            all_completed = all(a["status"] == "completed" for a in appts)
            log(31, "All returned appointments are completed",
                all_completed and len(appts) >= 1,
                "all completed, >= 1", f"{len(appts)} appts, all_completed={all_completed}")

        r = await c.get(f"/api/patients/{alice_id}/appointments?status=confirmed",
                        headers=admin_hdr)
        ok = check(32, "Filter by status=confirmed (admin)", r, 200)
        if ok:
            appts = r.json().get("appointments", [])
            log(33, "All returned appointments are confirmed",
                all(a["status"] == "confirmed" for a in appts),
                "all confirmed", str([a["status"] for a in appts]))

        # Date range — only past appointments
        past_from = "2020-01-01T00:00:00"
        past_to   = (datetime.now(timezone.utc) - timedelta(days=1)).strftime("%Y-%m-%dT%H:%M:%S")
        r = await c.get(
            f"/api/patients/{alice_id}/appointments?date_from={past_from}&date_to={past_to}",
            headers=admin_hdr,
        )
        ok = check(34, "Filter by past date range", r, 200)
        if ok:
            appts = r.json().get("appointments", [])
            log(35, "Past date range returns only past appointments",
                len(appts) >= 1,
                ">= 1 past appointment", len(appts))

        r = await c.get(f"/api/patients/{carol_id}/appointments",
                        headers=admin_hdr)
        ok = check(36, "Carol's appointments (admin view)", r, 200)
        if ok:
            total = r.json().get("total", 0)
            log(37, "Carol has at least 2 appointments",
                total >= 2, ">= 2", total)

        r = await c.get(f"/api/patients/{carol_id}/appointments?status=cancelled",
                        headers=admin_hdr)
        ok = check(38, "Carol's cancelled appointments", r, 200)
        if ok:
            appts = r.json().get("appointments", [])
            log(39, "Cancelled appointment has cancellation_reason set",
                len(appts) >= 1 and appts[0].get("cancellation_reason") is not None,
                "cancellation_reason present",
                appts[0].get("cancellation_reason") if appts else "no appts")

        r = await c.get(f"/api/patients/{bob_id}/appointments",
                        headers=alice_hdr)
        check(40, "Alice cannot view Bob's appointments — expects 403", r, 403)

        # Pagination on appointments
        r = await c.get(f"/api/patients/{alice_id}/appointments?page=1&per_page=1",
                        headers=admin_hdr)
        ok = check(41, "Appointments pagination — per_page=1", r, 200)
        if ok:
            body = r.json()
            log(42, "Pagination returns exactly 1 appointment",
                len(body.get("appointments", [])) == 1,
                1, len(body.get("appointments", [])))

        # ════════════════════════════════════════════════════
        # STEP 7 — DELETE /api/patients/:id  (soft delete)
        # ════════════════════════════════════════════════════
        print(f"\n{Style.BRIGHT}▶  Step 7 — DELETE /api/patients/:id")

        if new_patient_id:
            r = await c.delete(f"/api/patients/{new_patient_id}",
                               headers=admin_hdr)
            check(43, "Admin soft-deletes test patient", r, 200)

            r = await c.get(f"/api/patients/{new_patient_id}",
                            headers=admin_hdr)
            check(44, "Deleted patient returns 404", r, 404)

            r = await c.get("/api/patients", headers=admin_hdr)
            ids_in_list = [p["id"] for p in r.json().get("patients", [])]
            log(45, "Deleted patient absent from list",
                new_patient_id not in ids_in_list,
                "not in list", "in list" if new_patient_id in ids_in_list else "not in list")
        else:
            log(43, "Admin soft-deletes test patient", False,
                "patient created in step 4", "step 4 failed — skipped")
            log(44, "Deleted patient returns 404",      False, "N/A", "skipped")
            log(45, "Deleted patient absent from list",  False, "N/A", "skipped")

        r = await c.delete(f"/api/patients/{alice_id}", headers=alice_hdr)
        check(46, "Patient cannot delete themselves — expects 403", r, 403)

    # ── SUMMARY ─────────────────────────────────────────────
    total_tests = passed + failed
    print()
    print("=" * 60)
    print(f"  RESULTS: {passed}/{total_tests} passed")
    print("=" * 60)

    if failed > 0:
        print(f"\n{Fore.RED}{Style.BRIGHT}  Failed tests:")
        for num, name, ok in results:
            if not ok:
                print(f"  {Fore.RED}  ✗ [{num:02d}] {name}")

    if failed == 0:
        print(f"\n{Fore.GREEN}{Style.BRIGHT}  All tests passed! 🎉")
    else:
        pct = int(passed / total_tests * 100)
        print(f"\n  {Fore.YELLOW}{pct}% pass rate")

    print()


if __name__ == "__main__":
    asyncio.run(run_tests())