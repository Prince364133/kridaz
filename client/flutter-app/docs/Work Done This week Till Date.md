# Uncommitted Work — Plain-English Overview

A snapshot of everything that's sitting uncommitted in your two working trees
as of 2026-06-11. Written for someone who isn't reading the diff line-by-line.

Two repos:

1. **`C:\Users\Hp\Desktop\bms\bms`** — the Flutter mobile app.
2. **`C:\Users\Hp\Desktop\kridaz`** — the Node/Express backend (with a copy of
   the same Flutter app inside it) and the Postgres schema.

The numbers below come straight from `git status` and `git diff --stat HEAD`.

---

## Part A — `kridaz` (the server)

About **+2,100 / -400 lines** across the server folder, plus several brand-new
files. This is one big body of work: a major **Player Profile** overhaul, plus
a deployment notes doc for scoring latency.

### A1. The Player Profile rebuild (6 phases + a 7th cleanup pass)

Driven by the spec at `bms/docs/superpowers/specs/2026-06-10-player-profile-backend.md`.
The implementation notes are in `server/docs/plans/2026-06-10-player-profile-implementation.md`.

In layman terms — the player's profile used to be a thin record (name,
phone, photo, sports). It's now a rich, social, gamified profile. What
changed:

- **Bigger user record.** The `User` table grew 16 new columns: cover image,
  preferred foot/hand, languages spoken, how far they'll travel to play,
  what they're looking for (pickup matches / coaching / tournaments…),
  skill level per sport, preferred positions, weekly availability, privacy
  toggles (show on map, allow DMs, stats public), XP, level, verification
  flags (phone / email / ID), and a profile-view counter.
- **Blocking.** New `BlockedUser` table — users can now block each other.
  A new middleware (`server/middleware/block.middleware.js`) and a small
  utility (`server/utils/dmGate.js`) check that gate before letting one
  user message another.
- **XP and levels.** New `XpEvent` ledger table. Every time a user plays a
  match, hosts a game, gets a booking, or writes a review they earn XP.
  Service: `server/services/xp.service.js`. Constants live in
  `playerStatsAggregator.service.js` (base 50 per match, +20 for a win,
  +30 for MOTM).
- **Per-sport career stats.** `PlayerCareerStats` was extended to cover
  football (goals, assists, clean sheets) and cross-sport things
  (draws, win streak, longest streak, MVP/MOTM counts, a 1200-base rating,
  hours played). A new `MatchParticipant` table is one row per (match,
  user) — the single place that powers recent-matches lists and the
  heatmap, no matter the sport.
- **Achievements.** New `server/services/achievement.service.js` —
  milestone-style awards (first match, 10 wins, etc.). A daily 02:00 UTC
  job sweeps for new milestones.
- **Player reviews.** New `server/services/playerReviewAggregator.service.js`
  rolls up per-user review averages on a schedule.
- **Leaderboards.** New `server/services/leaderboardSnapshot.service.js`
  builds an hourly snapshot so the leaderboard endpoint is cheap to read.
- **Background-job plumbing.** New BullMQ queue in
  `server/queues/playerStats.queue.js` runs three repeatables:
  - Milestone sweep — daily 02:00 UTC.
  - Profile-view cleanup — daily 03:00 UTC.
  - Leaderboard snapshot — hourly.
- **Match-completion fan-out.** New `matchCompletedEmitter.service.js` —
  whenever a match wraps, it pushes a job onto the queue (keyed by
  `match-completed:${matchId}` so re-finalizing a match is a no-op).

### A2. SQL migrations

Six idempotent SQL files under `server/migrations/`, applied in order
against the local `kridaz` Postgres:

1. `phase1_player_profile_base.sql` — adds new User columns, creates
   `BlockedUser` + `XpEvent`, retires the old `UserProfile` table after
   moving data over.
2. `phase2_player_profile_stats.sql` — career-stats schema extension +
   `MatchParticipant`.
3. `phase3_player_reviews.sql` — review tables.
4. `phase4_achievements_xp.sql` — achievements schema, indexes.
5. `phase5_player_media.sql` — media gallery support.
6. `phase6_discovery_privacy.sql` — search/discovery + privacy indexes.

Plus a Prisma migration folder under `server/prisma/migrations/` for the
ORM side. Two old tables retired: `UserProfile` (data merged into `User`
first) and `UserBadge` (rows migrated into `UserAchievement`).

