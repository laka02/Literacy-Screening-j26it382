"""
CAIRE — MongoDB Database Connection
Database: "Personalized English"
Collections: teachers, parents
"""
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI")
# Database name as specified by the team
DATABASE_NAME = "Personalized English"

client: AsyncIOMotorClient = None
db = None


async def connect_db():
    """Connect to MongoDB and create unique indexes."""
    global client, db
    client = AsyncIOMotorClient(MONGODB_URI)
    db = client[DATABASE_NAME]

    # Create unique indexes to prevent duplicate email registrations
    await db["teachers"].create_index("email", unique=True)
    await db["parents"].create_index("parent_email", unique=True)

    print(f"✅ Connected to MongoDB | Database: '{DATABASE_NAME}'")
    print("📋 Collections ready: teachers, parents")


async def close_db():
    """Disconnect from MongoDB."""
    global client
    if client:
        client.close()
        print("🔌 Disconnected from MongoDB")


def get_db():
    """Return the active database instance."""
    return db
