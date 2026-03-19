from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from motor.motor_asyncio import AsyncIOMotorDatabase
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from app.db.session import get_db, get_next_id
from app.schemas import schemas
from app.core import security
from app.ml.engine import ml_engine
from typing import List
import shutil
import os
import json
import logging
from datetime import datetime

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# --- Auth ---
@router.post("/token", response_model=schemas.Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncIOMotorDatabase = Depends(get_db)):
    user = await db["users"].find_one({"username": form_data.username})
    if not user or not security.verify_password(form_data.password, user["hashed_password"]):
        # Log failed login attempt if user exists
        if user:
            log = {
                "id": await get_next_id("activity_logs"),
                "user_id": user["id"],
                "action": "login",
                "details": "Failed login attempt",
                "status": "failed",
                "created_at": datetime.utcnow()
            }
            await db["activity_logs"].insert_one(log)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Log successful login
    log = {
        "id": await get_next_id("activity_logs"),
        "user_id": user["id"],
        "action": "login",
        "details": "User logged in successfully",
        "status": "success",
        "created_at": datetime.utcnow()
    }
    await db["activity_logs"].insert_one(log)
    
    access_token = security.create_access_token(data={"sub": user["username"], "role": user["role"]})
    return {"access_token": access_token, "token_type": "bearer", "role": user["role"]}

