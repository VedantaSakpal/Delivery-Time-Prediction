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
        "predicted_delivery_time_min": round(predicted_time, 2),
        "prediction_range": {
            "lower": round(lower_bound, 1),
            "upper": round(upper_bound, 1)
        },
        "reliability": reliability,
        "prediction_category": category,
        "explanation": explanation
    }
