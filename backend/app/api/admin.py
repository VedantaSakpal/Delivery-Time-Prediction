from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict
from app.api.deps import get_current_admin
from app.database.supabase import supabase

router = APIRouter()

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
        response = supabase.table("restaurants") \
            .select("*, profiles(full_name, email)") \
            .order("created_at", desc=True) \
            .execute()
        return {"restaurants": response.data}
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
