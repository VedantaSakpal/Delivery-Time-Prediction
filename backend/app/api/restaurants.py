from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Optional
from pydantic import BaseModel
from app.api.deps import get_current_user
from app.database.supabase import supabase

router = APIRouter()

class MenuItem(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    image_url: Optional[str] = None
    is_available: bool = True

from app.database.restaurant_status import is_restaurant_terminated, clean_description

@router.get("/")
def get_restaurants():
    try:
        response = supabase.table("restaurants").select("*").execute()
        restaurants = []
        for r in (response.data or []):
            is_term, term_reason, _ = is_restaurant_terminated(r["id"], r.get("description"))
            restaurants.append({
                **r,
                "clean_description": clean_description(r.get("description")),
                "is_terminated": is_term,
                "termination_reason": term_reason
            })
        return {"restaurants": restaurants}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{restaurant_id}")
def get_restaurant(restaurant_id: str):
    if restaurant_id == "me":
        return get_restaurant_dashboard()
        
    try:
        res = supabase.table("restaurants").select("*").eq("id", restaurant_id).single().execute()
        menu = supabase.table("menu_items").select("*").eq("restaurant_id", restaurant_id).execute()
        data = res.data
        data["menu"] = menu.data
        return data
    except Exception as e:
        raise HTTPException(status_code=404, detail="Restaurant not found")

@router.get("/me/dashboard")
def get_restaurant_dashboard(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "restaurant":
        raise HTTPException(status_code=403, detail="Not a restaurant user")
    
    try:
        res = supabase.table("restaurants").select("*").eq("owner_id", current_user["id"]).execute()
        if not res.data:
            return {"error": "No restaurant setup for this user"}
            
        restaurant = res.data[0]
        
        orders = supabase.table("orders").select("*, profiles(full_name, email), order_items(*, menu_items(name))").eq("restaurant_id", restaurant["id"]).order("created_at", desc=True).execute()
        menu = supabase.table("menu_items").select("*").eq("restaurant_id", restaurant["id"]).execute()
        
        return {
            "restaurant": restaurant,
            "orders": orders.data,
            "menu": menu.data
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/me/menu")
def add_menu_item(item: MenuItem, current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "restaurant":
        raise HTTPException(status_code=403, detail="Not a restaurant user")
    try:
        res = supabase.table("restaurants").select("id").eq("owner_id", current_user["id"]).single().execute()
        restaurant_id = res.data["id"]
        
        payload = item.model_dump()
        payload["restaurant_id"] = restaurant_id
        
        insert_res = supabase.table("menu_items").insert(payload).execute()
        return {"success": True, "item": insert_res.data[0]}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/me/analytics")
def get_restaurant_analytics(current_user: dict = Depends(get_current_user)):
    """OLAP-style analytics for the restaurant owner's orders."""
    if current_user.get("role") != "restaurant":
        raise HTTPException(status_code=403, detail="Not a restaurant user")
    try:
        import pandas as pd
        from datetime import datetime

        # Get restaurant
        res = supabase.table("restaurants").select("id, name").eq("owner_id", current_user["id"]).single().execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="No restaurant found for this user")
        restaurant_id = res.data["id"]

        # Fetch all orders for this restaurant
        orders_res = supabase.table("orders") \
            .select("id, status, total_amount, created_at, order_items(quantity, price_at_time, menu_items(name))") \
            .eq("restaurant_id", restaurant_id) \
            .execute()

        orders = orders_res.data
        if not orders:
            return {
                "orders_by_month": [],
                "revenue_by_month": [],
                "orders_by_status": [],
                "top_items": [],
                "total_orders": 0,
                "total_revenue": 0.0,
            }

        df = pd.DataFrame(orders)
        df["created_at"] = pd.to_datetime(df["created_at"])
        df["month"] = df["created_at"].dt.strftime("%Y-%m")
        df["total_amount"] = pd.to_numeric(df["total_amount"], errors="coerce")

        # Orders by month
        orders_by_month = df.groupby("month").agg(
            order_count=("id", "count"),
            revenue=("total_amount", "sum")
        ).reset_index().sort_values("month")
        orders_by_month["revenue"] = orders_by_month["revenue"].round(2)

        # Orders by status
        orders_by_status = df.groupby("status").agg(
            count=("id", "count"),
            revenue=("total_amount", "sum")
        ).reset_index()
        orders_by_status["revenue"] = orders_by_status["revenue"].round(2)

        # Top menu items
        item_counts = {}
        for _, row in df.iterrows():
            for oi in (row.get("order_items") or []):
                name = oi.get("menu_items", {}).get("name", "Unknown")
                qty  = oi.get("quantity", 0)
                rev  = oi.get("price_at_time", 0) * qty
                if name not in item_counts:
                    item_counts[name] = {"name": name, "total_qty": 0, "total_revenue": 0.0}
                item_counts[name]["total_qty"]     += qty
                item_counts[name]["total_revenue"] += rev

        top_items = sorted(item_counts.values(), key=lambda x: x["total_qty"], reverse=True)[:5]
        for t in top_items:
            t["total_revenue"] = round(t["total_revenue"], 2)

        return {
            "orders_by_month":   orders_by_month.to_dict("records"),
            "revenue_by_month":  orders_by_month[["month", "revenue"]].to_dict("records"),
            "orders_by_status":  orders_by_status.to_dict("records"),
            "top_items":         top_items,
            "total_orders":      int(len(df)),
            "total_revenue":     round(float(df["total_amount"].sum()), 2),
        }

    except Exception as e:
        import traceback; traceback.print_exc()
        raise HTTPException(status_code=400, detail=str(e))