### A3. The route layer

- `server/modules/player/player.controller.js` grew by ~1,250 lines —
  **25+ new endpoints** powering all of the above (profile fetch, edit,
  block/unblock, follow, reviews, leaderboards, XP history, achievements,
  privacy toggles).
- `server/modules/player/routes/user.routes.js` grew by ~250 lines wiring
  those endpoints, with **5 new rate limiters** added in
  `server/middleware/rateLimiter.middleware.js` to protect the chatty
  ones.
- `server/modules/auth/auth.controller.js` was updated so `getMe` now
  returns `_count: { followers, following }` in one round-trip — the
  client doesn't have to make a second call after login.
- `server/utils/sanitizeUser.js` was upgraded to a versioned shape
  (`profileShapeVersion: 2`) so the client always gets a predictable
  payload regardless of which DB columns happen to be present.

### A4. Tests + small adjustments

- `server/tests/player.test.js` and `team.test.js` had 2 lines each
  removed (skipped checks that didn't fit the new model).
- `server/server.js` boots the new queues on startup and shuts them down
  on exit.
- `server/config/prisma.js` / `socket.js` got small tuning changes.
- `server/utils/settlementWorker.js` picked up a couple of guard lines.
- `server/modules/chat/chat.controller.js` + `message.controller.js`
  picked up the block-gate check (you can't DM someone who's blocked you,
  and vice versa).
- `server/services/careerStats.service.js` was refactored (~100 lines) to
  feed the new aggregator instead of computing inline.

### A5. Notably **not** done

Per direct instruction during implementation: the `is_reels_creator` flag
and the reels gating endpoints in the spec were **intentionally skipped**.
Reels stay admin-whitelisted (matching the standing rule in your auto-memory).

### A6. Scoring latency — `OPS_LATENCY_NOTES.md` at the repo root

A separate, smaller piece of work — a deployment checklist (not code). It
explains that the 6-7 second lag people see during live scoring is **not a
code bug** anymore; the remaining win is in the deployment topology. Three
action items:

1. **App and Postgres must be in the same region.** Each ball write is 3-4
   round-trips inside a transaction, so a 70ms cross-region RTT becomes
   ~300ms of pure latency before any real work happens.
2. **Use the pooler URL, not the direct URL.** Neon/Supabase expose two
   connection strings — the pooled one (PgBouncer) hands out warm
   connections in milliseconds instead of opening a fresh TCP+TLS
   handshake every time.
3. **HTTP/2 + keep-alive on the reverse proxy.** A 1-2KB scoring update
   over HTTP/1.1 without keep-alive pays the TLS handshake every ball
   (~80-150ms on cellular). HTTP/2 also avoids head-of-line blocking.

The doc gives a Nginx example config for #3 and a verification recipe at
the end (score 10 balls, snapshot should land within ~500ms).

---

## Part B — `bms\bms` (the Flutter app)

Two layers of work sitting uncommitted:

1. A large, pre-existing refactor that was already in flight when this
   session started — about **+22,500 / -19,200 lines** across `lib/`.
2. The **nearby-players live tracking** wiring done in this session.

### B1. Strip-out of the marketplace / cart / mock-backend code

The app is moving off its old "shop for gear and rentals" surface area.
Files **deleted**:

- Shopping/cart screens: `cart_screen.dart`, `category_cart_screen.dart`,
  `marketplace_cart_screen.dart`, `marketplace_coach_detail_screen.dart`,
  `marketplace_product_detail_screen.dart`,
  `marketplace_rental_detail_screen.dart`, `gear_equipment_screen.dart`,
  `media_services_screen.dart`, `ecommerce_home_screen.dart`,
  `product_detail_screen.dart`, `professional_booking_screen.dart`,
  `rental_booking_screen.dart`, `rentals_screen.dart`,
  `tournament_essentials_screen.dart`.
- Models: `cart_item_model.dart`, `product_model.dart`.
- Providers: `cart_provider.dart`.
- Services: `cart_api_service.dart`, `ecommerce_service.dart`,
  `gear_service.dart`, `media_services_service.dart`,
  `product_api_service.dart`, `rentals_service.dart`.
- Widget: `cart_icon_button.dart`.
- And the entire **`backend/`** folder at the repo root — the legacy
  Python/FastAPI mock backend (models, routers, schemas, requirements,
  setup scripts, even the mock S3 upload bucket). The real backend lives
  in `kridaz/server`, so this Python stub is being deleted.
- Tier-1 task-tracking CSVs: `clickup_backend_tasks.csv`,
  `clickup_frontend_tasks.csv`, `clickup_tasks.csv`.

### B2. New screens and flows being added

In layman terms — the app is gaining a bigger social and competitive
surface:

- **Community + content:** `community_screen.dart`, `blogs_screen.dart`,
  `discover_players_screen.dart`, `pending_requests_screen.dart`,
  `saved_items_screen.dart`, `theme_preview_screen.dart`.
- **Match journey:** `match_details_screen.dart`,
  `match_analytics_screen.dart`, `match_review_screen.dart`,
  `match_view/` folder, `join_game_info_screen.dart`,
  `raise_dispute_screen.dart`.
- **Live scoring & streaming:** `live_overlay_screen.dart`,
  `stream_setup_screen.dart`, plus a `scoring/` subfolder with the
  refactored scoring screens and `widgets/scoring/` for the parts.
- **Leaderboards:** `leaderboard_screen.dart`.
- **Operational guard-rails:** `force_update_screen.dart`,
  `legal_webview_screen.dart`.
- **Dev tools:** a `dev/` screens folder + `widgets/common/otp_dev_toast.dart`
  for local OTP testing.
- **Filters and pickers:** `pros_filter_sheets.dart`,
  `widgets/teams/contact_picker_sheet.dart`.

New models: `pending_match_model.dart`, `post_model.dart`.
New provider: `pending_matches_provider.dart`.
New widgets: `widgets/profile/profile_hero.dart`, `profile_pieces.dart`,
`profile_quick_stats_strip.dart`, `widgets/common/bms_light_input.dart`,
`filter_apply_button.dart`, `widgets/home/` folder.

### B3. New "clean architecture" layout

A bunch of new top-level folders under `lib/` that look like a deliberate
move to a layered architecture:

- `lib/data/`, `lib/domain/`, `lib/presentation/` — the classic
  data/domain/presentation split.
- `lib/core/clock/` — testable time abstraction (so tests don't depend on
  `DateTime.now`).
- `lib/core/di/` — dependency-injection wiring.
- `lib/core/error/` — common error types.
- `lib/core/network/` — networking primitives.
- `lib/core/observability/` — analytics / logging hooks.
- `lib/core/storage/` — local storage abstraction.
- `lib/core/util/` — small helpers.
- `lib/core/version/` — version-check support for the new force-update
  flow.
- `lib/core/constants/country_codes.dart` — phone-number country list.

### B4. New services (the network/API layer)

Either brand-new or freshly broken out:

- `apple_auth_service.dart` — Sign-in-with-Apple.
- `community_service.dart` — community feed.
- `content_services.dart` — blogs/posts content.
- `match_feed_service.dart` — match-completed fan-out on the client.
- `player_profile_service.dart` — talks to the new kridaz profile
  endpoints described in Part A.
- `push_notification_service.dart` — FCM wiring.
- `review_service.dart` — player reviews.
- `streaming_service.dart` — live-stream setup.
- **`location_socket_service.dart`** — the live WebSocket from this
  session (see B6).

### B5. Android package rename + build plumbing

The Android module was renamed from `com.example.flutter_phone_app` to
**`com.kridaz`** — the new Kotlin source dir lives at
`android/app/src/main/kotlin/com/kridaz/`, and the old
`MainActivity.kt` under the `com.example.flutter_phone_app` path is gone.
`AndroidManifest.xml`, `build.gradle`, `google-services.json`, and
`gradle.properties` were all updated to match. iOS build artifacts under
`ios/Flutter/` and `ios/Runner/` also moved, and a new
`ios/Runner/PrivacyInfo.xcprivacy` was added (App Store requires it).

`pubspec.yaml` + `pubspec.lock` changed — new dependencies came in for
the work above (shared_preferences, flutter_map, geolocator, socket_io_client,
etc.).

### B6. **This session's work — Nearby Players live tracking**

This is the targeted bit of work added in the most recent conversation.
Goal: make the "nearby players" map behave like the kridaz web client —
real-time pin movement, privacy gates, GPS handling done responsibly.

Five files touched:

1. **`lib/services/location_socket_service.dart`** *(new)* — a singleton
   Socket.IO client. It connects with the user's Bearer token, says hello
   to the server with a `setup` event (so it joins that user's personal
   room), emits **`location:update`** outbound when the GPS moves, and
   listens for the server's **`nearby:location:update`** broadcast — which
   it republishes as a Dart `Stream<NearbyLocationUpdate>` that any
   screen can subscribe to.
2. **`lib/services/auth_manager.dart`** *(modified)* — connects the new
   socket on login (right next to the existing chat socket) and
   disconnects it on logout. Same lifecycle as chat.
3. **`lib/services/friends_service.dart`** *(modified)* — added a
   `setLocationSharing(bool)` helper. Privacy-off sends `(0,0)` so the
   server wipes your saved coordinates instead of remembering the last
   real one.
4. **`lib/screens/nearby_players_home_screen.dart`** *(major rewrite)* —
   the actual map screen. What it now does:
   - **Continuous GPS** via `Geolocator.getPositionStream` with a 10-metre
     `distanceFilter`. The old code took a single GPS reading and
     stopped.
   - **Throttled emits** — a fix is only kept if you've moved >50 m or
     the last one is >30 s old. The map doesn't shake when you're sitting
     still.
   - **Accuracy gate** — fixes with accuracy worse than 200 m are dropped
     so a bad indoor GPS read doesn't yank your pin across town.
   - **30-second heartbeat** — even if you don't move, the screen
     refetches `/user/players/nearby` every 30 seconds so people who walk
     up to you appear.
   - **Live socket updates** — when the server tells us someone nearby
     moved, that single player's pin is patched in place; if it's a brand
     new face we trigger a fresh `/nearby` fetch.
   - **App-lifecycle aware** — `WidgetsBindingObserver` pauses the GPS
     stream and the heartbeat when the app goes to background, restarts
     them on resume. (Battery + privacy.)
   - **Last-known location cache** — saved to `SharedPreferences` under
     `bms_guest_location`, so a cold start with no GPS yet can still show
     something useful.
   - **Privacy "eye" toggle overlaid on the map** — tap to flip
     visibility on/off without leaving the screen. Same toggle wired up
     in the settings screen below.
   - **Zoom-aware clustering** — when you zoom out, overlapping pins
     collapse into a single badge with a count. Implemented with a
     `_PinNode` sealed type (`_SinglePin` / `_Cluster`) and a radius that
     scales with the map zoom (80 / 60 / 30 px depending on band).
   - **Real profile fetch** — tapping a pin now calls
     `FriendsService.getPlayerProfile(id)` instead of showing a stub
     card.
5. **`lib/screens/nearby_players_settings_screen.dart`** *(modified)* —
   the "Go Online" Switch is now wired to `setLocationSharing` with
   optimistic UI (flip first, roll back on API failure), a toast on
   success / failure, and `SharedPreferences` persistence so the screen
   remembers your preference between launches.

`flutter analyze` on those five files is clean — the only remaining
warning is on pre-existing `_GlassMsgButton({this.onTap})` code that
wasn't part of this work.

### B7. Other new docs already sitting in `docs/`

Not written this session, but present in the uncommitted set and worth
knowing about:

- `docs/KRIDAZ_SOFTWARE_DOCUMENTATION.md` — overall app overview.
- `docs/MOBILE_LAUNCH_CHECKLIST.md` — the launch readiness list.
- `docs/REELS_PERFORMANCE_BACKEND.md` — reels infrastructure notes.

### B8. Trivial / housekeeping bits

- `node_modules/`, `package.json`, `pnpm-lock.yaml`, `.github/`, and
  `.claude/scheduled_tasks.lock` show up — these are local dev tooling,
  not app code.
- A few `LF→CRLF` warnings on `git diff` — Windows line-ending
  normalization, harmless. Worth setting `.gitattributes` on commit so
  the diff isn't full of them.
- Lots of new `assets/images/` files (3D icons, sport icons, backgrounds,
  onboarding art) that the new screens above use.

---

## Part C — Visual / UI changes (Flutter side)

This section is dedicated to "what someone using the app would actually
see is different." Most of these live under `lib/core/` (design tokens,
theme) and `lib/widgets/` + `lib/screens/` (the rendered surfaces).

