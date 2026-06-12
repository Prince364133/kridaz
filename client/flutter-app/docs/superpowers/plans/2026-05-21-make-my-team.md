# Make My Team — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a full team management feature to the BMS Flutter app — create teams, manage members with roles, share via QR/code, show a digital Team Pass, and challenge opponent teams.

**Architecture:** New `TeamService` (singleton Dio, same pattern as `GameService`) + Riverpod `FutureProvider`/`StateNotifierProvider` in `team_provider.dart`. Five screens + three modals + seven reusable widgets. Entry point added to `settings_screen.dart`. All API calls go to the existing Kridaz backend at `ApiConfig.apiUrl` (already `https://kridaz.up.railway.app/api`).

**Tech Stack:** Flutter, Riverpod, GoRouter, Dio, `qr_flutter` (already in pubspec), `share_plus` (already in pubspec), `image_picker` (already in pubspec), `screenshot` (needs adding).

---

## File Map

**New files to create:**
```
lib/models/team_model.dart
lib/models/team_opponent_request_model.dart
lib/services/team_service.dart
lib/providers/team_provider.dart
lib/widgets/teams/team_card.dart
lib/widgets/teams/member_card.dart
lib/widgets/teams/team_code_chip.dart
lib/widgets/teams/team_stats_row.dart
lib/widgets/teams/create_team_modal.dart
lib/widgets/teams/invite_member_modal.dart
lib/widgets/teams/opponent_request_modal.dart
lib/screens/my_teams_screen.dart
lib/screens/team_detail_screen.dart
lib/screens/team_members_screen.dart
lib/screens/team_pass_screen.dart
lib/screens/challenge_team_screen.dart
test/team_model_test.dart
test/team_service_test.dart
```

**Files to modify:**
```
pubspec.yaml                   — add screenshot: ^2.3.0
lib/router/app_router.dart     — add 5 new routes + imports
lib/screens/settings_screen.dart — add "My Teams" entry card
```

---

## Task 1: Add `screenshot` dependency

**Files:**
- Modify: `pubspec.yaml`

- [ ] **Step 1: Add the package**

Open `pubspec.yaml`. After the `qr_flutter` line, add:

```yaml
  # Screenshot capture for Team Pass PNG download
  screenshot: ^2.3.0
```

- [ ] **Step 2: Install it**

```bash
flutter pub get
```

Expected output includes: `+ screenshot 2.3.0`

- [ ] **Step 3: Commit**

```bash
git add pubspec.yaml pubspec.lock
git commit -m "chore: add screenshot package for Team Pass PNG export"
```

---

## Task 2: Data Models

**Files:**
- Create: `lib/models/team_model.dart`
- Create: `lib/models/team_opponent_request_model.dart`
- Create: `test/team_model_test.dart`

- [ ] **Step 1: Write the failing model test**

Create `test/team_model_test.dart`:

```dart
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_phone_app/models/team_model.dart';

void main() {
  group('TeamModel.fromJson', () {
    test('parses full response', () {
      final json = {
        'id': 'abc123',
        'name': 'Thunder XI',
        'description': 'We play to win',
        'teamCode': 'THX1234567',
        'image': 'https://cdn.example.com/team.jpg',
        'logo': null,
        'sportType': 'Cricket',
        'city': 'Hyderabad',
        'captainName': 'Ravi',
        'captainPhone': '9876543210',
        'ownerId': 'user001',
        'qrCode': null,
        'members': [
          {
            'teamId': 'abc123',
            'userId': 'user001',
            'role': 'CAPTAIN',
            'status': 'JOINED',
            'user': {'firstName': 'Ravi', 'profilePhoto': null, 'city': 'Hyderabad'},
          }
        ],
        'customMembers': [],
      };

      final model = TeamModel.fromJson(json);

      expect(model.id, 'abc123');
      expect(model.name, 'Thunder XI');
      expect(model.teamCode, 'THX1234567');
      expect(model.sportType, 'Cricket');
      expect(model.members.length, 1);
      expect(model.members[0].role, TeamRole.captain);
      expect(model.members[0].status, TeamMemberStatus.joined);
      expect(model.members[0].userName, 'Ravi');
    });

    test('handles missing optional fields', () {
      final json = {
        'id': 'xyz',
        'name': 'Test Team',
        'teamCode': 'TEST000001',
        'sportType': 'Football',
        'ownerId': 'u1',
        'members': [],
        'customMembers': [],
      };
      final model = TeamModel.fromJson(json);
      expect(model.description, isNull);
      expect(model.city, isNull);
      expect(model.customMembers, isEmpty);
    });
  });

  group('TeamMemberModel.fromJson', () {
    test('maps all role strings', () {
      for (final pair in [
        ['CAPTAIN', TeamRole.captain],
        ['VICE_CAPTAIN', TeamRole.viceCaptain],
        ['PLAYER', TeamRole.player],
        ['GUEST', TeamRole.guest],
      ]) {
        final json = {
          'teamId': 't1', 'userId': 'u1',
          'role': pair[0], 'status': 'JOINED',
          'user': {'firstName': 'Ali', 'profilePhoto': null, 'city': null},
        };
        expect(TeamMemberModel.fromJson(json).role, pair[1]);
      }
    });
  });
}
```

- [ ] **Step 2: Run the test — expect it to fail**

```bash
flutter test test/team_model_test.dart
```

Expected: FAIL — `team_model.dart` not found.

- [ ] **Step 3: Create `lib/models/team_model.dart`**

```dart
enum TeamRole { captain, viceCaptain, player, guest }
enum TeamMemberStatus { joined, pending, accepted, declined }

class TeamModel {
  final String id;
  final String name;
  final String? description;
  final String teamCode;
  final String? imageUrl;
  final String? logoUrl;
  final String sportType;
  final String? city;
  final String? captainName;
  final String? captainPhone;
  final String ownerId;
  final String? qrCode;
  final List<TeamMemberModel> members;
  final List<TeamCustomMemberModel> customMembers;

  const TeamModel({
    required this.id,
    required this.name,
    this.description,
    required this.teamCode,
    this.imageUrl,
    this.logoUrl,
    required this.sportType,
    this.city,
    this.captainName,
    this.captainPhone,
    required this.ownerId,
    this.qrCode,
    required this.members,
    required this.customMembers,
  });

  factory TeamModel.fromJson(Map<String, dynamic> json) {
    return TeamModel(
      id: json['id']?.toString() ?? '',
      name: json['name'] ?? '',
      description: json['description'] as String?,
      teamCode: json['teamCode'] ?? '',
      imageUrl: json['image'] as String?,
      logoUrl: json['logo'] as String?,
      sportType: json['sportType'] ?? '',
      city: json['city'] as String?,
      captainName: json['captainName'] as String?,
      captainPhone: json['captainPhone'] as String?,
      ownerId: json['ownerId']?.toString() ?? '',
      qrCode: json['qrCode'] as String?,
      members: (json['members'] as List<dynamic>? ?? [])
          .map((m) => TeamMemberModel.fromJson(m as Map<String, dynamic>))
          .toList(),
      customMembers: (json['customMembers'] as List<dynamic>? ?? [])
          .map((m) => TeamCustomMemberModel.fromJson(m as Map<String, dynamic>))
          .toList(),
    );
  }
}

class TeamMemberModel {
  final String teamId;
  final String userId;
  final TeamRole role;
  final TeamMemberStatus status;
  final String? userName;
  final String? avatarUrl;
  final String? city;

  const TeamMemberModel({
    required this.teamId,
    required this.userId,
    required this.role,
    required this.status,
    this.userName,
    this.avatarUrl,
    this.city,
  });

  factory TeamMemberModel.fromJson(Map<String, dynamic> json) {
    final user = json['user'] as Map<String, dynamic>?;
    return TeamMemberModel(
      teamId: json['teamId']?.toString() ?? '',
      userId: json['userId']?.toString() ?? '',
      role: _parseRole(json['role'] as String?),
      status: _parseStatus(json['status'] as String?),
      userName: user?['firstName'] as String?,
      avatarUrl: user?['profilePhoto'] as String?,
      city: user?['city'] as String?,
    );
  }

  static TeamRole _parseRole(String? s) => switch (s) {
        'CAPTAIN' => TeamRole.captain,
        'VICE_CAPTAIN' => TeamRole.viceCaptain,
        'GUEST' => TeamRole.guest,
        _ => TeamRole.player,
      };

  static TeamMemberStatus _parseStatus(String? s) => switch (s) {
        'PENDING' => TeamMemberStatus.pending,
        'ACCEPTED' => TeamMemberStatus.accepted,
        'DECLINED' => TeamMemberStatus.declined,
        _ => TeamMemberStatus.joined,
      };
}

class TeamCustomMemberModel {
  final String teamId;
  final String name;
  final String? email;
  final String? phone;
  final String status;
  final String? inviteToken;

  const TeamCustomMemberModel({
    required this.teamId,
    required this.name,
    this.email,
    this.phone,
    required this.status,
    this.inviteToken,
  });

  factory TeamCustomMemberModel.fromJson(Map<String, dynamic> json) {
    return TeamCustomMemberModel(
      teamId: json['teamId']?.toString() ?? '',
      name: json['name'] ?? '',
      email: json['email'] as String?,
      phone: json['phone'] as String?,
      status: json['status'] ?? 'PENDING',
      inviteToken: json['inviteToken'] as String?,
    );
  }
}
```

- [ ] **Step 4: Create `lib/models/team_opponent_request_model.dart`**

```dart
import 'team_model.dart';

class TeamOpponentRequestModel {
  final String id;
  final String teamAId;
  final String teamBId;
  final String status;
  final TeamModel? teamA;
  final TeamModel? teamB;

  const TeamOpponentRequestModel({
    required this.id,
    required this.teamAId,
    required this.teamBId,
    required this.status,
    this.teamA,
    this.teamB,
  });

  factory TeamOpponentRequestModel.fromJson(Map<String, dynamic> json) {
    return TeamOpponentRequestModel(
      id: json['id']?.toString() ?? '',
      teamAId: json['teamAId']?.toString() ?? '',
      teamBId: json['teamBId']?.toString() ?? '',
      status: json['status'] ?? 'PENDING',
      teamA: json['teamA'] != null
          ? TeamModel.fromJson(json['teamA'] as Map<String, dynamic>)
          : null,
      teamB: json['teamB'] != null
          ? TeamModel.fromJson(json['teamB'] as Map<String, dynamic>)
          : null,
    );
  }
}
```

- [ ] **Step 5: Run the test — expect it to pass**

```bash
flutter test test/team_model_test.dart
```

