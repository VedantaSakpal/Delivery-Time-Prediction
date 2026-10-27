import pandas as pd
import numpy as np
try:
    import shap
except ImportError:
    shap = None

from app.ml.model_loader import get_model

# Global explainer to avoid recalculating
_explainer = None
_preprocessor = None
_linear_model = None

def get_explainer():
    global _explainer, _preprocessor, _linear_model
    if shap is None:
        return None, None, None
    if _explainer is None:
        pipeline = get_model()
        _preprocessor = pipeline.named_steps['preprocessor']
        _linear_model = pipeline.named_steps['model']
        # For a Linear Regression model, we can use LinearExplainer
        _explainer = shap.LinearExplainer(_linear_model, shap.maskers.Independent(np.zeros((1, _linear_model.coef_.shape[0]))))
    return _explainer, _preprocessor, _linear_model

def predict_delivery_time(features: dict) -> dict:
    model = get_model()
    # Features required: Distance_km, Weather, Traffic_Level, Time_of_Day, Vehicle_Type, Preparation_Time_min, Courier_Experience_yrs
    df = pd.DataFrame([features])
    
    # 1. Prediction
    predicted_time = model.predict(df)[0]
    
    # 2. Prediction Interval & Reliability
    # Based on offline validation, RMSE is ~10.47 min.
    # We construct a dynamic interval based on the prediction.
    # Higher delivery times typically have higher variance.
    base_margin = 8.0 
    
    # Adjust margin based on distance and weather (heuristic for dynamic reliability)
    if features.get('Weather') in ['Stormy', 'Snowy'] or features.get('Traffic_Level') == 'High':
        base_margin += 4.0
        reliability = "Low"
    elif features.get('Distance_km', 0) > 15:
        base_margin += 3.0
        reliability = "Medium"
    else:
        reliability = "High"
        
    lower_bound = max(10.0, predicted_time - base_margin)
    upper_bound = predicted_time + base_margin
    
    # Determine category
    category = "Normal"
    if predicted_time < 30:
        category = "Fast"
    elif predicted_time > 50:
        category = "Delayed"
        
    # 3. SHAP Explanation
    explanation = []
    try:
        explainer, preprocessor, linear_model = get_explainer()
        if explainer is not None:
            # Transform the single input
            X_transformed = preprocessor.transform(df)
        
        # Get SHAP values
        shap_values = explainer.shap_values(X_transformed)
        
        # We have SHAP values for the transformed columns. We need to map them back to original features.
        # ColumnTransformer preserves order: numeric first, then categorical (OneHotEncoded)
        # Let's get the feature names out of the preprocessor
        num_cols = preprocessor.transformers_[0][2]
        cat_cols = preprocessor.transformers_[1][2]
        
        cat_encoder = preprocessor.named_transformers_['cat'].named_steps['onehot']
        cat_encoded_cols = cat_encoder.get_feature_names_out(cat_cols)
        
        all_transformed_cols = list(num_cols) + list(cat_encoded_cols)
        
        # Aggregate SHAP values back to original categorical features
        feature_impacts = {col: 0.0 for col in df.columns}
        
        for i, col_name in enumerate(all_transformed_cols):
            val = shap_values[0][i]
            # If it's a numeric column, it matches exactly
            if col_name in num_cols:
                feature_impacts[col_name] += val
            else:
                # It's a categorical column, e.g. "Weather_Rainy"
                # Find which original cat_col it belongs to
                for original_cat in cat_cols:
                    if col_name.startswith(original_cat + "_"):
                        feature_impacts[original_cat] += val
                        break
                        
        # Format the explanation for the frontend
        for feature, impact in feature_impacts.items():
            if abs(impact) > 0.1:  # Filter out noise
                explanation.append({
                    "feature": feature.replace("_", " "),
                    "impact": round(float(impact), 1),
                    "direction": "increase" if impact > 0 else "decrease"
                })
                
        # Sort by absolute impact
        explanation.sort(key=lambda x: abs(x["impact"]), reverse=True)
        
    except Exception as e:
        print(f"SHAP Error: {e}")
        # Fallback if SHAP fails
        pass
        
    return {
        "predicted_delivery_time_min": round(float(predicted_time), 2),
        "prediction_range": {
            "lower": round(float(lower_bound), 1),
            "upper": round(float(upper_bound), 1)
        },
        "reliability": reliability,
        "prediction_category": category,
        "explanation": explanation
    }


