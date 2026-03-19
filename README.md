# AquaScope 💧 - Water Quality & Disease Analysis Platform

AquaScope is a comprehensive data analytics and machine learning platform designed to monitor water quality parameters and predict waterborne disease risks. It bridges the gap between raw environmental data and actionable health insights, serving government agencies, administrators, and the general public.

## 🚀 Features

### 🌍 Public Dashboard
-   **Interactive Maps & Charts**: Visualize water quality metrics (pH, Turbidity, Bacteria) across different regions.
-   **Disease Correlation**: Analyze relationships between water contamination and disease outbreaks (Cholera, Typhoid, etc.).
-   **Socioeconomic Insights**: Understand how GDP, healthcare access, and urbanization affect water safety.
-   **Risk Predictor**: Citizens can input local water parameters to get an instant health risk assessment using our ML model.

### 🏢 Agency Portal
-   **Data Management**: Agencies can upload new water quality datasets (CSV) to update the system.
-   **ML Training**: Trigger re-training of the Machine Learning model (Random Forest) to improve prediction accuracy with new data.

### 🛡️ Admin Portal
-   **Agency Management**: Create and manage agency profiles and credentials.
-   **User Management**: Control user access and roles.
-   **Activity Logs**: Monitor system activities like logins, uploads, and model training events.

## 🛠️ Tech Stack

-   **Frontend**: React (Vite), Tailwind CSS, Lucide React (Icons), Recharts/Chart.js.
-   **Backend**: Python, FastAPI, SQLAlchemy, Pydantic.
-   **Machine Learning**: Scikit-Learn, Pandas, NumPy (Random Forest Regressor).
-   **Database**: SQLite (default) / SQLAlchemy ORM.

## ⚙️ Installation & Setup

### Prerequisites
-   Node.js (v16+)
-   Python (v3.9+)

### 1. Clone & Setup Backend
```bash
cd backend
python -m venv venv
# Windows
.\venv\Scripts\activate
# Mac/Linux
source venv/bin/activate

pip install -r requirements.txt
```

### 2. Initialize Database
Run the seed script to create tables and default users:
```bash
python seed_data.py
```

### 3. Setup Frontend
```bash
cd frontend
npm install
```

## ▶️ Running the Application

### One-Click Start (Windows)
Simply run the helper script in the root directory:
```bash
.\run_project.bat
```

### Manual Start
**Backend**:
```bash
cd backend
uvicorn app.main:app --reload
```
*Server runs at http://localhost:8000*

**Frontend**:
```bash
cd frontend
npm run dev
```
*Client runs at http://localhost:5173*

## 📂 Project Structure

```
wbda/
├── backend/            # FastAPI Application
│   ├── app/            # App source code (API, Models, ML)
│   ├── data/           # Dataset storage
│   └── seed_data.py    # DB Initialization script
├── frontend/           # React Application
│   ├── src/            # Components, Pages, Services
│   └── public/         # Static assets
└── run_project.bat     # Startup script
```
