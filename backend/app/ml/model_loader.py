import joblib
import os

_model = None

def get_model():
    global _model
    if _model is None:
        model_path = os.getenv("MODEL_PATH", "model/delivery_time_model.pkl")
        # Ensure we are in the backend directory when resolving relative path
        if not os.path.isabs(model_path):
            base_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
            model_path = os.path.join(base_dir, model_path)
        if not os.path.exists(model_path):
            raise Exception(f"Model file not found at {model_path}")
        _model = joblib.load(model_path)
    return _model
