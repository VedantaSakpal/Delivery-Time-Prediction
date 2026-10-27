from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Any
from pydantic import BaseModel
from app.schemas.prediction import PredictionRequest
from app.ml.predictor import predict_delivery_time, get_model_coefficients, compute_what_if
from app.api.deps import get_current_user
from app.database.supabase import supabase

router = APIRouter()

class WhatIfRequest(BaseModel):
    baseline: PredictionRequest
    counterfactual: PredictionRequest

@router.get("/coefficients")
def get_coefficients():
    """Returns exact OLS Linear Regression coefficients, beta weights, and marginal elasticity."""
    try:
        return get_model_coefficients()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/what-if")
def calculate_what_if(req: WhatIfRequest):
    """Calculates zero-latency counterfactual simulation delta between baseline and modified features."""
    try:
        b_input = req.baseline.model_dump(by_alias=False)
        c_input = req.counterfactual.model_dump(by_alias=False)
        return compute_what_if(b_input, c_input)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/predict")
def create_prediction(request: PredictionRequest, current_user: dict = Depends(get_current_user)):
    try:
        # 1. Run prediction
        model_input = request.model_dump(by_alias=False)
        prediction_result = predict_delivery_time(model_input)
        
        # 2. Store in Supabase
        db_payload = {
            "user_id": current_user["id"],
            "distance_km": request.Distance_km,
            "weather": request.Weather,
            "traffic_level": request.Traffic_Level,
            "time_of_day": request.Time_of_Day,
            "vehicle_type": request.Vehicle_Type,
            "preparation_time_min": request.Preparation_Time_min,
            "courier_experience_yrs": request.Courier_Experience_yrs,
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
            "prediction": prediction_result
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/history")
def get_prediction_history(current_user: dict = Depends(get_current_user), limit: int = 50, offset: int = 0):
    try:
        response = supabase.table("predictions") \
            .select("*") \
            .eq("user_id", current_user["id"]) \
            .order("created_at", desc=True) \
            .range(offset, offset + limit - 1) \
            .execute()
        
        return {"predictions": response.data}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
