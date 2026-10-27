import urllib.request
import json
from typing import Optional, Dict, Any

CITIES_COORDINATES = {
    "pune": (18.5204, 73.8567, "Pune, Maharashtra"),
    "mumbai": (19.0760, 72.8777, "Mumbai, Maharashtra"),
    "delhi": (28.6139, 77.2090, "Delhi NCR"),
    "bengaluru": (12.9716, 77.5946, "Bengaluru, Karnataka"),
    "hyderabad": (17.3850, 78.4867, "Hyderabad, Telangana"),
    "kolkata": (22.5726, 88.3639, "Kolkata, West Bengal"),
    "chennai": (13.0827, 80.2707, "Chennai, Tamil Nadu")
}

def map_wmo_code(weather_code: int, rain_mm: float = 0.0, wind_kmh: float = 0.0) -> tuple[str, str]:
    """
    Maps WMO Weather Code to model category ('Clear', 'Foggy', 'Rainy', 'Snowy', 'Windy')
    and provides a user-facing descriptive label.
    """
    # Rain/Drizzle/Thunderstorm codes
    if weather_code in [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99] or rain_mm > 0.1:
        if weather_code in [95, 96, 99]:
            return "Rainy", "Thunderstorm & Heavy Monsoon Rain"
        elif weather_code in [80, 81, 82]:
            return "Rainy", "Rain Showers"
        return "Rainy", "Moderate Rain & Wet Roads"

    # Fog codes
    if weather_code in [45, 48]:
        return "Foggy", "Dense Fog & Low Visibility"

    # Snow codes
    if weather_code in [71, 73, 75, 77, 85, 86]:
        return "Snowy", "Snowfall"

    # High wind
    if wind_kmh > 24.0:
        return "Windy", "High Gusts & Strong Winds"

    # Clear/Partly Cloudy
    if weather_code in [1, 2, 3]:
        return "Clear", "Partly Cloudy"
    return "Clear", "Clear Skies"

def fetch_live_weather(
    city: str = "Pune",
    lat: Optional[float] = None,
    lon: Optional[float] = None,
    override_condition: Optional[str] = None
) -> Dict[str, Any]:
    """
    Fetches real-world meteorological conditions from Open-Meteo public API (no API key required).
    Falls back gracefully if network unavailable.
    """
    city_clean = (city or "Pune").strip().lower()
    city_info = CITIES_COORDINATES.get(city_clean, CITIES_COORDINATES["pune"])
    
    use_lat = lat if lat is not None else city_info[0]
    use_lon = lon if lon is not None else city_info[1]
    display_city = city_info[2]

    # Default fallback data
    temp_c = 28.5
    humidity = 45
    rain_mm = 0.0
    wind_kmh = 10.2
    w_code = 0
    condition = "Clear"
    desc = "Clear Skies"

    try:
        url = (
            f"https://api.open-meteo.com/v1/forecast?"
            f"latitude={use_lat:.4f}&longitude={use_lon:.4f}"
            f"&current=temperature_2m,relative_humidity_2m,precipitation,rain,weather_code,wind_speed_10m"
            f"&timezone=auto"
        )
        req = urllib.request.Request(url, headers={"User-Agent": "justwoww-Delivery/1.0"})
        with urllib.request.urlopen(req, timeout=4) as response:
            payload = json.loads(response.read().decode("utf-8"))
            curr = payload.get("current", {})
            temp_c = round(float(curr.get("temperature_2m", 28.5)), 1)
            humidity = int(curr.get("relative_humidity_2m", 45))
            rain_mm = round(float(curr.get("rain", curr.get("precipitation", 0.0))), 2)
            wind_kmh = round(float(curr.get("wind_speed_10m", 10.0)), 1)
            w_code = int(curr.get("weather_code", 0))

            condition, desc = map_wmo_code(w_code, rain_mm, wind_kmh)
    except Exception as err:
        print(f"Notice: Open-Meteo live weather fetch ({err}). Using standard regional meteorological baseline.")

    # Allow testing simulation override (e.g. testing rainy monsoon behavior)
    if override_condition and override_condition in ["Rainy", "Clear", "Foggy", "Windy", "Snowy"]:
        condition = override_condition
        if condition == "Rainy":
            desc = "Simulated Monsoon Rain"
            rain_mm = 4.2
            humidity = 86

    is_raining = (condition == "Rainy")
    transit_buffer_min = 12 if is_raining else 0

    warning_banner = None
    if is_raining:
        warning_banner = "🌧️ Monsoons in your area: Transit buffer increased by +12 mins for courier safety"

    return {
        "city": display_city.split(",")[0],
        "full_city": display_city,
        "latitude": use_lat,
        "longitude": use_lon,
        "temperature_c": temp_c,
        "humidity": humidity,
        "precipitation_mm": rain_mm,
        "wind_speed_kmh": wind_kmh,
        "weather_code": w_code,
        "condition": condition,
        "description": desc,
        "is_raining": is_raining,
        "transit_buffer_min": transit_buffer_min,
        "warning_banner": warning_banner,
        "supported_cities": [
            {"id": "pune", "name": "Pune"},
            {"id": "mumbai", "name": "Mumbai"},
            {"id": "delhi", "name": "Delhi NCR"},
            {"id": "bengaluru", "name": "Bengaluru"},
            {"id": "hyderabad", "name": "Hyderabad"},
            {"id": "kolkata", "name": "Kolkata"},
            {"id": "chennai", "name": "Chennai"},
        ]
    }
