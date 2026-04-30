from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi import Request
from fastapi.responses import JSONResponse

# from app.models import user, patient, doctor, specialty, availability_slot, appointment

from app.routers import (
    auth, patients, doctors,
    appointments, medical_records,
    reviews, notifications, analytics,
)



app = FastAPI(title="Clinic API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # restrict to your frontend URL in production
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(patients.router)
app.include_router(doctors.router) 
app.include_router(appointments.router)
app.include_router(medical_records.router)
app.include_router(reviews.router)
app.include_router(notifications.router)
app.include_router(analytics.router)


@app.get("/")
async def root():
    return {"status": "Clinic API running"}

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"success": False, "error": "Internal server error"}
    )