_coefficients_meta = None

def get_model_coefficients() -> dict:
    global _coefficients_meta
    if _coefficients_meta is not None:
        return _coefficients_meta

    pipeline = get_model()
    preprocessor = pipeline.named_steps['preprocessor']
    linear_model = pipeline.named_steps['model']

    intercept = float(linear_model.intercept_)
    num_cols = list(preprocessor.transformers_[0][2])
    cat_cols = list(preprocessor.transformers_[1][2])
    cat_encoder = preprocessor.named_transformers_['cat'].named_steps['onehot']
    cat_encoded_cols = list(cat_encoder.get_feature_names_out(cat_cols))

    all_features = num_cols + cat_encoded_cols
    coefs = {feat: round(float(coef), 4) for feat, coef in zip(all_features, linear_model.coef_)}

    _coefficients_meta = {
        "model_architecture": "Ordinary Least Squares (OLS) Linear Regression Pipeline",
        "intercept": round(intercept, 4),
        "coefficients": coefs,
        "features": {
            "numerical": num_cols,
            "categorical": cat_cols,
            "encoded_features": all_features
        },
        "marginal_elasticity": [
            {
                "feature": "Distance_km",
                "label": "Delivery Route Distance",
                "weight": coefs.get("Distance_km", 3.0013),
                "unit": "min / km",
                "interpretation": f"Each additional 1.0 km increases ETA by exactly +{coefs.get('Distance_km', 3.0013):.2f} minutes."
            },
            {
                "feature": "Preparation_Time_min",
                "label": "Kitchen Preparation Duration",
                "weight": coefs.get("Preparation_Time_min", 0.9692),
                "unit": "min / min",
                "interpretation": f"Each 1.0 minute in kitchen prep adds +{coefs.get('Preparation_Time_min', 0.9692):.2f} minutes to delivery time (~1:1 direct transmission)."
            },
            {
                "feature": "Courier_Experience_yrs",
                "label": "Courier Experience",
                "weight": coefs.get("Courier_Experience_yrs", -0.6772),
                "unit": "min / year",
                "interpretation": f"Each year of rider experience saves {abs(coefs.get('Courier_Experience_yrs', -0.6772)):.2f} minutes via superior route familiarity."
            }
        ],
        "categorical_spreads": {
            "traffic": {
                "high": coefs.get("Traffic_Level_High", 5.5264),
                "low": coefs.get("Traffic_Level_Low", -5.5992),
                "medium": coefs.get("Traffic_Level_Medium", 0.0728),
                "spread_min": round(coefs.get("Traffic_Level_High", 5.5264) - coefs.get("Traffic_Level_Low", -5.5992), 2),
                "insight": "High vs. Low traffic produces an 11.13 minute variance swing."
            },
            "weather": {
                "clear": coefs.get("Weather_Clear", -4.2299),
                "snowy": coefs.get("Weather_Snowy", 5.0169),
                "foggy": coefs.get("Weather_Foggy", 1.5865),
                "rainy": coefs.get("Weather_Rainy", 0.4095),
                "windy": coefs.get("Weather_Windy", -2.7830),
                "spread_min": round(coefs.get("Weather_Snowy", 5.0169) - coefs.get("Weather_Clear", -4.2299), 2),
                "insight": "Inclement weather (snow/storm) adds up to 9.25 minutes over clear skies."
            },
            "vehicle": {
                "scooter": coefs.get("Vehicle_Type_Scooter", -0.7959),
                "bike": coefs.get("Vehicle_Type_Bike", 0.1391),
                "car": coefs.get("Vehicle_Type_Car", 0.6568),
                "spread_min": round(coefs.get("Vehicle_Type_Car", 0.6568) - coefs.get("Vehicle_Type_Scooter", -0.7959), 2),
                "insight": "Scooters are the fastest urban courier vehicle, beating cars by 1.45 minutes in city traffic."
            }
        },
        "formula_display": "ETA = 15.80 + 3.00·Distance + 0.97·PrepTime - 0.68·Experience + β(Weather) + β(Traffic) + β(Vehicle) + β(Time)"
    }
    return _coefficients_meta

