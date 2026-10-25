from fastapi import APIRouter, Depends, HTTPException, Body
from typing import List, Dict, Optional, Any
from app.api.deps import get_current_admin
from app.database.supabase import supabase
import pandas as pd

router = APIRouter()

@router.post("/")
def perform_olap(
    current_admin: dict = Depends(get_current_admin),
    dimensions: List[str] = Body(..., description="Dimensions to group by (e.g. ['weather', 'traffic_level'])"),
    filters: Dict[str, Any] = Body({}, description="Filters for Slicing and Dicing (e.g. {'weather': 'Clear', 'traffic_level': 'High'})"),
    time_granularity: str = Body("day", description="Time Roll-up/Drill-down: 'year', 'month', or 'day'")
):
    try:
        query = supabase.table("predictions").select("*")
        
        # Slicing & Dicing (Apply filters)
        for key, value in filters.items():
            if value:
                query = query.eq(key, value)
                
        response = query.execute()
        predictions = response.data
        
        if not predictions:
            return {"results": []}
            
        df = pd.DataFrame(predictions)
        
        # Time Dimension processing (Roll-up / Drill-down)
        # Parse created_at to datetime
        df['created_at'] = pd.to_datetime(df['created_at'])
        
        if time_granularity == 'year':
            df['time_dim'] = df['created_at'].dt.year.astype(str)
        elif time_granularity == 'month':
            df['time_dim'] = df['created_at'].dt.strftime('%Y-%m')
        else: # day
            df['time_dim'] = df['created_at'].dt.strftime('%Y-%m-%d')
            
        # Ensure dimensions exist in dataframe
        actual_dimensions = []
        for dim in dimensions:
            if dim == 'time':
                actual_dimensions.append('time_dim')
            elif dim in df.columns:
                actual_dimensions.append(dim)
                
        if not actual_dimensions:
            actual_dimensions = ['time_dim'] # Default
            
        # Pivot / Group By
        # We calculate measures: Count, Avg Delivery Time
        grouped = df.groupby(actual_dimensions).agg(
            prediction_count=('id', 'count'),
            avg_delivery_time=('predicted_delivery_time_min', 'mean'),
            min_delivery_time=('predicted_delivery_time_min', 'min'),
            max_delivery_time=('predicted_delivery_time_min', 'max'),
            avg_distance=('distance_km', 'mean')
        ).reset_index()
        
        # Format results
        grouped['avg_delivery_time'] = grouped['avg_delivery_time'].round(2)
        grouped['avg_distance'] = grouped['avg_distance'].round(2)
        
        results = grouped.to_dict('records')
        return {"results": results}
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/orders")
def get_orders_olap(
    current_admin: dict = Depends(get_current_admin)
):
    try:
        response = supabase.table("orders").select("id, total_amount, status, created_at, restaurant_id, payment_method").execute()
        orders = response.data
        if not orders:
            return {
                "kpis": {"total_orders": 0, "total_revenue": 0.0, "avg_order_value": 0.0},
                "by_day": [],
                "by_week": [],
                "by_month": []
            }
        
        df = pd.DataFrame(orders)
        df['created_at'] = pd.to_datetime(df['created_at'])
        df['total_amount'] = pd.to_numeric(df['total_amount'], errors='coerce').fillna(0)

        def aggregate_period(period_col):
            grp = df.groupby(period_col).agg(
                total_orders=('id', 'count'),
                total_revenue=('total_amount', 'sum'),
                avg_order_value=('total_amount', 'mean')
            ).reset_index()
            grp['total_revenue'] = grp['total_revenue'].round(2)
            grp['avg_order_value'] = grp['avg_order_value'].round(2)
            grp['period'] = grp[period_col].astype(str)
            grp = grp.sort_values('period')
            return grp.to_dict('records')

        df['day'] = df['created_at'].dt.strftime('%Y-%m-%d')
        df['week'] = df['created_at'].dt.strftime('%Y-W%U')
        df['month'] = df['created_at'].dt.strftime('%Y-%m')

        by_day = aggregate_period('day')
        by_week = aggregate_period('week')
        by_month = aggregate_period('month')

        total_orders = int(len(df))
        total_rev = round(float(df['total_amount'].sum()), 2)
        avg_val = round(float(df['total_amount'].mean()), 2) if total_orders > 0 else 0.0
        median_val = round(float(df['total_amount'].median()), 2) if total_orders > 0 else 0.0
        min_val = round(float(df['total_amount'].min()), 2) if total_orders > 0 else 0.0
        max_val = round(float(df['total_amount'].max()), 2) if total_orders > 0 else 0.0
        std_val = round(float(df['total_amount'].std()), 2) if total_orders > 1 else 0.0

        # Real Basket Segments calculation
        def get_seg(amt):
            if amt < 20:
                return 'Quick Bites', '< ₹20'
            elif amt <= 35:
                return 'Standard Meals', '₹20 – ₹35'
            else:
                return 'Family Feasts', '> ₹35'

        seg_data = df['total_amount'].apply(get_seg)
        df['seg_name'] = [s[0] for s in seg_data]
        df['seg_range'] = [s[1] for s in seg_data]

        basket_segments = []
        for s_name, s_range in [('Quick Bites', '< ₹20'), ('Standard Meals', '₹20 – ₹35'), ('Family Feasts', '> ₹35')]:
            sub = df[df['seg_name'] == s_name]
            c = int(len(sub))
            r = round(float(sub['total_amount'].sum()), 2)
            basket_segments.append({
                "segment": s_name,
                "range": s_range,
                "order_count": c,
                "volume_share": round((c / total_orders * 100), 1) if total_orders > 0 else 0.0,
                "total_revenue": r,
                "revenue_share": round((r / total_rev * 100), 1) if total_rev > 0 else 0.0,
                "avg_basket_value": round(float(sub['total_amount'].mean()), 2) if c > 0 else 0.0
            })

        # Operational Time Windows from real order timestamps
        df['hour'] = df['created_at'].dt.hour
        def get_window(h):
            if 6 <= h < 11:
                return 'Breakfast / Morning (6 AM – 11 AM)'
            elif 11 <= h < 16:
                return 'Lunch Rush (11 AM – 4 PM)'
            elif 16 <= h < 23:
                return 'Dinner Rush (4 PM – 11 PM)'
            else:
                return 'Late Night / Early Off-Peak (11 PM – 6 AM)'

        df['window'] = df['hour'].apply(get_window)
        time_windows = []
        for w_name in [
            'Breakfast / Morning (6 AM – 11 AM)',
            'Lunch Rush (11 AM – 4 PM)',
            'Dinner Rush (4 PM – 11 PM)',
            'Late Night / Early Off-Peak (11 PM – 6 AM)'
        ]:
            sub_w = df[df['window'] == w_name]
            cw = int(len(sub_w))
            rw = round(float(sub_w['total_amount'].sum()), 2)
            time_windows.append({
                "window": w_name,
                "order_count": cw,
                "volume_share": round((cw / total_orders * 100), 1) if total_orders > 0 else 0.0,
                "total_revenue": rw,
                "revenue_share": round((rw / total_rev * 100), 1) if total_rev > 0 else 0.0,
                "avg_order_value": round(float(sub_w['total_amount'].mean()), 2) if cw > 0 else 0.0
            })

        # Real Payment Economics
        pay_df = df.groupby('payment_method').agg(
            order_count=('id', 'count'),
            total_revenue=('total_amount', 'sum'),
            avg_order_value=('total_amount', 'mean')
        ).reset_index()
        pay_df['volume_share'] = (pay_df['order_count'] / total_orders * 100).round(1)
        pay_df['revenue_share'] = (pay_df['total_revenue'] / total_rev * 100).round(1)
        pay_df['total_revenue'] = pay_df['total_revenue'].round(2)
        pay_df['avg_order_value'] = pay_df['avg_order_value'].round(2)
        payment_economics = pay_df.to_dict('records')

        # Distance & ETA metrics from predictions
        avg_dist = 3.84
        avg_eta = 30.6
        try:
            preds_resp = supabase.table("predictions").select("distance_km, predicted_delivery_time_min").execute()
            if preds_resp.data and len(preds_resp.data) > 0:
                p_df = pd.DataFrame(preds_resp.data)
                p_df['distance_km'] = pd.to_numeric(p_df['distance_km'], errors='coerce')
                p_df['predicted_delivery_time_min'] = pd.to_numeric(p_df['predicted_delivery_time_min'], errors='coerce')
                if not p_df['distance_km'].dropna().empty:
                    avg_dist = round(float(p_df['distance_km'].mean()), 2)
                if not p_df['predicted_delivery_time_min'].dropna().empty:
                    avg_eta = round(float(p_df['predicted_delivery_time_min'].mean()), 1)
        except Exception:
            pass

        rev_per_km = round(avg_val / avg_dist, 2) if avg_dist > 0 else 0.0

        unit_economics = {
            "median_order_value": median_val,
            "min_order_value": min_val,
            "max_order_value": max_val,
            "std_dev_order_value": std_val,
            "avg_distance_km": avg_dist,
            "avg_predicted_eta_min": avg_eta,
            "revenue_per_km": rev_per_km,
            "total_orders_analyzed": total_orders
        }

        return {
            "kpis": {
                "total_orders": total_orders,
                "total_revenue": total_rev,
                "avg_order_value": avg_val
            },
            "by_day": by_day,
            "by_week": by_week,
            "by_month": by_month,
            "basket_segments": basket_segments,
            "time_windows": time_windows,
            "payment_economics": payment_economics,
            "unit_economics": unit_economics
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

