import asyncio
import math
import logging
from typing import List, Dict, Any, Optional
from recommendation_engine import get_recommendations, calculate_geo_proximity

# Configure logging for tests
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("recommendation_test_suite")

class MockConnection:
    def __init__(self, scenario_data: Dict[str, Any]):
        self.scenario_data = scenario_data

    async def fetch(self, query: str, *args) -> List[Dict[str, Any]]:
        # Match queries to simulate exact scenario states
        if "Booking" in query:
            if "TeamMember" in query:  # Teammates bookings query (F6 Social)
                return self.scenario_data.get("teammate_bookings", [])
            else:  # User personal bookings query
                return self.scenario_data.get("bookings", [])
        elif "TurfLike" in query:
            return self.scenario_data.get("likes", [])
        elif "TurfInteraction" in query:
            return self.scenario_data.get("interactions", [])
        elif "Turf" in query:
            return self.scenario_data.get("grounds", [])
        return []

    async def fetchrow(self, query: str, *args) -> Optional[Dict[str, Any]]:
        if "User" in query:
            return self.scenario_data.get("user_profile", {"sportTypes": []})
        return None

    async def execute(self, query: str, *args):
        return "SELECT 1"

class MockPoolContext:
    def __init__(self, conn: MockConnection):
        self.conn = conn

    async def __aenter__(self) -> MockConnection:
        return self.conn

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        pass

class MockPool:
    def __init__(self, scenario_data: Dict[str, Any]):
        self.conn = MockConnection(scenario_data)

    def acquire(self) -> MockPoolContext:
        return MockPoolContext(self.conn)

