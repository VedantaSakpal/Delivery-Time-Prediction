from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional, Dict, Any, List
from datetime import datetime, timezone
import pandas as pd
from app.api.deps import get_current_user
from app.database.supabase import supabase

router = APIRouter()

@router.get("/operations")
def get_operations_report(
    granularity: str = Query("day", pattern="^(day|week|month|year)$"),
    restaurant_id: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    """
    Day-to-day, week-wise, month-wise, and year-wise operational & financial reports.
    Accessible to both Admin (platform-wide or per-restaurant) and Restaurant owners (their kitchen).
    """
    user_role = current_user.get("role")
    if user_role not in ["admin", "restaurant"]:
        raise HTTPException(status_code=403, detail="Not authorized to view operations reports")

    try:
        # Determine restaurant scope
        scope = "platform"
        scoped_restaurant_id = None
        entity_name = "Platform Wide - All Kitchen Partners"
        restaurant_details = None

        if user_role == "restaurant":
            scope = "restaurant"
            rest_resp = supabase.table("restaurants").select("*").eq("owner_id", current_user["id"]).execute()
            if not rest_resp.data:
                raise HTTPException(status_code=404, detail="No registered restaurant found for this account")
            restaurant_details = rest_resp.data[0]
            scoped_restaurant_id = restaurant_details["id"]
            entity_name = restaurant_details.get("name", "My Kitchen")
        elif user_role == "admin":
            if restaurant_id and restaurant_id not in ["all", "", "null", "undefined"]:
                scope = "restaurant"
                scoped_restaurant_id = restaurant_id
                rest_resp = supabase.table("restaurants").select("*").eq("id", restaurant_id).execute()
                if rest_resp.data:
                    restaurant_details = rest_resp.data[0]
                    entity_name = restaurant_details.get("name", "Kitchen Partner")

        # Fetch orders with items, profiles, and restaurants
        query = supabase.table("orders").select(
            "id, total_amount, status, payment_method, delivery_address, created_at, restaurant_id, "
            "restaurants(id, name, address, image_url), "
            "profiles(id, full_name, email), "
            "order_items(id, quantity, price_at_time, menu_items(name))"
        )

        if scoped_restaurant_id:
            query = query.eq("restaurant_id", scoped_restaurant_id)

        orders_resp = query.order("created_at", desc=True).execute()
        orders = orders_resp.data or []

        if not orders:
            return {
                "scope": scope,
                "entity_name": entity_name,
                "granularity": granularity,
                "restaurant": restaurant_details,
                "summary": {
                    "total_orders": 0,
                    "total_revenue": 0.0,
                    "delivered_orders": 0,
                    "active_orders": 0,
                    "rejected_orders": 0,
                    "fulfillment_rate": 0.0,
                    "avg_order_value": 0.0,
                    "avg_delivery_time_min": 0.0
                },
                "periodic_data": [],
                "status_breakdown": [],
                "payment_breakdown": [],
                "top_performers": [],
                "recent_operations": []
            }

        df = pd.DataFrame(orders)
        df["created_at_dt"] = pd.to_datetime(df["created_at"])
        df["total_amount"] = pd.to_numeric(df["total_amount"], errors="coerce").fillna(0.0)

        # Standardize completed/delivered status
        df["is_delivered"] = df["status"].isin(["delivered", "completed"])
        df["is_rejected"] = df["status"].isin(["rejected", "cancelled"])
        df["is_active"] = ~df["is_delivered"] & ~df["is_rejected"]

        # Date formatting for time roll-ups
        if granularity == "day":
            df["period_key"] = df["created_at_dt"].dt.strftime("%Y-%m-%d")
            df["period_label"] = df["created_at_dt"].dt.strftime("%d %b %Y")
        elif granularity == "week":
            df["period_key"] = df["created_at_dt"].dt.strftime("%Y-W%U")
            df["period_label"] = df["created_at_dt"].apply(lambda d: f"Week {d.strftime('%U, %Y')}")
        elif granularity == "month":
            df["period_key"] = df["created_at_dt"].dt.strftime("%Y-%m")
            df["period_label"] = df["created_at_dt"].dt.strftime("%B %Y")
        else:  # year
            df["period_key"] = df["created_at_dt"].dt.strftime("%Y")
            df["period_label"] = df["created_at_dt"].dt.strftime("Year %Y")

        # Group by period
        grouped = df.groupby(["period_key", "period_label"]).agg(
            total_orders=("id", "count"),
            revenue=("total_amount", "sum"),
            delivered_orders=("is_delivered", "sum"),
            rejected_orders=("is_rejected", "sum"),
            active_orders=("is_active", "sum"),
            avg_order_value=("total_amount", "mean")
        ).reset_index()

        # Sort chronologically
        grouped = grouped.sort_values("period_key", ascending=False)
        grouped["revenue"] = grouped["revenue"].round(2)
        grouped["avg_order_value"] = grouped["avg_order_value"].round(2)
        grouped["fulfillment_rate"] = (
            (grouped["delivered_orders"] / grouped["total_orders"] * 100).round(1)
        )

        periodic_data = grouped.to_dict("records")

        # Overall Summary KPIs
        total_orders_count = int(len(df))
        total_rev = round(float(df["total_amount"].sum()), 2)
        delivered_count = int(df["is_delivered"].sum())
        active_count = int(df["is_active"].sum())
        rejected_count = int(df["is_rejected"].sum())
        fulfillment_rate = round((delivered_count / total_orders_count * 100), 1) if total_orders_count > 0 else 0.0
        avg_aov = round(float(df["total_amount"].mean()), 2) if total_orders_count > 0 else 0.0

        # Average delivery time from predictions
        avg_delivery_time = 28.5
        try:
            preds_resp = supabase.table("predictions").select("predicted_delivery_time_min").execute()
            if preds_resp.data and len(preds_resp.data) > 0:
                p_times = [p["predicted_delivery_time_min"] for p in preds_resp.data if p.get("predicted_delivery_time_min") is not None]
                if p_times:
                    avg_delivery_time = round(sum(p_times) / len(p_times), 1)
        except Exception:
            pass

        # Status distribution
        status_df = df.groupby("status").agg(
            count=("id", "count"),
            revenue=("total_amount", "sum")
        ).reset_index()
        status_df["share_pct"] = (status_df["count"] / total_orders_count * 100).round(1)
        status_df["revenue"] = status_df["revenue"].round(2)
        status_breakdown = status_df.to_dict("records")

        # Payment distribution
        payment_df = df.groupby("payment_method").agg(
            count=("id", "count"),
            revenue=("total_amount", "sum")
        ).reset_index()
        payment_df["share_pct"] = (payment_df["count"] / total_orders_count * 100).round(1)
        payment_df["revenue"] = payment_df["revenue"].round(2)
        payment_breakdown = payment_df.to_dict("records")

        # Top performers
        top_performers = []
        if scope == "restaurant":
            # Extract top selling items from order_items
            item_stats = {}
            for _, row in df.iterrows():
                items = row.get("order_items") or []
                for item in items:
                    menu_item = item.get("menu_items") or {}
                    name = menu_item.get("name", "Popular Item")
                    qty = int(item.get("quantity") or 1)
                    price = float(item.get("price_at_time") or 0.0)
                    if name not in item_stats:
                        item_stats[name] = {"name": name, "quantity_sold": 0, "total_revenue": 0.0}
                    item_stats[name]["quantity_sold"] += qty
                    item_stats[name]["total_revenue"] += round(qty * price, 2)
            top_performers = sorted(item_stats.values(), key=lambda x: x["quantity_sold"], reverse=True)[:8]
        else:
            # Platform wide: top restaurants by order volume & revenue
            rest_stats = {}
            for _, row in df.iterrows():
                r_info = row.get("restaurants") or {}
                r_name = r_info.get("name", "Unknown Kitchen")
                r_amt = float(row.get("total_amount") or 0.0)
                is_deliv = bool(row.get("is_delivered"))
                if r_name not in rest_stats:
                    rest_stats[r_name] = {
                        "name": r_name,
                        "orders_count": 0,
                        "total_revenue": 0.0,
                        "delivered_count": 0
                    }
                rest_stats[r_name]["orders_count"] += 1
                rest_stats[r_name]["total_revenue"] = round(rest_stats[r_name]["total_revenue"] + r_amt, 2)
                if is_deliv:
                    rest_stats[r_name]["delivered_count"] += 1

            for r in rest_stats.values():
                r["fulfillment_rate"] = round((r["delivered_count"] / r["orders_count"] * 100), 1) if r["orders_count"] > 0 else 0.0

            top_performers = sorted(rest_stats.values(), key=lambda x: x["orders_count"], reverse=True)[:8]

        # Recent operations log
        recent_operations = []
        for order in orders[:30]:
            customer = order.get("profiles") or {}
            restaurant = order.get("restaurants") or {}
            items_list = order.get("order_items") or []
            items_summary = ", ".join([
                f"{i.get('quantity', 1)}x {i.get('menu_items', {}).get('name', 'Item')}"
                for i in items_list[:3]
            ])
            if len(items_list) > 3:
                items_summary += f" +{len(items_list) - 3} more"

            recent_operations.append({
                "id": order["id"],
                "short_id": order["id"][:8],
                "created_at": order["created_at"],
                "formatted_time": pd.to_datetime(order["created_at"]).strftime("%d %b %Y, %I:%M %p"),
                "customer_name": customer.get("full_name") or "Valued Guest",
                "customer_email": customer.get("email") or "—",
                "restaurant_name": restaurant.get("name") or "Kitchen",
                "total_amount": float(order.get("total_amount") or 0.0),
                "status": order.get("status", "pending"),
                "payment_method": order.get("payment_method", "cash"),
                "delivery_address": order.get("delivery_address", "—"),
                "items_summary": items_summary or "Menu Items"
            })

        return {
            "scope": scope,
            "entity_name": entity_name,
            "granularity": granularity,
            "restaurant": restaurant_details,
            "summary": {
                "total_orders": total_orders_count,
                "total_revenue": total_rev,
                "delivered_orders": delivered_count,
                "active_orders": active_count,
                "rejected_orders": rejected_count,
                "fulfillment_rate": fulfillment_rate,
                "avg_order_value": avg_aov,
                "avg_delivery_time_min": avg_delivery_time
            },
            "periodic_data": periodic_data,
            "status_breakdown": status_breakdown,
            "payment_breakdown": payment_breakdown,
            "top_performers": top_performers,
            "recent_operations": recent_operations
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=str(e))
