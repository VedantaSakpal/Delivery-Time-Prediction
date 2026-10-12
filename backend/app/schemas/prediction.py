from pydantic import BaseModel, Field

class PredictionRequest(BaseModel):
    Distance_km: float = Field(..., alias="distance_km")
    Weather: str = Field(..., alias="weather")
    Traffic_Level: str = Field(..., alias="traffic_level")
    Time_of_Day: str = Field(..., alias="time_of_day")
    Vehicle_Type: str = Field(..., alias="vehicle_type")
    Preparation_Time_min: int = Field(..., alias="preparation_time_min")
    Courier_Experience_yrs: float = Field(..., alias="courier_experience_yrs")
    
    class Config:
        populate_by_name = True
