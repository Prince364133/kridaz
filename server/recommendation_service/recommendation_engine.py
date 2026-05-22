import math
import logging
from typing import List, Dict, Any, Optional
import asyncpg

logger = logging.getLogger("recommendation_engine")

# ─── F1: Haversine Geo Proximity ───
def calculate_geo_proximity(user_lat: Optional[float], user_lng: Optional[float], ground_lat: Optional[float], ground_lng: Optional[float]) -> float:
    if user_lat is None or user_lng is None or ground_lat is None or ground_lng is None:
        return 0.5  # Neutral baseline if coordinates are missing
    
    try:
        # Haversine formula
        dlat = math.radians(float(ground_lat) - float(user_lat))
        dlon = math.radians(float(ground_lng) - float(user_lng))
        a = (math.sin(dlat/2)**2 + 
             math.cos(math.radians(float(user_lat))) * 
             math.cos(math.radians(float(ground_lat))) * 
             math.sin(dlon/2)**2)
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
        distance_km = 6371 * c
        
        # Exponential decay: exp(-0.08 * distance_km)
        # 0 km = 1.0, 5 km = 0.67, 15 km = 0.30, 30 km = 0.09
        return math.exp(-0.08 * distance_km)
    except Exception as e:
        logger.error(f"Geo proximity calculation failed: {e}")
        return 0.5

