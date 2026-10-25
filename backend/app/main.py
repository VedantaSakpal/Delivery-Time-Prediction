from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

load_dotenv()

from app.api import predictions, admin, analytics, olap, restaurants, orders, reports, warehouse

app = FastAPI(title="Delivery Time Prediction API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to the frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

for prefix in ["/api", ""]:
    app.include_router(predictions.router, prefix=f"{prefix}/predictions", tags=["Predictions"], include_in_schema=(prefix == "/api"))
    app.include_router(admin.router, prefix=f"{prefix}/admin", tags=["Admin"], include_in_schema=(prefix == "/api"))
    app.include_router(analytics.router, prefix=f"{prefix}/analytics", tags=["Analytics"], include_in_schema=(prefix == "/api"))
    app.include_router(olap.router, prefix=f"{prefix}/olap", tags=["OLAP"], include_in_schema=(prefix == "/api"))
    app.include_router(restaurants.router, prefix=f"{prefix}/restaurants", tags=["Restaurants"], include_in_schema=(prefix == "/api"))
    app.include_router(orders.router, prefix=f"{prefix}/orders", tags=["Orders"], include_in_schema=(prefix == "/api"))
    app.include_router(reports.router, prefix=f"{prefix}/reports", tags=["Reports"], include_in_schema=(prefix == "/api"))
    app.include_router(warehouse.router, prefix=f"{prefix}/warehouse", tags=["Warehouse"], include_in_schema=(prefix == "/api"))

@app.get("/")
def read_root():
    return {"message": "Welcome to Delivery Time Prediction API"}