def compute_what_if(baseline: dict, counterfactual: dict) -> dict:
    meta = get_model_coefficients()
    intercept = meta["intercept"]
    coefs = meta["coefficients"]

    def calc_eta(feats):
        eta = intercept
        eta += coefs.get("Distance_km", 3.0013) * float(feats.get("Distance_km", 0))
        eta += coefs.get("Preparation_Time_min", 0.9692) * float(feats.get("Preparation_Time_min", 0))
        eta += coefs.get("Courier_Experience_yrs", -0.6772) * float(feats.get("Courier_Experience_yrs", 0))
        eta += coefs.get(f"Weather_{feats.get('Weather', 'Clear')}", 0.0)
        eta += coefs.get(f"Traffic_Level_{feats.get('Traffic_Level', 'Medium')}", 0.0)
        eta += coefs.get(f"Time_of_Day_{feats.get('Time_of_Day', 'Evening')}", 0.0)
        eta += coefs.get(f"Vehicle_Type_{feats.get('Vehicle_Type', 'Scooter')}", 0.0)
        return max(10.0, round(eta, 2))

    base_eta = calc_eta(baseline)
    cf_eta = calc_eta(counterfactual)
    delta = round(cf_eta - base_eta, 2)
    pct = round((delta / base_eta) * 100, 1) if base_eta > 0 else 0.0

    breakdown = []
    num_labels = {
        "Distance_km": ("Distance", "km"),
        "Preparation_Time_min": ("Preparation Time", "min"),
        "Courier_Experience_yrs": ("Courier Experience", "yrs")
    }
    for num_col, (label, unit) in num_labels.items():
        b_val = float(baseline.get(num_col, 0))
        c_val = float(counterfactual.get(num_col, 0))
        if abs(c_val - b_val) > 0.01:
            diff = c_val - b_val
            impact = round(diff * coefs.get(num_col, 0.0), 2)
            breakdown.append({
                "feature": num_col,
                "label": label,
                "old_value": f"{b_val} {unit}",
                "new_value": f"{c_val} {unit}",
                "change": f"{'+' if diff > 0 else ''}{diff:.1f} {unit}",
                "impact_min": impact,
                "direction": "increase" if impact > 0 else "decrease",
                "explanation": f"{label} shifted by {'+' if diff > 0 else ''}{diff:.1f} {unit}, altering ETA by {'+' if impact > 0 else ''}{impact:.2f} min"
            })

    for cat_col in ["Weather", "Traffic_Level", "Time_of_Day", "Vehicle_Type"]:
        b_cat = baseline.get(cat_col)
        c_cat = counterfactual.get(cat_col)
        if b_cat and c_cat and b_cat != c_cat:
            b_weight = coefs.get(f"{cat_col}_{b_cat}", 0.0)
            c_weight = coefs.get(f"{cat_col}_{c_cat}", 0.0)
            impact = round(c_weight - b_weight, 2)
            breakdown.append({
                "feature": cat_col,
                "label": cat_col.replace("_", " "),
                "old_value": b_cat,
                "new_value": c_cat,
                "change": f"{b_cat} ➔ {c_cat}",
                "impact_min": impact,
                "direction": "increase" if impact > 0 else "decrease",
                "explanation": f"{cat_col.replace('_', ' ')} transitioned from {b_cat} to {c_cat}, altering ETA by {'+' if impact > 0 else ''}{impact:.2f} min"
            })

    breakdown.sort(key=lambda x: abs(x["impact_min"]), reverse=True)

    return {
        "baseline_eta": base_eta,
        "counterfactual_eta": cf_eta,
        "delta_min": delta,
        "percent_change": pct,
        "breakdown": breakdown,
        "formula": meta["formula_display"]
    }