Expected: All tests PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/models/team_model.dart lib/models/team_opponent_request_model.dart test/team_model_test.dart
git commit -m "feat: add TeamModel, TeamMemberModel, TeamCustomMemberModel, TeamOpponentRequestModel"
```

---

## Task 3: TeamService

**Files:**
- Create: `lib/services/team_service.dart`
- Create: `test/team_service_test.dart`

- [ ] **Step 1: Write the failing service test**

Create `test/team_service_test.dart`:

```dart
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_phone_app/services/team_service.dart';
import 'package:flutter_phone_app/models/team_model.dart';

void main() {
  test('TeamService is a singleton', () {
    final a = TeamService();
    final b = TeamService();
    expect(identical(a, b), isTrue);
  });

  test('TeamService exposes expected public methods', () {
    final svc = TeamService();
    expect(svc.getMyTeams, isA<Function>());
    expect(svc.getTeamById, isA<Function>());
    expect(svc.createTeam, isA<Function>());
    expect(svc.updateTeam, isA<Function>());
    expect(svc.deleteTeam, isA<Function>());
    expect(svc.inviteMember, isA<Function>());
    expect(svc.getAllPublicTeams, isA<Function>());
    expect(svc.requestOpponent, isA<Function>());
    expect(svc.handleOpponentRequest, isA<Function>());
    expect(svc.findByCode, isA<Function>());
    expect(svc.joinByToken, isA<Function>());
  });
}
```

- [ ] **Step 2: Run the test — expect it to fail**

```bash
flutter test test/team_service_test.dart
```

Expected: FAIL — `team_service.dart` not found.

- [ ] **Step 3: Create `lib/services/team_service.dart`**

```dart
import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../config/api_config.dart';
import '../models/team_model.dart';
import '../models/team_opponent_request_model.dart';
import 'auth_manager.dart';

class TeamService {
  static final TeamService _instance = TeamService._internal();
  factory TeamService() => _instance;

  late final Dio _dio;

  TeamService._internal() {
    _dio = Dio(
      BaseOptions(
        baseUrl: ApiConfig.apiUrl,
        connectTimeout: ApiConfig.connectTimeout,
        receiveTimeout: ApiConfig.receiveTimeout,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final prefs = await SharedPreferences.getInstance();
        final token = prefs.getString('auth_token');
        if (token != null) options.headers['Authorization'] = 'Bearer $token';
        handler.next(options);
      },
    ));
  }

  String? get _userId => AuthManager().currentUser?['_id']?.toString();

  Future<List<TeamModel>> getMyTeams() async {
    final response = await _dio.get('/team');
    final data = response.data as List<dynamic>;
    return data.map((j) => TeamModel.fromJson(j as Map<String, dynamic>)).toList();
  }

  Future<TeamModel> getTeamById(String id) async {
    final response = await _dio.get('/team/$id');
    return TeamModel.fromJson(response.data as Map<String, dynamic>);
  }

  Future<TeamModel> createTeam(Map<String, dynamic> payload) async {
    final response = await _dio.post('/team', data: payload);
    return TeamModel.fromJson(response.data as Map<String, dynamic>);
  }

  Future<TeamModel> updateTeam(String id, Map<String, dynamic> payload) async {
    final response = await _dio.put('/team/$id', data: payload);
    return TeamModel.fromJson(response.data as Map<String, dynamic>);
  }

  Future<void> deleteTeam(String id) async {
    await _dio.delete('/team/$id');
  }

  Future<void> inviteMember(String teamId, Map<String, dynamic> payload) async {
    await _dio.post('/team/$teamId/invite', data: payload);
  }

  Future<TeamModel> findByCode(String code) async {
    final response = await _dio.get('/team/find-by-code/$code');
    return TeamModel.fromJson(response.data as Map<String, dynamic>);
  }

  Future<TeamModel> joinByToken(String token) async {
    final response = await _dio.post('/team/join/$token');
    return TeamModel.fromJson(response.data as Map<String, dynamic>);
  }

  Future<void> requestOpponent(String teamId, String opponentTeamId) async {
    await _dio.post('/team/$teamId/request-opponent', data: {'opponentTeamId': opponentTeamId});
  }

  Future<void> handleOpponentRequest(String requestId, bool accept) async {
    await _dio.post('/team/$requestId/handle-opponent-request', data: {'accept': accept});
  }

  Future<List<TeamModel>> getAllPublicTeams({String? sport, String? city}) async {
    final response = await _dio.get('/team/all', queryParameters: {
      if (sport != null) 'sportType': sport,
      if (city != null) 'city': city,
    });
    final data = response.data as List<dynamic>;
    return data.map((j) => TeamModel.fromJson(j as Map<String, dynamic>)).toList();
  }

  Future<List<TeamOpponentRequestModel>> getIncomingRequests(String teamId) async {
    final response = await _dio.get('/team/$teamId/opponent-requests');
    final data = response.data as List<dynamic>;
    return data
        .map((j) => TeamOpponentRequestModel.fromJson(j as Map<String, dynamic>))
        .toList();
  }
}
```

- [ ] **Step 4: Run the test — expect it to pass**

```bash
flutter test test/team_service_test.dart
```

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/services/team_service.dart test/team_service_test.dart
git commit -m "feat: add TeamService with all Kridaz team API endpoints"
```

---

## Task 4: Riverpod Provider

**Files:**
- Create: `lib/providers/team_provider.dart`

- [ ] **Step 1: Create `lib/providers/team_provider.dart`**

```dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/team_model.dart';
import '../services/team_service.dart';

final teamServiceProvider = Provider<TeamService>((_) => TeamService());

final myTeamsProvider = FutureProvider<List<TeamModel>>((ref) async {
  return ref.read(teamServiceProvider).getMyTeams();
});

final teamDetailProvider =
    FutureProvider.family<TeamModel, String>((ref, id) async {
  return ref.read(teamServiceProvider).getTeamById(id);
});

final publicTeamsProvider =
    FutureProvider.family<List<TeamModel>, Map<String, String?>>((ref, filters) async {
  return ref.read(teamServiceProvider).getAllPublicTeams(
        sport: filters['sport'],
        city: filters['city'],
      );
});

class TeamFormState {
  final String name;
  final String? description;
  final String sport;
  final String? city;
  final String? captainName;
  final String? captainPhone;
  final String? imageUrl;

  const TeamFormState({
    this.name = '',
    this.description,
    this.sport = 'Cricket',
    this.city,
    this.captainName,
    this.captainPhone,
    this.imageUrl,
  });

  TeamFormState copyWith({
    String? name,
    String? description,
    String? sport,
    String? city,
    String? captainName,
    String? captainPhone,
    String? imageUrl,
  }) {
    return TeamFormState(
      name: name ?? this.name,
      description: description ?? this.description,
      sport: sport ?? this.sport,
      city: city ?? this.city,
      captainName: captainName ?? this.captainName,
      captainPhone: captainPhone ?? this.captainPhone,
      imageUrl: imageUrl ?? this.imageUrl,
    );
  }

  Map<String, dynamic> toPayload() => {
        'name': name,
        if (description != null) 'description': description,
        'sportType': sport,
        if (city != null) 'city': city,
        if (captainName != null) 'captainName': captainName,
        if (captainPhone != null) 'captainPhone': captainPhone,
        if (imageUrl != null) 'image': imageUrl,
      };
}

class TeamFormNotifier extends StateNotifier<TeamFormState> {
  TeamFormNotifier() : super(const TeamFormState());

  void update(TeamFormState Function(TeamFormState) fn) => state = fn(state);
  void reset() => state = const TeamFormState();
}

final teamFormProvider =
    StateNotifierProvider<TeamFormNotifier, TeamFormState>(
  (_) => TeamFormNotifier(),
);
```

- [ ] **Step 2: Verify it compiles**

```bash
flutter analyze lib/providers/team_provider.dart
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add lib/providers/team_provider.dart
git commit -m "feat: add team Riverpod providers (myTeams, teamDetail, publicTeams, teamForm)"
```

---

## Task 5: Reusable Widgets — TeamCard & MemberCard

**Files:**
- Create: `lib/widgets/teams/team_card.dart`
- Create: `lib/widgets/teams/member_card.dart`
- Create: `lib/widgets/teams/team_code_chip.dart`
- Create: `lib/widgets/teams/team_stats_row.dart`

- [ ] **Step 1: Create `lib/widgets/teams/team_card.dart`**

```dart
import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../models/team_model.dart';
import '../../core/constants/app_colors.dart';

class TeamCard extends StatelessWidget {
  final TeamModel team;
  final VoidCallback onTap;

  const TeamCard({super.key, required this.team, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: const Color(0xFF1A1A1A),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.white12),
        ),
        child: Row(
          children: [
            _TeamAvatar(imageUrl: team.imageUrl, name: team.name),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    team.name,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      fontFamily: 'Poppins',
                    ),
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      _SportBadge(sport: team.sportType),
                      const SizedBox(width: 8),
                      if (team.city != null)
                        Text(
                          team.city!,
                          style: const TextStyle(
                            color: Colors.white54,
                            fontSize: 12,
                            fontFamily: 'Poppins',
                          ),
                        ),
                    ],
                  ),
                ],
              ),
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  '${team.members.length}',
                  style: const TextStyle(
                    color: AppColors.primary,
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    fontFamily: 'Poppins',
                  ),
                ),
                const Text(
                  'members',
                  style: TextStyle(
                    color: Colors.white38,
                    fontSize: 11,
                    fontFamily: 'Poppins',
                  ),
                ),
              ],
            ),
            const SizedBox(width: 8),
            const Icon(Icons.chevron_right, color: Colors.white38, size: 20),
          ],
        ),
      ),
    );
  }
}

class _TeamAvatar extends StatelessWidget {
  final String? imageUrl;
  final String name;

  const _TeamAvatar({this.imageUrl, required this.name});

  @override
  Widget build(BuildContext context) {
    if (imageUrl != null && imageUrl!.isNotEmpty) {
      return ClipRRect(
        borderRadius: BorderRadius.circular(12),
        child: CachedNetworkImage(
          imageUrl: imageUrl!,
          width: 52,
          height: 52,
          fit: BoxFit.cover,
          placeholder: (_, __) => _initials(name),
          errorWidget: (_, __, ___) => _initials(name),
        ),
      );
    }
    return _initials(name);
  }

  Widget _initials(String name) {
    return Container(
      width: 52,
      height: 52,
      decoration: BoxDecoration(
        color: AppColors.primary.withOpacity(0.15),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.primary.withOpacity(0.4)),
      ),
      alignment: Alignment.center,
      child: Text(
        name.isNotEmpty ? name[0].toUpperCase() : '?',
        style: const TextStyle(
          color: AppColors.primary,
          fontSize: 22,
          fontWeight: FontWeight.w700,
          fontFamily: 'Poppins',
        ),
      ),
    );
  }
}

class _SportBadge extends StatelessWidget {
  final String sport;
  const _SportBadge({required this.sport});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: AppColors.primary.withOpacity(0.12),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.primary.withOpacity(0.3)),
      ),
      child: Text(
        sport,
        style: const TextStyle(
          color: AppColors.primary,
          fontSize: 11,
          fontWeight: FontWeight.w600,
          fontFamily: 'Poppins',
        ),
      ),
    );
  }
}
```