### C1. Design-system expansion (a real palette, finally)

`lib/core/constants/app_colors.dart` gained **20+ new colour tokens**.
Until now, screens were sprinkling raw hex values inline; the new tokens
are the single source of truth. The additions, in plain English:

- **A wider accent set** — `accentNeonGreen`, `accentLime`,
  `accentLimeBright`, `accentTeal`, `accentOrange`, `accentOrangeDeep`,
  `accentBlue` (+ dark/light variants), `accentPink`, `accentPurple`,
  `accentIndigo`, `accentGoldWarm`, `errorRed`. So a card can say
  "use `accentTeal`" instead of "use `0xFF4ECDC4`."
- **Gradient endpoints exposed as solid tokens** — `gradientStart`
  (cyan `#55DEE8`) and `gradientEnd` (lime `#BFF367`), so when a screen
  wants just the lime tail of the brand gradient as a solid colour it
  has a name for it.
- **Web-parity tokens** — explicit comments mark these as mirrors of the
  Kridaz web frontend's CSS variables, so the two surfaces look
  identical:
  - `primaryGlow` → `--primary-glow` (lime at 40% alpha, used for focus
    rings and button-hover halos).
  - `primaryDark` → `--primary-dark` (`#A2D152`, slightly darker lime
    for pressed states and shadows on lime CTAs).
  - `cardBorderWeb` → `--card-border` (`#2D2D2D`, hairline card edge
    subtler than the existing `borderGray`).
