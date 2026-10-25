from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Optional, Any
from app.api.deps import get_current_user
from app.database.notifications import (
    get_notifications_for_user, get_unread_count, mark_as_read,
    mark_all_as_read, delete_notification, clear_all_notifications
)

router = APIRouter()

@router.get("/")
def get_user_notifications(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    user_role = current_user.get("role", "user")

    notifs = get_notifications_for_user(user_id, role=user_role)
    unread = get_unread_count(user_id, role=user_role)

    return {
        "notifications": notifs,
        "unread_count": unread
    }

@router.post("/{notif_id}/read")
def mark_notification_read(notif_id: str, current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    user_role = current_user.get("role", "user")

    success = mark_as_read(notif_id, user_id, role=user_role)
    unread = get_unread_count(user_id, role=user_role)
    return {
        "success": success,
        "unread_count": unread
    }

@router.post("/read-all")
def mark_all_notifications_read(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    user_role = current_user.get("role", "user")

    updated = mark_all_as_read(user_id, role=user_role)
    return {
        "success": True,
        "marked_count": updated,
        "unread_count": 0
    }

@router.delete("/{notif_id}")
def delete_single_notification(notif_id: str, current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    user_role = current_user.get("role", "user")

    success = delete_notification(notif_id, user_id, role=user_role)
    unread = get_unread_count(user_id, role=user_role)
    return {
        "success": success,
        "unread_count": unread
    }

@router.delete("/clear-all")
def clear_all_user_notifications(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    user_role = current_user.get("role", "user")

    cleared = clear_all_notifications(user_id, role=user_role)
    return {
        "success": True,
        "cleared_count": cleared,
        "unread_count": 0
    }
