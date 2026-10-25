import json
import os
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from app.database.supabase import supabase

APPLICATIONS_FILE = os.path.abspath(os.path.join(os.path.dirname(__file__), "partner_applications.json"))

def load_applications() -> Dict[str, Any]:
    if not os.path.exists(APPLICATIONS_FILE):
        return {}
    try:
        with open(APPLICATIONS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}

def save_applications(apps: Dict[str, Any]):
    os.makedirs(os.path.dirname(APPLICATIONS_FILE), exist_ok=True)
    with open(APPLICATIONS_FILE, "w", encoding="utf-8") as f:
        json.dump(apps, f, indent=2)

def create_application(data: Dict[str, Any]) -> Dict[str, Any]:
    apps = load_applications()
    app_id = str(uuid.uuid4())
    now_iso = datetime.now(timezone.utc).isoformat()

    new_app = {
        "id": app_id,
        "user_id": data.get("user_id"),
        "owner_name": data.get("owner_name", "").strip(),
        "email": data.get("email", "").strip().lower(),
        "phone": data.get("phone", "").strip(),
        "restaurant_name": data.get("restaurant_name", "").strip(),
        "cuisine_type": data.get("cuisine_type", "Authentic Indian"),
        "address": data.get("address", "").strip(),
        "description": data.get("description", "").strip(),
        "preparation_time_min": int(data.get("preparation_time_min", 20)),
        "fssai_license": data.get("fssai_license", "").strip(),
        "image_url": data.get("image_url") or "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80",
        "status": "pending_approval",  # pending_approval | approved | rejected
        "rejection_reason": None,
        "applied_at": now_iso,
        "reviewed_at": None,
        "reviewed_by": None
    }

    apps[app_id] = new_app
    save_applications(apps)
    return new_app

def get_all_applications() -> List[Dict[str, Any]]:
    apps = load_applications()
    # Return sorted by applied_at desc
    return sorted(apps.values(), key=lambda x: x.get("applied_at", ""), reverse=True)

def get_application_by_user(user_id: str) -> Optional[Dict[str, Any]]:
    apps = load_applications()
    for app in apps.values():
        if app.get("user_id") == user_id:
            return app
    return None

def get_application_by_email(email: str) -> Optional[Dict[str, Any]]:
    apps = load_applications()
    e_clean = email.strip().lower()
    for app in apps.values():
        if app.get("email") == e_clean:
            return app
    return None

def approve_application(app_id: str, admin_email: str = "admin@zaikapulse.com") -> Dict[str, Any]:
    apps = load_applications()
    if app_id not in apps:
        raise ValueError("Application not found")

    app = apps[app_id]
    user_id = app.get("user_id")
    now_iso = datetime.now(timezone.utc).isoformat()

    # Create official restaurant in Supabase
    restaurant_payload = {
        "owner_id": user_id,
        "name": app["restaurant_name"],
        "description": app["description"],
        "address": app["address"],
        "image_url": app["image_url"],
        "preparation_time_min": app["preparation_time_min"]
    }

    try:
        # Check if restaurant already exists for this owner
        existing = supabase.table("restaurants").select("id").eq("owner_id", user_id).execute()
        if existing.data and len(existing.data) > 0:
            rest_id = existing.data[0]["id"]
        else:
            ins = supabase.table("restaurants").insert(restaurant_payload).execute()
            rest_id = ins.data[0]["id"]

            # Insert sample starter menu items for the new kitchen
            starter_items = [
                {"restaurant_id": rest_id, "name": f"{app['restaurant_name']} Special Thali", "description": "Chef curated feast with signature gravies, warm breads, and dessert.", "price": 280.0, "is_available": True},
                {"restaurant_id": rest_id, "name": "Signature Dum Biryani", "description": "Fragrant long-grain basmati rice layered with aromatic spices and saffron.", "price": 320.0, "is_available": True},
                {"restaurant_id": rest_id, "name": "Paneer Butter Masala", "description": "Cottage cheese cubes simmered in a rich, buttery tomato gravy.", "price": 240.0, "is_available": True},
                {"restaurant_id": rest_id, "name": "Butter Garlic Naan (2 pcs)", "description": "Traditional tandoor baked bread brushed with herb butter and garlic.", "price": 75.0, "is_available": True}
            ]
            try:
                for item in starter_items:
                    supabase.table("menu_items").insert(item).execute()
            except Exception as menu_err:
                print("Notice: starter menu insertion error:", menu_err)

        # Ensure user profile role is set to 'restaurant'
        try:
            supabase.table("profiles").upsert({
                "id": user_id,
                "email": app["email"],
                "full_name": app["owner_name"],
                "role": "restaurant"
            }).execute()
        except Exception as prof_err:
            print("Notice: profile role update error:", prof_err)

    except Exception as db_err:
        print("Error creating approved restaurant in database:", db_err)
        raise db_err

    app["status"] = "approved"
    app["reviewed_at"] = now_iso
    app["reviewed_by"] = admin_email
    app["restaurant_id"] = rest_id
    apps[app_id] = app
    save_applications(apps)
    return app


def reject_application(app_id: str, reason: str, admin_email: str = "admin@zaikapulse.com") -> Dict[str, Any]:
    apps = load_applications()
    if app_id not in apps:
        raise ValueError("Application not found")

    app = apps[app_id]
    now_iso = datetime.now(timezone.utc).isoformat()
    app["status"] = "rejected"
    app["rejection_reason"] = reason.strip()
    app["reviewed_at"] = now_iso
    app["reviewed_by"] = admin_email
    apps[app_id] = app
    save_applications(apps)
    return app
