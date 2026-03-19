import sys
import os
import pandas as pd
import traceback

# Add backend to path
sys.path.append(os.getcwd())

from app.ml.engine import ml_engine

def debug_predict():
    print("Loading model...")
    try:
        if not ml_engine.model:
            print("Model not loaded automatically.")
            ml_engine.load_model()
            if not ml_engine.model:
                 print("Model could NOT be loaded. Is model.pkl present?")
                 return
        
        print("Model loaded.")
        print(f"Feature Cols: {ml_engine.feature_cols}")
        
        # Simulate Input from Endpoint
        input_data = {
            "Region": ["North"],
            "Country": ["Country A"],
            "Water Source Type": ["Well"],
            "Water Treatment Method": ["None"],
            "Bacteria Count (CFU/mL)": [100],
            "Turbidity (NTU)": [5],
            "Access to Clean Water (%)": [50],
            "Contaminant Level (ppm)": [10],
        }
        
        all_numeric = ["pH Level", "Dissolved Oxygen (mg/L)", "Nitrate Level (mg/L)", "Lead Concentration (µg/L)", "Rainfall", "Temperature", "Population Density", "GDP per Capita", "Healthcare Access Index", "Urbanization Rate"]
        for col in all_numeric:
            input_data[col] = [0]
            
        print("Input prepared. calling predict...")
        result = ml_engine.predict(input_data)
        print(f"Result: {result}")
        
    except Exception as e:
        print("PREDICTION FAILED:")
        traceback.print_exc()

if __name__ == "__main__":
    debug_predict()
