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

        return {
            "kpis": {
                "total_orders": total_orders,
                "total_revenue": total_rev,
                "avg_order_value": avg_val
            },
            "by_day": by_day,
            "by_week": by_week,
            "by_month": by_month
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

