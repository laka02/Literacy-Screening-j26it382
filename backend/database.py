"""
CAIRE — MongoDB Database Connection
Database: "Personalized English"
Collections: teachers, parents
"""
import os
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI", "").strip()
# Database name as specified by the team
DATABASE_NAME = "PersonalizedEnglish"

client: AsyncIOMotorClient = None
db = None


async def connect_db():
    """Connect to MongoDB and create unique indexes."""
    global client, db
    if not MONGODB_URI:
        raise RuntimeError(
            "MONGODB_URI is not configured. Set it in backend/.env before starting the API."
        )

    client = AsyncIOMotorClient(MONGODB_URI, serverSelectionTimeoutMS=5000)
    db = client[DATABASE_NAME]
    await client.admin.command("ping")

    # Create unique indexes to prevent duplicate email registrations
    await db["teachers"].create_index("email", unique=True)
    await db["parents"].create_index("parent_email", unique=True)

    print(f"[OK] Connected to MongoDB | Database: '{DATABASE_NAME}'")
    print("[OK] Collections ready: teachers, parents")


async def close_db():
    """Disconnect from MongoDB."""
    global client
    if client:
        client.close()
        print("[--] Disconnected from MongoDB")


def get_db():
    """Return the active database instance."""
    return db