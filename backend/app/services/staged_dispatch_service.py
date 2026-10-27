from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List
from app.services.freshness_service import calculate_freshness_index

def compute_staged_dispatch_schedule(
    order_created_at: Optional[datetime] = None,
    prep_time_min: float = 18.0,
    courier_pickup_transit_min: float = 5.5,
    order_status: str = "pending"
) -> Dict[str, Any]:
    """
    Computes synchronized staged dispatch timings to eliminate courier idle wait time
    outside restaurant kitchens while guaranteeing food never sits on counters cooling.
    """
    if not order_created_at:
        order_created_at = datetime.now()

    prep_time = max(5.0, float(prep_time_min))
    courier_pickup_transit = max(2.0, float(courier_pickup_transit_min))

    # Traditional systems dispatch immediately at T0:
    # Courier arrives at T0 + pickup_transit, but food is ready at T0 + prep_time.
    traditional_idle_wait = max(0.0, prep_time - courier_pickup_transit)

    # justwoww Staged Dispatch delay:
    # Hold courier dispatch so courier arrives exactly when food is packed:
    staged_hold_min = max(0.0, prep_time - courier_pickup_transit)
    scheduled_dispatch_dt = order_created_at + timedelta(minutes=staged_hold_min)
    food_ready_dt = order_created_at + timedelta(minutes=prep_time)
    courier_arrival_dt = food_ready_dt

    # Time elapsed since order placement
    now = datetime.now()
    if order_created_at.tzinfo is not None:
        order_created_at = order_created_at.replace(tzinfo=None)

    elapsed_min = max(0.0, (now - order_created_at).total_seconds() / 60.0)

    # Determine live dispatch stage
    if order_status in ["delivered", "completed"]:
        stage = "delivered"
        stage_label = "Delivered to Diner"
        stage_color = "emerald"
    elif order_status in ["out_for_delivery"]:
        stage = "in_transit"
        stage_label = "In-Flight to Customer"
        stage_color = "indigo"
    elif order_status in ["ready"]:
        stage = "zero_wait_handoff"
        stage_label = "Zero-Wait Handoff Complete"
        stage_color = "teal"
    elif elapsed_min < staged_hold_min and order_status in ["pending", "accepted", "preparing"]:
        stage = "staged_hold"
        stage_label = "Kitchen Cooking (Rider Dispatch on Smart Hold)"
        stage_color = "amber"
    elif elapsed_min < prep_time:
        stage = "courier_en_route"
        stage_label = "Courier Dispatched (Synchronized Inbound)"
        stage_color = "blue"
    else:
        stage = "zero_wait_handoff"
        stage_label = "Handoff Window Active"
        stage_color = "emerald"

    remaining_hold_sec = max(0, int((scheduled_dispatch_dt - now).total_seconds()))
    remaining_prep_sec = max(0, int((food_ready_dt - now).total_seconds()))

    idle_saved = max(0.0, round(traditional_idle_wait - 0.8, 1))
    co2_saved = round(idle_saved * 14.2, 1)

    return {
        "order_created_at": order_created_at.isoformat(),
        "prep_time_min": round(prep_time, 1),
        "courier_pickup_transit_min": round(courier_pickup_transit, 1),
        "staged_hold_min": round(staged_hold_min, 1),
        "scheduled_dispatch_time": scheduled_dispatch_dt.strftime("%I:%M %p"),
        "projected_food_ready_time": food_ready_dt.strftime("%I:%M %p"),
        "projected_courier_arrival": courier_arrival_dt.strftime("%I:%M %p"),
        "current_stage": stage,
        "stage_label": stage_label,
        "stage_color": stage_color,
        "remaining_hold_sec": remaining_hold_sec,
        "remaining_prep_sec": remaining_prep_sec,
        "traditional_courier_idle_min": round(traditional_idle_wait, 1),
        "justwoww_courier_idle_min": 0.8,
        "idle_minutes_saved": idle_saved,
        "co2_emissions_saved_grams": co2_saved,
        "explanation": f"Courier dispatch timed to release at {scheduled_dispatch_dt.strftime('%I:%M %p')}, eliminating {idle_saved} mins of curbside idling."
    }

def enrich_order_with_smart_telemetry(order: dict, default_eta_min: float = 28.0) -> dict:
    """Enriches an order dictionary with live Freshness Index and Staged Dispatch metadata."""
    raw_items = order.get("order_items") or []
    items_for_freshness = []
    for oi in raw_items:
        menu_info = oi.get("menu_items") or {}
        name = menu_info.get("name") or oi.get("name") or "Dish"
        items_for_freshness.append({
            "name": name,
            "quantity": oi.get("quantity", 1)
        })

    created_raw = order.get("created_at")
    created_dt = None
    if created_raw:
        try:
            clean_str = created_raw.replace("Z", "+00:00")
            created_dt = datetime.fromisoformat(clean_str)
            if created_dt.tzinfo is not None:
                created_dt = created_dt.replace(tzinfo=None)
        except Exception:
            pass

    has_thermal = order.get("has_thermal_packaging", False)
    freshness = calculate_freshness_index(
        delivery_time_min=default_eta_min,
        items=items_for_freshness,
        has_thermal_packaging=has_thermal
    )

    staged = compute_staged_dispatch_schedule(
        order_created_at=created_dt,
        prep_time_min=18.0,
        order_status=order.get("status", "pending")
    )

    enriched = {**order}
    enriched["freshness_assessment"] = freshness
    enriched["staged_dispatch"] = staged
    return enriched
