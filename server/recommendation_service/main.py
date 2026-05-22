import os
import logging
from typing import Optional
from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import asyncpg
from dotenv import load_dotenv

# Load env configurations
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("recommendation_service")

# Initialize FastAPI App
app = FastAPI(
    title="Kridaz Recommendation Microservice",
    description="High-performance, pure PostgreSQL 8-factor turf recommender pipeline",
    version="1.0.0"
)

# Enable CORS for internal proxy calls
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database Connection Pool
pool: Optional[asyncpg.Pool] = None
DATABASE_URL = os.getenv("DATABASE_URL")

@app.on_event("startup")
async def startup():
    global pool
    if not DATABASE_URL:
        logger.error("DATABASE_URL env variable is not set!")
        raise RuntimeError("DATABASE_URL env variable is not set!")
    
    try:
        logger.info("Initializing asyncpg connection pool to PostgreSQL...")
        # Resolve potential IPv6 proxy DNS timeouts by enforcing direct tcp connection settings if required
        pool = await asyncpg.create_pool(
            DATABASE_URL,
            min_size=5,
            max_size=20,
            timeout=10.0,
            command_timeout=15.0
        )
        logger.info("PostgreSQL connection pool initialized successfully!")
    except Exception as e:
        logger.error(f"Failed to initialize PostgreSQL pool: {e}")
        raise e

@app.on_event("shutdown")
async def shutdown():
    global pool
    if pool:
        logger.info("Closing PostgreSQL connection pool...")
        await pool.close()
        logger.info("PostgreSQL connection pool closed.")

# Importing recommendations engine
from recommendation_engine import get_recommendations
from user_recommendation_engine import get_user_recommendations

@app.get("/health")
async def health_check():
    if pool:
        try:
            async with pool.acquire() as conn:
                await conn.execute("SELECT 1")
            return {"status": "healthy", "database": "connected"}
        except Exception as e:
            return {"status": "degraded", "database_error": str(e)}
    return {"status": "uninitialized"}

@app.get("/api/recommendations/feed")
async def fetch_recommendation_feed(
    user_id: str = Query(..., description="Target User UUID for personalization"),
    lat: Optional[float] = Query(None, description="User current Latitude for geo-proximity calculations"),
    lng: Optional[float] = Query(None, description="User current Longitude for geo-proximity calculations"),
    limit: int = Query(15, ge=1, le=50, description="Limit count of recommendations to return"),
    include_scores: bool = Query(False, description="Whether to return individual parameter breakdown scores")
):
    if not pool:
        raise HTTPException(status_code=500, detail="Database pool not initialized.")
        
    try:
        logger.info(f"Generating turf recommendations for User ID: {user_id}...")
        results = await get_recommendations(
            pool=pool,
            user_id=user_id,
            user_lat=lat,
            user_lng=lng,
            limit=limit,
            include_scores=include_scores
        )
        return {
            "success": True,
            "count": len(results),
            "data": results
        }
    except Exception as e:
        logger.error(f"Failed to fetch recommendations for user {user_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/recommendations/users")
async def fetch_user_recommendations(
    user_id: str = Query(..., description="Target User UUID for follow recommendations"),
    lat: Optional[float] = Query(None, description="User current Latitude for geo-proximity calculations"),
    lng: Optional[float] = Query(None, description="User current Longitude for geo-proximity calculations"),
    limit: int = Query(15, ge=1, le=50, description="Limit count of recommendations to return"),
    include_scores: bool = Query(False, description="Whether to return individual parameter breakdown scores")
):
    if not pool:
        raise HTTPException(status_code=500, detail="Database pool not initialized.")
        
    try:
        logger.info(f"Generating follow recommendations for User ID: {user_id}...")
        results = await get_user_recommendations(
            pool=pool,
            user_id=user_id,
            user_lat=lat,
            user_lng=lng,
            limit=limit,
            include_scores=include_scores
        )
        return {
            "success": True,
            "count": len(results),
            "data": results
        }
    except Exception as e:
        logger.error(f"Failed to fetch user recommendations for user {user_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

