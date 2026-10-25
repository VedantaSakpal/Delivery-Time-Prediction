from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Optional
from pydantic import BaseModel
from app.api.deps import get_current_user
from app.database.supabase import supabase
from app.ml.predictor import predict_delivery_time
from datetime import datetime, timedelta
import random

router = APIRouter()

def resolve_time_and_traffic(
    order_time_raw: Optional[str] = None,
    local_hour: Optional[int] = None,
    local_minute: Optional[int] = None,
    local_time_str: Optional[str] = None
):
    # If client passed their exact local device hour/minute (e.g. 15, 32 from laptop)
    if local_hour is not None and local_minute is not None:
        hour = int(local_hour)
        minute = int(local_minute)
        order_time_str = local_time_str or f"{hour % 12 or 12:02d}:{minute:02d} {'AM' if hour < 12 else 'PM'}"
    else:
        order_dt = None
        if order_time_raw:
            try:
                clean_str = order_time_raw.replace("Z", "+00:00")
                order_dt = datetime.fromisoformat(clean_str)
            except Exception:
                pass
        if not order_dt:
            order_dt = datetime.now()
        hour = order_dt.hour
        minute = order_dt.minute
        order_time_str = order_dt.strftime("%I:%M %p")

    time_float = hour + minute / 60.0

    # 1. Real Time_of_Day mapping for model: 'Morning', 'Afternoon', 'Evening', 'Night'
    if 6 <= hour < 12:
        time_of_day = "Morning"
    elif 12 <= hour < 17:
        time_of_day = "Afternoon"
    elif 17 <= hour < 22:
        time_of_day = "Evening"
    else:
        time_of_day = "Night"

    # 2. Dynamic Traffic_Level based on urban rush hours
    if (8.5 <= time_float <= 10.5) or (12.5 <= time_float <= 14.5) or (18.0 <= time_float <= 21.0):
        traffic_level = "High"
    elif (22.5 <= time_float) or (time_float <= 6.5):
        traffic_level = "Low"
    else:
        traffic_level = "Medium"

    return hour, minute, order_time_str, time_of_day, traffic_level

class OrderItemInput(BaseModel):
    menu_item_id: str
    quantity: int

class PlaceOrderRequest(BaseModel):
    restaurant_id: str
    items: List[OrderItemInput]
    delivery_address: str
    payment_method: str = "cash"
    distance_km: Optional[float] = None
    user_location: Optional[Dict[str, float]] = None
    order_time: Optional[str] = None
    local_hour: Optional[int] = None
    local_minute: Optional[int] = None
    local_time_str: Optional[str] = None
    weather_condition: Optional[str] = None
    city: Optional[str] = "Pune"
    override_weather: Optional[str] = None
    
class OrderStatusUpdate(BaseModel):
    status: str


from app.database.restaurant_status import is_restaurant_terminated

