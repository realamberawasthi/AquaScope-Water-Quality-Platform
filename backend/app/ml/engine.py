import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.impute import SimpleImputer
import pickle
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "model.pkl")
ENCODERS_PATH = os.path.join(BASE_DIR, "encoders.pkl")

class MLEngine:
    def __init__(self):
        self.model = None
        self.encoders = {}
        self.scaler = None
        self.feature_cols = []
        self.target_col = "Risk Score" # We need to create this target
        
        self.load_model()

    def normalize_columns(self, df):
        # Map user uploaded columns to internal schema
        corrections = {
            "Access to Clean Water (% of Population)": "Access to Clean Water (%)",
            "Diarrheal Cases per 100,000 people": "Diarrheal Cases",
            "Cholera Cases per 100,000 people": "Cholera Cases",
            "Typhoid Cases per 100,000 people": "Typhoid Cases",
            "Infant Mortality Rate (per 1,000 live births)": "Infant Mortality Rate",
            "GDP per Capita (USD)": "GDP per Capita",
            "Healthcare Access Index (0-100)": "Healthcare Access Index",
            "Urbanization Rate (%)": "Urbanization Rate",
            "Sanitation Coverage (% of Population)": "Sanitation Coverage (%)",
            "Rainfall (mm per year)": "Rainfall",
        }
        
        # Fuzzy match for Temperature and Lead due to encoding
        cols = df.columns.tolist()
        rename_map = {}
        for c in cols:
            if c in corrections:
                rename_map[c] = corrections[c]
                continue
            
            if "Temperature" in c:
                rename_map[c] = "Temperature"
            elif "Lead Concentration" in c:
                rename_map[c] = "Lead Concentration (µg/L)"
            elif "Population Density" in c:
                rename_map[c] = "Population Density"
                
        df = df.rename(columns=rename_map)
        return df


    def load_data(self, csv_paths):
        # Resolve path relative to project root or use absolute
        # Assuming project root is parent of 'backend' or we are running from 'backend'
        # Let's try to find 'data' folder
        
        base_dir = os.path.dirname(os.path.abspath(__file__)) # .../app/ml
        project_root = os.path.join(base_dir, "..", "..", "..") # .../wbda
        
        if not os.path.exists(os.path.join(project_root, "data")):
             # Fallback if running from different location
             project_root = "."

        def resolve(p):
            if os.path.isabs(p): return p
            return os.path.join(project_root, p)

        # Supports reading multiple CSVs (if we implement aggregation later)
        # For now, just read one
        try:
             path = csv_paths[0] if isinstance(csv_paths, list) else csv_paths
             full_path = resolve(path)
             # Try default utf-8 first
             try:
                 df = pd.read_csv(full_path, encoding='utf-8')
             except UnicodeDecodeError:
                 # Fallback to latin1/cp1252
                 df = pd.read_csv(full_path, encoding='latin1')
             
             df = self.normalize_columns(df)
             return df
        except Exception as e:
             print(f"Error loading data from {csv_paths}: {e}")
             # Return empty DF with expected columns to prevent crash
             return pd.DataFrame(columns=["Country", "Region", "Year", "Water Source Type", "Water Treatment Method", 
                                          "Contaminant Level (ppm)", "pH Level", "Turbidity (NTU)", "Dissolved Oxygen (mg/L)", 
                                          "Nitrate Level (mg/L)", "Lead Concentration (µg/L)", "Bacteria Count (CFU/mL)", 
                                          "Diarrheal Cases", "Cholera Cases", "Typhoid Cases", "Infant Mortality Rate", 
                                          "Access to Clean Water (%)", "Sanitation Coverage (%)", "GDP per Capita", 
                                          "Healthcare Access Index", "Urbanization Rate", "Rainfall", "Temperature", 
                                          "Population Density"])


    def preprocess(self, df, training=True):
        # 1. Handle Missing Values
        imputer = SimpleImputer(strategy='mean')
        
        # 2. Derive Risk Score (Target) if training
        # Composite Risk = a*Bacteria + b*Contaminants + c*(1/Access)
        # Normalizing to 0-1 range roughly
        if training and self.target_col not in df.columns:
            # Simple heuristic formula for Ground Truth Risk Score (0-100 normalized to 0-1)
            # Higher bacteria, higher turbidity, lower access = Higher Risk
            
            risk = (
                (df["Bacteria Count (CFU/mL)"] / 500) * 0.4 + 
                (df["Turbidity (NTU)"] / 10) * 0.2 + 
                ((100 - df["Access to Clean Water (%)"]) / 100) * 0.3 + 
                (df["Contaminant Level (ppm)"] / 100) * 0.1
            )
            # Add some noise
            risk += np.random.normal(0, 0.05, len(risk))
            df[self.target_col] = risk.clip(0, 1)

        # 3. Encode Categoricals
        cat_cols = ["Region", "Country", "Water Source Type", "Water Treatment Method"]
        for col in cat_cols:
            if training:
                le = LabelEncoder()
                df[col] = le.fit_transform(df[col].astype(str))
                self.encoders[col] = le
            else:
                if col in self.encoders:
                    # Handle unseen labels by assigning a default or mode (simplification)
                    le = self.encoders[col]
                    df[col] = df[col].map(lambda s: le.transform([s])[0] if s in le.classes_ else 0)

        # 4. Features Selection
        exclude = ["Year", "Diarrheal Cases", "Cholera Cases", "Typhoid Cases", "Infant Mortality Rate", self.target_col]
        
        if training:
            self.feature_cols = [c for c in df.columns if c not in exclude]
        else:
            # Ensure all feature cols exist, fill missing with 0
            for col in self.feature_cols:
                if col not in df.columns:
                    df[col] = 0
        
        X = df[self.feature_cols]
        y = df[self.target_col] if training else None
        
        # 5. Scaling
        if training:
            self.scaler = StandardScaler()
            X = self.scaler.fit_transform(X)
        else:
            if self.scaler:
                X = self.scaler.transform(X)
                
        return X, y

    def train(self, csv_path):
        df = self.load_data(csv_path)
        if df.empty:
            raise ValueError("Dataset is empty or could not be loaded due to format/encoding errors.")
        
        X, y = self.preprocess(df, training=True)
        
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        self.model = RandomForestRegressor(n_estimators=100, random_state=42)
        self.model.fit(X_train, y_train)
        
        score = self.model.score(X_test, y_test)
        
        self.save_model()
        
        # Feature Importance
        importances = self.model.feature_importances_
        feature_importance_dict = dict(zip(self.feature_cols, importances))
        
        return score, feature_importance_dict

    def predict(self, input_data):
        # input_data is a DataFrame or dict
        if not self.model:
            raise Exception("Model not trained")
            
        df = pd.DataFrame(input_data)
        X, _ = self.preprocess(df, training=False)
        predictions = self.model.predict(X)
        
        # Map to usage categories
        results = []
        for pred in predictions:
            risk_level = "Low"
            if pred > 0.33: risk_level = "Medium"
            if pred > 0.66: risk_level = "High"
            results.append({"risk_score": float(pred), "risk_level": risk_level})
            
        return results

    def save_model(self):
        os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
        with open(MODEL_PATH, "wb") as f:
            pickle.dump({
                "model": self.model,
                "encoders": self.encoders,
                "scaler": self.scaler,
                "feature_cols": self.feature_cols
            }, f)

    def load_model(self):
        if os.path.exists(MODEL_PATH):
            with open(MODEL_PATH, "rb") as f:
                data = pickle.load(f)
                self.model = data["model"]
                self.encoders = data["encoders"]
                self.scaler = data["scaler"]
                self.feature_cols = data.get("feature_cols", [])

ml_engine = MLEngine()
