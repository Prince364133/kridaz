# Live Scoring Feature — Design Spec
**Date:** 2026-05-20  
**Branch:** Vamshiz  
**Status:** Approved — ready for implementation

---

## 1. Overview

Users (hosts) can self-report match scores in real-time during a game. All players in the game see live score updates on their phones. When the host ends the game, scores are finalized, player profile stats are updated, and the results feed into a leaderboard.

---

## 2. Scope

### Sports Supported (v1)
- Cricket
- Football (Soccer only)
- Basketball (5v5 and 3x3 variants)
- Badminton / Tennis
- Pickleball

### Who Can Score
- **Host only.** The player who created the game submits and edits all score events.

### When Scoring Happens
- **Live during the match.** Host taps score events in real-time. All participants see a live scoreboard on their device. On game end, scores are aggregated into a final result.

### What Scores Affect
1. Game detail page — shows final result to all participants
2. Player profile stats — `player_stats` table updated on finalize
3. Leaderboard — Friends | City | Global tabs, filterable by sport

---

## 3. Database Design

### 3a. New Table: `score_events`

Append-only event log. One row per scoring action during a live game.

```sql
CREATE TABLE score_events (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id      VARCHAR NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    scored_by    VARCHAR REFERENCES users(uid),        -- player the event belongs to
    sport        VARCHAR NOT NULL,
    event_type   VARCHAR NOT NULL,                     -- 'goal','run','4','6','wicket','point','three_pointer', etc.
    team         VARCHAR,                              -- 'A' or 'B'
    event_data   JSONB DEFAULT '{}',                  -- extra context per event type
    sequence_no  INTEGER NOT NULL,                     -- for ordering and undo
    created_at   TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_score_events_game_id ON score_events(game_id);
CREATE INDEX idx_score_events_sequence ON score_events(game_id, sequence_no);
```

**Event types per sport:**

| Sport | Event Types |
|---|---|
| Cricket | `run_1`, `run_2`, `run_3`, `four`, `six`, `dot_ball`, `wide`, `no_ball`, `bye`, `leg_bye`, `wicket` |
| Football | `goal`, `assist` |
| Basketball (5v5) | `two_pointer`, `three_pointer`, `free_throw`, `and_one`, `four_point_play` |
| Basketball (3x3) | `one_pointer`, `two_pointer`, `free_throw` |
| Badminton | `point` (team A or B per rally) |
| Pickleball | `point` (team A or B per rally) |

**`event_data` examples:**
```json
// wicket
{"dismissal_type": "caught", "bowler_id": "uid_x", "fielder_id": "uid_y"}

// goal
{"is_penalty": false, "is_own_goal": false}

// free_throw
{"made": true}

// wide
{"runs": 1}
```

---

### 3b. Existing Table: `game_scores` (New — Hybrid)

Final aggregated result written once when host taps "End Game."

```sql
CREATE TABLE game_scores (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id       VARCHAR NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    user_id       VARCHAR NOT NULL REFERENCES users(uid),
    sport         VARCHAR NOT NULL,                    -- indexed for leaderboard
    team          VARCHAR,                             -- 'A' or 'B'
    result        VARCHAR,                             -- 'win', 'loss', 'draw'
    sport_details JSONB DEFAULT '{}',                  -- sport-specific stats (see schemas below)
    submitted_by  VARCHAR REFERENCES users(uid),       -- must be game host
    created_at    TIMESTAMP DEFAULT NOW(),
    updated_at    TIMESTAMP DEFAULT NOW(),
    UNIQUE(game_id, user_id)
);

CREATE INDEX idx_game_scores_sport ON game_scores(sport);
CREATE INDEX idx_game_scores_user_id ON game_scores(user_id);
CREATE INDEX idx_game_scores_result ON game_scores(result);
```

---

### 3c. Sport Detail Schemas (`sport_details` JSONB)

All derived stats are **computed at read time**, never stored.

**Cricket**
```json
{
  "batting": {
    "runs": 43, "balls_faced": 35, "minutes": 69,
    "fours": 3, "sixes": 0, "is_not_out": false,
    "dismissal_type": "caught",
    "dismissed_by": { "bowler_id": "uid_x", "fielder_id": "uid_y" }
  },
  "bowling": {
    "overs": 4.0, "maidens": 1, "runs_conceded": 28,
    "wickets": 2, "wides": 1, "no_balls": 0
  },
  "team_innings": {
    "total_runs": 190, "wickets_fallen": 9, "overs_played": 20.0,
    "extras": { "wides": 9, "no_balls": 0, "byes": 0, "leg_byes": 0 }
  }
}
```
Derived: `strike_rate = (runs / balls_faced) * 100`, `economy_rate = runs_conceded / overs`, `run_rate = total_runs / overs_played`

