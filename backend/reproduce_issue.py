import pandas as pd
import numpy as np
import os
import sys

# Add app to path
sys.path.append(os.getcwd())

from app.ml.engine import ml_engine

def debug_dataset():
    csv_path = r"C:\Users\shash\Desktop\wbda\data\2000.csv"
    print(f"Loading {csv_path}...")
    
    try:
        df = ml_engine.load_data(csv_path)
        print(f"DF Shape: {df.shape}")
        print(f"Columns: {df.columns.tolist()}")
        print("-" * 20)
        
        # Run preprocessing step by step
        print("Running Preprocess...")
        X, y = ml_engine.preprocess(df, training=True)
        print(f"X Shape: {X.shape}")
        if y is not None:
            print(f"y Shape: {y.shape}")
            
    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    debug_dataset()
