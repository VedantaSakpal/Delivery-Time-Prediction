import joblib
import pandas as pd
import sys
import traceback

def inspect_model(pkl_path):
    print(f"--- Inspecting Model: {pkl_path} ---")
    try:
        model = joblib.load(pkl_path)
        print(f"Model Type: {type(model)}")
        
        # Check if it's a pipeline
        if hasattr(model, 'steps'):
            print("Pipeline Steps:")
            for name, step in model.steps:
                print(f"  - {name}: {type(step)}")
                
        # Check for feature names
        if hasattr(model, 'feature_names_in_'):
            print(f"Features in: {model.feature_names_in_}")
        
        # Access column transformer if present
        if hasattr(model, 'named_steps') and 'preprocessor' in model.named_steps:
            preprocessor = model.named_steps['preprocessor']
            print("\nPreprocessor details:")
            if hasattr(preprocessor, 'transformers_'):
                for name, transformer, columns in preprocessor.transformers_:
                    print(f"  - {name}: {type(transformer)} on columns {columns}")
        
    except Exception as e:
        print(f"Error loading model: {e}")
        traceback.print_exc()

def inspect_data(csv_path):
    print(f"\n--- Inspecting Data: {csv_path} ---")
    try:
        df = pd.read_csv(csv_path)
        print(f"Shape: {df.shape}")
        print("\nColumns and Data Types:")
        print(df.dtypes)
        print("\nFirst 3 rows:")
        print(df.head(3).to_string())
        
        print("\nMissing values:")
        print(df.isnull().sum())
    except Exception as e:
        print(f"Error loading data: {e}")

if __name__ == "__main__":
    inspect_model("food_delivery_model (1).pkl")
    inspect_data("Food_Delivery_Times (1).csv")
