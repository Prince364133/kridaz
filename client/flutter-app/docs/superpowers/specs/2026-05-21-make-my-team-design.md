# Make My Team — Feature Design Spec

**Date:** 2026-05-21  
**Project:** BMS Flutter App  
**Feature Source:** Kridaz web app (`/client/user/src/features/teams/`)  
**Status:** Approved

---

## 1. Overview

Integrate the "Make My Team" feature from the Kridaz web platform into the BMS Flutter app. This allows users to create sports teams, manage member rosters with roles, share team codes/QR, download a digital Team Pass, and challenge opponent teams to matches.

**Entry point:** Profile/Settings tab → "My Teams" list tile  
**Backend:** Reuse existing Kridaz backend API endpoints (no new server work)  
**Design style:** BMS existing style — dark background, lime green (#94EA01) primary, Poppins font, glassmorphic cards

---

## 2. Architecture

### Screen Structure

| File | Route | Purpose |
|---|---|---|
| `lib/screens/my_teams_screen.dart` | `/my-teams` | List of user's teams + Create Team FAB |
| `lib/screens/team_detail_screen.dart` | `/my-teams/:id` | Team overview, members summary, action hub |
| `lib/screens/team_members_screen.dart` | `/my-teams/:id/members` | Full member list with roles, status, actions |
| `lib/screens/team_pass_screen.dart` | `/my-teams/:id/pass` | Digital membership card with QR + PNG download |
| `lib/screens/challenge_team_screen.dart` | `/my-teams/:id/challenge` | Search & challenge an opponent team |

### Modals / Bottom Sheets

| Widget | Triggered From | Purpose |
|---|---|---|
| `lib/widgets/teams/create_team_modal.dart` | MyTeamsScreen FAB | Multi-field team creation form |
| `lib/widgets/teams/invite_member_modal.dart` | TeamDetailScreen / TeamMembersScreen | Search users or add custom player |
| `lib/widgets/teams/opponent_request_modal.dart` | TeamDetailScreen (incoming) | Accept / decline opponent challenge |

---

## 3. Data Models

### `lib/models/team_model.dart`

```dart
class TeamModel {
  final String id;
  final String name;
  final String? description;
  final String teamCode;        // unique 10-char join code
  final String? imageUrl;
  final String? logoUrl;
  final String sportType;
  final String? city;
  final String? captainName;
  final String? captainPhone;
  final String ownerId;
  final String? qrCode;         // base64 or URL
  final List<TeamMemberModel> members;
  final List<TeamCustomMemberModel> customMembers;
}

class TeamMemberModel {
  final String teamId;
  final String userId;
  final TeamRole role;           // CAPTAIN, VICE_CAPTAIN, PLAYER, GUEST
  final TeamMemberStatus status; // JOINED, PENDING, ACCEPTED, DECLINED
  final String? userName;
  final String? avatarUrl;
  final String? city;
}

class TeamCustomMemberModel {
  final String teamId;
  final String name;
  final String? email;
  final String? phone;
  final String status;
  final String? inviteToken;
}

enum TeamRole { captain, viceCaptain, player, guest }
enum TeamMemberStatus { joined, pending, accepted, declined }
```

### `lib/models/team_opponent_request_model.dart`

```dart
class TeamOpponentRequestModel {
  final String id;
  final String teamAId;
  final String teamBId;
  final String status;    // PENDING, ACCEPTED, DECLINED
  final TeamModel? teamA;
  final TeamModel? teamB;
}
```

---

## 4. Service Layer

### `lib/services/team_service.dart`

Wraps all Kridaz team API endpoints using the existing `ApiService` (Dio client).

**Methods:**
```dart
Future<List<TeamModel>> getMyTeams()
Future<TeamModel> getTeamById(String id)
Future<TeamModel> createTeam(CreateTeamRequest request)
Future<void> updateTeam(String id, UpdateTeamRequest request)
Future<void> deleteTeam(String id)
Future<void> inviteMember(String teamId, InviteMemberRequest request)
Future<TeamModel> joinByToken(String token)
Future<TeamModel> findByCode(String code)
Future<void> requestOpponent(String teamId, String opponentTeamId)
Future<void> handleOpponentRequest(String requestId, bool accept)
Future<List<TeamModel>> getAllPublicTeams({String? sport, String? city})
```

**API base path:** reuses the Kridaz backend base URL from `lib/config/api_config.dart`  
**Endpoints:**
- `POST /api/team` — create
- `GET /api/team` — my teams
- `GET /api/team/:id` — by ID
- `GET /api/team/all` — public teams (for challenge search)
- `GET /api/team/find-by-code/:code` — join by code
- `POST /api/team/:id/invite` — invite member
- `POST /api/team/:id/request-opponent` — challenge
- `POST /api/team/:id/handle-opponent-request` — accept/decline
- `PUT /api/team/:id` — update
- `DELETE /api/team/:id` — delete
- `POST /api/team/join/:token` — join via token

---

## 5. State Management

### `lib/providers/team_provider.dart`

Uses Riverpod `StateNotifierProvider` pattern (consistent with existing providers).

```dart
// Providers
final teamServiceProvider = Provider((ref) => TeamService(...));
final myTeamsProvider = FutureProvider<List<TeamModel>>(...);
final selectedTeamProvider = StateProvider<TeamModel?>(...);
final teamDetailProvider = FutureProvider.family<TeamModel, String>(...);
```

**State managed:**
- List of user's teams
- Currently selected team
- Loading / error states per screen
- Invite flow state (search results, pending invites)

---

## 6. Screen Designs

### 6.1 MyTeamsScreen (`/my-teams`)

- **Header:** "My Teams" title + subtitle count ("3 teams")
- **Body:** `ListView` of `TeamCard` widgets — shows team logo, name, sport badge, member count
- **Empty state:** Illustration + "Create your first team" CTA
- **FAB:** Lime green (+) button → opens `CreateTeamModal`
- **Each card tap** → navigates to `TeamDetailScreen`

### 6.2 TeamDetailScreen (`/my-teams/:id`)

- **Header banner:** Team logo/image (large), team name, sport type badge, city
- **Team Code chip:** shows code + copy icon + Share button
- **Stats row:** matches played, wins, member count
- **Members preview:** first 4 member avatars → "View All" → `TeamMembersScreen`
- **Action buttons:**
  - "Invite Member" → `InviteMemberModal`
  - "Team Pass" → `TeamPassScreen`
  - "Challenge Team" → `ChallengeTeamScreen`
  - "Edit Team" → same modal as CreateTeamModal, pre-populated with current values → `PUT /api/team/:id`
  - "Delete Team" → confirmation dialog (owner only)
- **Incoming challenges section:** list of pending opponent requests → `OpponentRequestModal`

### 6.3 TeamMembersScreen (`/my-teams/:id/members`)

- **Header:** "Members" + count
- **Tabs:** "Registered" | "Custom" (non-platform invites)
- **Each member card:**
  - Avatar, username, city
  - Role badge (Captain / Vice Captain / Player / Guest) — color-coded
  - Status badge (Joined / Pending / Declined)
  - Owner actions: promote role, remove member
- **FAB:** "Invite Member" → `InviteMemberModal`

### 6.4 TeamPassScreen (`/my-teams/:id/pass`)

- Full-screen dark card styled as a digital membership pass
- Team logo (large, centered)
- Team name, sport, captain name, city
- QR code (centered, white background)
- Team code in monospace text
- **Actions:** Download as PNG (wrap card in `RepaintBoundary`, capture with `screenshot` package), Share
- Lime green gradient border around the card

### 6.5 ChallengeTeamScreen (`/my-teams/:id/challenge`)

- **Search bar:** filter public teams by name/sport/city
- **List of public teams:** team card with name, sport, city, member count
- **Tap to challenge:** confirmation bottom sheet → `POST /api/team/:id/request-opponent`
- **Pending sent challenges:** section showing outgoing requests + status

### 6.6 CreateTeamModal

- **Multi-field form:**
  - Team Name (required)
  - Sport Type (dropdown: Cricket, Football, Badminton, Volleyball, Basketball)
  - City (text input)
  - Team Logo (image picker → upload via existing `lib/services/image_storage_service.dart`)
  - Description (optional, 200 char limit)
  - Captain Name & Phone (optional)
- Submit → `POST /api/team` → refresh `myTeamsProvider`

### 6.7 InviteMemberModal

- **Two tabs:**
  - **Search Users:** type username/email → hits `/api/user/players/search` → tap to invite
  - **Add Custom:** name + phone fields → invite without platform account
- Both hit `POST /api/team/:id/invite`

### 6.8 OpponentRequestModal

- Shows challenger team info (name, logo, sport, city)
- Accept / Decline buttons → `POST /api/team/:id/handle-opponent-request`

---

## 7. Navigation & Routing

Add to `lib/router/app_router.dart`:

```dart
GoRoute(path: '/my-teams', builder: (_,__) => const MyTeamsScreen()),
GoRoute(path: '/my-teams/:id', builder: (_,s) => TeamDetailScreen(teamId: s.pathParameters['id']!)),
GoRoute(path: '/my-teams/:id/members', builder: (_,s) => TeamMembersScreen(teamId: s.pathParameters['id']!)),
GoRoute(path: '/my-teams/:id/pass', builder: (_,s) => TeamPassScreen(teamId: s.pathParameters['id']!)),
GoRoute(path: '/my-teams/:id/challenge', builder: (_,s) => ChallengeTeamScreen(teamId: s.pathParameters['id']!)),
```

**Entry point:** In the Profile/Settings tab screen, add a `ListTile` or `SettingMenuTile` (existing widget at `lib/widgets/profile/setting_menu_tile.dart`) pointing to `/my-teams`.

---

## 8. Error Handling

- All API calls wrapped in try/catch; errors surfaced via existing `ErrorWidget` + `RetryButton` pattern
- Network offline state uses existing `OfflineBanner` widget
- Image upload failure shows snackbar toast
- Invalid team code → inline error on form field

---

## 9. New Dependencies

| Package | Purpose |
|---|---|
| `qr_flutter` | Render QR code widget from team code string |
| `screenshot` or `RepaintBoundary` | Capture Team Pass as PNG for download |
| `share_plus` | Share team code / QR / Team Pass image |
| `image_picker` | Team logo upload (likely already in project) |

Check `pubspec.yaml` before adding — `image_picker` and `share_plus` may already be present.

---

## 10. File Structure Summary

```
lib/
  models/
    team_model.dart
    team_opponent_request_model.dart
  services/
    team_service.dart
  providers/
    team_provider.dart
  screens/
    my_teams_screen.dart
    team_detail_screen.dart
    team_members_screen.dart
    team_pass_screen.dart
    challenge_team_screen.dart
  widgets/
    teams/
      create_team_modal.dart
      invite_member_modal.dart
      opponent_request_modal.dart
      team_card.dart
      member_card.dart
      team_stats_row.dart
      team_code_chip.dart
docs/
  superpowers/
    specs/
      2026-05-21-make-my-team-design.md
```

---

## 11. Out of Scope (for now)

- Live match scoring integration from team context
- Team analytics / win-loss history charts
- Push notifications for team invites (can reuse existing `notifications_service.dart` later)
- Deep linking via team join URL
