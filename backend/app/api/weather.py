from fastapi import APIRouter, Query
from typing import Optional
from app.services.weather_service import fetch_live_weather

router = APIRouter()

@router.get("/live")
def get_live_weather(
    city: Optional[str] = Query(default="Pune"),
    lat: Optional[float] = Query(default=None),
    lon: Optional[float] = Query(default=None),
    override: Optional[str] = Query(default=None)
):
    """
    Fetches real-time atmospheric weather for a delivery zone.
    Supported cities: Pune, Mumbai, Delhi, Bengaluru, Hyderabad, Kolkata, Chennai.
    """
    weather_info = fetch_live_weather(
        city=city or "Pune",
        lat=lat,
        lon=lon,
        override_condition=override
    )
    return weather_info
