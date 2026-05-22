import math
import logging
from typing import List, Dict, Any, Optional
import asyncpg

logger = logging.getLogger("user_recommendation_engine")

# Haversine distance for Geo Proximity
def calculate_geo_proximity(user_lat: Optional[float], user_lng: Optional[float], candidate_lat: Optional[float], candidate_lng: Optional[float]) -> float:
    if user_lat is None or user_lng is None or candidate_lat is None or candidate_lng is None:
        return 0.5  # Neutral baseline if coordinates are missing
    
    try:
        dlat = math.radians(float(candidate_lat) - float(user_lat))
        dlon = math.radians(float(candidate_lng) - float(user_lng))
        a = (math.sin(dlat/2)**2 + 
             math.cos(math.radians(float(user_lat))) * 
             math.cos(math.radians(float(candidate_lat))) * 
             math.sin(dlon/2)**2)
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
        distance_km = 6371 * c
        
        # Decay: exp(-0.05 * distance_km) - users are willing to connect with players slightly further than turfs
        return math.exp(-0.05 * distance_km)
    except Exception as e:
        logger.error(f"User geo proximity calculation failed: {e}")
        return 0.5

async def get_user_recommendations(
    pool: asyncpg.Pool,
    user_id: str,
    user_lat: Optional[float] = None,
    user_lng: Optional[float] = None,
    limit: int = 20,
    include_scores: bool = False
) -> List[Dict[str, Any]]:
    
    async with pool.acquire() as conn:
        # 1. Fetch current user's profile details & followed user IDs
        user_row = await conn.fetchrow(
            'SELECT "sportTypes", latitude, longitude FROM "User" WHERE id = $1',
            user_id
        )
        if not user_row:
            return []
            
        user_sports = set(user_row['sportTypes']) if user_row['sportTypes'] else set()
        # Fallback to parameters if not in user profile
        u_lat = float(user_row['latitude']) if user_row['latitude'] is not None else user_lat
        u_lng = float(user_row['longitude']) if user_row['longitude'] is not None else user_lng

        # 2. Get the list of people the user already follows
        following_rows = await conn.fetch(
            'SELECT "targetId" FROM "UserRelationship" WHERE "userId" = $1 AND type = \'FOLLOW\'',
            user_id
        )
        followed_ids = {r['targetId'] for r in following_rows}
        
        # 3. Calculate Mutual Followers / 2nd Degree Network overlap
        # Users followed by people I follow, but who I don't follow yet
        mutual_rows = await conn.fetch(
            '''
            SELECT r2."targetId", COUNT(r1."targetId") as mutual_count
            FROM "UserRelationship" r1
            JOIN "UserRelationship" r2 ON r1."targetId" = r2."userId"
            WHERE r1."userId" = $1 AND r1.type = 'FOLLOW' AND r2.type = 'FOLLOW'
              AND r2."targetId" != $1
            GROUP BY r2."targetId"
            ''',
            user_id
        )
        mutual_counts = {r['targetId']: int(r['mutual_count']) for r in mutual_rows}

        # 4. Fetch candidate users (exclude current user and already followed users)
        # Limit candidate pool to 200 users for performance constraints
        candidates = await conn.fetch(
            '''
            SELECT u.id, u.name, u.username, u."profilePicture", u."sportTypes", u.latitude, u.longitude,
                   (SELECT COUNT(*) FROM "UserRelationship" WHERE "targetId" = u.id AND type = 'FOLLOW') as followers_count
            FROM "User" u
            WHERE u.id != $1 AND u.status = 'active'
            ORDER BY followers_count DESC
            LIMIT 200
            ''',
            user_id
        )
        
        # Filter candidate set programmatically
        candidate_pool = [c for c in candidates if c['id'] not in followed_ids]
        
        ranked_results = []
        
        for c in candidate_pool:
            c_id = c['id']
            c_sports = c['sportTypes'] or []
            
            # F1: Mutual Follower / Social Connection Score (Weight: 35%)
            mutuals = mutual_counts.get(c_id, 0)
            f1_social = min(mutuals * 0.2, 1.0) # 5+ mutual followers gives a perfect 1.0
            
            # F2: Sport Affinity (Weight: 25%)
            f2_sport = 0.2
            if user_sports and c_sports:
                matches = [s for s in c_sports if s in user_sports]
                if matches:
                    f2_sport = 1.0
                else:
                    f2_sport = 0.3
            
            # F3: Geo Proximity (Weight: 25%)
            f3_geo = calculate_geo_proximity(u_lat, u_lng, c['latitude'], c['longitude'])
            
            # F4: Popularity / Influence Score (Weight: 15%)
            followers_count = c['followers_count']
            f4_popularity = min(followers_count / 100.0, 1.0) # log scaling or normalization capping at 100 followers
            
            # Weighted total score calculation
            total_score = (
                0.35 * f1_social +
                0.25 * f2_sport +
                0.25 * f3_geo +
                0.15 * f4_popularity
            )
            
            payload = {
                "id": c_id,
                "name": c['name'],
                "username": c['username'],
                "profilePicture": c['profilePicture'],
                "sportTypes": c_sports,
                "followersCount": followers_count,
                "totalScore": total_score
            }
            
            if include_scores:
                payload["scores"] = {
                    "social": f1_social,
                    "sport": f2_sport,
                    "geo": f3_geo,
                    "popularity": f4_popularity
                }
                
            ranked_results.append(payload)
            
        # Sort by score descending
        ranked_results.sort(key=lambda x: x['totalScore'], reverse=True)
        return ranked_results[:limit]