- [ ] **Step 2: Create `lib/widgets/teams/member_card.dart`**

```dart
import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../models/team_model.dart';
import '../../core/constants/app_colors.dart';

class MemberCard extends StatelessWidget {
  final TeamMemberModel member;
  final bool isOwner;
  final VoidCallback? onRemove;
  final void Function(TeamRole)? onPromote;

  const MemberCard({
    super.key,
    required this.member,
    this.isOwner = false,
    this.onRemove,
    this.onPromote,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: const Color(0xFF1A1A1A),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.white12),
      ),
      child: Row(
        children: [
          _avatar(),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  member.userName ?? 'Player',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    fontFamily: 'Poppins',
                  ),
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    _RoleBadge(role: member.role),
                    const SizedBox(width: 8),
                    _StatusBadge(status: member.status),
                  ],
                ),
              ],
            ),
          ),
          if (isOwner && member.role != TeamRole.captain)
            IconButton(
              icon: const Icon(Icons.more_vert, color: Colors.white38, size: 20),
              onPressed: () => _showActions(context),
            ),
        ],
      ),
    );
  }

  Widget _avatar() {
    if (member.avatarUrl != null && member.avatarUrl!.isNotEmpty) {
      return CircleAvatar(
        radius: 22,
        backgroundImage: CachedNetworkImageProvider(member.avatarUrl!),
      );
    }
    return CircleAvatar(
      radius: 22,
      backgroundColor: AppColors.primary.withOpacity(0.15),
      child: Text(
        (member.userName?.isNotEmpty == true) ? member.userName![0].toUpperCase() : '?',
        style: const TextStyle(
          color: AppColors.primary,
          fontWeight: FontWeight.w700,
          fontFamily: 'Poppins',
        ),
      ),
    );
  }

  void _showActions(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: const Color(0xFF1A1A1A),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (onPromote != null && member.role != TeamRole.viceCaptain)
              ListTile(
                leading: const Icon(Icons.arrow_upward, color: Colors.white70),
                title: const Text('Make Vice Captain',
                    style: TextStyle(color: Colors.white, fontFamily: 'Poppins')),
                onTap: () {
                  Navigator.pop(context);
                  onPromote!(TeamRole.viceCaptain);
                },
              ),
            if (onRemove != null)
              ListTile(
                leading: const Icon(Icons.remove_circle_outline, color: Colors.redAccent),
                title: const Text('Remove Member',
                    style: TextStyle(color: Colors.redAccent, fontFamily: 'Poppins')),
                onTap: () {
                  Navigator.pop(context);
                  onRemove!();
                },
              ),
          ],
        ),
      ),
    );
  }
}

class _RoleBadge extends StatelessWidget {
  final TeamRole role;
  const _RoleBadge({required this.role});

  @override
  Widget build(BuildContext context) {
    final (label, color) = switch (role) {
      TeamRole.captain => ('Captain', AppColors.primary),
      TeamRole.viceCaptain => ('Vice Captain', const Color(0xFF3BE8B0)),
      TeamRole.guest => ('Guest', Colors.white38),
      _ => ('Player', Colors.white54),
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
      decoration: BoxDecoration(
        color: color.withOpacity(0.12),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withOpacity(0.35)),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: color,
          fontSize: 10,
          fontWeight: FontWeight.w600,
          fontFamily: 'Poppins',
        ),
      ),
    );
  }
}

class _StatusBadge extends StatelessWidget {
  final TeamMemberStatus status;
  const _StatusBadge({required this.status});

  @override
  Widget build(BuildContext context) {
    final (label, color) = switch (status) {
      TeamMemberStatus.joined => ('Joined', Colors.green),
      TeamMemberStatus.pending => ('Pending', Colors.orange),
      TeamMemberStatus.declined => ('Declined', Colors.redAccent),
      _ => ('Accepted', Colors.green),
    };
    return Text(
      label,
      style: TextStyle(color: color, fontSize: 11, fontFamily: 'Poppins'),
    );
  }
}
```

- [ ] **Step 3: Create `lib/widgets/teams/team_code_chip.dart`**

```dart
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:share_plus/share_plus.dart';
import '../../core/constants/app_colors.dart';

class TeamCodeChip extends StatelessWidget {
  final String code;

  const TeamCodeChip({super.key, required this.code});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: const Color(0xFF111111),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.primary.withOpacity(0.4)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            code,
            style: const TextStyle(
              color: AppColors.primary,
              fontSize: 16,
              fontWeight: FontWeight.w700,
              fontFamily: 'Poppins',
              letterSpacing: 2,
            ),
          ),
          const SizedBox(width: 10),
          GestureDetector(
            onTap: () {
              Clipboard.setData(ClipboardData(text: code));
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Team code copied!'),
                  duration: Duration(seconds: 2),
                ),
              );
            },
            child: const Icon(Icons.copy, color: Colors.white54, size: 18),
          ),
          const SizedBox(width: 8),
          GestureDetector(
            onTap: () => Share.share('Join my team on BMS! Use code: $code'),
            child: const Icon(Icons.share, color: Colors.white54, size: 18),
          ),
        ],
      ),
    );
  }
}
```

- [ ] **Step 4: Create `lib/widgets/teams/team_stats_row.dart`**

```dart
import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';

class TeamStatsRow extends StatelessWidget {
  final int memberCount;
  final int matchesPlayed;
  final int wins;

  const TeamStatsRow({
    super.key,
    required this.memberCount,
    this.matchesPlayed = 0,
    this.wins = 0,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        _StatItem(label: 'Members', value: '$memberCount'),
        _divider(),
        _StatItem(label: 'Matches', value: '$matchesPlayed'),
        _divider(),
        _StatItem(label: 'Wins', value: '$wins'),
      ],
    );
  }

  Widget _divider() => Container(
        width: 1,
        height: 32,
        margin: const EdgeInsets.symmetric(horizontal: 16),
        color: Colors.white12,
      );
}

class _StatItem extends StatelessWidget {
  final String label;
  final String value;

  const _StatItem({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(
          value,
          style: const TextStyle(
            color: AppColors.primary,
            fontSize: 22,
            fontWeight: FontWeight.w700,
            fontFamily: 'Poppins',
          ),
        ),
        Text(
          label,
          style: const TextStyle(
            color: Colors.white54,
            fontSize: 12,
            fontFamily: 'Poppins',
          ),
        ),
      ],
    );
  }
}
```

- [ ] **Step 5: Verify all widgets compile**

```bash
flutter analyze lib/widgets/teams/
```

Expected: No errors.

- [ ] **Step 6: Commit**

```bash
git add lib/widgets/teams/
git commit -m "feat: add TeamCard, MemberCard, TeamCodeChip, TeamStatsRow widgets"
```

---

## Task 6: CreateTeamModal

**Files:**
- Create: `lib/widgets/teams/create_team_modal.dart`

- [ ] **Step 1: Create `lib/widgets/teams/create_team_modal.dart`**

