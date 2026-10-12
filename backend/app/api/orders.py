from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Optional
from pydantic import BaseModel
from app.api.deps import get_current_user
from app.database.supabase import supabase
from app.ml.predictor import predict_delivery_time
import random

router = APIRouter()

class OrderItemInput(BaseModel):
    menu_item_id: str
    quantity: int

class PlaceOrderRequest(BaseModel):
    restaurant_id: str
    items: List[OrderItemInput]
    delivery_address: str
    payment_method: str = "cash"
    
class OrderStatusUpdate(BaseModel):
    status: str

@router.post("/")
def place_order(request: PlaceOrderRequest, current_user: dict = Depends(get_current_user)):
    try:
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

        # Generate Delivery Prediction
        rest_res = supabase.table("restaurants").select("preparation_time_min").eq("id", request.restaurant_id).single().execute()
        prep_time = float(rest_res.data.get("preparation_time_min", 15))
        
        # Heuristics for realistic dummy params based on order
        model_input = {
            "Distance_km": round(random.uniform(1.5, 8.0), 1),
            "Weather": "Clear", 
            "Traffic_Level": "Medium",
            "Time_of_Day": "Evening",
            "Vehicle_Type": "Motorcycle",
            "Preparation_Time_min": prep_time,
            "Courier_Experience_yrs": round(random.uniform(1.0, 5.0), 1)
        }
        
        prediction_result = predict_delivery_time(model_input)
        
        db_payload = {
            "user_id": current_user["id"],
            "order_id": order_id,
            "distance_km": model_input["Distance_km"],
            "weather": model_input["Weather"],
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
        supabase.table("predictions").insert(db_payload).execute()

        return {
            "success": True, 
            "order_id": order_id,
            "prediction": prediction_result
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
        res = supabase.table("predictions").select("*").eq("order_id", order_id).single().execute()
        return {"prediction": res.data}
    except Exception as e:
         raise HTTPException(status_code=404, detail="Prediction not found for this order")

@router.patch("/{order_id}/status")
def update_order_status(order_id: str, update: OrderStatusUpdate, current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "restaurant":
        raise HTTPException(status_code=403, detail="Not a restaurant user")
        
    try:
        order = supabase.table("orders").select("*").eq("id", order_id).single().execute()
        res_rest = supabase.table("restaurants").select("id").eq("owner_id", current_user["id"]).single().execute()
        if order.data["restaurant_id"] != res_rest.data["id"]:
             raise HTTPException(status_code=403, detail="Not your order")
             
        supabase.table("orders").update({"status": update.status}).eq("id", order_id).execute()
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