@router.post("/")
def place_order(request: PlaceOrderRequest, current_user: dict = Depends(get_current_user)):
    try:
        # Verify restaurant is not terminated
        is_term, term_reason, _ = is_restaurant_terminated(request.restaurant_id)
        if is_term:
            raise HTTPException(
                status_code=400,
                detail=f"This kitchen partner is currently terminated ({term_reason}) and cannot accept new orders."
            )

        # Calculate total and get menu items
        total_amount = 0
        menu_items_cache = {}
        for item in request.items:
            res = supabase.table("menu_items").select("*").eq("id", item.menu_item_id).single().execute()
            if not res.data:
                raise Exception(f"Menu item {item.menu_item_id} not found")
            menu_item = res.data
            menu_items_cache[item.menu_item_id] = menu_item
            total_amount += menu_item["price"] * item.quantity

        # Create Order
        order_payload = {
            "user_id": current_user["id"],
            "restaurant_id": request.restaurant_id,
            "total_amount": total_amount,
            "delivery_address": request.delivery_address,
            "payment_method": request.payment_method,
            "status": "pending"
        }
        order_res = supabase.table("orders").insert(order_payload).execute()
        order_id = order_res.data[0]["id"]
        
        # Create Order Items
        for item in request.items:
            supabase.table("order_items").insert({
                "order_id": order_id,
                "menu_item_id": item.menu_item_id,
                "quantity": item.quantity,
                "price_at_time": menu_items_cache[item.menu_item_id]["price"]
            }).execute()

        # Fetch original order placement time and determine dynamic time of day + traffic
        hour, minute, order_time_str, time_of_day, traffic_level = resolve_time_and_traffic(
            order_time_raw=request.order_time,
            local_hour=request.local_hour,
            local_minute=request.local_minute,
            local_time_str=request.local_time_str
        )

        # Generate Delivery Prediction using actual 3D map distance and current time factors
        rest_res = supabase.table("restaurants").select("preparation_time_min").eq("id", request.restaurant_id).single().execute()
        prep_time = float(rest_res.data.get("preparation_time_min", 15)) if rest_res.data else 15.0
        
        # Use exact virtual map distance if provided by client
        if request.distance_km is not None and float(request.distance_km) > 0:
            actual_distance = round(float(request.distance_km), 1)
        else:
            actual_distance = round(random.uniform(2.0, 6.5), 1)

        # Fetch live real-world weather or use client selected/simulated condition
        from app.services.weather_service import fetch_live_weather
        weather_info = fetch_live_weather(
            city=request.city or "Pune",
            override_condition=request.override_weather or request.weather_condition
        )
        weather_condition = weather_info["condition"]
        is_raining = weather_info["is_raining"]
        transit_buffer = weather_info["transit_buffer_min"]
        weather_warning = weather_info["warning_banner"]

        model_input = {
            "Distance_km": actual_distance,
            "Weather": weather_condition, 
            "Traffic_Level": traffic_level,
            "Time_of_Day": time_of_day,
            "Vehicle_Type": "Bike",
            "Preparation_Time_min": prep_time,
            "Courier_Experience_yrs": round(random.uniform(1.5, 4.5), 1)
        }
        
        prediction_result = predict_delivery_time(model_input)

        # Apply +12 min courier safety buffer during monsoon/rain
        if is_raining:
            prediction_result["predicted_delivery_time_min"] = round(prediction_result["predicted_delivery_time_min"] + transit_buffer, 2)
            prediction_result["prediction_range"]["lower"] = round(prediction_result["prediction_range"]["lower"] + transit_buffer, 1)
            prediction_result["prediction_range"]["upper"] = round(prediction_result["prediction_range"]["upper"] + transit_buffer, 1)
            prediction_result["weather_warning"] = weather_warning
            prediction_result["transit_buffer_min"] = transit_buffer
            if "explanation" in prediction_result and isinstance(prediction_result["explanation"], list):
                prediction_result["explanation"].insert(0, {
                    "feature": "Monsoon Road Safety Buffer",
                    "impact": transit_buffer,
                    "direction": "increase"
                })
        
        # Calculate expected clock arrival time using user's exact local time
        pred_min = float(prediction_result.get("predicted_delivery_time_min", 30))
        arrival_total_min = hour * 60 + minute + int(round(pred_min))
        arr_h = (arrival_total_min // 60) % 24
        arr_m = arrival_total_min % 60
        arr_ampm = "AM" if arr_h < 12 else "PM"
        arr_h12 = arr_h % 12 or 12
        arrival_time_str = f"{arr_h12:02d}:{arr_m:02d} {arr_ampm}"
        
        prediction_result["order_time_formatted"] = order_time_str
        prediction_result["estimated_arrival_time"] = arrival_time_str
        prediction_result["time_of_day"] = time_of_day
        prediction_result["traffic_level"] = traffic_level
        prediction_result["weather"] = weather_info

        db_payload = {
            "user_id": current_user["id"],
            "distance_km": actual_distance,
            "weather": weather_condition,
            "traffic_level": model_input["Traffic_Level"],
            "time_of_day": model_input["Time_of_Day"],
            "vehicle_type": model_input["Vehicle_Type"],
            "preparation_time_min": model_input["Preparation_Time_min"],
            "courier_experience_yrs": model_input["Courier_Experience_yrs"],
            "predicted_delivery_time_min": prediction_result["predicted_delivery_time_min"],
            "prediction_category": prediction_result["prediction_category"],
            "prediction_range_lower": prediction_result["prediction_range"]["lower"],
            "prediction_range_upper": prediction_result["prediction_range"]["upper"],
            "reliability": prediction_result["reliability"],
            "explanation": prediction_result["explanation"]
        }

        
        # Try inserting with order_id (if schema has order_id as uuid); fallback if it's bigint
        try:
            supabase.table("predictions").insert({**db_payload, "order_id": order_id}).execute()
        except Exception as pred_err:
            print(f"Notice: could not link prediction with order_id ({pred_err}). Saving prediction without order_id.")
            supabase.table("predictions").insert(db_payload).execute()

        # In-app notifications: notify restaurant owner, diner, and admin
        try:
            from app.database.notifications import create_notification
            rest_info = supabase.table("restaurants").select("name, owner_id").eq("id", request.restaurant_id).single().execute()
            rest_name = rest_info.data.get("name", "Kitchen Partner") if rest_info.data else "Kitchen Partner"
            rest_owner_id = rest_info.data.get("owner_id") if rest_info.data else None
            diner_name = current_user.get("user_metadata", {}).get("full_name") or current_user.get("email", "Diner Guest")

            # 1. Notify Restaurant Owner
            if rest_owner_id:
                create_notification(
                    recipient_id=rest_owner_id,
                    role="restaurant",
                    title="New Order Received! 🔔",
                    message=f"Order #{order_id[:8]} received from {diner_name} for Rs. {total_amount:,.2f} ({len(request.items)} items).",
                    notif_type="new_order",
                    data={
                        "order_id": order_id,
                        "restaurant_id": request.restaurant_id,
                        "restaurant_name": rest_name,
                        "amount": total_amount,
                        "items_count": len(request.items),
                        "diner_name": diner_name
                    }
                )

            # 2. Notify Diner
            create_notification(
                recipient_id=current_user["id"],
                role="user",
                title="Order Confirmed! 🎉",
                message=f"Your order #{order_id[:8]} with {rest_name} has been placed. Estimated arrival at ~{arrival_time_str}.",
                notif_type="order_placed",
                data={
                    "order_id": order_id,
                    "restaurant_id": request.restaurant_id,
                    "restaurant_name": rest_name,
                    "estimated_arrival": arrival_time_str,
                    "amount": total_amount
                }
            )

            # 3. Notify Admin
            create_notification(
                recipient_id="admin",
                role="admin",
                title="New Platform Order 📦",
                message=f"Order #{order_id[:8]} (Rs. {total_amount:,.2f}) placed at {rest_name} by {diner_name}.",
                notif_type="admin_order",
                data={
                    "order_id": order_id,
                    "restaurant_id": request.restaurant_id,
                    "restaurant_name": rest_name,
                    "amount": total_amount
                }
            )
        except Exception as n_err:
            print("Notice: order notification dispatch error:", n_err)

        return {
            "success": True, 
            "order_id": order_id, 
            "prediction": prediction_result,
            "distance_km": actual_distance,
            "order_time": order_time_str,
            "estimated_arrival_time": arrival_time_str,
            "time_of_day": time_of_day,
            "traffic_level": traffic_level,
            "weather": weather_info,
            "weather_warning": weather_warning,
            "weather_condition": weather_condition,
            "is_raining": is_raining,
            "transit_buffer_min": transit_buffer
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/me")
def get_my_orders(current_user: dict = Depends(get_current_user)):
    try:
        res = supabase.table("orders").select("*, restaurants(name, image_url), order_items(*, menu_items(name))").eq("user_id", current_user["id"]).order("created_at", desc=True).execute()
        return {"orders": res.data}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{order_id}/prediction")
def get_order_prediction(order_id: str, current_user: dict = Depends(get_current_user)):
    try:
        res = supabase.table("predictions").select("*").eq("order_id", order_id).execute()
        if res.data and len(res.data) > 0:
            return {"prediction": res.data[0]}
        return {"prediction": None}
    except Exception:
        return {"prediction": None}

@router.patch("/{order_id}/status")
def update_order_status(order_id: str, update: OrderStatusUpdate, current_user: dict = Depends(get_current_user)):
    user_role = current_user.get("role")
    if user_role not in ["restaurant", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized to update order status")
        
    try:
        order = supabase.table("orders").select("*").eq("id", order_id).single().execute()
        if not order.data:
            raise HTTPException(status_code=404, detail="Order not found")
            
        if user_role == "restaurant":
            res_rest = supabase.table("restaurants").select("id").eq("owner_id", current_user["id"]).single().execute()
            if not res_rest.data or order.data["restaurant_id"] != res_rest.data["id"]:
                raise HTTPException(status_code=403, detail="Not authorized to modify this order")
             
        upd = supabase.table("orders").update({"status": update.status}).eq("id", order_id).execute()

        # Send in-app notification to diner about status change
        try:
            from app.database.notifications import create_notification
            rest_res = supabase.table("restaurants").select("name").eq("id", order.data["restaurant_id"]).single().execute()
            rest_name = rest_res.data.get("name", "Kitchen Partner") if rest_res.data else "Kitchen Partner"
            diner_id = order.data.get("user_id")

            status_clean = update.status.lower()
            if status_clean == "preparing":
                title = "👨‍🍳 Kitchen Preparing Your Meal"
                msg = f"{rest_name} is actively cooking your order #{order_id[:8]} fresh!"
            elif status_clean in ["ready", "out_for_delivery"]:
                title = "🛵 Order Out For Delivery!"
                msg = f"Your order #{order_id[:8]} from {rest_name} is on the way with our courier."
            elif status_clean in ["delivered", "completed"]:
                title = "✅ Order Delivered! Bon Appétit"
                msg = f"Your order #{order_id[:8]} from {rest_name} has arrived. Enjoy your meal!"
            elif status_clean in ["rejected", "cancelled"]:
                title = "❌ Order Cancelled"
                msg = f"Your order #{order_id[:8]} from {rest_name} could not be fulfilled."
            else:
                title = f"Order Status Update: {update.status.replace('_', ' ').title()}"
                msg = f"Your order #{order_id[:8]} from {rest_name} status is now {update.status.replace('_', ' ')}."

            if diner_id:
                create_notification(
                    recipient_id=diner_id,
                    role="user",
                    title=title,
                    message=msg,
                    notif_type="status_update",
                    data={
                        "order_id": order_id,
                        "status": update.status,
                        "restaurant_name": rest_name
                    }
                )
        except Exception as notif_err:
            print("Notice: status change notification error:", notif_err)

        return {
            "success": True, 
            "order_id": order_id, 
            "status": update.status,
            "order": upd.data[0] if upd.data else None
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