**Football (Soccer)**
```json
{
  "goals": 2, "assists": 1, "shots_on_target": 4,
  "yellow_cards": 0, "red_cards": 0,
  "saves": 0, "clean_sheet": false
}
```
Derived: `league_points = win→3, draw→1, loss→0`

**Basketball**
```json
{
  "variant": "5v5",
  "two_pointers_made": 4, "two_pointers_attempted": 8,
  "three_pointers_made": 2, "three_pointers_attempted": 5,
  "free_throws_made": 3, "free_throws_attempted": 4,
  "rebounds": 7, "assists": 3, "steals": 2,
  "blocks": 1, "turnovers": 2,
  "and_ones": 0, "four_point_plays": 0
}
```
Derived: `total_points = (2pm*2) + (3pm*3) + ftm`, `fg_pct`, `three_pct`, `ft_pct`

**Badminton / Tennis** (shared schema — both use rally-point set scoring)
```json
{
  "scoring_system": "3x21",
  "max_points": 21,
  "deuce_cap": 30,
  "sets_won": 2,
  "set_scores": ["21-15", "18-21", "21-19"],
  "smashes": 14,
  "service_errors": 3,
  "aces": 0,
  "double_faults": 0
}
```
Note: `aces` and `double_faults` are Tennis-specific optional fields; ignored for Badminton. `scoring_system` will be `"3x15"` with `max_points: 15`, `deuce_cap: 21` for Badminton effective January 2027 per BWF rule change.

**Pickleball**
```json
{
  "games_won": 2,
  "max_points": 11,
  "game_scores": ["11-7", "9-11", "11-8"],
  "dinks": 32,
  "kitchen_violations": 1
}
```

---

## 4. Backend Architecture

### 4a. WebSocket — Live Scoring Room

Extends the existing `ConnectionManager` in `backend/app/api/v1/websocket.py` with a **game-room** concept (currently it is user-centric for chat).

```
ws://api/ws/game/{game_id}/score?user_id={uid}
```

**Host → Server actions:**
```json
{ "action": "score_event", "event_type": "goal", "scored_by": "uid", "team": "A", "event_data": {} }
{ "action": "undo_event", "event_id": "uuid" }
{ "action": "end_game" }
```

**Server → All players broadcast:**
```json
{ "type": "score_update", "current_totals": { "team_a": 3, "team_b": 1 }, "last_event": {...}, "sequence_no": 14 }
{ "type": "event_undone", "event_id": "uuid", "current_totals": {...} }
{ "type": "game_finalized", "score_summary": { ... } }
```

**Reconnect flow:** On reconnect, client calls `GET /game-scores/{game_id}/events` to fetch full event history and rebuild current state.

---

### 4b. New REST Endpoints

```
POST /game-scores/{game_id}/events      — internal: save score_event (called by WS handler)
GET  /game-scores/{game_id}/events      — full event log (for reconnecting clients)
GET  /game-scores/{game_id}             — final aggregated result
PUT  /game-scores/{game_id}             — host edits final score post-game
POST /game-scores/{game_id}/finalize    — end_game: aggregate events → game_scores, update player_stats
GET  /leaderboard?sport=&scope=city&city=&page=
GET  /leaderboard/friends?sport=&user_id=
```

### 4c. Finalize Logic (on `end_game`)

1. Aggregate all `score_events` for `game_id` into per-player stats
2. Compute `result` (win/loss/draw) per team
3. Write rows to `game_scores` (one per player)
4. Call existing `player_stats` increment logic for each participant
5. Update `games.status` → `completed`
6. Broadcast `game_finalized` to all WS subscribers

---

## 5. Frontend Architecture

### 5a. New Service: `ScoreSocketService`

`lib/services/score_socket_service.dart`

Uses Flutter's `web_socket_channel` package (native WebSocket — matches FastAPI backend directly, separate from the Socket.IO `ChatSocketService`).

```dart
class ScoreSocketService {
  // connect(gameId, userId)
  // sendScoreEvent(eventType, scoredBy, team, eventData)
  // sendUndoEvent(eventId)
  // sendEndGame()
  // Stream<ScoreUpdate> get scoreStream
  // disconnect()
}
```

### 5b. New Provider: `liveScoreProvider`

`lib/providers/score_provider.dart`

```dart
// Holds running totals + event list, updated on each WS message
final liveScoreProvider = StateNotifierProvider.family<LiveScoreNotifier, LiveScoreState, String>(
  (ref, gameId) => LiveScoreNotifier(gameId),
);

// Fetches finalized score for a completed game
final gameScoreProvider = FutureProvider.family<GameScore?, String>(
  (ref, gameId) => ScoreService().getScore(gameId),
);

// Leaderboard
final leaderboardProvider = FutureProvider.family<List<LeaderboardEntry>, LeaderboardParams>(
  (ref, params) => ScoreService().getLeaderboard(params),
);
```

