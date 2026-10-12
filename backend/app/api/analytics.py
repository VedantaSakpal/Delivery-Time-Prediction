from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional, List
from app.api.deps import get_current_admin
from app.database.supabase import supabase

router = APIRouter()

@router.get("/")
def get_analytics(
    current_admin: dict = Depends(get_current_admin),
    weather: Optional[str] = None,
    traffic_level: Optional[str] = None,
    time_of_day: Optional[str] = None,
    vehicle_type: Optional[str] = None,
    prediction_category: Optional[str] = None
):
    try:
        query = supabase.table("predictions").select("*")
        
        if weather:
            query = query.eq("weather", weather)
        if traffic_level:
            query = query.eq("traffic_level", traffic_level)
        if time_of_day:
            query = query.eq("time_of_day", time_of_day)
        if vehicle_type:
            query = query.eq("vehicle_type", vehicle_type)
        if prediction_category:
            query = query.eq("prediction_category", prediction_category)
            
        response = query.execute()
        predictions = response.data
        
        count = len(predictions)
        avg_delivery = sum(p["predicted_delivery_time_min"] for p in predictions) / count if count > 0 else 0
        min_delivery = min((p["predicted_delivery_time_min"] for p in predictions), default=0)
        max_delivery = max((p["predicted_delivery_time_min"] for p in predictions), default=0)
        avg_distance = sum(p["distance_km"] for p in predictions) / count if count > 0 else 0
        avg_prep = sum(p["preparation_time_min"] for p in predictions) / count if count > 0 else 0
        avg_courier_exp = sum(p["courier_experience_yrs"] for p in predictions) / count if count > 0 else 0
        
        return {
            "prediction_count": count,
            "average_delivery_time": round(avg_delivery, 2),
            "minimum_delivery_time": min_delivery,
            "maximum_delivery_time": max_delivery,
            "average_distance": round(avg_distance, 2),
            "average_preparation_time": round(avg_prep, 2),
            "average_courier_experience": round(avg_courier_exp, 2),
            "raw_data_for_charts": predictions # Returning raw data here so the frontend can build charts
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