- **Sport-tinted card surfaces** — four new tinted backgrounds for
  themed cards: `surfaceSlate` / `surfaceSlateDeep` (cricket / league /
  premium) and `surfaceForest` / `surfaceForestDeep` (football / turf).

`lib/core/constants/premium_gradients.dart` was cleaned up at the same
time — the green, purple, and orange `PremiumGradients` constants
stopped hard-coding hex colours and now reference `AppColors` tokens.
Change a token, all three gradients update.

### C2. Icon system migration — Material → Lucide

Across the dashboard, drawer, login, and other screens, `Icons.*` calls
(Flutter's built-in Material set) are being replaced with
`LucideIcons.*`. Visible difference: the icons are thinner, more
outline-style, and match the look on the kridaz web app. Examples from
the profile drawer alone:

- `Icons.chat_bubble_outline_rounded` → `LucideIcons.messageCircle`
- `Icons.group_outlined` → `LucideIcons.users`
- `Icons.calendar_today_outlined` → `LucideIcons.calendar`
- `Icons.emoji_events_outlined` → `LucideIcons.trophy`
- `Icons.person` → `LucideIcons.user`

This is happening project-wide, not just on those screens.

### C3. Profile drawer — flipped from right to left

`lib/screens/home/profile_drawer.dart` used to round its **top-left and
bottom-left** corners, meaning the drawer slid in from the **right** edge
of the screen. The corners flipped to **top-right + bottom-right**, so
it now slides in from the **left** edge — matching how iOS / Android
users expect the avatar-in-the-corner pattern to behave. While that file
was open, all of its icons were swapped to Lucide and ~150 lines of new
menu items were added (the new community/blogs/leaderboard etc. entries
from section B2 plug into the drawer here).

### C4. Bottom navigation — selected-state gradient

`lib/widgets/navigation/glass_bottom_navigation.dart` previously tinted
the selected tab with a hard-coded teal gradient
(`#3BE8B0 → #2AD4A0`). It now uses the brand tokens —
`AppColors.accentCyan → accentNeonGreen` — so the active-tab glow
matches the rest of the new design system.

### C5. Login flow redesign

`lib/screens/bms_login_screen.dart` was reworked from a phone-only login
into a more flexible identifier + step-up OTP flow:

- The phone-number-only field became a **single "email or phone"
  identifier field** (`_identifierCtrl`). One UI handles both.
- The hard-coded country-code dropdown (+91/+1/+44/+61/+971/+65) was
  removed — country codes now live in
  `lib/core/constants/country_codes.dart` and are picked up by the new
  light-input widget instead.
- A **step-up OTP step** was added — if the server responds with
  `requiresOtp: true` (e.g. logging in from a new device), the screen
  switches to an OTP entry mode with a hint about where the code was
  sent. The new `_otpStep` boolean state and `_otpHint` drive this UI.
- New helper widget `lib/widgets/common/bms_light_input.dart` provides
  the lighter-themed input fields used on this screen.
- `lib/widgets/common/otp_dev_toast.dart` lets the dev OTP code drop in
  as an in-app toast in dev builds, so you can paste-test without a real
  SMS.

The home dashboard, register, OTP, and phone-auth screens picked up
matching visual changes so the whole onboarding flow feels consistent.

### C6. Profile screens — big visual rebuilds

Two of the largest visual changes in the diff, by line count:

- `lib/screens/my_profile_screen.dart` — **+2,343 lines net** (the
  rewrite isn't 100% additive; the file roughly doubled in size).
- `lib/screens/player_profile_screen.dart` — **+1,252 lines net** with a
  similar pattern.
- `lib/screens/new_home_dashboard.dart` — **2,171 lines reorganised**
  (more of a refactor — line counts went from ~1,100 → ~1,200 with
  heavy reshuffling).

These rewrites lean on three brand-new widgets under
`lib/widgets/profile/`:

- **`profile_hero.dart`** — the top "hero" block of the profile (cover
  image + avatar + name + verification badges + level chip).
- **`profile_pieces.dart`** — the smaller atoms that the profile is
  composed from (chips, stat rows, section headers).
- **`profile_quick_stats_strip.dart`** — the horizontal strip of headline
  numbers (matches played, win rate, XP, level) that sits under the
  hero.

The shape of this rebuild matches the **Player Profile** backend work
from Part A (cover image, XP, level, verification flags, per-sport
stats, languages, looking-for tags). Both ends were planned together.

### C7. Other visual housekeeping

- `lib/widgets/dashboard/social_post_card.dart` — switched its hard-coded
  `#707070` border and `#0E0E0E` bottom bar to `AppColors.borderLight`
  and `AppColors.surfaceL0`, and added a small `isHttpUrl()` guard so
  the placeholder shows cleanly when the image URL is empty / non-HTTP.
- `lib/widgets/dashboard/glassmorphic_search_bar.dart`,
  `premium_feature_card.dart`, `section_title_divider.dart`,
  `widgets/profile/setting_menu_tile.dart` — small token swaps and
  formatting cleanups (no behavioural change, just a sweep replacing
  inline hex with `AppColors.*`).
- `lib/widgets/teams/invite_member_modal.dart` (+432 lines),
  `member_card.dart` (+305 lines), `opponent_request_modal.dart` (+63),
  `create_team_modal.dart` (+53) — teams UI got a fresh coat of paint
  to match the new design system; the invite modal in particular grew a
  contact-picker sheet (`widgets/teams/contact_picker_sheet.dart`) that
  pulls from the device address book.
- `lib/widgets/host_game/step3_venue_widget.dart` (+101),
  `step4_quick_widget.dart` (+54), `step5_preview_widget.dart` (+39),
  `step4_professional_widget.dart` (+31) — the host-game wizard's steps
  were tightened up visually.
- New onboarding art and 3D sport icons under `assets/images/` — the
  fresh visual identity (3D icons of a map pin, a whistle, a stadium,
  pros, professional v2, scoreboard v2; new gender selector images;
  onboarding illustrations; sport icons; pros section assets).

### C8. This session's UI bits (nearby players)

Specifically added to the map screen in this session:

- **Privacy "eye" overlay** — a small circular button overlaid on the
  top-right of the map. Tapping it flips visibility on/off without
  leaving the screen and gives haptic + toast feedback.
- **Cluster badges** (`_ClusterBadge`) — when you zoom out, overlapping
  player pins collapse into a single round gradient badge with the count
  of how many people are inside. Tapping a cluster zooms the map in to
  re-expand them. The radius is zoom-aware (80 / 60 / 30 px depending
  on zoom band) so the clustering feels natural across the whole zoom
  range.

---

## Part D — YouTube live streaming during scoring

This is a cross-cutting feature that runs in **both repos at once**, so it
sits in its own section. The idea, in one sentence: while a scorer is
updating a cricket match ball-by-ball, the match can also be **broadcast
live to YouTube**, and the live embed shows up inside the app for viewers
to watch in-line with the scorecard.

The server endpoints powering this already exist on `kridaz` (the
modifications to `scoring.service.js` extend them); the mobile client
side is **brand-new and untracked** — three files added in this branch.

### D1. What's new on the mobile side

Three new files in `bms\bms\lib\`:

- **`services/streaming_service.dart`** *(new)* — talks to the kridaz
  streaming endpoints. The public surface:
  - `youtubeOAuthUrl()` / `facebookOAuthUrl()` — builds
    `${ApiConfig.apiUrl}/auth/youtube/start?platform=mobile` (and the
    Facebook equivalent). The mobile app opens this in the system
    browser via `url_launcher`; the web flow does it in a popup.
  - `listYoutubeAccounts()` / `listFacebookAccounts()` — GETs
    `/youtube/accounts` (or `/facebook/accounts`), returns the channels
    that user has previously connected.
  - `createYoutubeStream({matchId, title, channelId})` — POSTs
    `/youtube/stream/create?matchId=…` with the title and channel.
    The server creates a real YouTube live broadcast via Google's Live
    Streaming API and returns `{streamUrl, streamKey, embedUrl, …}`.
  - `endYoutubeStream(matchId)` — POSTs `/youtube/stream/end/:matchId`
    when the scorer stops broadcasting.
- **`screens/stream_setup_screen.dart`** *(new)* — the "Go Live"
  screen the scorer opens from inside the scoring flow. It:
  1. Shows a YouTube / Facebook platform picker (Facebook is still
     stubbed with a "coming soon" toast — YouTube is the active path).
  2. Lists the user's connected channels via
     `listYoutubeAccounts()`. If none, the **Connect** button launches
     the OAuth URL in the system browser. After the user finishes
     Google sign-in, the backend callback redirects to
     `kridaz://oauth/youtube` (a deep-link the app's manifest handles),
     and the screen re-fetches the channel list.
  3. Takes a stream title (defaults to "Live Match").
  4. **Go Live** button calls `createYoutubeStream(…)`. On success the
     screen flips into an "active" state showing a red `LIVE` badge,
     the embed URL (selectable for sharing), and a **Copy stream key**
     button so an external encoder (OBS) can be pointed at the RTMP
     ingest if the scorer is using one.
  5. After `createYoutubeStream` returns, the screen **also** calls
     `ScoringService.updateStreamConfig(matchId, platform, streamUrl,
     streamKey)` to persist the embed URL onto the match record. This
     is what makes the live tile appear inside the scoring screen for
     everyone watching.
  6. **End Live** button calls `endYoutubeStream(matchId)`.
- **`screens/live_overlay_screen.dart`** *(new)* — the broadcast
  overlay shown on top of the scoring camera feed (score, last over,
  batsmen, ticker).

### D2. How it plugs into the scorer side

`ScoringService.updateStreamConfig(…)` is the glue. The new endpoint it
calls is **`PUT /scoring/:matchId/stream-config`** with body:

```json
{
  "platform": "youtube",
  "streamUrl": "https://www.youtube.com/embed/<videoId>",
  "streamKey": "<rtmp-key>"
}
```

Once that's saved, anyone fetching the match snapshot (`/scoring/snapshot/:matchId`
or the WebSocket `liveScore` push) sees the embed URL and can render the
live tile alongside the scorecard.

### D3. What the server already knows about a live stream

From `kridaz/server/prisma/schema.prisma`, the cricket match record
carries these live-stream-related columns:

- `isLive` — boolean flag flipped on first frame.
- `streamStatus` — `"offline" | "starting" | "live" | "ended"`.
- `liveStartedAt` — timestamp the broadcast went up.
- `overlayToken` — short-lived token the OBS overlay URL uses to
  authenticate without exposing the scorer's main session.
- `overlayConfig` — JSONB blob with ticker theme, colours, fields to
  show. Driven from the new ticker-theme dropdowns.
- `lastCommentary` + `lastCommentaryAt` — last text commentary, fed
  into the overlay as a scroll.
- `liveScoreSnapshot` — JSONB cached copy of the most recent score so
  reconnects + page reloads paint instantly.
- `tickerTheme` — defaults to `"neon_classic"`; new themes can be added
  without a schema change.

Separately the hosted-game record has a `youtubeLiveUrl` text column
that older hand-pasted streams used (entered manually by the host
during game setup), and a dedicated stream model carries
`streamId`, `videoId`, `streamKey`, `rtmpUrl`, `watchUrl` for the
YouTube-API-managed broadcasts created via the new flow.

### D4. The Redis live-state layer

`server/services/liveState.service.js` keeps the hot live-stream state
in Redis (not Postgres) so reads are cheap. The functions that matter
for streaming:

- `setStreamStatus(matchId, status)` — flips the Redis key to
  `starting` / `live` / `ended`. The scoring service calls this at the
  same time as the DB write, so subscribers on the WebSocket see the
  status change in real time without polling Postgres.
- `setOverlayConfig(matchId, config)` — overlay JSON for the OBS
  browser source.
- `setLiveScore(matchId, snapshot)` — every ball update pushes a
  new snapshot here; viewers reading via the Socket.IO `live:score`
  channel get sub-second updates.

The lifecycle on the scoring side (`server/modules/scoring/scoring.service.js`):

```
startLiveStream() →  DB:  streamStatus = "starting"
                          liveStartedAt = now()
                          overlayToken = <fresh token>
                     Redis: setStreamStatus("starting")
                            setOverlayConfig({...})

every ball   →  Redis: setLiveScore(snapshot)  (HTTP ack returns
                       immediately; snapshot recomputes via
                       setImmediate so the scorer never waits)

endLiveStream()  →  DB:  streamStatus = "ended"
                         overlayToken = null
                    Redis: setStreamStatus("ended")
```

### D5. The mobile end-to-end flow, in order

1. Scorer taps **Go Live** in the scoring screen → opens
   `StreamSetupScreen`.
2. `_loadAccounts()` fires → GETs `/youtube/accounts`.
3. If empty → scorer taps **Connect YouTube** → app calls
   `launchUrl(youtubeOAuthUrl(), mode: externalApplication)`.
4. System browser opens `/auth/youtube/start?platform=mobile` →
   redirects to Google OAuth → user grants access → backend handles
   the callback and stores the access + refresh token under the user.
5. Backend redirects to `kridaz://oauth/youtube` → the
   `AndroidManifest.xml` intent-filter (the `<data android:scheme="kridaz"/>`
   block on `MainActivity`) routes back into the app.
6. Scorer returns to `StreamSetupScreen`, taps refresh — channels load.
7. Scorer enters a title, picks a channel, taps **Go Live**.
8. `createYoutubeStream(…)` → POST `/youtube/stream/create?matchId=<id>`.
   - Server creates a YouTube live broadcast + stream pair via Google's
     Live Streaming API, persists `streamId/videoId/streamKey/rtmpUrl/watchUrl`,
     flips `streamStatus → "starting"`, sets `liveStartedAt`, returns
     the payload.
9. `updateStreamConfig(…)` → PUT `/scoring/:matchId/stream-config`
   saves the embed URL on the match — the live tile now shows up inside
   the scoring screen for all viewers.
10. Scorer's OBS / external encoder uses the **copied stream key** to
    push RTMP frames to YouTube. When the first frame lands,
    `streamStatus` flips to `"live"`.
11. Every ball the scorer enters → `liveStateService.setLiveScore(…)` →
    pushed via Socket.IO `live:score` → viewer apps + the overlay
    re-render within ~500ms (assuming the deployment-topology fixes
    from §A6 are in place).
12. Match ends (or scorer taps **End Live**) → `endYoutubeStream(matchId)`
    → POST `/youtube/stream/end/:matchId` → server ends the broadcast
    on Google's side, flips `streamStatus → "ended"`, clears
    `overlayToken`.

### D6. Why this is a kridaz-driven feature, not bms-driven

All the heavy lifting — OAuth token management, Google API calls,
broadcast lifecycle, Redis cache, overlay token generation — lives on
the server. The mobile client is intentionally thin: it triggers the
OAuth flow in a browser, hits five REST endpoints, and renders the
embed URL once the server hands it back. This means:

- The same backend endpoints power both the **web scorer** and the
  **mobile scorer**, so they can't drift apart.
- Adding **Facebook Live** later is a backend job — the mobile UI
  already has the platform picker in place; only the FB endpoints need
  to be filled in.
- If a YouTube API change breaks broadcasts, the fix ships in a server
  deploy. No app-store roundtrip needed.

---

## How to think about committing this

Both repos are sitting on a large, mixed pile. If you ever want to land it
cleanly, the natural cuts are probably:

**kridaz** — one commit per phase (the implementation doc already lists them),
then a final commit for `OPS_LATENCY_NOTES.md` since it's deployment-only and
unrelated to the code.

**bms\bms** — three logical groupings:

1. **Cleanup** — delete the marketplace, cart, ecommerce, gear, rentals,
   and the legacy Python `backend/` folder. One PR, all deletions.
2. **Profile + community surface** — the new screens, services, models,
   widgets, and the clean-architecture folders.
3. **Nearby-players live tracking** — the five files from B6. Self-contained,
   small, reviewable in one sitting.

The Android package rename and the iOS PrivacyInfo file are best landed
on their own so the build-system change is bisectable.
