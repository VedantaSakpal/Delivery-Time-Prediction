import json
import os
import re
from datetime import datetime, timezone
from typing import Dict, Any, Optional

STATUS_FILE = os.path.abspath(os.path.join(os.path.dirname(__file__), "terminated_restaurants.json"))

def load_status_store() -> Dict[str, Any]:
    if not os.path.exists(STATUS_FILE):
        return {}
    try:
        with open(STATUS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}

def save_status_store(store: Dict[str, Any]):
    os.makedirs(os.path.dirname(STATUS_FILE), exist_ok=True)
    with open(STATUS_FILE, "w", encoding="utf-8") as f:
        json.dump(store, f, indent=2)

def is_restaurant_terminated(restaurant_id: str, description: Optional[str] = None) -> (bool, Optional[str], Optional[str]):
    """
    Checks if a restaurant is terminated either via JSON store or description tag.
    Returns: (is_terminated, reason, terminated_at)
    """
    store = load_status_store()
    if restaurant_id in store:
        data = store[restaurant_id]
        return True, data.get("reason", "Partnership terminated by administration"), data.get("terminated_at")
        
    if description and "[PARTNERSHIP_TERMINATED" in description:
        match = re.search(r"\[PARTNERSHIP_TERMINATED:\s*([^\]]+)\]", description)
        reason = match.group(1) if match else "Partnership terminated by administration"
        return True, reason, None

    return False, None, None

def terminate_partnership(restaurant_id: str, reason: str, admin_email: str = "admin@justwoww.com"):
    store = load_status_store()
    now_iso = datetime.now(timezone.utc).isoformat()
    store[restaurant_id] = {
        "status": "terminated",
        "reason": reason.strip(),
        "terminated_at": now_iso,
        "terminated_by": admin_email
    }
    save_status_store(store)
    return store[restaurant_id]

def reinstate_partnership(restaurant_id: str):
    store = load_status_store()
    if restaurant_id in store:
        del store[restaurant_id]
        save_status_store(store)
    return True

def clean_description(desc: Optional[str]) -> str:
    if not desc:
        return ""
    return re.sub(r"\[PARTNERSHIP_TERMINATED:[^\]]+\]\s*", "", desc).strip()
