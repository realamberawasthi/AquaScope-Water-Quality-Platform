import asyncio
import certifi
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

async def init_db():
    try:
        ca = certifi.where()
        client = AsyncIOMotorClient(settings.MONGODB_URL, tlsCAFile=ca)
        # The is_master command is cheap and does not require auth.
        await client.admin.command('ismaster')
        print(f"Successfully connected to MongoDB at {settings.MONGODB_URL}")
        print(f"Database: {settings.DATABASE_NAME}")
    except Exception as e:
        print(f"Error connecting to MongoDB: {e}")

if __name__ == "__main__":
    asyncio.run(init_db())
