from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# from app.models import user, patient, doctor, specialty, availability_slot, appointment

from app.routers import auth, patients, doctors, appointments



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


@app.get("/")
async def root():
    return {"status": "Clinic API running"}