from fastapi import APIRouter, Depends, HTTPException, Body
from typing import List, Dict, Optional, Any
from pydantic import BaseModel
import pandas as pd
from app.api.deps import get_current_admin
from app.database.supabase import supabase
from app.database.restaurant_status import (
    is_restaurant_terminated, terminate_partnership, reinstate_partnership, clean_description
)

router = APIRouter()

class TerminationRequest(BaseModel):
    reason: str

@router.get("/dashboard")
def get_dashboard_stats(current_admin: dict = Depends(get_current_admin)):
    try:
        # Total Users
        users_resp = supabase.table("profiles").select("id", count="exact").execute()
        total_users = users_resp.count
        
        # Total Restaurants
        rest_resp = supabase.table("restaurants").select("id", count="exact").execute()
        total_restaurants = rest_resp.count
        
        # Total Orders
        orders_resp = supabase.table("orders").select("id", count="exact").execute()
        total_orders = orders_resp.count
        
        # Predictions stats
        preds_resp = supabase.table("predictions").select("predicted_delivery_time_min, prediction_category, created_at").execute()
        predictions = preds_resp.data
        
        total_predictions = len(predictions)
        avg_time = sum(p["predicted_delivery_time_min"] for p in predictions) / total_predictions if total_predictions > 0 else 0
        min_time = min(p["predicted_delivery_time_min"] for p in predictions) if total_predictions > 0 else 0
        max_time = max(p["predicted_delivery_time_min"] for p in predictions) if total_predictions > 0 else 0
        delayed = sum(1 for p in predictions if p["prediction_category"] == "Delayed")
        
        # Simplified "Today's Predictions" (just basic date match)
        from datetime import datetime, timezone
        today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        today_preds = sum(1 for p in predictions if p["created_at"].startswith(today_str))

        return {
            "total_users": total_users,
            "total_restaurants": total_restaurants,
            "total_orders": total_orders,
            "total_predictions": total_predictions,
            "average_predicted_delivery_time": round(avg_time, 2),
            "minimum_predicted_time": min_time,
            "maximum_predicted_time": max_time,
            "delayed_predictions": delayed,
            "todays_predictions": today_preds
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/users")
def get_all_users(current_admin: dict = Depends(get_current_admin), limit: int = 50, offset: int = 0):
    try:
        response = supabase.table("profiles") \
            .select("*") \
            .order("created_at", desc=True) \
            .range(offset, offset + limit - 1) \
            .execute()
            
        # Get prediction counts per user
        preds_resp = supabase.table("predictions").select("user_id, created_at").execute()
        preds = preds_resp.data
        
        users = []
        for user in response.data:
            user_preds = [p for p in preds if p["user_id"] == user["id"]]
            user["prediction_count"] = len(user_preds)
            if user_preds:
                # Sort by created_at desc
                user_preds.sort(key=lambda x: x["created_at"], reverse=True)
                user["last_prediction"] = user_preds[0]["created_at"]
            else:
                user["last_prediction"] = None
            users.append(user)
            
        return {"users": users}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/predictions")
def get_all_predictions(current_admin: dict = Depends(get_current_admin), limit: int = 50, offset: int = 0):
    try:
        response = supabase.table("predictions") \
            .select("*, profiles(full_name, email)") \
            .order("created_at", desc=True) \
            .range(offset, offset + limit - 1) \
            .execute()
        return {"predictions": response.data}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/model")
def get_model_info(current_admin: dict = Depends(get_current_admin)):
    return {
        "model_name": "Delivery Time Predictor",
        "model_type": "Linear Regression with scikit-learn Pipeline",
        "model_version": "1.0",
        "target_variable": "Delivery_Time_min",
        "input_features": [
            "Distance_km", "Weather", "Traffic_Level", "Time_of_Day", 
            "Vehicle_Type", "Preparation_Time_min", "Courier_Experience_yrs"
        ],
        "training_dataset": "Food_Delivery_Times(1).csv",
        "model_status": "Active"
    }

@router.get("/restaurants")
def get_all_restaurants(current_admin: dict = Depends(get_current_admin)):
    try:
        rest_resp = supabase.table("restaurants") \
            .select("*, profiles(full_name, email)") \
            .order("created_at", desc=True) \
            .execute()
        restaurants = rest_resp.data or []

        orders_resp = supabase.table("orders").select("id, restaurant_id, total_amount, status").execute()
        orders = orders_resp.data or []
        df_orders = pd.DataFrame(orders)
        if not df_orders.empty:
            df_orders['total_amount'] = pd.to_numeric(df_orders['total_amount'], errors='coerce').fillna(0.0)

        total_platform_revenue = 0.0
        total_delivered_all = 0
        total_rejected_all = 0
        total_orders_all = len(orders)

        enriched_restaurants = []
        active_count = 0
        terminated_count = 0

        for r in restaurants:
            rid = r["id"]
            is_term, term_reason, term_at = is_restaurant_terminated(rid, r.get("description"))
            if is_term:
                terminated_count += 1
                partnership_status = "terminated"
            else:
                active_count += 1
                partnership_status = "active"

            if not df_orders.empty:
                sub = df_orders[df_orders['restaurant_id'] == rid]
                o_count = int(len(sub))
                revenue = round(float(sub['total_amount'].sum()), 2)
                delivered = int(len(sub[sub['status'].isin(['delivered', 'completed'])]))
                rejected = int(len(sub[sub['status'].isin(['rejected', 'cancelled'])]))
                active_o = int(len(sub[~sub['status'].isin(['delivered', 'completed', 'rejected', 'cancelled'])]))
                fulfillment_rate = round((delivered / o_count * 100), 1) if o_count > 0 else 0.0
                rejection_rate = round((rejected / o_count * 100), 1) if o_count > 0 else 0.0
                avg_order_value = round((revenue / o_count), 2) if o_count > 0 else 0.0
            else:
                o_count = 0
                revenue = 0.0
                delivered = 0
                rejected = 0
                active_o = 0
                fulfillment_rate = 0.0
                rejection_rate = 0.0
                avg_order_value = 0.0

            total_platform_revenue += revenue
            total_delivered_all += delivered
            total_rejected_all += rejected

            r_data = {
                **r,
                "clean_description": clean_description(r.get("description")),
                "is_terminated": is_term,
                "partnership_status": partnership_status,
                "termination_reason": term_reason,
                "terminated_at": term_at,
                "stats": {
                    "total_orders": o_count,
                    "total_revenue": revenue,
                    "delivered_orders": delivered,
                    "rejected_orders": rejected,
                    "active_orders": active_o,
                    "fulfillment_rate": fulfillment_rate,
                    "rejection_rate": rejection_rate,
                    "avg_order_value": avg_order_value
                }
            }
            enriched_restaurants.append(r_data)

        platform_summary = {
            "total_restaurants": len(restaurants),
            "active_restaurants": active_count,
            "terminated_restaurants": terminated_count,
            "total_platform_revenue": round(total_platform_revenue, 2),
            "total_platform_orders": total_orders_all,
            "total_delivered_orders": total_delivered_all,
            "total_rejected_orders": total_rejected_all,
            "overall_fulfillment_rate": round((total_delivered_all / total_orders_all * 100), 1) if total_orders_all > 0 else 0.0
        }

        return {
            "restaurants": enriched_restaurants,
            "summary": platform_summary
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/restaurants/{restaurant_id}/terminate")
def terminate_restaurant(
    restaurant_id: str,
    req: TerminationRequest,
    current_admin: dict = Depends(get_current_admin)
):
    try:
        res = supabase.table("restaurants").select("*").eq("id", restaurant_id).single().execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Restaurant not found")

        r_data = res.data
        admin_email = current_admin.get("email", "admin@zaikapulse.com")
        term_info = terminate_partnership(restaurant_id, req.reason, admin_email)

        curr_desc = clean_description(r_data.get("description"))
        new_desc = f"[PARTNERSHIP_TERMINATED: {req.reason.strip()}] {curr_desc}".strip()
        try:
            supabase.table("restaurants").update({"description": new_desc}).eq("id", restaurant_id).execute()
        except Exception as upd_err:
            print("Notice: could not update description tag in database:", upd_err)

        return {
            "success": True,
            "restaurant_id": restaurant_id,
            "partnership_status": "terminated",
            "reason": req.reason,
            "termination_info": term_info
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/restaurants/{restaurant_id}/reinstate")
def reinstate_restaurant(
    restaurant_id: str,
    current_admin: dict = Depends(get_current_admin)
):
    try:
        res = supabase.table("restaurants").select("*").eq("id", restaurant_id).single().execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Restaurant not found")

        r_data = res.data
        reinstate_partnership(restaurant_id)

        curr_desc = clean_description(r_data.get("description"))
        try:
            supabase.table("restaurants").update({"description": curr_desc}).eq("id", restaurant_id).execute()
        except Exception as upd_err:
            print("Notice: could not update description tag in database:", upd_err)

        return {
            "success": True,
            "restaurant_id": restaurant_id,
            "partnership_status": "active"
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/orders")
def get_all_orders(current_admin: dict = Depends(get_current_admin), limit: int = 100, offset: int = 0):
    try:
        response = supabase.table("orders") \
            .select("*, profiles(full_name, email), restaurants(name), order_items(*, menu_items(name))") \
            .order("created_at", desc=True) \
            .range(offset, offset + limit - 1) \
            .execute()
        return {"orders": response.data}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

class RejectApplicationRequest(BaseModel):
    reason: str

@router.get("/applications")
def get_partner_applications(current_admin: dict = Depends(get_current_admin)):
    try:
        from app.database.partner_applications import get_all_applications
        apps = get_all_applications()
        pending_count = sum(1 for a in apps if a.get("status") == "pending_approval")
        approved_count = sum(1 for a in apps if a.get("status") == "approved")
        rejected_count = sum(1 for a in apps if a.get("status") == "rejected")
        return {
            "applications": apps,
            "counts": {
                "total": len(apps),
                "pending": pending_count,
                "approved": approved_count,
                "rejected": rejected_count
            }
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/applications/{app_id}/approve")
def approve_partner_application(app_id: str, current_admin: dict = Depends(get_current_admin)):
    try:
        from app.database.partner_applications import approve_application
        admin_email = current_admin.get("email", "admin@zaikapulse.com")
        updated_app = approve_application(app_id, admin_email)
        return {
            "success": True,
            "message": f"Successfully approved {updated_app.get('restaurant_name')}! Kitchen partner onboarded and starter menu generated.",
            "application": updated_app
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/applications/{app_id}/reject")
def reject_partner_application(
    app_id: str,
    req: RejectApplicationRequest,
    current_admin: dict = Depends(get_current_admin)
):
    try:
        from app.database.partner_applications import reject_application
        admin_email = current_admin.get("email", "admin@zaikapulse.com")
        updated_app = reject_application(app_id, req.reason, admin_email)
        return {
            "success": True,
            "message": f"Application for {updated_app.get('restaurant_name')} has been rejected.",
            "application": updated_app
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