# ─── 15 SIMULATION SCENARIO DECLARATIONS ───
SCENARIOS = {
    # 1. Cold Start Guest Profile
    "Scenario 1: Cold Start Guest Profile": {
        "bookings": [],
        "likes": [],
        "interactions": [],
        "teammate_bookings": [],
        "user_profile": {"sportTypes": []},
        "grounds": [
            {"id": "t1", "name": "Standard Arena", "image": "img1", "sportTypes": ["FOOTBALL"], "pricePerHour": 800.0, "rating": 4.0, "latitude": 12.9716, "longitude": 77.5946, "createdAt": type('datetime', (), {'timestamp': lambda: 1779098306})}
        ]
    },
    
    # 2. Perfect Proximity Match
    "Scenario 2: Exact Location Match (F1 Proximity)": {
        "bookings": [],
        "likes": [],
        "interactions": [],
        "teammate_bookings": [],
        "user_profile": {"sportTypes": []},
        "grounds": [
            {"id": "t1", "name": "Close Ground", "image": "img1", "sportTypes": ["FOOTBALL"], "pricePerHour": 800.0, "rating": 4.0, "latitude": 12.9716, "longitude": 77.5946, "createdAt": type('datetime', (), {'timestamp': lambda: 1779098306})}
        ],
        "query_coords": (12.9716, 77.5946)
    },
    
    # 3. Remote Ground (Far Decay)
    "Scenario 3: Out-of-Range Location Match (F1 Proximity)": {
        "bookings": [],
        "likes": [],
        "interactions": [],
        "teammate_bookings": [],
        "user_profile": {"sportTypes": []},
        "grounds": [
            {"id": "t1", "name": "Remote Ground", "image": "img1", "sportTypes": ["FOOTBALL"], "pricePerHour": 800.0, "rating": 4.0, "latitude": 13.5, "longitude": 78.5, "createdAt": type('datetime', (), {'timestamp': lambda: 1779098306})}
        ],
        "query_coords": (12.9716, 77.5946)
    },
    
    # 4. Premium Sport Matching
    "Scenario 4: High Sport Affinity Match (F2 Sport)": {
        "bookings": [],
        "likes": [],
        "interactions": [],
        "teammate_bookings": [],
        "user_profile": {"sportTypes": ["CRICKET"]},
        "grounds": [
            {"id": "t1", "name": "Cricket Stadium", "image": "img1", "sportTypes": ["CRICKET"], "pricePerHour": 800.0, "rating": 4.0, "latitude": 12.9716, "longitude": 77.5946, "createdAt": type('datetime', (), {'timestamp': lambda: 1779098306})}
        ]
    },
    
    # 5. Price Target Alignment
    "Scenario 5: Dynamic Price Profile Alignment (F3 Price)": {
        "bookings": [
            {"turfId": "x", "totalPrice": 1000.0},
            {"turfId": "y", "totalPrice": 1000.0}
        ],
        "likes": [],
        "interactions": [],
        "teammate_bookings": [],
        "user_profile": {"sportTypes": []},
        "grounds": [
            {"id": "t1", "name": "Expensive Arena", "image": "img1", "sportTypes": ["FOOTBALL"], "pricePerHour": 1000.0, "rating": 4.0, "latitude": 12.9716, "longitude": 77.5946, "createdAt": type('datetime', (), {'timestamp': lambda: 1779098306})}
        ]
    },
    
    # 6. Dwell / Interaction Telemetry
    "Scenario 6: Dwell Time Interaction Telemetry (F4 Telemetry)": {
        "bookings": [],
        "likes": [],
        "interactions": [
            {"turfId": "t1", "interactionType": "VIEW", "duration": 45},
            {"turfId": "t1", "interactionType": "VIEW", "duration": 60}
        ],
        "teammate_bookings": [],
        "user_profile": {"sportTypes": []},
        "grounds": [
            {"id": "t1", "name": "Viewed Turf", "image": "img1", "sportTypes": ["FOOTBALL"], "pricePerHour": 800.0, "rating": 4.0, "latitude": 12.9716, "longitude": 77.5946, "createdAt": type('datetime', (), {'timestamp': lambda: 1779098306})}
        ]
    },
    
    # 7. Wishlisted Arena Boost
    "Scenario 7: Wishlist Like Affinity (F4 Telemetry)": {
        "bookings": [],
        "likes": [{"turfId": "t1"}],
        "interactions": [],
        "teammate_bookings": [],
        "user_profile": {"sportTypes": []},
        "grounds": [
            {"id": "t1", "name": "Liked Turf", "image": "img1", "sportTypes": ["FOOTBALL"], "pricePerHour": 800.0, "rating": 4.0, "latitude": 12.9716, "longitude": 77.5946, "createdAt": type('datetime', (), {'timestamp': lambda: 1779098306})}
        ]
    },
    
    # 8. High-Quality Rating Peak
    "Scenario 8: Perfect Quality Rating (F5 Quality)": {
        "bookings": [],
        "likes": [],
        "interactions": [],
        "teammate_bookings": [],
        "user_profile": {"sportTypes": []},
        "grounds": [
            {"id": "t1", "name": "Elite Arena", "image": "img1", "sportTypes": ["FOOTBALL"], "pricePerHour": 800.0, "rating": 5.0, "latitude": 12.9716, "longitude": 77.5946, "createdAt": type('datetime', (), {'timestamp': lambda: 1779098306})}
        ]
    },
    
    # 9. Teammate Booking Signals
    "Scenario 9: Social Teammate Proximity Bookings (F6 Social)": {
        "bookings": [],
        "likes": [],
        "interactions": [],
        "teammate_bookings": [
            {"turfId": "t1"},
            {"turfId": "t1"},
            {"turfId": "t1"}
        ],
        "user_profile": {"sportTypes": []},
        "grounds": [
            {"id": "t1", "name": "Teammates Arena", "image": "img1", "sportTypes": ["FOOTBALL"], "pricePerHour": 800.0, "rating": 4.0, "latitude": 12.9716, "longitude": 77.5946, "createdAt": type('datetime', (), {'timestamp': lambda: 1779098306})}
        ]
    },
    
    # 10. Direct Freshness Decay
    "Scenario 10: Freshness Decays Correctly (F7 Freshness)": {
        "bookings": [],
        "likes": [],
        "interactions": [],
        "teammate_bookings": [],
        "user_profile": {"sportTypes": []},
        "grounds": [
            {"id": "t1", "name": "Brand New Arena", "image": "img1", "sportTypes": ["FOOTBALL"], "pricePerHour": 800.0, "rating": 4.0, "latitude": 12.9716, "longitude": 77.5946, "createdAt": type('datetime', (), {'timestamp': lambda: 1779098306})}
        ]
    },

    # 11. Multi-Sport Cross Filtering
    "Scenario 11: Multi-Sport Cross Filtering (Cricket vs Football)": {
        "bookings": [],
        "likes": [],
        "interactions": [],
        "teammate_bookings": [],
        "user_profile": {"sportTypes": ["CRICKET", "TENNIS"]},
        "grounds": [
            {"id": "t1", "name": "Cricket Arena", "image": "img1", "sportTypes": ["CRICKET"], "pricePerHour": 800.0, "rating": 4.0, "latitude": 12.9716, "longitude": 77.5946, "createdAt": type('datetime', (), {'timestamp': lambda: 1779098306})},
            {"id": "t2", "name": "Football Arena", "image": "img2", "sportTypes": ["FOOTBALL"], "pricePerHour": 800.0, "rating": 4.0, "latitude": 12.9716, "longitude": 77.5946, "createdAt": type('datetime', (), {'timestamp': lambda: 1779098306})}
        ]
    },

    # 12. Pure Passive User (High Dwell-Time, Zero Likes)
    "Scenario 12: High Dwell-Time with Zero Likes (Pure Passive User)": {
        "bookings": [],
        "likes": [],
        "interactions": [
            {"turfId": "t1", "interactionType": "VIEW", "duration": 150},
            {"turfId": "t1", "interactionType": "VIEW", "duration": 180}
        ],
        "teammate_bookings": [],
        "user_profile": {"sportTypes": []},
        "grounds": [
            {"id": "t1", "name": "Highly Viewed Arena", "image": "img1", "sportTypes": ["FOOTBALL"], "pricePerHour": 800.0, "rating": 4.0, "latitude": 12.9716, "longitude": 77.5946, "createdAt": type('datetime', (), {'timestamp': lambda: 1779098306})}
        ]
    },

    # 13. Extremely Remote but Highest-Rated Turf
    "Scenario 13: Extremely Remote but Highest-Rated Turf (Geo vs Quality Tradeoff)": {
        "bookings": [],
        "likes": [],
        "interactions": [],
        "teammate_bookings": [],
        "user_profile": {"sportTypes": []},
        "grounds": [
            {"id": "t1", "name": "Perfect Far Arena", "image": "img1", "sportTypes": ["FOOTBALL"], "pricePerHour": 800.0, "rating": 5.0, "latitude": 13.5, "longitude": 78.5, "createdAt": type('datetime', (), {'timestamp': lambda: 1779098306})}
        ],
        "query_coords": (12.9716, 77.5946)
    },

    # 14. Social Teammates vs Disliked Pricing Tradeoff
    "Scenario 14: Social Teammates vs Disliked Pricing Tradeoff": {
        "bookings": [
            {"turfId": "x", "totalPrice": 600.0}
        ],
        "likes": [],
        "interactions": [],
        "teammate_bookings": [
            {"turfId": "t1"},
            {"turfId": "t1"},
            {"turfId": "t1"}
        ],
        "user_profile": {"sportTypes": []},
        "grounds": [
            {"id": "t1", "name": "Teammates Costly Arena", "image": "img1", "sportTypes": ["FOOTBALL"], "pricePerHour": 2500.0, "rating": 4.0, "latitude": 12.9716, "longitude": 77.5946, "createdAt": type('datetime', (), {'timestamp': lambda: 1779098306})}
        ]
    },

    # 15. The "Hot Discovery" (Fresh + Active Interaction + Near)
    "Scenario 15: The Hot Discovery Arena": {
        "bookings": [],
        "likes": [],
        "interactions": [
            {"turfId": "t1", "interactionType": "VIEW", "duration": 30}
        ],
        "teammate_bookings": [],
        "user_profile": {"sportTypes": ["FOOTBALL"]},
        "grounds": [
            {"id": "t1", "name": "Super Hot Arena", "image": "img1", "sportTypes": ["FOOTBALL"], "pricePerHour": 800.0, "rating": 4.8, "latitude": 12.9716, "longitude": 77.5946, "createdAt": type('datetime', (), {'timestamp': lambda: 1779098306})}
        ],
        "query_coords": (12.9716, 77.5946)
    }
}