# ─── Core Scorer Pipeline ───
async def get_recommendations(
    pool: asyncpg.Pool,
    user_id: str,
    user_lat: Optional[float] = None,
    user_lng: Optional[float] = None,
    limit: int = 20,
    include_scores: bool = False
) -> List[Dict[str, Any]]:
    
    async with pool.acquire() as conn:
        # 1. Fetch user bookings (for pricing profile and sport preferences)
        bookings = await conn.fetch(
            'SELECT "turfId", "totalPrice" FROM "Booking" WHERE "userId" = $1 ORDER BY "createdAt" DESC LIMIT 50',
            user_id
        )
        
        # 2. Fetch user's explicitly liked / wishlisted grounds
        likes = await conn.fetch(
            'SELECT "turfId" FROM "TurfLike" WHERE "userId" = $1',
            user_id
        )
        liked_ids = {r['turfId'] for r in likes}
        
        # 3. Fetch user implicit interactions (views, shares, clicks)
        interactions = await conn.fetch(
            'SELECT "turfId", "interactionType", duration FROM "TurfInteraction" WHERE "userId" = $1 ORDER BY "createdAt" DESC LIMIT 150',
            user_id
        )
        
        # 4. Fetch teammates' bookings to build social signals (F6: Social Proximity)
        # Intersects bookings of users on the same team as the target user
        teammate_bookings = await conn.fetch(
            '''
            SELECT b."turfId"
            FROM "Booking" b
            WHERE b."userId" IN (
                SELECT tm_sub."userId"
                FROM "TeamMember" tm_sub
                WHERE tm_sub."teamId" IN (
                    SELECT tm."teamId" FROM "TeamMember" tm WHERE tm."userId" = $1
                ) AND tm_sub."userId" != $1
            )
            LIMIT 100
            ''',
            user_id
        )
        teammate_turf_counts = {}
        for r in teammate_bookings:
            tid = r['turfId']
            teammate_turf_counts[tid] = teammate_turf_counts.get(tid, 0) + 1
        
        # 5. Fetch target user's profile preferred sports
        user_row = await conn.fetchrow(
            'SELECT "sportTypes" FROM "User" WHERE id = $1',
            user_id
        )
        user_sports = set(user_row['sportTypes']) if user_row and user_row['sportTypes'] else set()

        # 6. Fetch all active candidate grounds (Rough db-layer query limits)
        grounds = await conn.fetch(
            'SELECT id, name, image, "sportTypes", "pricePerHour", rating, latitude, longitude, "createdAt" '
            'FROM "Turf" WHERE "isActive" = TRUE AND status = \'approved\''
        )
        
        if not grounds:
            return []

        # ─── Synthesize User Profile Preferences ───
        # Determine user's average booking price to build price alignment (F3)
        booking_prices = [float(b['totalPrice']) for b in bookings]
        avg_booking_price = sum(booking_prices) / len(booking_prices) if booking_prices else 800.0 # default baseline (e.g. ₹800/hr)
        
        ranked_results = []
        datetime_now = 1779098306000 # baseline epoch timeline

        for g in grounds:
            g_id = g['id']
            g_sports = g['sportTypes'] or []
            
            # F1: Geo Proximity Score (Weight: 25%)
            f1_geo = calculate_geo_proximity(user_lat, user_lng, g['latitude'], g['longitude'])
            
            # F2: Sport Affinity Score (Weight: 20%)
            f2_sport = 0.2  # Neutral baseline
            if user_sports:
                matched_sports = [s for s in g_sports if s in user_sports]
                if matched_sports:
                    f2_sport = 1.0
                else:
                    f2_sport = 0.3
            elif bookings:
                f2_sport = 0.8  # Strong secondary fallback
            else:
                f2_sport = 0.5  # Neutral default
            
            # F3: Price Alignment Score (Weight: 15%)
            # High-fidelity Gaussian RBF Kernel Decay (Tolerance boundary σ = ₹300)
            g_price = float(g['pricePerHour'])
            f3_price = math.exp(-((g_price - avg_booking_price) ** 2) / (2 * (300 ** 2)))
            
            # F4: Telemetry Interaction Score (Weight: 15%)
            # Optimized Log-scale scaling to model marginal utility bounds
            views = sum(1 for i in interactions if i['turfId'] == g_id and i['interactionType'] == 'VIEW')
            shares = sum(1 for i in interactions if i['turfId'] == g_id and i['interactionType'] == 'SHARE')
            is_liked = 1.0 if g_id in liked_ids else 0.0
            
            f4_interact = min(0.6 * is_liked + 0.4 * math.log1p(views * 0.5 + shares * 1.5), 1.0)
            f4_interact = max(f4_interact, 0.1)  # Minimal baseline
            
            # F5: Operational Quality Score (Weight: 10%)
            # Optimized Min-Max Normalized Power-Law Transform
            rating_val = float(g['rating']) if g['rating'] is not None else 3.5
            f5_quality = ((rating_val - 1.0) / 4.0) ** 2
            
            # F6: Social Proximity Score (Weight: 10%)
            teammate_hits = teammate_turf_counts.get(g_id, 0)
            f6_social = min(teammate_hits * 0.25, 1.0)
            if f6_social == 0.0:
                f6_social = 0.1
                
            # F7: Freshness & Discovery Score (Weight: 5%)
            try:
                age_days = (datetime_now - g['createdAt'].timestamp() * 1000) / (1000 * 60 * 60 * 24)
                f7_freshness = math.exp(-0.02 * max(age_days, 0))  # decayed over 50 days
            except Exception:
                f7_freshness = 0.5
                
            # ─── Weighted Score Summation (1.0 Total Weight) ───
            total_score = (
                0.25 * f1_geo +
                0.20 * f2_sport +
                0.15 * f3_price +
                0.15 * f4_interact +
                0.10 * f5_quality +
                0.10 * f6_social +
                0.05 * f7_freshness
            )
            
            payload = {
                "id": g_id,
                "name": g['name'],
                "image": g['image'],
                "sportTypes": g_sports,
                "pricePerHour": float(g['pricePerHour']),
                "rating": float(g['rating']) if g['rating'] is not None else 3.5,
                "latitude": float(g['latitude']) if g['latitude'] is not None else None,
                "longitude": float(g['longitude']) if g['longitude'] is not None else None,
                "totalScore": total_score
            }
            
            if include_scores:
                payload["scores"] = {
                    "geo": f1_geo,
                    "sport": f2_sport,
                    "price": f3_price,
                    "interact": f4_interact,
                    "quality": f5_quality,
                    "social": f6_social,
                    "freshness": f7_freshness
                }
            ranked_results.append(payload)
            
        # Sort candidates descending by totalScore
        ranked_results.sort(key=lambda x: x['totalScore'], reverse=True)
        return ranked_results[:limit]
