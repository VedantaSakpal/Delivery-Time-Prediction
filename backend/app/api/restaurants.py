from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Optional
from pydantic import BaseModel
from app.api.deps import get_current_user
from app.database.supabase import supabase

router = APIRouter()

class MenuItem(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    image_url: Optional[str] = None
    is_available: bool = True

from datetime import datetime, timezone
from app.database.restaurant_status import is_restaurant_terminated, clean_description
from app.database.partner_applications import (
    create_application, get_application_by_email, get_application_by_user,
    load_applications, save_applications
)

class PartnerApplicationRequest(BaseModel):
    owner_name: str
    email: str
    phone: str
    password: str
    restaurant_name: str
    cuisine_type: str = "Authentic Indian"
    address: str
    description: str
    preparation_time_min: int = 20
    fssai_license: str
    image_url: Optional[str] = None

@router.get("/")
def get_restaurants():
    try:
        response = supabase.table("restaurants").select("*").execute()
        restaurants = []
        for r in (response.data or []):
            is_term, term_reason, _ = is_restaurant_terminated(r["id"], r.get("description"))
            restaurants.append({
                **r,
                "clean_description": clean_description(r.get("description")),
                "is_terminated": is_term,
                "termination_reason": term_reason
            })
        return {"restaurants": restaurants}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/apply")

def apply_for_partnership(req: PartnerApplicationRequest):
    email = req.email.strip().lower()
    
    # Check existing application
    existing_app = get_application_by_email(email)
    if existing_app:
        if existing_app.get("status") == "pending_approval":
            return {
                "success": True,
                "already_submitted": True,
                "status": "pending_approval",
                "message": "An application for this email is already under administrative review.",
                "application": existing_app
            }
        elif existing_app.get("status") == "approved":
            return {
                "success": True,
                "already_submitted": True,
                "status": "approved",
                "message": "This restaurant partner account is already approved. You can sign in directly!",
                "application": existing_app
            }
        elif existing_app.get("status") == "rejected":
            apps = load_applications()
            app_id = existing_app["id"]
            existing_app.update({
                "owner_name": req.owner_name.strip(),
                "phone": req.phone.strip(),
                "restaurant_name": req.restaurant_name.strip(),
                "cuisine_type": req.cuisine_type.strip(),
                "address": req.address.strip(),
                "description": req.description.strip(),
                "preparation_time_min": int(req.preparation_time_min),
                "fssai_license": req.fssai_license.strip(),
                "image_url": req.image_url or existing_app.get("image_url"),
                "status": "pending_approval",
                "rejection_reason": None,
                "applied_at": datetime.now(timezone.utc).isoformat(),
                "reviewed_at": None,
                "reviewed_by": None
            })
            apps[app_id] = existing_app
            save_applications(apps)
            return {
                "success": True,
                "message": "Your updated partner application has been resubmitted for administrative review.",
                "application": existing_app
            }

    # If no existing application, create user in Supabase Auth
    user_id = None
    try:
        prof_res = supabase.table("profiles").select("id").eq("email", email).execute()
        if prof_res.data and len(prof_res.data) > 0:
            user_id = prof_res.data[0]["id"]
        else:
            auth_user = supabase.auth.admin.create_user({
                "email": email,
                "password": req.password,
                "email_confirm": True,
                "user_metadata": {
                    "full_name": req.owner_name.strip(),
                    "role": "restaurant_applicant"
                }
            })
            if auth_user and auth_user.user:
                user_id = auth_user.user.id
                try:
                    supabase.table("profiles").upsert({
                        "id": user_id,
                        "email": email,
                        "full_name": req.owner_name.strip(),
                        "role": "restaurant_applicant"
                    }).execute()
                except Exception as p_err:
                    print("Notice profile upsert:", p_err)
    except Exception as auth_err:
        err_msg = str(auth_err).lower()
        if "already registered" in err_msg or "exists" in err_msg:
            try:
                prof_res = supabase.table("profiles").select("id").eq("email", email).execute()
                if prof_res.data and len(prof_res.data) > 0:
                    user_id = prof_res.data[0]["id"]
            except Exception:
                pass
        if not user_id:
            raise HTTPException(status_code=400, detail=f"Authentication account error: {str(auth_err)}")

    app_payload = {
        "user_id": user_id,
        "owner_name": req.owner_name.strip(),
        "email": email,
        "phone": req.phone.strip(),
        "restaurant_name": req.restaurant_name.strip(),
        "cuisine_type": req.cuisine_type.strip(),
        "address": req.address.strip(),
        "description": req.description.strip(),
        "preparation_time_min": int(req.preparation_time_min),
        "fssai_license": req.fssai_license.strip(),
        "image_url": req.image_url or "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80",
    }
    new_app = create_application(app_payload)

    # Notify Admin of new partner application
    try:
        from app.database.notifications import create_notification
        create_notification(
            recipient_id="admin",
            role="admin",
            title="New Partner Application 📋",
            message=f"{req.restaurant_name} ({req.cuisine_type}) submitted an onboarding application.",
            notif_type="partner_application",
            data={"app_id": new_app["id"], "restaurant_name": req.restaurant_name, "owner_name": req.owner_name}
        )
    except Exception as n_err:
        print("Notice: admin partner application notification error:", n_err)

    return {
        "success": True,
        "message": "Application submitted successfully! Your culinary and FSSAI credentials will be verified by the Zaika Admin team within 24-48 hours.",
        "application": new_app
    }


@router.get("/application-status")
def check_application_status(email: Optional[str] = None):
    if not email:
        return {"status": "none", "application": None}
    
    app = get_application_by_email(email.strip().lower())
    if not app:
        return {"status": "none", "application": None}
    
    return {
        "status": app.get("status", "none"),
        "application": app
    }

@router.get("/{restaurant_id}")

def get_restaurant(restaurant_id: str):
    if restaurant_id == "me":
        return get_restaurant_dashboard()
        
    try:
        res = supabase.table("restaurants").select("*").eq("id", restaurant_id).single().execute()
        menu = supabase.table("menu_items").select("*").eq("restaurant_id", restaurant_id).execute()
        data = res.data
        data["menu"] = menu.data
        return data
    except Exception as e:
        raise HTTPException(status_code=404, detail="Restaurant not found")

@router.get("/me/dashboard")
def get_restaurant_dashboard(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "restaurant":
        raise HTTPException(status_code=403, detail="Not a restaurant user")
    
    try:
        res = supabase.table("restaurants").select("*").eq("owner_id", current_user["id"]).execute()
        if not res.data:
            return {"error": "No restaurant setup for this user"}
            
        restaurant = res.data[0]
        
        orders = supabase.table("orders").select("*, profiles(full_name, email), order_items(*, menu_items(name))").eq("restaurant_id", restaurant["id"]).order("created_at", desc=True).execute()
        menu = supabase.table("menu_items").select("*").eq("restaurant_id", restaurant["id"]).execute()
        
        return {
            "restaurant": restaurant,
            "orders": orders.data,
            "menu": menu.data
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/me/menu")
def add_menu_item(item: MenuItem, current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "restaurant":
        raise HTTPException(status_code=403, detail="Not a restaurant user")
    try:
        res = supabase.table("restaurants").select("id").eq("owner_id", current_user["id"]).single().execute()
        restaurant_id = res.data["id"]
        
        payload = item.model_dump()
        payload["restaurant_id"] = restaurant_id
        
        insert_res = supabase.table("menu_items").insert(payload).execute()
        return {"success": True, "item": insert_res.data[0]}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/me/analytics")
def get_restaurant_analytics(current_user: dict = Depends(get_current_user)):
    """OLAP-style analytics for the restaurant owner's orders."""
    if current_user.get("role") != "restaurant":
        raise HTTPException(status_code=403, detail="Not a restaurant user")
    try:
        import pandas as pd
        from datetime import datetime

        # Get restaurant
        res = supabase.table("restaurants").select("id, name").eq("owner_id", current_user["id"]).single().execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="No restaurant found for this user")
        restaurant_id = res.data["id"]

        # Fetch all orders for this restaurant
        orders_res = supabase.table("orders") \
            .select("id, status, total_amount, created_at, order_items(quantity, price_at_time, menu_items(name))") \
            .eq("restaurant_id", restaurant_id) \
            .execute()

        orders = orders_res.data
        if not orders:
            return {
                "orders_by_month": [],
                "revenue_by_month": [],
                "orders_by_status": [],
                "top_items": [],
                "total_orders": 0,
                "total_revenue": 0.0,
            }

        df = pd.DataFrame(orders)
        df["created_at"] = pd.to_datetime(df["created_at"])
        df["month"] = df["created_at"].dt.strftime("%Y-%m")
        df["total_amount"] = pd.to_numeric(df["total_amount"], errors="coerce")

        # Orders by month
        orders_by_month = df.groupby("month").agg(
            order_count=("id", "count"),
            revenue=("total_amount", "sum")
        ).reset_index().sort_values("month")
        orders_by_month["revenue"] = orders_by_month["revenue"].round(2)

        # Orders by status
        orders_by_status = df.groupby("status").agg(
            count=("id", "count"),
            revenue=("total_amount", "sum")
        ).reset_index()
        orders_by_status["revenue"] = orders_by_status["revenue"].round(2)

        # Top menu items
        item_counts = {}
        for _, row in df.iterrows():
            for oi in (row.get("order_items") or []):
                name = oi.get("menu_items", {}).get("name", "Unknown")
                qty  = oi.get("quantity", 0)
                rev  = oi.get("price_at_time", 0) * qty
                if name not in item_counts:
                    item_counts[name] = {"name": name, "total_qty": 0, "total_revenue": 0.0}
                item_counts[name]["total_qty"]     += qty
                item_counts[name]["total_revenue"] += rev

        top_items = sorted(item_counts.values(), key=lambda x: x["total_qty"], reverse=True)[:5]
        for t in top_items:
            t["total_revenue"] = round(t["total_revenue"], 2)

        return {
            "orders_by_month":   orders_by_month.to_dict("records"),
            "revenue_by_month":  orders_by_month[["month", "revenue"]].to_dict("records"),
            "orders_by_status":  orders_by_status.to_dict("records"),
            "top_items":         top_items,
            "total_orders":      int(len(df)),
            "total_revenue":     round(float(df["total_amount"].sum()), 2),
        }

    except Exception as e:
        import traceback; traceback.print_exc()
        raise HTTPException(status_code=400, detail=str(e))