### 5c. New Screens & Widgets

| File | Role |
|---|---|
| `lib/screens/live_score_screen.dart` | Full-screen live scoring view. Host sees event pad + scoreboard. Players see scoreboard only. |
| `lib/widgets/scoring/score_event_pad_widget.dart` | Host-only. Sport-specific tap buttons. Widget factory switches on `sport`. |
| `lib/widgets/scoring/live_scoreboard_widget.dart` | Read-only live view for all players. Shows team totals + recent events ticker. |
| `lib/widgets/scoring/game_score_detail_widget.dart` | Embedded in game detail screen. Shows final result post-game. |
| `lib/screens/leaderboard_screen.dart` | 3 tabs: Friends \| City \| Global. Sport filter chip row. |

### 5d. Sport Event Pad Buttons (per sport)

| Sport | Host tap buttons |
|---|---|
| Cricket | `+Dot` `+1` `+2` `+3` `+4` `+6` `Wide` `No Ball` `Bye` `Wicket` |
| Football | `+Goal [select player]` `+Assist [select player]` |
| Basketball 5v5 | `+2` `+3` `+FT` `And-One` `Miss` `+Reb` `+Ast` |
| Basketball 3x3 | `+1 (inside)` `+2 (outside)` `+FT` |
| Badminton | `+Point A` `+Point B` (auto-detects set completion at 15/21) |
| Pickleball | `+Point A` `+Point B` (auto-detects game completion at 11/15/21) |

### 5e. Data Flow

```
Host starts game → status = 'in_progress'
        ↓
LiveScoreScreen opens → ScoreSocketService.connect(gameId)
All players open game detail → subscribe to same WS room
        ↓
Host taps score button → sendScoreEvent()
        ↓
Backend saves score_events row → broadcasts score_update to all in room
        ↓
liveScoreProvider updates → LiveScoreboardWidget re-renders on all phones
        ↓
Host taps "End Game" → sendEndGame()
        ↓
Backend finalizes: aggregates events → game_scores, updates player_stats
Broadcasts game_finalized → all clients navigate to score summary
        ↓
gameScoreProvider fetches final result → GameScoreDetailWidget renders
leaderboardProvider invalidated → LeaderboardScreen refreshes on next visit
```

---

## 6. Leaderboard

### Scopes
- **Friends** — players in user's friends list, all sports or per-sport
- **City** — players with matching `location` field, per sport
- **Global** — all users, per sport

### Ranking Metric (per sport)
| Sport | Primary rank metric |
|---|---|
| Cricket | Total runs (batting) |
| Football | Total goals |
| Basketball | Total points |
| Badminton | Win count |
| Pickleball | Win count |

### Query Strategy
Single table scan on `game_scores` (leverages `sport` and `result` indexes). No UNION across tables needed — this is why the hybrid approach was chosen over separate tables.

---

## 7. Error Handling

| Scenario | Handling |
|---|---|
| Non-host sends `score_event` | WS handler rejects with `{"error": "not_authorized"}` |
| Game not `in_progress` when scoring | `score_event` rejected with `{"error": "game_not_active"}` |
| WS disconnect mid-game | Client reconnects, fetches `/events` to rebuild state |
| Host submits duplicate finalize | Idempotent — if `game_scores` rows exist for `game_id`, return existing result |
| Invalid `event_type` for sport | Pydantic validation rejects at WS message parse |
| Undo on empty event log | Returns `{"error": "nothing_to_undo"}` |

---

## 8. Testing Plan

### Backend
- Unit: Pydantic schema validation for each sport's `sport_details`
- Unit: Finalize aggregation logic (events → game_scores) for each sport
- Integration: Full flow — connect WS → emit events → end_game → verify `game_scores` + `player_stats`
- Integration: Leaderboard query returns correct ranking by scope

### Flutter
- Widget test: `ScoreEventPadWidget` renders correct buttons per sport
- Widget test: `LiveScoreboardWidget` updates when `liveScoreProvider` state changes
- Unit: Derived stat computation (strike_rate, economy_rate, fg_pct) in score detail widget

---

## 9. Out of Scope (v1)

- Volleyball (deferred — can be added with zero DB changes, just a new sport schema)
- American Football (Soccer only for football)
- Player dispute / score challenge flow (host-only removes the need)
- Spectator mode (non-players watching live)
- Historical analytics / graphs beyond existing `player_stats` weekly activity
