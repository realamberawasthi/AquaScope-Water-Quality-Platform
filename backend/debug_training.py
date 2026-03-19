from app.db.session import SessionLocal
from app.db.models import TrainingLog

def check_logs():
    db = SessionLocal()
    try:
        # Get last 5 logs
        logs = db.query(TrainingLog).order_by(TrainingLog.created_at.desc()).limit(5).all()
        for log in logs:
            print(f"ID: {log.id} | Status: {log.status} | Created: {log.created_at}")
            if log.status == "Failed":
                print(f"ERROR DETAILS: {log.feature_importance}")
            else:
                print(f"Accuracy: {log.accuracy}")
            print("-" * 30)
    finally:
        db.close()

if __name__ == "__main__":
    check_logs()