```dart
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import '../../core/constants/app_colors.dart';
import '../../providers/team_provider.dart';
import '../../services/image_storage_service.dart';
import '../../services/team_service.dart';

const _sports = ['Cricket', 'Football', 'Badminton', 'Volleyball', 'Basketball'];

class CreateTeamModal extends ConsumerStatefulWidget {
  final String? teamId;
  final Map<String, dynamic>? initialValues;
  final VoidCallback onSuccess;

  const CreateTeamModal({
    super.key,
    this.teamId,
    this.initialValues,
    required this.onSuccess,
  });

  @override
  ConsumerState<CreateTeamModal> createState() => _CreateTeamModalState();
}

class _CreateTeamModalState extends ConsumerState<CreateTeamModal> {
  final _nameCtrl = TextEditingController();
  final _descCtrl = TextEditingController();
  final _cityCtrl = TextEditingController();
  final _captainNameCtrl = TextEditingController();
  final _captainPhoneCtrl = TextEditingController();
  String _sport = 'Cricket';
  File? _imageFile;
  bool _loading = false;
  String? _error;

  bool get _isEdit => widget.teamId != null;

  @override
  void initState() {
    super.initState();
    if (widget.initialValues != null) {
      _nameCtrl.text = widget.initialValues!['name'] ?? '';
      _descCtrl.text = widget.initialValues!['description'] ?? '';
      _cityCtrl.text = widget.initialValues!['city'] ?? '';
      _captainNameCtrl.text = widget.initialValues!['captainName'] ?? '';
      _captainPhoneCtrl.text = widget.initialValues!['captainPhone'] ?? '';
      _sport = widget.initialValues!['sportType'] ?? 'Cricket';
    }
  }

  @override
  void dispose() {
    _nameCtrl.dispose(); _descCtrl.dispose(); _cityCtrl.dispose();
    _captainNameCtrl.dispose(); _captainPhoneCtrl.dispose();
    super.dispose();
  }

  Future<void> _pickImage() async {
    final picked = await ImagePicker().pickImage(source: ImageSource.gallery);
    if (picked != null) setState(() => _imageFile = File(picked.path));
  }

  Future<void> _submit() async {
    if (_nameCtrl.text.trim().isEmpty) {
      setState(() => _error = 'Team name is required');
      return;
    }
    setState(() { _loading = true; _error = null; });
    try {
      String? uploadedUrl;
      if (_imageFile != null) {
        uploadedUrl = await ImageStorageService().uploadImage(_imageFile!);
      }
      final payload = {
        'name': _nameCtrl.text.trim(),
        if (_descCtrl.text.trim().isNotEmpty) 'description': _descCtrl.text.trim(),
        'sportType': _sport,
        if (_cityCtrl.text.trim().isNotEmpty) 'city': _cityCtrl.text.trim(),
        if (_captainNameCtrl.text.trim().isNotEmpty) 'captainName': _captainNameCtrl.text.trim(),
        if (_captainPhoneCtrl.text.trim().isNotEmpty) 'captainPhone': _captainPhoneCtrl.text.trim(),
        if (uploadedUrl != null) 'image': uploadedUrl,
      };
      if (_isEdit) {
        await TeamService().updateTeam(widget.teamId!, payload);
      } else {
        await TeamService().createTeam(payload);
      }
      ref.invalidate(myTeamsProvider);
      if (mounted) Navigator.pop(context);
      widget.onSuccess();
    } catch (e) {
      setState(() { _loading = false; _error = 'Failed to save team. Try again.'; });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Color(0xFF111111),
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      padding: EdgeInsets.only(
        left: 20, right: 20, top: 20,
        bottom: MediaQuery.of(context).viewInsets.bottom + 24,
      ),
      child: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Center(
              child: Container(
                width: 40, height: 4,
                decoration: BoxDecoration(
                  color: Colors.white24,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 20),
            Text(
              _isEdit ? 'Edit Team' : 'Create Team',
              style: const TextStyle(
                color: Colors.white, fontSize: 20,
                fontWeight: FontWeight.w700, fontFamily: 'Poppins',
              ),
            ),
            const SizedBox(height: 20),
            _logoRow(),
            const SizedBox(height: 16),
            _field('Team Name *', _nameCtrl),
            const SizedBox(height: 12),
            _field('Description', _descCtrl, maxLines: 2, maxLength: 200),
            const SizedBox(height: 12),
            _sportDropdown(),
            const SizedBox(height: 12),
            _field('City', _cityCtrl),
            const SizedBox(height: 12),
            _field('Captain Name', _captainNameCtrl),
            const SizedBox(height: 12),
            _field('Captain Phone', _captainPhoneCtrl, keyboardType: TextInputType.phone),
            if (_error != null) ...[
              const SizedBox(height: 12),
              Text(_error!, style: const TextStyle(color: Colors.redAccent, fontSize: 13)),
            ],
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              height: 52,
              child: ElevatedButton(
                onPressed: _loading ? null : _submit,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                ),
                child: _loading
                    ? const CircularProgressIndicator(color: Colors.black, strokeWidth: 2)
                    : Text(
                        _isEdit ? 'Save Changes' : 'Create Team',
                        style: const TextStyle(
                          color: Colors.black, fontSize: 16,
                          fontWeight: FontWeight.w700, fontFamily: 'Poppins',
                        ),
                      ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _logoRow() {
    return Row(
      children: [
        GestureDetector(
          onTap: _pickImage,
          child: Container(
            width: 72, height: 72,
            decoration: BoxDecoration(
              color: const Color(0xFF1A1A1A),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: AppColors.primary.withOpacity(0.4)),
            ),
            child: _imageFile != null
                ? ClipRRect(
                    borderRadius: BorderRadius.circular(14),
                    child: Image.file(_imageFile!, fit: BoxFit.cover),
                  )
                : const Icon(Icons.add_a_photo_outlined,
                    color: AppColors.primary, size: 28),
          ),
        ),
        const SizedBox(width: 14),
        const Text(
          'Tap to add\nteam logo',
          style: TextStyle(color: Colors.white54, fontSize: 13, fontFamily: 'Poppins'),
        ),
      ],
    );
  }

  Widget _field(String hint, TextEditingController ctrl,
      {int maxLines = 1, int? maxLength, TextInputType? keyboardType}) {
    return TextField(
      controller: ctrl,
      maxLines: maxLines,
      maxLength: maxLength,
      keyboardType: keyboardType,
      style: const TextStyle(color: Colors.white, fontFamily: 'Poppins'),
      decoration: InputDecoration(
        hintText: hint,
        hintStyle: const TextStyle(color: Colors.white38, fontFamily: 'Poppins'),
        filled: true,
        fillColor: const Color(0xFF1A1A1A),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: Colors.white12),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Colors.white12),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: AppColors.primary),
        ),
        counterStyle: const TextStyle(color: Colors.white38),
      ),
    );
  }

  Widget _sportDropdown() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14),
      decoration: BoxDecoration(
        color: const Color(0xFF1A1A1A),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white12),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<String>(
          value: _sport,
          isExpanded: true,
          dropdownColor: const Color(0xFF1A1A1A),
          style: const TextStyle(color: Colors.white, fontFamily: 'Poppins'),
          items: _sports
              .map((s) => DropdownMenuItem(value: s, child: Text(s)))
              .toList(),
          onChanged: (v) => setState(() => _sport = v!),
        ),
      ),
    );
  }
}
```

- [ ] **Step 2: Verify it compiles**

```bash
flutter analyze lib/widgets/teams/create_team_modal.dart
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add lib/widgets/teams/create_team_modal.dart
git commit -m "feat: add CreateTeamModal with image picker, sport dropdown, edit support"
```

---

## Task 7: InviteMemberModal

**Files:**
- Create: `lib/widgets/teams/invite_member_modal.dart`

- [ ] **Step 1: Create `lib/widgets/teams/invite_member_modal.dart`**

```dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/constants/app_colors.dart';
import '../../services/team_service.dart';
import '../../services/user_service.dart';
import '../../providers/team_provider.dart';

class InviteMemberModal extends ConsumerStatefulWidget {
  final String teamId;
  final VoidCallback onSuccess;

  const InviteMemberModal({super.key, required this.teamId, required this.onSuccess});

  @override
  ConsumerState<InviteMemberModal> createState() => _InviteMemberModalState();
}

class _InviteMemberModalState extends ConsumerState<InviteMemberModal>
    with SingleTickerProviderStateMixin {
  late final TabController _tabs;
  final _searchCtrl = TextEditingController();
  final _customNameCtrl = TextEditingController();
  final _customPhoneCtrl = TextEditingController();

  List<Map<String, dynamic>> _searchResults = [];
  bool _searching = false;
  bool _inviting = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabs.dispose();
    _searchCtrl.dispose();
    _customNameCtrl.dispose();
    _customPhoneCtrl.dispose();
    super.dispose();
  }

  Future<void> _search(String query) async {
    if (query.length < 2) { setState(() => _searchResults = []); return; }
    setState(() => _searching = true);
    try {
      final results = await UserService().searchPlayers(query);
      setState(() { _searchResults = results; _searching = false; });
    } catch (_) {
      setState(() => _searching = false);
    }
  }

  Future<void> _inviteUser(String userId) async {
    setState(() { _inviting = true; _error = null; });
    try {
      await TeamService().inviteMember(widget.teamId, {'userId': userId});
      ref.invalidate(teamDetailProvider(widget.teamId));
      if (mounted) Navigator.pop(context);
      widget.onSuccess();
    } catch (_) {
      setState(() { _inviting = false; _error = 'Failed to invite. Try again.'; });
    }
  }

  Future<void> _inviteCustom() async {
    if (_customNameCtrl.text.trim().isEmpty) {
      setState(() => _error = 'Name is required');
      return;
    }
    setState(() { _inviting = true; _error = null; });
    try {
      await TeamService().inviteMember(widget.teamId, {
        'name': _customNameCtrl.text.trim(),
        if (_customPhoneCtrl.text.trim().isNotEmpty)
          'phone': _customPhoneCtrl.text.trim(),
      });
      ref.invalidate(teamDetailProvider(widget.teamId));
      if (mounted) Navigator.pop(context);
      widget.onSuccess();
    } catch (_) {
      setState(() { _inviting = false; _error = 'Failed to invite. Try again.'; });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: MediaQuery.of(context).size.height * 0.7,
      decoration: const BoxDecoration(
        color: Color(0xFF111111),
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        children: [
          const SizedBox(height: 12),
          Container(
            width: 40, height: 4,
            decoration: BoxDecoration(
              color: Colors.white24,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(height: 16),
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 20),
            child: Align(
              alignment: Alignment.centerLeft,
              child: Text(
                'Invite Member',
                style: TextStyle(
                  color: Colors.white, fontSize: 20,
                  fontWeight: FontWeight.w700, fontFamily: 'Poppins',
                ),
              ),
            ),
          ),
          const SizedBox(height: 12),
          TabBar(
            controller: _tabs,
            indicatorColor: AppColors.primary,
            labelColor: AppColors.primary,
            unselectedLabelColor: Colors.white38,
            labelStyle: const TextStyle(fontFamily: 'Poppins', fontWeight: FontWeight.w600),
            tabs: const [Tab(text: 'Search Users'), Tab(text: 'Add Custom')],
          ),
          Expanded(
            child: TabBarView(
              controller: _tabs,
              children: [_searchTab(), _customTab()],
            ),
          ),
        ],
      ),
    );
  }

  Widget _searchTab() {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          TextField(
            controller: _searchCtrl,
            style: const TextStyle(color: Colors.white, fontFamily: 'Poppins'),
            decoration: InputDecoration(
              hintText: 'Search by username or email',
              hintStyle: const TextStyle(color: Colors.white38, fontFamily: 'Poppins'),
              prefixIcon: const Icon(Icons.search, color: Colors.white38),
              filled: true,
              fillColor: const Color(0xFF1A1A1A),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(color: Colors.white12),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(color: Colors.white12),
              ),
            ),
            onChanged: _search,
          ),
          const SizedBox(height: 12),
          if (_searching) const CircularProgressIndicator(color: AppColors.primary),
          Expanded(
            child: ListView.builder(
              itemCount: _searchResults.length,
              itemBuilder: (_, i) {
                final user = _searchResults[i];
                final name = '${user['firstName'] ?? ''} ${user['lastName'] ?? ''}'.trim();
                return ListTile(
                  leading: CircleAvatar(
                    backgroundColor: AppColors.primary.withOpacity(0.15),
                    backgroundImage: user['profilePhoto'] != null
                        ? NetworkImage(user['profilePhoto']) : null,
                    child: user['profilePhoto'] == null
                        ? Text(name.isNotEmpty ? name[0].toUpperCase() : '?',
                            style: const TextStyle(color: AppColors.primary))
                        : null,
                  ),
                  title: Text(name, style: const TextStyle(color: Colors.white, fontFamily: 'Poppins')),
                  subtitle: Text(user['email'] ?? '', style: const TextStyle(color: Colors.white38)),
                  trailing: _inviting
                      ? const SizedBox(width: 20, height: 20,
                          child: CircularProgressIndicator(color: AppColors.primary, strokeWidth: 2))
                      : IconButton(
                          icon: const Icon(Icons.person_add, color: AppColors.primary),
                          onPressed: () => _inviteUser(user['_id']?.toString() ?? user['id']?.toString() ?? ''),
                        ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _customTab() {
    return Padding(
      padding: EdgeInsets.only(
        left: 16, right: 16, top: 16,
        bottom: MediaQuery.of(context).viewInsets.bottom + 16,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          TextField(
            controller: _customNameCtrl,
            style: const TextStyle(color: Colors.white, fontFamily: 'Poppins'),
            decoration: _inputDec('Full Name *'),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _customPhoneCtrl,
            keyboardType: TextInputType.phone,
            style: const TextStyle(color: Colors.white, fontFamily: 'Poppins'),
            decoration: _inputDec('Phone Number (optional)'),
          ),
          if (_error != null) ...[
            const SizedBox(height: 8),
            Text(_error!, style: const TextStyle(color: Colors.redAccent, fontSize: 13)),
          ],
          const SizedBox(height: 20),
          SizedBox(
            width: double.infinity,
            height: 52,
            child: ElevatedButton(
              onPressed: _inviting ? null : _inviteCustom,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
              child: _inviting
                  ? const CircularProgressIndicator(color: Colors.black, strokeWidth: 2)
                  : const Text('Add Player',
                      style: TextStyle(
                        color: Colors.black, fontSize: 16,
                        fontWeight: FontWeight.w700, fontFamily: 'Poppins',
                      )),
            ),
          ),
        ],
      ),
    );
  }

  InputDecoration _inputDec(String hint) => InputDecoration(
        hintText: hint,
        hintStyle: const TextStyle(color: Colors.white38, fontFamily: 'Poppins'),
        filled: true,
        fillColor: const Color(0xFF1A1A1A),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Colors.white12),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Colors.white12),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: AppColors.primary),
        ),
      );
}
```

