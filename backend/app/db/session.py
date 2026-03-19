import certifi
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

ca = certifi.where()
client = AsyncIOMotorClient(settings.MONGODB_URL, tlsCAFile=ca)
db_client = client[settings.DATABASE_NAME]

async def get_db():
    yield db_client

async def get_next_id(collection_name: str) -> int:
    """Gets the next sequential ID for a collection."""
    result = await db_client["counters"].find_one_and_update(
        {"_id": collection_name},
        {"$inc": {"seq": 1}},
        upsert=True,
        return_document=True
    )
    return result["seq"]
