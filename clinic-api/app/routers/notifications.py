from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timezone
import uuid

from app.database.session import get_db
from app.models.notification import Notification
from app.schemas.notification import NotificationResponse
from app.utils.dependencies import get_current_user

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


# ── GET /api/notifications — current user's notifications
@router.get("", response_model=list[NotificationResponse])
async def get_notifications(
    db:           AsyncSession = Depends(get_db),
    current_user: dict         = Depends(get_current_user),
):
    result = await db.execute(
        select(Notification)
        .where(Notification.user_id == uuid.UUID(current_user["sub"]))
        .order_by(Notification.created_at.desc())
    )
    return [NotificationResponse.model_validate(n) for n in result.scalars().all()]


# ── PATCH /api/notifications/:id/read — mark one as read
@router.patch("/{notification_id}/read", response_model=NotificationResponse)
async def mark_read(
    notification_id: uuid.UUID,
    db:              AsyncSession = Depends(get_db),
    current_user:    dict         = Depends(get_current_user),
):
    result = await db.execute(
        select(Notification).where(
            Notification.id      == notification_id,
            Notification.user_id == uuid.UUID(current_user["sub"]),
        )
    )
    notif = result.scalar_one_or_none()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")

    notif.is_read = True
    notif.read_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(notif)
    return NotificationResponse.model_validate(notif)


# ── PATCH /api/notifications/read-all — mark all as read
@router.patch("/read-all", status_code=status.HTTP_200_OK)
async def mark_all_read(
    db:           AsyncSession = Depends(get_db),
    current_user: dict         = Depends(get_current_user),
):
    result = await db.execute(
        select(Notification).where(
            Notification.user_id == uuid.UUID(current_user["sub"]),
            Notification.is_read == False,
        )
    )
    notifs = result.scalars().all()
    now = datetime.now(timezone.utc)
    for n in notifs:
        n.is_read = True
        n.read_at = now
    await db.commit()
    return {"message": f"Marked {len(notifs)} notifications as read"}