- [ ] **Step 2: Verify it compiles**

```bash
flutter analyze lib/widgets/teams/invite_member_modal.dart
```

Expected: No errors. (Note: `UserService().searchPlayers` — verify this method exists in `lib/services/user_service.dart`. If not, add it: `Future<List<Map<String, dynamic>>> searchPlayers(String query)` that calls `GET /user/players/search?query=<query>`)

- [ ] **Step 3: Commit**

```bash
git add lib/widgets/teams/invite_member_modal.dart
git commit -m "feat: add InviteMemberModal with user search and custom player tabs"
```

---

## Task 8: OpponentRequestModal

**Files:**
- Create: `lib/widgets/teams/opponent_request_modal.dart`

- [ ] **Step 1: Create `lib/widgets/teams/opponent_request_modal.dart`**

```dart
import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../core/constants/app_colors.dart';
import '../../models/team_opponent_request_model.dart';
import '../../services/team_service.dart';

class OpponentRequestModal extends StatefulWidget {
  final TeamOpponentRequestModel request;
  final VoidCallback onHandled;

  const OpponentRequestModal({
    super.key,
    required this.request,
    required this.onHandled,
  });

  @override
  State<OpponentRequestModal> createState() => _OpponentRequestModalState();
}

class _OpponentRequestModalState extends State<OpponentRequestModal> {
  bool _loading = false;

  Future<void> _handle(bool accept) async {
    setState(() => _loading = true);
    try {
      await TeamService().handleOpponentRequest(widget.request.id, accept);
      if (mounted) Navigator.pop(context);
      widget.onHandled();
    } catch (_) {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final challenger = widget.request.teamA;
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: const BoxDecoration(
        color: Color(0xFF111111),
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 40, height: 4,
            decoration: BoxDecoration(
              color: Colors.white24,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(height: 20),
          const Text(
            'Challenge Request',
            style: TextStyle(
              color: Colors.white, fontSize: 20,
              fontWeight: FontWeight.w700, fontFamily: 'Poppins',
            ),
          ),
          const SizedBox(height: 20),
          if (challenger != null) ...[
            CircleAvatar(
              radius: 36,
              backgroundColor: AppColors.primary.withOpacity(0.15),
              backgroundImage: challenger.imageUrl != null
                  ? CachedNetworkImageProvider(challenger.imageUrl!) : null,
              child: challenger.imageUrl == null
                  ? Text(
                      challenger.name.isNotEmpty ? challenger.name[0].toUpperCase() : '?',
                      style: const TextStyle(
                        color: AppColors.primary, fontSize: 28,
                        fontWeight: FontWeight.w700,
                      ))
                  : null,
            ),
            const SizedBox(height: 12),
            Text(
              challenger.name,
              style: const TextStyle(
                color: Colors.white, fontSize: 18,
                fontWeight: FontWeight.w600, fontFamily: 'Poppins',
              ),
            ),
            Text(
              '${challenger.sportType}${challenger.city != null ? ' · ${challenger.city}' : ''}',
              style: const TextStyle(color: Colors.white54, fontFamily: 'Poppins'),
            ),
            const SizedBox(height: 8),
            Text(
              '${challenger.members.length} members',
              style: const TextStyle(color: Colors.white38, fontSize: 13, fontFamily: 'Poppins'),
            ),
          ],
          const SizedBox(height: 28),
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: _loading ? null : () => _handle(false),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Colors.redAccent,
                    side: const BorderSide(color: Colors.redAccent),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: const Text('Decline', style: TextStyle(fontFamily: 'Poppins', fontWeight: FontWeight.w600)),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: ElevatedButton(
                  onPressed: _loading ? null : () => _handle(true),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: _loading
                      ? const CircularProgressIndicator(color: Colors.black, strokeWidth: 2)
                      : const Text('Accept!',
                          style: TextStyle(
                            color: Colors.black, fontFamily: 'Poppins',
                            fontWeight: FontWeight.w700,
                          )),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/widgets/teams/opponent_request_modal.dart
git commit -m "feat: add OpponentRequestModal for accept/decline challenges"
```

---

## Task 9: MyTeamsScreen

**Files:**
- Create: `lib/screens/my_teams_screen.dart`

- [ ] **Step 1: Create `lib/screens/my_teams_screen.dart`**

```dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../core/constants/app_colors.dart';
import '../providers/team_provider.dart';
import '../widgets/teams/team_card.dart';
import '../widgets/teams/create_team_modal.dart';

class MyTeamsScreen extends ConsumerWidget {
  const MyTeamsScreen({super.key});

  void _openCreate(BuildContext context, WidgetRef ref) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => CreateTeamModal(
        onSuccess: () => ref.invalidate(myTeamsProvider),
      ),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final teamsAsync = ref.watch(myTeamsProvider);

    return Scaffold(
      backgroundColor: Colors.black,
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
              child: Row(
                children: [
                  GestureDetector(
                    onTap: () => context.pop(),
                    child: const Icon(Icons.arrow_back_ios, color: Colors.white, size: 20),
                  ),
                  const SizedBox(width: 12),
                  const Text(
                    'My Teams',
                    style: TextStyle(
                      color: Colors.white, fontSize: 22,
                      fontWeight: FontWeight.w700, fontFamily: 'Poppins',
                    ),
                  ),
                  const Spacer(),
                  teamsAsync.whenOrNull(
                    data: (teams) => Text(
                      '${teams.length} team${teams.length == 1 ? '' : 's'}',
                      style: const TextStyle(color: Colors.white38, fontFamily: 'Poppins'),
                    ),
                  ) ?? const SizedBox(),
                ],
              ),
            ),
            const SizedBox(height: 16),
            Expanded(
              child: teamsAsync.when(
                loading: () => const Center(
                  child: CircularProgressIndicator(color: AppColors.primary),
                ),
                error: (e, _) => Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.error_outline, color: Colors.white38, size: 48),
                      const SizedBox(height: 12),
                      Text('$e', style: const TextStyle(color: Colors.white54, fontFamily: 'Poppins')),
                      const SizedBox(height: 12),
                      TextButton(
                        onPressed: () => ref.invalidate(myTeamsProvider),
                        child: const Text('Retry', style: TextStyle(color: AppColors.primary)),
                      ),
                    ],
                  ),
                ),
                data: (teams) => teams.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.group_outlined, color: Colors.white24, size: 72),
                            const SizedBox(height: 16),
                            const Text(
                              'No teams yet',
                              style: TextStyle(
                                color: Colors.white54, fontSize: 18,
                                fontWeight: FontWeight.w600, fontFamily: 'Poppins',
                              ),
                            ),
                            const SizedBox(height: 8),
                            const Text(
                              'Create your first team and start\nplaying with friends!',
                              textAlign: TextAlign.center,
                              style: TextStyle(color: Colors.white38, fontFamily: 'Poppins'),
                            ),
                            const SizedBox(height: 24),
                            ElevatedButton.icon(
                              onPressed: () => _openCreate(context, ref),
                              icon: const Icon(Icons.add, color: Colors.black),
                              label: const Text(
                                'Create Team',
                                style: TextStyle(
                                  color: Colors.black, fontWeight: FontWeight.w700,
                                  fontFamily: 'Poppins',
                                ),
                              ),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppColors.primary,
                                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                              ),
                            ),
                          ],
                        ),
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.symmetric(horizontal: 20),
                        itemCount: teams.length,
                        itemBuilder: (_, i) => TeamCard(
                          team: teams[i],
                          onTap: () => context.push('/my-teams/${teams[i].id}'),
                        ),
                      ),
              ),
            ),
          ],
        ),
      ),
      floatingActionButton: teamsAsync.whenOrNull(
        data: (teams) => teams.isEmpty
            ? null
            : FloatingActionButton(
                onPressed: () => _openCreate(context, ref),
                backgroundColor: AppColors.primary,
                child: const Icon(Icons.add, color: Colors.black),
              ),
      ),
    );
  }
}
```

- [ ] **Step 2: Verify it compiles**

```bash
flutter analyze lib/screens/my_teams_screen.dart
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add lib/screens/my_teams_screen.dart
git commit -m "feat: add MyTeamsScreen with team list, empty state, and create FAB"
```

---

## Task 10: TeamDetailScreen

**Files:**
- Create: `lib/screens/team_detail_screen.dart`

- [ ] **Step 1: Create `lib/screens/team_detail_screen.dart`**

```dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../core/constants/app_colors.dart';
import '../providers/team_provider.dart';
import '../services/auth_manager.dart';
import '../services/team_service.dart';
import '../widgets/teams/team_code_chip.dart';
import '../widgets/teams/team_stats_row.dart';
import '../widgets/teams/member_card.dart';
import '../widgets/teams/invite_member_modal.dart';
import '../widgets/teams/create_team_modal.dart';
import '../widgets/teams/opponent_request_modal.dart';

class TeamDetailScreen extends ConsumerWidget {
  final String teamId;

  const TeamDetailScreen({super.key, required this.teamId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final teamAsync = ref.watch(teamDetailProvider(teamId));
    final currentUserId = AuthManager().currentUser?['_id']?.toString();

    return Scaffold(
      backgroundColor: Colors.black,
      body: teamAsync.when(
        loading: () => const Center(child: CircularProgressIndicator(color: AppColors.primary)),
        error: (e, _) => Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.error_outline, color: Colors.white38, size: 48),
              const SizedBox(height: 12),
              Text('$e', style: const TextStyle(color: Colors.white54, fontFamily: 'Poppins')),
              TextButton(
                onPressed: () => ref.invalidate(teamDetailProvider(teamId)),
                child: const Text('Retry', style: TextStyle(color: AppColors.primary)),
              ),
            ],
          ),
        ),
        data: (team) {
          final isOwner = team.ownerId == currentUserId;
          final previewMembers = team.members.take(4).toList();

          return CustomScrollView(
            slivers: [
              SliverAppBar(
                expandedHeight: 220,
                backgroundColor: Colors.black,
                leading: IconButton(
                  icon: const Icon(Icons.arrow_back_ios, color: Colors.white),
                  onPressed: () => context.pop(),
                ),
                flexibleSpace: FlexibleSpaceBar(
                  background: Stack(
                    fit: StackFit.expand,
                    children: [
                      team.imageUrl != null
                          ? CachedNetworkImage(
                              imageUrl: team.imageUrl!,
                              fit: BoxFit.cover,
                              errorWidget: (_, __, ___) => Container(color: const Color(0xFF1A1A1A)),
                            )
                          : Container(color: const Color(0xFF1A1A1A)),
                      Container(
                        decoration: const BoxDecoration(
                          gradient: LinearGradient(
                            begin: Alignment.topCenter,
                            end: Alignment.bottomCenter,
                            colors: [Colors.transparent, Colors.black],
                          ),
                        ),
                      ),
                      Positioned(
                        bottom: 16,
                        left: 20,
                        right: isOwner ? 60 : 20,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              team.name,
                              style: const TextStyle(
                                color: Colors.white, fontSize: 24,
                                fontWeight: FontWeight.w700, fontFamily: 'Poppins',
                              ),
                            ),
                            Row(
                              children: [
                                _SportBadge(sport: team.sportType),
                                if (team.city != null) ...[
                                  const SizedBox(width: 8),
                                  const Icon(Icons.location_on, color: Colors.white38, size: 14),
                                  Text(
                                    team.city!,
                                    style: const TextStyle(color: Colors.white54, fontSize: 13, fontFamily: 'Poppins'),
                                  ),
                                ],
                              ],
                            ),
                          ],
                        ),
                      ),
                      if (isOwner)
                        Positioned(
                          bottom: 16,
                          right: 16,
                          child: GestureDetector(
                            onTap: () => showModalBottomSheet(
                              context: context,
                              isScrollControlled: true,
                              backgroundColor: Colors.transparent,
                              builder: (_) => CreateTeamModal(
                                teamId: team.id,
                                initialValues: {
                                  'name': team.name,
                                  'description': team.description,
                                  'sportType': team.sportType,
                                  'city': team.city,
                                  'captainName': team.captainName,
                                  'captainPhone': team.captainPhone,
                                },
                                onSuccess: () => ref.invalidate(teamDetailProvider(teamId)),
                              ),
                            ),
                            child: Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: Colors.black54,
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: const Icon(Icons.edit, color: Colors.white70, size: 20),
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
              ),
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (team.description != null) ...[
                        Text(
                          team.description!,
                          style: const TextStyle(color: Colors.white70, fontFamily: 'Poppins', fontSize: 14),
                        ),
                        const SizedBox(height: 20),
                      ],
                      TeamCodeChip(code: team.teamCode),
                      const SizedBox(height: 24),
                      TeamStatsRow(memberCount: team.members.length),
                      const SizedBox(height: 24),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text(
                            'Members',
                            style: TextStyle(
                              color: Colors.white, fontSize: 18,
                              fontWeight: FontWeight.w600, fontFamily: 'Poppins',
                            ),
                          ),
                          GestureDetector(
                            onTap: () => context.push('/my-teams/$teamId/members'),
                            child: const Text(
                              'View All',
                              style: TextStyle(color: AppColors.primary, fontFamily: 'Poppins'),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      ...previewMembers.map((m) => MemberCard(member: m, isOwner: isOwner)),
                      const SizedBox(height: 24),
                      _ActionGrid(
                        teamId: teamId,
                        isOwner: isOwner,
                        onInvite: () => showModalBottomSheet(
                          context: context,
                          isScrollControlled: true,
                          backgroundColor: Colors.transparent,
                          builder: (_) => InviteMemberModal(
                            teamId: teamId,
                            onSuccess: () => ref.invalidate(teamDetailProvider(teamId)),
                          ),
                        ),
                        onDelete: isOwner
                            ? () => _confirmDelete(context, ref)
                            : null,
                      ),
                    ],
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  void _confirmDelete(BuildContext context, WidgetRef ref) {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        backgroundColor: const Color(0xFF1A1A1A),
        title: const Text('Delete Team', style: TextStyle(color: Colors.white, fontFamily: 'Poppins')),
        content: const Text(
          'This will permanently delete the team and remove all members. Are you sure?',
          style: TextStyle(color: Colors.white70, fontFamily: 'Poppins'),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel', style: TextStyle(color: Colors.white54)),
          ),
          TextButton(
            onPressed: () async {
              Navigator.pop(context);
              await TeamService().deleteTeam(teamId);
              ref.invalidate(myTeamsProvider);
              if (context.mounted) context.pop();
            },
            child: const Text('Delete', style: TextStyle(color: Colors.redAccent)),
          ),
        ],
      ),
    );
  }
}

class _ActionGrid extends StatelessWidget {
  final String teamId;
  final bool isOwner;
  final VoidCallback onInvite;
  final VoidCallback? onDelete;

  const _ActionGrid({
    required this.teamId,
    required this.isOwner,
    required this.onInvite,
    this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Row(
          children: [
            _ActionBtn(
              icon: Icons.person_add_outlined,
              label: 'Invite',
              onTap: onInvite,
            ),
            const SizedBox(width: 12),
            _ActionBtn(
              icon: Icons.card_membership_outlined,
              label: 'Team Pass',
              onTap: () => context.push('/my-teams/$teamId/pass'),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            _ActionBtn(
              icon: Icons.sports_kabaddi_outlined,
              label: 'Challenge',
              onTap: () => context.push('/my-teams/$teamId/challenge'),
            ),
            const SizedBox(width: 12),
            if (isOwner && onDelete != null)
              _ActionBtn(
                icon: Icons.delete_outline,
                label: 'Delete',
                onTap: onDelete!,
                danger: true,
              )
            else
              const Expanded(child: SizedBox()),
          ],
        ),
      ],
    );
  }
}

class _ActionBtn extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final bool danger;

  const _ActionBtn({
    required this.icon,
    required this.label,
    required this.onTap,
    this.danger = false,
  });

  @override
  Widget build(BuildContext context) {
    final color = danger ? Colors.redAccent : AppColors.primary;
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 16),
          decoration: BoxDecoration(
            color: color.withOpacity(0.08),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: color.withOpacity(0.3)),
          ),
          child: Column(
            children: [
              Icon(icon, color: color, size: 26),
              const SizedBox(height: 6),
              Text(
                label,
                style: TextStyle(
                  color: color, fontSize: 13,
                  fontWeight: FontWeight.w600, fontFamily: 'Poppins',
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _SportBadge extends StatelessWidget {
  final String sport;
  const _SportBadge({required this.sport});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: AppColors.primary.withOpacity(0.15),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.primary.withOpacity(0.3)),
      ),
      child: Text(
        sport,
        style: const TextStyle(
          color: AppColors.primary, fontSize: 12,
          fontWeight: FontWeight.w600, fontFamily: 'Poppins',
        ),
      ),
    );
  }
}
```

- [ ] **Step 2: Verify**

```bash
flutter analyze lib/screens/team_detail_screen.dart
```

Expected: No errors.

- [ ] **Step 3: Add incoming challenges section**

After `_ActionGrid` in the `data:` branch of the `when()`, add this widget to show and handle incoming opponent challenges:

```dart
// Inside the SliverToBoxAdapter Column, after _ActionGrid widget:
const SizedBox(height: 24),
FutureBuilder<List<TeamOpponentRequestModel>>(
  future: TeamService().getIncomingRequests(teamId),
  builder: (context, snap) {
    if (!snap.hasData || snap.data!.isEmpty) return const SizedBox();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Incoming Challenges',
          style: TextStyle(
            color: Colors.white, fontSize: 18,
            fontWeight: FontWeight.w600, fontFamily: 'Poppins',
          ),
        ),
        const SizedBox(height: 12),
        ...snap.data!.where((r) => r.status == 'PENDING').map((req) => GestureDetector(
          onTap: () => showModalBottomSheet(
            context: context,
            backgroundColor: Colors.transparent,
            builder: (_) => OpponentRequestModal(
              request: req,
              onHandled: () => ref.invalidate(teamDetailProvider(teamId)),
            ),
          ),
          child: Container(
            margin: const EdgeInsets.only(bottom: 10),
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: const Color(0xFF1A1A1A),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: Colors.orange.withOpacity(0.4)),
            ),
            child: Row(
              children: [
                const Icon(Icons.sports_kabaddi, color: Colors.orange, size: 20),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    req.teamA?.name ?? 'Unknown Team',
                    style: const TextStyle(color: Colors.white, fontFamily: 'Poppins'),
                  ),
                ),
                const Text('Tap to respond',
                    style: TextStyle(color: Colors.white38, fontSize: 12, fontFamily: 'Poppins')),
              ],
            ),
          ),
        )),
      ],
    );
  },
),
```

Also add the missing import at the top of `team_detail_screen.dart`:

```dart
import '../models/team_opponent_request_model.dart';
```

- [ ] **Step 4: Commit**

```bash
git add lib/screens/team_detail_screen.dart
git commit -m "feat: add TeamDetailScreen with banner, stats, member preview, action grid, incoming challenges"
```

---

## Task 11: TeamMembersScreen

**Files:**
- Create: `lib/screens/team_members_screen.dart`

- [ ] **Step 1: Create `lib/screens/team_members_screen.dart`**

```dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../core/constants/app_colors.dart';
import '../models/team_model.dart';
import '../providers/team_provider.dart';
import '../services/auth_manager.dart';
import '../widgets/teams/member_card.dart';
import '../widgets/teams/invite_member_modal.dart';

class TeamMembersScreen extends ConsumerStatefulWidget {
  final String teamId;

  const TeamMembersScreen({super.key, required this.teamId});

  @override
  ConsumerState<TeamMembersScreen> createState() => _TeamMembersScreenState();
}

class _TeamMembersScreenState extends ConsumerState<TeamMembersScreen>
    with SingleTickerProviderStateMixin {
  late final TabController _tabs;

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabs.dispose();
    super.dispose();
  }

  void _openInvite(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => InviteMemberModal(
        teamId: widget.teamId,
        onSuccess: () => ref.invalidate(teamDetailProvider(widget.teamId)),
      ),
    );
  }

  @override
  Widget build(BuildContext context, ) {
    final teamAsync = ref.watch(teamDetailProvider(widget.teamId));
    final currentUserId = AuthManager().currentUser?['_id']?.toString();

    return Scaffold(
      backgroundColor: Colors.black,
      floatingActionButton: FloatingActionButton(
        onPressed: () => _openInvite(context),
        backgroundColor: AppColors.primary,
        child: const Icon(Icons.person_add, color: Colors.black),
      ),
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
              child: Row(
                children: [
                  GestureDetector(
                    onTap: () => context.pop(),
                    child: const Icon(Icons.arrow_back_ios, color: Colors.white, size: 20),
                  ),
                  const SizedBox(width: 12),
                  const Text(
                    'Members',
                    style: TextStyle(
                      color: Colors.white, fontSize: 22,
                      fontWeight: FontWeight.w700, fontFamily: 'Poppins',
                    ),
                  ),
                  const Spacer(),
                  teamAsync.whenOrNull(
                    data: (t) => Text(
                      '${t.members.length + t.customMembers.length}',
                      style: const TextStyle(
                        color: AppColors.primary, fontSize: 18,
                        fontWeight: FontWeight.w700, fontFamily: 'Poppins',
                      ),
                    ),
                  ) ?? const SizedBox(),
                ],
              ),
            ),
            const SizedBox(height: 12),
            TabBar(
              controller: _tabs,
              indicatorColor: AppColors.primary,
              labelColor: AppColors.primary,
              unselectedLabelColor: Colors.white38,
              labelStyle: const TextStyle(fontFamily: 'Poppins', fontWeight: FontWeight.w600),
              tabs: const [Tab(text: 'Registered'), Tab(text: 'Custom')],
            ),
            Expanded(
              child: teamAsync.when(
                loading: () => const Center(child: CircularProgressIndicator(color: AppColors.primary)),
                error: (e, _) => Center(
                  child: Text('$e', style: const TextStyle(color: Colors.white54, fontFamily: 'Poppins')),
                ),
                data: (team) {
                  final isOwner = team.ownerId == currentUserId;
                  return TabBarView(
                    controller: _tabs,
                    children: [
                      _memberList(team.members, isOwner),
                      _customList(team.customMembers),
                    ],
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _memberList(List<TeamMemberModel> members, bool isOwner) {
    if (members.isEmpty) {
      return const Center(
        child: Text('No registered members yet.',
            style: TextStyle(color: Colors.white38, fontFamily: 'Poppins')),
      );
    }
    return ListView.builder(
      padding: const EdgeInsets.all(20),
      itemCount: members.length,
      itemBuilder: (_, i) => MemberCard(
        member: members[i],
        isOwner: isOwner,
        onPromote: isOwner
            ? (_) => ref.invalidate(teamDetailProvider(widget.teamId))
            : null,
        onRemove: isOwner && members[i].role != TeamRole.captain
            ? () => ref.invalidate(teamDetailProvider(widget.teamId))
            : null,
      ),
    );
  }

  Widget _customList(List<TeamCustomMemberModel> members) {
    if (members.isEmpty) {
      return const Center(
        child: Text('No custom players added yet.',
            style: TextStyle(color: Colors.white38, fontFamily: 'Poppins')),
      );
    }
    return ListView.builder(
      padding: const EdgeInsets.all(20),
      itemCount: members.length,
      itemBuilder: (_, i) {
        final m = members[i];
        return Container(
          margin: const EdgeInsets.only(bottom: 10),
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          decoration: BoxDecoration(
            color: const Color(0xFF1A1A1A),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: Colors.white12),
          ),
          child: Row(
            children: [
              CircleAvatar(
                radius: 22,
                backgroundColor: AppColors.primary.withOpacity(0.15),
                child: Text(
                  m.name.isNotEmpty ? m.name[0].toUpperCase() : '?',
                  style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.w700),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(m.name, style: const TextStyle(color: Colors.white, fontFamily: 'Poppins')),
                    if (m.phone != null)
                      Text(m.phone!, style: const TextStyle(color: Colors.white38, fontSize: 12, fontFamily: 'Poppins')),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: Colors.orange.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  m.status,
                  style: const TextStyle(color: Colors.orange, fontSize: 11, fontFamily: 'Poppins'),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
```

- [ ] **Step 2: Verify**

```bash
flutter analyze lib/screens/team_members_screen.dart
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add lib/screens/team_members_screen.dart
git commit -m "feat: add TeamMembersScreen with registered/custom tabs and role management"
```

---

## Task 12: TeamPassScreen

**Files:**
- Create: `lib/screens/team_pass_screen.dart`

- [ ] **Step 1: Create `lib/screens/team_pass_screen.dart`**

```dart
import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:screenshot/screenshot.dart';
import 'package:share_plus/share_plus.dart';
import 'package:path_provider/path_provider.dart';
import 'dart:io';
import '../core/constants/app_colors.dart';
import '../providers/team_provider.dart';

class TeamPassScreen extends ConsumerWidget {
  final String teamId;

  const TeamPassScreen({super.key, required this.teamId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final teamAsync = ref.watch(teamDetailProvider(teamId));
    final screenshotCtrl = ScreenshotController();

    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios, color: Colors.white),
          onPressed: () => context.pop(),
        ),
        title: const Text(
          'Team Pass',
          style: TextStyle(
            color: Colors.white, fontWeight: FontWeight.w700, fontFamily: 'Poppins',
          ),
        ),
      ),
      body: teamAsync.when(
        loading: () => const Center(child: CircularProgressIndicator(color: AppColors.primary)),
        error: (e, _) => Center(
          child: Text('$e', style: const TextStyle(color: Colors.white54)),
        ),
        data: (team) => Column(
          children: [
            Expanded(
              child: Center(
                child: Screenshot(
                  controller: screenshotCtrl,
                  child: Container(
                    width: 320,
                    padding: const EdgeInsets.all(24),
                    decoration: BoxDecoration(
                      color: const Color(0xFF111111),
                      borderRadius: BorderRadius.circular(24),
                      border: Border.all(
                        color: AppColors.primary.withOpacity(0.6),
                        width: 2,
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: AppColors.primary.withOpacity(0.15),
                          blurRadius: 30,
                          spreadRadius: 4,
                        ),
                      ],
                    ),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Text(
                          'TEAM PASS',
                          style: TextStyle(
                            color: AppColors.primary,
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                            letterSpacing: 4,
                            fontFamily: 'Poppins',
                          ),
                        ),
                        const SizedBox(height: 16),
                        if (team.imageUrl != null)
                          ClipRRect(
                            borderRadius: BorderRadius.circular(14),
                            child: Image.network(team.imageUrl!, width: 80, height: 80, fit: BoxFit.cover),
                          )
                        else
                          Container(
                            width: 80, height: 80,
                            decoration: BoxDecoration(
                              color: AppColors.primary.withOpacity(0.15),
                              borderRadius: BorderRadius.circular(14),
                            ),
                            alignment: Alignment.center,
                            child: Text(
                              team.name.isNotEmpty ? team.name[0].toUpperCase() : '?',
                              style: const TextStyle(
                                color: AppColors.primary, fontSize: 36,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ),
                        const SizedBox(height: 14),
                        Text(
                          team.name.toUpperCase(),
                          style: const TextStyle(
                            color: Colors.white, fontSize: 20,
                            fontWeight: FontWeight.w700, fontFamily: 'Poppins',
                            letterSpacing: 1,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          team.sportType,
                          style: const TextStyle(
                            color: AppColors.primary, fontFamily: 'Poppins', fontSize: 13,
                          ),
                        ),
                        if (team.captainName != null) ...[
                          const SizedBox(height: 4),
                          Text(
                            'Captain: ${team.captainName}',
                            style: const TextStyle(color: Colors.white54, fontFamily: 'Poppins', fontSize: 12),
                          ),
                        ],
                        if (team.city != null) ...[
                          const SizedBox(height: 2),
                          Text(
                            team.city!,
                            style: const TextStyle(color: Colors.white38, fontFamily: 'Poppins', fontSize: 12),
                          ),
                        ],
                        const SizedBox(height: 20),
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: QrImageView(
                            data: team.teamCode,
                            version: QrVersions.auto,
                            size: 140,
                          ),
                        ),
                        const SizedBox(height: 12),
                        Text(
                          team.teamCode,
                          style: const TextStyle(
                            color: AppColors.primary,
                            fontSize: 18,
                            fontWeight: FontWeight.w700,
                            fontFamily: 'Poppins',
                            letterSpacing: 3,
                          ),
                        ),
                        const SizedBox(height: 4),
                        const Text(
                          'Team Code',
                          style: TextStyle(color: Colors.white38, fontSize: 11, fontFamily: 'Poppins'),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 32),
              child: Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () async {
                        final bytes = await screenshotCtrl.capture();
                        if (bytes == null) return;
                        final dir = await getTemporaryDirectory();
                        final file = File('${dir.path}/team_pass_${team.teamCode}.png');
                        await file.writeAsBytes(bytes);
                        await Share.shareXFiles(
                          [XFile(file.path)],
                          text: 'Join my team ${team.name} on BMS! Code: ${team.teamCode}',
                        );
                      },
                      icon: const Icon(Icons.share_outlined, color: AppColors.primary),
                      label: const Text('Share', style: TextStyle(color: AppColors.primary, fontFamily: 'Poppins')),
                      style: OutlinedButton.styleFrom(
                        side: BorderSide(color: AppColors.primary),
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: () async {
                        final bytes = await screenshotCtrl.capture();
                        if (bytes == null) return;
                        final dir = await getTemporaryDirectory();
                        final file = File('${dir.path}/team_pass_${team.teamCode}.png');
                        await file.writeAsBytes(bytes);
                        if (context.mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: Text('Saved to ${file.path}')),
                          );
                        }
                      },
                      icon: const Icon(Icons.download_outlined, color: Colors.black),
                      label: const Text('Download', style: TextStyle(color: Colors.black, fontFamily: 'Poppins', fontWeight: FontWeight.w600)),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
```

- [ ] **Step 2: Note on `path_provider`**

Check `pubspec.yaml` for `path_provider`. If missing, add it:

```yaml
  path_provider: ^2.1.0
```

Then run `flutter pub get`.

- [ ] **Step 3: Verify**

```bash
flutter analyze lib/screens/team_pass_screen.dart
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add lib/screens/team_pass_screen.dart pubspec.yaml pubspec.lock
git commit -m "feat: add TeamPassScreen with QR code display, Share and Download actions"
```

---

## Task 13: ChallengeTeamScreen

**Files:**
- Create: `lib/screens/challenge_team_screen.dart`

- [ ] **Step 1: Create `lib/screens/challenge_team_screen.dart`**

```dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../core/constants/app_colors.dart';
import '../models/team_model.dart';
import '../providers/team_provider.dart';
import '../services/team_service.dart';
import '../widgets/teams/team_card.dart';

class ChallengeTeamScreen extends ConsumerStatefulWidget {
  final String teamId;

  const ChallengeTeamScreen({super.key, required this.teamId});

  @override
  ConsumerState<ChallengeTeamScreen> createState() => _ChallengeTeamScreenState();
}

class _ChallengeTeamScreenState extends ConsumerState<ChallengeTeamScreen> {
  String _query = '';
  String? _sportFilter;
  bool _sending = false;

  void _confirmChallenge(BuildContext context, TeamModel opponent) {
    showModalBottomSheet(
      context: context,
      backgroundColor: const Color(0xFF111111),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (_) => Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              'Challenge ${opponent.name}?',
              style: const TextStyle(
                color: Colors.white, fontSize: 18,
                fontWeight: FontWeight.w700, fontFamily: 'Poppins',
              ),
            ),
            const SizedBox(height: 8),
            Text(
              '${opponent.sportType}${opponent.city != null ? ' · ${opponent.city}' : ''}  •  ${opponent.members.length} members',
              style: const TextStyle(color: Colors.white54, fontFamily: 'Poppins'),
            ),
            const SizedBox(height: 24),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => Navigator.pop(context),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: Colors.white54,
                      side: const BorderSide(color: Colors.white24),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    child: const Text('Cancel', style: TextStyle(fontFamily: 'Poppins')),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton(
                    onPressed: _sending
                        ? null
                        : () async {
                            setState(() => _sending = true);
                            Navigator.pop(context);
                            try {
                              await TeamService().requestOpponent(widget.teamId, opponent.id);
                              if (context.mounted) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                    content: Text('Challenge sent to ${opponent.name}!'),
                                    backgroundColor: AppColors.primary.withOpacity(0.85),
                                  ),
                                );
                              }
                            } catch (_) {
                              if (context.mounted) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(content: Text('Failed to send challenge. Try again.')),
                                );
                              }
                            } finally {
                              setState(() => _sending = false);
                            }
                          },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    child: const Text(
                      'Send Challenge!',
                      style: TextStyle(color: Colors.black, fontWeight: FontWeight.w700, fontFamily: 'Poppins'),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final filters = <String, String?>{
      'sport': _sportFilter,
      'city': null,
    };
    final teamsAsync = ref.watch(publicTeamsProvider(filters));

    return Scaffold(
      backgroundColor: Colors.black,
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
              child: Row(
                children: [
                  GestureDetector(
                    onTap: () => context.pop(),
                    child: const Icon(Icons.arrow_back_ios, color: Colors.white, size: 20),
                  ),
                  const SizedBox(width: 12),
                  const Text(
                    'Challenge a Team',
                    style: TextStyle(
                      color: Colors.white, fontSize: 22,
                      fontWeight: FontWeight.w700, fontFamily: 'Poppins',
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: TextField(
                onChanged: (v) => setState(() => _query = v.toLowerCase()),
                style: const TextStyle(color: Colors.white, fontFamily: 'Poppins'),
                decoration: InputDecoration(
                  hintText: 'Search teams by name or city...',
                  hintStyle: const TextStyle(color: Colors.white38, fontFamily: 'Poppins'),
                  prefixIcon: const Icon(Icons.search, color: Colors.white38),
                  filled: true,
                  fillColor: const Color(0xFF1A1A1A),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: const BorderSide(color: Colors.white12),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: const BorderSide(color: Colors.white12),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 12),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: ['All', 'Cricket', 'Football', 'Badminton', 'Volleyball', 'Basketball']
                      .map((s) => GestureDetector(
                            onTap: () => setState(() => _sportFilter = s == 'All' ? null : s),
                            child: Container(
                              margin: const EdgeInsets.only(right: 8),
                              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                              decoration: BoxDecoration(
                                color: (_sportFilter == s || (s == 'All' && _sportFilter == null))
                                    ? AppColors.primary
                                    : const Color(0xFF1A1A1A),
                                borderRadius: BorderRadius.circular(20),
                                border: Border.all(
                                  color: (_sportFilter == s || (s == 'All' && _sportFilter == null))
                                      ? AppColors.primary
                                      : Colors.white24,
                                ),
                              ),
                              child: Text(
                                s,
                                style: TextStyle(
                                  color: (_sportFilter == s || (s == 'All' && _sportFilter == null))
                                      ? Colors.black
                                      : Colors.white70,
                                  fontFamily: 'Poppins',
                                  fontWeight: FontWeight.w600,
                                  fontSize: 13,
                                ),
                              ),
                            ),
                          ))
                      .toList(),
                ),
              ),
            ),
            const SizedBox(height: 12),
            Expanded(
              child: teamsAsync.when(
                loading: () => const Center(child: CircularProgressIndicator(color: AppColors.primary)),
                error: (e, _) => Center(
                  child: Text('$e', style: const TextStyle(color: Colors.white54, fontFamily: 'Poppins')),
                ),
                data: (teams) {
                  final filtered = teams
                      .where((t) =>
                          t.id != widget.teamId &&
                          (_query.isEmpty ||
                              t.name.toLowerCase().contains(_query) ||
                              (t.city?.toLowerCase().contains(_query) ?? false)))
                      .toList();
                  if (filtered.isEmpty) {
                    return const Center(
                      child: Text('No teams found.',
                          style: TextStyle(color: Colors.white38, fontFamily: 'Poppins')),
                    );
                  }
                  return ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    itemCount: filtered.length,
                    itemBuilder: (_, i) => TeamCard(
                      team: filtered[i],
                      onTap: () => _confirmChallenge(context, filtered[i]),
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}
```

- [ ] **Step 2: Verify**

```bash
flutter analyze lib/screens/challenge_team_screen.dart
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add lib/screens/challenge_team_screen.dart
git commit -m "feat: add ChallengeTeamScreen with team search, sport filters, and challenge confirmation"
```

---

## Task 14: Wire Up Routes

**Files:**
- Modify: `lib/router/app_router.dart`

- [ ] **Step 1: Add imports to `app_router.dart`**

At the top of `lib/router/app_router.dart`, after the existing imports, add:

```dart
import '../screens/my_teams_screen.dart';
import '../screens/team_detail_screen.dart';
import '../screens/team_members_screen.dart';
import '../screens/team_pass_screen.dart';
import '../screens/challenge_team_screen.dart';
```

- [ ] **Step 2: Add routes**

Find the `routes: [` list in `app_router.dart`. Add these routes before the closing `]` of the routes list:

```dart
// ----------------------------------------------------------------
// My Teams
// ----------------------------------------------------------------
GoRoute(
  path: '/my-teams',
  builder: (context, state) => const MyTeamsScreen(),
),
GoRoute(
  path: '/my-teams/:id',
  builder: (context, state) =>
      TeamDetailScreen(teamId: state.pathParameters['id']!),
),
GoRoute(
  path: '/my-teams/:id/members',
  builder: (context, state) =>
      TeamMembersScreen(teamId: state.pathParameters['id']!),
),
GoRoute(
  path: '/my-teams/:id/pass',
  builder: (context, state) =>
      TeamPassScreen(teamId: state.pathParameters['id']!),
),
GoRoute(
  path: '/my-teams/:id/challenge',
  builder: (context, state) =>
      ChallengeTeamScreen(teamId: state.pathParameters['id']!),
),
```

- [ ] **Step 3: Verify**

```bash
flutter analyze lib/router/app_router.dart
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add lib/router/app_router.dart
git commit -m "feat: register /my-teams and sub-routes in GoRouter"
```

---

## Task 15: Add Entry Point in Settings Screen

**Files:**
- Modify: `lib/screens/settings_screen.dart`

- [ ] **Step 1: Add the "My Teams" card**

In `lib/screens/settings_screen.dart`, find the first `_buildSettingCard(` call (the "Apply as a Coach" card around line 101). Add the "My Teams" card **before** it:

```dart
// My Teams
_buildSettingCard(
  icon: '👥',
  title: 'My Teams',
  subtitle: 'Create and manage your sports teams',
  gradientColors: [
    const Color(0xFF1a3d1a),
    const Color(0xFF0d2010),
  ],
  onTap: () {
    context.push('/my-teams');
  },
),

const SizedBox(height: 12),
```

- [ ] **Step 2: Verify**

```bash
flutter analyze lib/screens/settings_screen.dart
```

Expected: No errors.

- [ ] **Step 3: Run the app and navigate to the Profile tab → Settings to verify the card appears**

```bash
flutter run
```

Navigate: Profile tab → scroll to "My Teams" card → tap → `MyTeamsScreen` loads.

- [ ] **Step 4: Commit**

```bash
git add lib/screens/settings_screen.dart
git commit -m "feat: add My Teams entry point in settings screen"
```

---

## Task 16: Verify `UserService.searchPlayers` Exists

**Files:**
- Modify (if needed): `lib/services/user_service.dart`

- [ ] **Step 1: Check if the method exists**

```bash
grep -n "searchPlayers" lib/services/user_service.dart
```

- [ ] **Step 2: If NOT found, add the method**

Open `lib/services/user_service.dart` and add inside the `UserService` class:

```dart
Future<List<Map<String, dynamic>>> searchPlayers(String query) async {
  try {
    final response = await _dio.get(
      '/user/players/search',
      queryParameters: {'query': query},
    );
    final data = response.data as List<dynamic>;
    return data.map((u) => u as Map<String, dynamic>).toList();
  } on DioException catch (e) {
    print('❌ searchPlayers error: ${e.response?.data}');
    return [];
  }
}
```

- [ ] **Step 3: Verify**

```bash
flutter analyze lib/services/user_service.dart
```

Expected: No errors.

- [ ] **Step 4: Commit if changed**

```bash
git add lib/services/user_service.dart
git commit -m "feat: add searchPlayers method to UserService for team invite search"
```

---

## Task 17: Final Integration Check

- [ ] **Step 1: Full analyze**

```bash
flutter analyze lib/
```

Expected: No errors (warnings about unused imports are acceptable, errors are not).

- [ ] **Step 2: Run all tests**

```bash
flutter test
```

Expected: All tests pass.

- [ ] **Step 3: Run the app and walk through the full flow**

```bash
flutter run
```

Walk through:
1. Profile tab → "My Teams" card appears
2. Tap → `MyTeamsScreen` loads (empty state shows)
3. Tap FAB → `CreateTeamModal` opens, fill in name + sport → submit → team appears in list
4. Tap a team → `TeamDetailScreen` shows banner, code, stats, member preview, 4 action buttons
5. Tap "Invite" → `InviteMemberModal` opens with two tabs
6. Tap "Team Pass" → `TeamPassScreen` shows QR card → Share and Download work
7. Tap "Challenge" → `ChallengeTeamScreen` shows public teams list, sport filters work
8. Tap "View All" members → `TeamMembersScreen` shows Registered/Custom tabs

- [ ] **Step 4: Final commit**

```bash
git add .
git commit -m "feat: complete Make My Team integration — 5 screens, 3 modals, full Kridaz backend wiring"
```