async def run_simulations():
    logger.info("🚀 STARTING 15 SCENARIO SIMULATION SUITE FOR KRIDAZ RECS ENGINE...")
    success_count = 0
    
    for name, data in SCENARIOS.items():
        logger.info(f"\n──────────────────────────────────────────────────────────")
        logger.info(f"🧪 Running {name}")
        
        # Resolve query coordinates if specified
        coords = data.get("query_coords", (None, None))
        
        # Build mock pool
        pool = MockPool(data)
        
        try:
            results = await get_recommendations(
                pool=pool,
                user_id="test-user-uuid",
                user_lat=coords[0],
                user_lng=coords[1],
                limit=5,
                include_scores=True
            )
            
            # Assertions / Verifications based on scenarios
            if results:
                target = results[0]
                scores = target["scores"]
                
                if "Scenario 1:" in name:
                    assert scores["interact"] == 0.1, f"Expected cold start baseline 0.1, got {scores['interact']}"
                    assert scores["social"] == 0.1
                    logger.info("✅ Cold start fallback baselines successfully verified!")
                    
                elif "Scenario 2" in name:
                    assert scores["geo"] == 1.0, f"Expected perfect proximity 1.0, got {scores['geo']}"
                    logger.info("✅ Perfect proximity 1.0 matched successfully!")
                    
                elif "Scenario 3" in name:
                    assert scores["geo"] < 0.2, f"Expected decayed remote proximity, got {scores['geo']}"
                    logger.info(f"✅ remote proximity successfully decayed to: {scores['geo']}")
                    
                elif "Scenario 4" in name:
                    assert scores["sport"] == 1.0, f"Expected perfect sport match, got {scores['sport']}"
                    logger.info("✅ High sport affinity matched successfully!")
                    
                elif "Scenario 5" in name:
                    assert scores["price"] == 1.0, f"Expected perfect price alignment, got {scores['price']}"
                    logger.info("✅ Pricing alignment calculated correctly!")
                    
                elif "Scenario 6" in name:
                    assert scores["interact"] > 0.15, f"Expected telemetry views boost, got {scores['interact']}"
                    logger.info(f"✅ Dwell views successfully registered interaction score: {scores['interact']}")
                    
                elif "Scenario 7" in name:
                    assert scores["interact"] > 0.5, f"Expected wishlist target boost, got {scores['interact']}"
                    logger.info(f"✅ Wishlist target registered interaction score: {scores['interact']}")
                    
                elif "Scenario 8" in name:
                    assert scores["quality"] == 1.0, f"Expected perfect quality, got {scores['quality']}"
                    logger.info("✅ Perfect 5-star quality score verified!")
                    
                elif "Scenario 9" in name:
                    assert scores["social"] > 0.5, f"Expected social teammates boost, got {scores['social']}"
                    logger.info(f"✅ Teammates bookings registered social score: {scores['social']}")
                    
                elif "Scenario 10" in name:
                    assert scores["freshness"] == 1.0, f"Expected brand new freshness, got {scores['freshness']}"
                    logger.info("✅ Maximum freshness score verified!")

                elif "Scenario 11" in name:
                    assert results[0]["id"] == "t1", f"Expected Cricket Arena first, got {results[0]['id']}"
                    assert results[0]["scores"]["sport"] == 1.0
                    logger.info("✅ Multi-sport preference matching successfully verified!")
                    
                elif "Scenario 12" in name:
                    assert scores["interact"] > 0.15, f"Expected passive dwell boost, got {scores['interact']}"
                    logger.info("✅ Pure passive dwell-time telemetry successfully captured!")
                    
                elif "Scenario 13" in name:
                    assert scores["geo"] < 0.1, f"Expected geo decay, got {scores['geo']}"
                    assert scores["quality"] == 1.0
                    logger.info("✅ Extremely remote geo vs perfect quality tradeoff confirmed!")
                    
                elif "Scenario 14" in name:
                    assert scores["social"] > 0.5, f"Expected social boost, got {scores['social']}"
                    assert scores["price"] < 0.1, f"Expected price penalty, got {scores['price']}"
                    logger.info("✅ Teammate social booking boost vs high pricing tradeoff verified!")
                    
                elif "Scenario 15" in name:
                    assert scores["freshness"] == 1.0, f"Expected new freshness, got {scores['freshness']}"
                    assert scores["geo"] == 1.0, f"Expected perfect geo, got {scores['geo']}"
                    logger.info("✅ Hot Discovery Arena multi-factor maximum scores successfully validated!")
 
                logger.info(f"🏆 Scenario Rank Total Score: {target['totalScore']:.4f}")
                success_count += 1
            else:
                logger.error(f"❌ Simulation failed: No recommendations returned!")
                
        except Exception as e:
            logger.error(f"❌ Simulation failed with exception: {e}", exc_info=True)
            
    logger.info(f"\n──────────────────────────────────────────────────────────")
    logger.info(f"📊 SUMMARY: {success_count}/15 SIMULATION SCENARIOS COMPLETED SUCCESSFULLY!")
    return success_count == len(SCENARIOS)
 
if __name__ == "__main__":
    asyncio.run(run_simulations())
