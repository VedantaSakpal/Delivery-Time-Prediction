import json
import os
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional

NOTIFICATIONS_FILE = os.path.abspath(os.path.join(os.path.dirname(__file__), "notifications.json"))

def load_notifications() -> Dict[str, Any]:
    if not os.path.exists(NOTIFICATIONS_FILE):
        return {}
    try:
        with open(NOTIFICATIONS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}

def save_notifications(data: Dict[str, Any]):
    os.makedirs(os.path.dirname(NOTIFICATIONS_FILE), exist_ok=True)
    with open(NOTIFICATIONS_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)

def create_notification(
    recipient_id: str,
    role: str,
    title: str,
    message: str,
    notif_type: str = "system",
    data: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Creates an in-app notification.
    recipient_id can be a user_id (UUID string) or 'admin' or restaurant owner ID.
    role can be 'user', 'restaurant', or 'admin'.
    """
    notifs = load_notifications()
    notif_id = str(uuid.uuid4())
    now_iso = datetime.now(timezone.utc).isoformat()

    new_notif = {
        "id": notif_id,
        "recipient_id": str(recipient_id).strip(),
        "role": role,
        "title": title.strip(),
        "message": message.strip(),
        "type": notif_type,
        "data": data or {},
        "is_read": False,
        "created_at": now_iso
    }

    notifs[notif_id] = new_notif
    save_notifications(notifs)
    return new_notif

def get_notifications_for_user(recipient_id: str, role: Optional[str] = None, limit: int = 50) -> List[Dict[str, Any]]:
    notifs = load_notifications()
    rec_str = str(recipient_id).strip()
    
    user_notifs = []
    for item in notifs.values():
        item_rec = item.get("recipient_id")
        item_role = item.get("role")
        
        # Match if recipient_id matches, or if current user is admin and notification is addressed to 'admin'
        if item_rec == rec_str or (role == "admin" and item_rec == "admin"):
            user_notifs.append(item)

    # Sort descending by created_at
    user_notifs.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return user_notifs[:limit]

def get_unread_count(recipient_id: str, role: Optional[str] = None) -> int:
    notifs = get_notifications_for_user(recipient_id, role, limit=200)
    return sum(1 for n in notifs if not n.get("is_read", False))

def mark_as_read(notif_id: str, recipient_id: str, role: Optional[str] = None) -> bool:
    notifs = load_notifications()
    if notif_id in notifs:
        notif = notifs[notif_id]
        if notif.get("recipient_id") == str(recipient_id) or (role == "admin" and notif.get("recipient_id") == "admin"):
            notif["is_read"] = True
            save_notifications(notifs)
            return True
    return False

def mark_all_as_read(recipient_id: str, role: Optional[str] = None) -> int:
    notifs = load_notifications()
    rec_str = str(recipient_id).strip()
    updated_count = 0

    for notif in notifs.values():
        if notif.get("recipient_id") == rec_str or (role == "admin" and notif.get("recipient_id") == "admin"):
            if not notif.get("is_read", False):
                notif["is_read"] = True
                updated_count += 1

    if updated_count > 0:
        save_notifications(notifs)
    return updated_count

def delete_notification(notif_id: str, recipient_id: str, role: Optional[str] = None) -> bool:
    notifs = load_notifications()
    if notif_id in notifs:
        notif = notifs[notif_id]
        if notif.get("recipient_id") == str(recipient_id) or (role == "admin" and notif.get("recipient_id") == "admin"):
            del notifs[notif_id]
            save_notifications(notifs)
            return True
    return False

def clear_all_notifications(recipient_id: str, role: Optional[str] = None) -> int:
    notifs = load_notifications()
    rec_str = str(recipient_id).strip()
    to_delete = []

    for k, notif in notifs.items():
        if notif.get("recipient_id") == rec_str or (role == "admin" and notif.get("recipient_id") == "admin"):
            to_delete.append(k)

    for k in to_delete:
        del notifs[k]

    if to_delete:
        save_notifications(notifs)
    return len(to_delete)
