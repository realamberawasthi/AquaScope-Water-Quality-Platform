from datetime import datetime
from typing import Optional, List

# MongoDB is schema-less, but we can define the document structures for reference.
# These will be handled via Pydantic schemas for validation in the API.

"""
Collections:
- agencies: { _id, name, location, contact_info }
- users: { _id, username, hashed_password, role, agency_id }
- datasets: { _id, filename, uploaded_at, agency_id }
- training_logs: { _id, dataset_id, status, accuracy, feature_importance, created_at }
- activity_logs: { _id, user_id, action, details, status, ip_address, created_at }
"""