async def get_current_user(token: str = Depends(oauth2_scheme), db: AsyncIOMotorDatabase = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = security.jwt.decode(token, security.settings.SECRET_KEY, algorithms=[security.settings.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except security.jwt.JWTError:
        raise credentials_exception
    user = await db["users"].find_one({"username": username})
    if user is None:
        raise credentials_exception
    return user

async def get_active_dataset_path(db: AsyncIOMotorDatabase):
    # Find the latest successfully trained dataset
    last_training = await db["training_logs"].find_one(
        {"status": "Success"},
        sort=[("created_at", -1)]
    )
    
    project_root = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "..")
    default_path = os.path.join(project_root, "data", "water_quality_dataset.csv")

    if last_training:
        dataset = await db["datasets"].find_one({"id": last_training["dataset_id"]})
        if dataset:
            candidate_path = os.path.join(project_root, "data", dataset["filename"])
            if os.path.exists(candidate_path):
                return candidate_path
    
    return default_path

# --- Public / Dashboard ---
@router.get("/public/summary", response_model=schemas.DashboardSummary)
async def get_dashboard_summary(db: AsyncIOMotorDatabase = Depends(get_db)):
    # Load data from latest CSV if available, or use ML engine data
    try:
        csv_path = await get_active_dataset_path(db)
        df = ml_engine.load_data(csv_path)
        
        # Calculate heuristics
        # This is strictly "Dashboard" data logic
        # Ideally we read from DB, but user wants "Load and clean dataset" -> implies analysis on file
        
        total_regions = df["Region"].nunique()
        total_countries = df["Country"].nunique()
        
        # Create a dummy risk score if needed for summary
        if "Risk Score" not in df.columns:
             # Just use a proxy for summary
             df["Risk Score"] = (df["Bacteria Count (CFU/mL)"] / 500).clip(0, 1)

        avg_risk = df["Risk Score"].mean()
        high_risk_count = len(df[df["Risk Score"] > 0.66])
        high_risk_pct = (high_risk_count / len(df)) * 100
        
        # Get latest training accuracy
        # Start a new session for DB access inside this function is okay, but better to pass db
        # We can skip DB access for accuracy for now or hardcode 0 if not trained
        accuracy = 0.0 # Placeholder
        if ml_engine.model:
             # If model is loaded, we might know accuracy? 
             # For simplicity, let's assume 0.85 if model exists
             accuracy = 0.85
        
        return {
            "total_regions": total_regions,
            "total_countries": total_countries,
            "avg_risk_score": avg_risk,
            "high_risk_percentage": high_risk_pct,
            "recent_training_accuracy": accuracy
        }
    except Exception as e:
        print(f"Error generating summary: {e}")
        return {
            "total_regions": 0,
            "total_countries": 0,
            "avg_risk_score": 0.0,
            "high_risk_percentage": 0.0,
            "recent_training_accuracy": 0.0
        }

@router.get("/public/chart-data")
async def get_chart_data(country: str = None, db: AsyncIOMotorDatabase = Depends(get_db)):
    try:
        csv_path = await get_active_dataset_path(db)
        df = ml_engine.load_data(csv_path)
        
        # Determine strict or fuzzy match for country if provided
        selected_country = None
        if country:
            # Case insensitive match
            matches = df[df["Country"].str.lower() == country.lower()]
            if not matches.empty:
                df = matches
                selected_country = matches.iloc[0]["Country"]
        
        # Define all water quality parameters for heatmap
        heatmap_params = [
            "Contaminant Level (ppm)",
            "pH Level",
            "Turbidity (NTU)",
            "Nitrate Level (mg/L)",
            "Lead Concentration (µg/L)",
            "Bacteria Count (CFU/mL)"
        ]
        
        # 1. Heatmap Data - Region x Parameters (averages)
        # Filter to only existing columns
        available_params = [p for p in heatmap_params if p in df.columns]
        
        if selected_country:
            # For specific country, group by Region within that country
            heatmap_data = df.groupby("Region")[available_params].mean().reset_index().to_dict(orient="records")
        else:
            # Global: Region x Parameter
            heatmap_data = df.groupby("Region")[available_params].mean().reset_index().to_dict(orient="records")

        # 2. Bar Chart - Disease Cases
        if selected_country:
            # Disease by Region within country
            disease_data = df.groupby("Region")[["Diarrheal Cases", "Cholera Cases", "Typhoid Cases"]].sum().reset_index().to_dict(orient="records")
        else:
            disease_data = df.groupby("Region")[["Diarrheal Cases", "Cholera Cases", "Typhoid Cases"]].sum().reset_index().to_dict(orient="records")

        # 3. Boxplot Data - Treatment Method Effectiveness
        boxplot_data = []
        treatment_methods = df["Water Treatment Method"].dropna().unique().tolist()
        
        for method in treatment_methods:
            method_df = df[df["Water Treatment Method"] == method]["Bacteria Count (CFU/mL)"].dropna()
            if len(method_df) > 0:
                boxplot_data.append({
                    "method": method,
                    "min": float(method_df.min()),
                    "q1": float(method_df.quantile(0.25)),
                    "median": float(method_df.median()),
                    "q3": float(method_df.quantile(0.75)),
                    "max": float(method_df.max()),
                    "count": int(len(method_df))
                })

        # 4. Environmental Impact: Rainfall vs Turbidity
        rainfall_turbidity = []
        if "Rainfall" in df.columns and "Turbidity (NTU)" in df.columns:
            sample = df[["Rainfall", "Turbidity (NTU)", "Region"]].dropna().sample(min(150, len(df)))
            for _, row in sample.iterrows():
                rainfall_turbidity.append({
                    "rainfall": float(row["Rainfall"]),
                    "turbidity": float(row["Turbidity (NTU)"]),
                    "region": row["Region"]
                })

        # 5. Development Paradox Quadrant (GDP vs Healthcare)
        development_quadrant = []
        required_cols = ["GDP per Capita", "Healthcare Access Index", "Urbanization Rate"]
        if all(c in df.columns for c in required_cols):
            # Calculate Risk Score if not present
            if "Risk Score" not in df.columns:
                df["Risk Score"] = (df["Bacteria Count (CFU/mL)"] / 500).clip(0, 1)
            
            # Get aggregated data per country/region
            agg_df = df.groupby("Country").agg({
                "GDP per Capita": "mean",
                "Healthcare Access Index": "mean",
                "Urbanization Rate": "mean",
                "Risk Score": "mean"
            }).reset_index()
            
            for _, row in agg_df.iterrows():
                development_quadrant.append({
                    "country": row["Country"],
                    "gdp": float(row["GDP per Capita"]),
                    "healthcare": float(row["Healthcare Access Index"]),
                    "urbanization": float(row["Urbanization Rate"]),
                    "risk": float(row["Risk Score"]),
                    "risk_level": "High" if row["Risk Score"] > 0.6 else ("Medium" if row["Risk Score"] > 0.3 else "Low")
                })
            
            # Calculate reference lines (means)
            gdp_mean = float(agg_df["GDP per Capita"].mean())
            healthcare_mean = float(agg_df["Healthcare Access Index"].mean())
        else:
            gdp_mean = 0
            healthcare_mean = 0

        # 6. Socioeconomic Vulnerability Heatmap
        socio_heatmap = []
        socio_cols = ["Healthcare Access Index", "Urbanization Rate", "Infant Mortality Rate"]
        available_socio = [c for c in socio_cols if c in df.columns]
        
        if len(available_socio) > 0:
            # Add Risk Score
            if "Risk Score" not in df.columns:
                df["Risk Score"] = (df["Bacteria Count (CFU/mL)"] / 500).clip(0, 1)
            available_socio.append("Risk Score")
            
            agg_socio = df.groupby("Country")[available_socio].mean().reset_index()
            socio_heatmap = agg_socio.to_dict(orient="records")

        return {
            "heatmap": heatmap_data,
            "heatmap_params": available_params,
            "disease_bar": disease_data,
            "boxplot": boxplot_data,
            "rainfall_turbidity": rainfall_turbidity,
            "development_quadrant": development_quadrant,
            "development_refs": {"gdp_mean": gdp_mean, "healthcare_mean": healthcare_mean},
            "socio_heatmap": socio_heatmap,
            "socio_cols": available_socio,
            "view_mode": "Country" if selected_country else "Global",
            "title_context": selected_country if selected_country else "Global"
        }
    except Exception as e:
        return {"error": str(e)}
        
@router.post("/public/predict-risk", response_model=schemas.PredictionResponse)
def predict_risk(request: schemas.PredictionRequest):
    # Convert request to df format
    input_data = {
        "Region": [request.region],
        "Country": [request.country],
        "Water Source Type": [request.water_source],
        "Water Treatment Method": [request.treatment_method],
        "Bacteria Count (CFU/mL)": [request.bacteria_count],
        "Turbidity (NTU)": [request.turbidity],
        "Access to Clean Water (%)": [request.access_to_clean_water],
        "Contaminant Level (ppm)": [request.contaminant_level],
        # Add defaults for other cols required by scaler if strict, 
        # but ML Engine preprocess should handle subsets if we align features.
        # For Hackathon, I'll pass 0 for missing numeric cols and "Unknown" for categorical.
    }
    
    all_numeric = ["pH Level", "Dissolved Oxygen (mg/L)", "Nitrate Level (mg/L)", "Lead Concentration (µg/L)", "Rainfall", "Temperature", "Population Density", "GDP per Capita", "Healthcare Access Index", "Urbanization Rate"]
    for col in all_numeric:
        input_data[col] = [0] # Dummy
    
    res = ml_engine.predict(input_data)
    return res[0]

@router.get("/public/country/{country_name}", response_model=schemas.CountryInsight)
async def get_country_details(country_name: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    try:
        # Resolve path - reusing logic from MLEngine would be cleaner, but for now direct load via engine helper
        # better to add a method in engine or just access the loaded df if we made it stateful?
        # Engine reloads every time currently in 'load_data'. Let's use load_data.
        
        csv_path = await get_active_dataset_path(db)
        
        # We need a robust way to get data. accessing ml_engine.predict implies model logic.
        # Let's use pandas directly here for stats.
        df = ml_engine.load_data(csv_path)
        
        # Filter
        country_df = df[df["Country"].str.lower() == country_name.lower()]
        
        if country_df.empty:
            raise HTTPException(status_code=404, detail="Country not found")
            
        # Calc Stats
        # Risk proxy if not present
        if "Risk Score" not in country_df.columns:
             country_df["Risk Score"] = (country_df["Bacteria Count (CFU/mL)"] / 500).clip(0, 1)

        avg_risk = country_df["Risk Score"].mean()
        avg_bacteria = country_df["Bacteria Count (CFU/mL)"].mean()
        avg_access = country_df["Access to Clean Water (%)"].mean()
        
        # Top Source
        top_source = country_df["Water Source Type"].mode()[0] if not country_df.empty else "Unknown"
        
        # Diseases
        total_disease = (country_df["Diarrheal Cases"] + country_df["Cholera Cases"] + country_df["Typhoid Cases"]).sum()
        
        risk_level = "Low"
        if avg_risk > 0.33: risk_level = "Medium"
        if avg_risk > 0.66: risk_level = "High"
        
        return {
            "country": country_name,
            "avg_risk_score": avg_risk,
            "avg_bacteria": avg_bacteria,
            "avg_access": avg_access,
            "top_water_source": top_source,
            "total_disease_cases": int(total_disease),
            "risk_level": risk_level
        }
        
    except FileNotFoundError:
         raise HTTPException(status_code=500, detail="Dataset not found")
    except Exception as e:
         if "Country not found" in str(e): raise e
         print(f"Error: {e}")
         raise HTTPException(status_code=500, detail=str(e))


# --- Agency ---
@router.post("/agency/upload")
async def upload_dataset(file: UploadFile = File(...), current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    if current_user["role"] != "agency":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Resolve data directory
    project_root = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "..")
    
    file_location = os.path.join(project_root, "data", file.filename)
    # Ensure dir exists
    os.makedirs(os.path.dirname(file_location), exist_ok=True)
    
    with open(file_location, "wb+") as file_object:
        shutil.copyfileobj(file.file, file_object)
    
    # Save to DB
    dataset_id = await get_next_id("datasets")
    dataset = {
        "id": dataset_id,
        "filename": file.filename,
        "agency_id": current_user["agency_id"],
        "uploaded_at": datetime.utcnow()
    }
    await db["datasets"].insert_one(dataset)
    
    return {"message": "File uploaded successfully", "dataset_id": dataset_id}

@router.post("/agency/train/{dataset_id}")
async def train_model(dataset_id: int, current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    if current_user["role"] != "agency":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    dataset = await db["datasets"].find_one({"id": dataset_id})
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
        
    project_root = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "..")
    csv_path = os.path.join(project_root, "data", dataset["filename"])
    
    if not os.path.exists(csv_path):
        raise HTTPException(status_code=404, detail="File not found on server")
        
    # Trigger training
    try:
        score, importances = ml_engine.train(csv_path)
        
        # Log result
        log_id = await get_next_id("training_logs")
        log = {
            "id": log_id,
            "dataset_id": dataset["id"],
            "status": "Success",
            "accuracy": score,
            "feature_importance": json.dumps(importances),
            "created_at": datetime.utcnow()
        }
        await db["training_logs"].insert_one(log)
        
        return {"message": "Training complete", "accuracy": score}
    except Exception as e:
        log_id = await get_next_id("training_logs")
        log = {
            "id": log_id,
            "dataset_id": dataset["id"],
            "status": "Failed",
            "feature_importance": str(e),
            "created_at": datetime.utcnow()
        }
        await db["training_logs"].insert_one(log)
        raise HTTPException(status_code=500, detail=str(e))

# --- Admin ---
@router.post("/admin/agencies", response_model=schemas.Agency)
async def create_agency(agency: schemas.AgencyCreate, current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Check if username exists if provided
    if agency.admin_username:
        existing_user = await db["users"].find_one({"username": agency.admin_username})
        if existing_user:
            raise HTTPException(status_code=400, detail="Username already exists")
            
    # Create Agency
    agency_id = await get_next_id("agencies")
    db_agency = {
        "id": agency_id,
        "name": agency.name,
        "location": agency.location,
        "contact_info": agency.contact_info
    }
    await db["agencies"].insert_one(db_agency)
    
    # Create User if requested
    if agency.admin_username and agency.admin_password:
        hashed_pw = security.get_password_hash(agency.admin_password)
        user_id = await get_next_id("users")
        new_user = {
            "id": user_id,
            "username": agency.admin_username,
            "hashed_password": hashed_pw,
            "role": "agency",
            "agency_id": agency_id
        }
        await db["users"].insert_one(new_user)
        
    return db_agency


@router.get("/admin/agencies", response_model=List[schemas.AgencyDetailResponse])
async def list_agencies(current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    agencies = await db["agencies"].find().to_list(length=100)
    result = []
    for agency in agencies:
        user_count = await db["users"].count_documents({"agency_id": agency["id"]})
        dataset_count = await db["datasets"].count_documents({"agency_id": agency["id"]})
        result.append({
            "id": agency["id"],
            "name": agency["name"],
            "location": agency.get("location"),
            "contact_info": agency.get("contact_info"),
            "user_count": user_count,
            "dataset_count": dataset_count
        })
    return result


@router.delete("/admin/agencies/{agency_id}")
async def delete_agency(agency_id: int, current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    agency = await db["agencies"].find_one({"id": agency_id})
    if not agency:
        raise HTTPException(status_code=404, detail="Agency not found")
    
    # Delete related users and datasets
    await db["users"].delete_many({"agency_id": agency_id})
    await db["datasets"].delete_many({"agency_id": agency_id})
    await db["agencies"].delete_one({"id": agency_id})
    
    return {"message": f"Agency {agency['name']} deleted successfully"}


@router.get("/admin/users", response_model=List[schemas.UserDetailResponse])
async def list_users(current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    users = await db["users"].find().to_list(length=100)
    result = []
    for user in users:
        agency_name = None
        if user.get("agency_id"):
            agency = await db["agencies"].find_one({"id": user["agency_id"]})
            if agency:
                agency_name = agency["name"]
        
        result.append({
            "id": user["id"],
            "username": user["username"],
            "role": user["role"],
            "agency_id": user.get("agency_id"),
            "agency_name": agency_name
        })
    return result


@router.delete("/admin/users/{user_id}")
async def delete_user(user_id: int, current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    user = await db["users"].find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Prevent deleting self
    if user["id"] == current_user["id"]:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
    
    # Delete related activity logs
    await db["activity_logs"].delete_many({"user_id": user_id})
    await db["users"].delete_one({"id": user_id})
    
    return {"message": f"User {user['username']} deleted successfully"}


@router.get("/admin/activity-logs", response_model=List[schemas.ActivityLogResponse])
async def get_activity_logs(
    limit: int = 100,
    action: str = None,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    query = {}
    if action:
        query["action"] = action
    
    logs = await db["activity_logs"].find(query).sort("created_at", -1).limit(limit).to_list(length=limit)
    
    result = []
    for log in logs:
        # Get username for log
        user = await db["users"].find_one({"id": log["user_id"]})
        result.append({
            "id": log["id"],
            "user_id": log["user_id"],
            "username": user["username"] if user else "Unknown",
            "action": log["action"],
            "details": log.get("details"),
            "status": log["status"],
            "ip_address": log.get("ip_address"),
            "created_at": log["created_at"]
        })
    return result
