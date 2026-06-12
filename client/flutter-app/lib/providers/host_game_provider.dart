import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/ground_model.dart';
import '../models/official_model.dart';
import '../models/slot_model.dart';

enum GameMode { quick, professional }

enum CompetitionLevel { friendly, competitive }

class HostGameFormState {
  // Step 1
  final GameMode gameMode;

  // Step 2
  final String? selectedSport;
  final DateTime? selectedDate;
  final TimeOfDay? startTime;
  final TimeOfDay? endTime;
  final String? selectedLocation;
  final double playerShare;
  final bool isFreeGame;
  final CompetitionLevel competitionLevel;
  final bool isPublic;

  // Step 3 — Venue & Officials
  final GroundModel? selectedGround;
  final OfficialModel? selectedUmpire;
  final OfficialModel? selectedScorer;
  final OfficialModel? selectedStreamer;
  final String? customUmpireName;
  final String? customUmpireEmail;
  final String? customUmpirePhone;

  // Cricket-specific — gates the scoring console at POST /scoring/auth/:gameId.
  // Optional; if blank, only assigned umpire/scorer accounts (real users)
  // can run the scoring app via their normal login.
  final String? scoringPassword;
  // Overs cap for cricket matches (used by /scoring/setup). 20 = T20, 50 = ODI.
  final int? oversPerInnings;

  // Step 4 — Professional mode
  final TeamConfig teamA;
  final TeamConfig teamB;

  // Step 4 — Quick mode
  final int quickPlayerCount;
  final List<SlotData> quickSlots;

  const HostGameFormState({
    this.gameMode = GameMode.professional,
    this.selectedSport,
    this.selectedDate,
    this.startTime,
    this.endTime,
    this.selectedLocation,
    this.playerShare = 0,
    this.isFreeGame = false,
    this.competitionLevel = CompetitionLevel.competitive,
    this.isPublic = true,
    this.selectedGround,
    this.selectedUmpire,
    this.selectedScorer,
    this.selectedStreamer,
    this.customUmpireName,
    this.customUmpireEmail,
    this.customUmpirePhone,
    this.scoringPassword,
    this.oversPerInnings,
    this.teamA = const TeamConfig(name: 'Team A', slots: []),
    this.teamB = const TeamConfig(name: 'Team B', slots: []),
    this.quickPlayerCount = 2,
    this.quickSlots = const [],
  });

  HostGameFormState copyWith({
    GameMode? gameMode,
    String? selectedSport,
    DateTime? selectedDate,
    TimeOfDay? startTime,
    TimeOfDay? endTime,
    String? selectedLocation,
    double? playerShare,
    bool? isFreeGame,
    CompetitionLevel? competitionLevel,
    bool? isPublic,
    GroundModel? selectedGround,
    OfficialModel? selectedUmpire,
    OfficialModel? selectedScorer,
    OfficialModel? selectedStreamer,
    String? customUmpireName,
    String? customUmpireEmail,
    String? customUmpirePhone,
    String? scoringPassword,
    int? oversPerInnings,
    TeamConfig? teamA,
    TeamConfig? teamB,
    int? quickPlayerCount,
    List<SlotData>? quickSlots,
  }) {
    return HostGameFormState(
      gameMode: gameMode ?? this.gameMode,
      selectedSport: selectedSport ?? this.selectedSport,
      selectedDate: selectedDate ?? this.selectedDate,
      startTime: startTime ?? this.startTime,
      endTime: endTime ?? this.endTime,
      selectedLocation: selectedLocation ?? this.selectedLocation,
      playerShare: playerShare ?? this.playerShare,
      isFreeGame: isFreeGame ?? this.isFreeGame,
      competitionLevel: competitionLevel ?? this.competitionLevel,
      isPublic: isPublic ?? this.isPublic,
      selectedGround: selectedGround ?? this.selectedGround,
      selectedUmpire: selectedUmpire ?? this.selectedUmpire,
      selectedScorer: selectedScorer ?? this.selectedScorer,
      selectedStreamer: selectedStreamer ?? this.selectedStreamer,
      customUmpireName: customUmpireName ?? this.customUmpireName,
      customUmpireEmail: customUmpireEmail ?? this.customUmpireEmail,
      customUmpirePhone: customUmpirePhone ?? this.customUmpirePhone,
      scoringPassword: scoringPassword ?? this.scoringPassword,
      oversPerInnings: oversPerInnings ?? this.oversPerInnings,
      teamA: teamA ?? this.teamA,
      teamB: teamB ?? this.teamB,
      quickPlayerCount: quickPlayerCount ?? this.quickPlayerCount,
      quickSlots: quickSlots ?? this.quickSlots,
    );
  }

  double get totalCost =>
      (selectedGround?.pricePerHour ?? 0) +
      (selectedUmpire?.price ?? 0) +
      (selectedScorer?.price ?? 0) +
      (selectedStreamer?.price ?? 0);

  String? validate() {
    if (selectedSport == null) return 'Please select a sport';
    if (selectedDate == null) return 'Please select a date';
    if (startTime == null) return 'Please select a start time';
    if (selectedLocation == null) return 'Please select a location';
    if (gameMode == GameMode.quick && quickPlayerCount < 2) {
      return 'Quick game needs at least 2 players';
    }
    if (!isFreeGame && playerShare <= 0) {
      return 'Enter a player share amount or mark as Free';
    }
    return null;
  }

  Map<String, dynamic> toCreatePayload(String hostId) {
    final startHour = startTime!.hour.toString().padLeft(2, '0');
    final startMin = startTime!.minute.toString().padLeft(2, '0');
    final timeStr = '$startHour:$startMin';

    String? endTimeStr;
    if (endTime != null) {
      final h = endTime!.hour.toString().padLeft(2, '0');
      final m = endTime!.minute.toString().padLeft(2, '0');
      endTimeStr = '$h:$m';
    }

    final city = selectedLocation?.split(',').first.trim();
    final state = selectedLocation?.split(',').length == 2
        ? selectedLocation!.split(',').last.trim()
        : null;

    final base = <String, dynamic>{
      'gameType': selectedSport,
      'date': selectedDate!.toIso8601String(),
      'time': timeStr,
      if (endTimeStr != null) 'endTime': endTimeStr,
      'isFree': isFreeGame,
      'competitionLevel': competitionLevel == CompetitionLevel.friendly
          ? 'FRIENDLY'
          : 'COMPETITIVE',
      // Send both shapes — legacy boolean and the doc's PUBLIC|PRIVATE
      // string — so older backends and the contract-spec backend both work.
      'isPublic': isPublic,
      'visibility': isPublic ? 'PUBLIC' : 'PRIVATE',
      'perPlayerCharge': isFreeGame ? 0 : playerShare,
      if (city != null) 'city': city,
      if (state != null) 'state': state,
      if (selectedGround != null) 'groundId': selectedGround!.id,
      if (selectedGround != null) 'turfId': selectedGround!.id,
      if (selectedUmpire != null) 'umpireId': selectedUmpire!.id,
      if (selectedScorer != null) 'scorerId': selectedScorer!.id,
      if (selectedStreamer != null) 'streamerId': selectedStreamer!.id,
      if (scoringPassword != null && scoringPassword!.isNotEmpty)
        'scoringPassword': scoringPassword,
      if (oversPerInnings != null) 'oversPerInnings': oversPerInnings,
      if (customUmpireName != null && customUmpireEmail != null)
        'customUmpireData': {
          'name': customUmpireName,
          'email': customUmpireEmail,
          if (customUmpirePhone != null) 'phone': customUmpirePhone,
        },
    };

    if (gameMode == GameMode.quick) {
      base['gameMode'] = 'QUICK';
      base['playerCount'] = quickPlayerCount;
      base['quickSlotsData'] = quickSlots
          .map((s) => {
                'role': s.role,
                if (s.userId != null) 'userId': s.userId,
                if (s.customPlayerEmail != null)
                  'customPlayer': {
                    'name': s.customPlayerName ?? 'Guest',
                    'email': s.customPlayerEmail,
                    'mustPay': !isFreeGame,
                  },
              })
          .toList();
    } else {
      // Doc names the two-team mode "TEAMS"; we kept the legacy
      // "PROFESSIONAL" enum locally. Send both so backend dispatchers
      // that switch on either value work.
      base['gameMode'] = 'TEAMS';
      base['teamA'] = teamA.toJson();
      base['teamB'] = teamB.toJson();
      base['maxMembers'] = teamA.slots.length;
    }

    return base;
  }
}

class HostGameFormNotifier extends StateNotifier<HostGameFormState> {
  HostGameFormNotifier() : super(const HostGameFormState());

  void setGameMode(GameMode mode) => state = state.copyWith(gameMode: mode);
  void setSport(String sport) => state = state.copyWith(selectedSport: sport);
  void setDate(DateTime date) => state = state.copyWith(selectedDate: date);
  void setStartTime(TimeOfDay t) => state = state.copyWith(startTime: t);
  void setEndTime(TimeOfDay t) => state = state.copyWith(endTime: t);
  void setLocation(String loc) => state = state.copyWith(selectedLocation: loc);
  void setPlayerShare(double v) => state = state.copyWith(playerShare: v);
  void setFreeGame(bool v) => state = state.copyWith(isFreeGame: v);
  void setCompetitionLevel(CompetitionLevel v) =>
      state = state.copyWith(competitionLevel: v);
  void setPublic(bool v) => state = state.copyWith(isPublic: v);
  void setGround(GroundModel? g) => state = state.copyWith(selectedGround: g);
  void setUmpire(OfficialModel? u) => state = state.copyWith(selectedUmpire: u);
  void setScorer(OfficialModel? s) => state = state.copyWith(selectedScorer: s);
  void setStreamer(OfficialModel? s) =>
      state = state.copyWith(selectedStreamer: s);
  void setScoringPassword(String? pwd) =>
      state = state.copyWith(scoringPassword: pwd);
  void setOversPerInnings(int? overs) =>
      state = state.copyWith(oversPerInnings: overs);
  void setCustomUmpire(String name, String email, String? phone) =>
      state = state.copyWith(
        customUmpireName: name,
        customUmpireEmail: email,
        customUmpirePhone: phone,
      );
  void clearCustomUmpire() => state = state.copyWith(
        customUmpireName: null,
        customUmpireEmail: null,
        customUmpirePhone: null,
      );

  void setTeamName(String teamKey, String name) {
    if (teamKey == 'teamA') {
      state = state.copyWith(teamA: state.teamA.copyWith(name: name));
    } else {
      state = state.copyWith(teamB: state.teamB.copyWith(name: name));
    }
  }

  void setTeamImage(String teamKey, String url) {
    if (teamKey == 'teamA') {
      state = state.copyWith(teamA: state.teamA.copyWith(imageUrl: url));
    } else {
      state = state.copyWith(teamB: state.teamB.copyWith(imageUrl: url));
    }
  }

  void initSlotsForSport(String sport) {
    final defaults =
        _sportDefaults[sport] ?? [const _RoleCount(role: 'Player', count: 5)];
    final slots = <SlotData>[];
    for (final d in defaults) {
      for (int i = 0; i < d.count; i++) {
        slots.add(SlotData(role: d.role));
      }
    }
    state = state.copyWith(
      teamA: state.teamA.copyWith(slots: List.from(slots)),
      teamB: state.teamB.copyWith(slots: List.from(slots)),
    );
  }

  void addSlot(String teamKey) {
    final team = teamKey == 'teamA' ? state.teamA : state.teamB;
    final updated = team.copyWith(
      slots: [...team.slots, const SlotData(role: 'Player')],
    );
    if (teamKey == 'teamA') {
      state = state.copyWith(teamA: updated);
    } else {
      state = state.copyWith(teamB: updated);
    }
  }

  void removeSlot(String teamKey, int index) {
    final team = teamKey == 'teamA' ? state.teamA : state.teamB;
    final newSlots = [...team.slots]..removeAt(index);
    final updated = team.copyWith(slots: newSlots);
    if (teamKey == 'teamA') {
      state = state.copyWith(teamA: updated);
    } else {
      state = state.copyWith(teamB: updated);
    }
  }

  void updateSlotRole(String teamKey, int index, String role) {
    final team = teamKey == 'teamA' ? state.teamA : state.teamB;
    final newSlots = [...team.slots];
    newSlots[index] = newSlots[index].copyWith(role: role);
    final updated = team.copyWith(slots: newSlots);
    if (teamKey == 'teamA') {
      state = state.copyWith(teamA: updated);
    } else {
      state = state.copyWith(teamB: updated);
    }
  }

  void setQuickPlayerCount(int count) =>
      state = state.copyWith(quickPlayerCount: count);

  void initQuickSlots(String hostId, String hostName) {
    final slots = <SlotData>[
      SlotData(
        role: 'Player',
        userId: hostId,
        userName: hostName,
        status: SlotStatus.joined,
      ),
      ...List.generate(
        state.quickPlayerCount - 1,
        (_) => const SlotData(role: 'Player', status: SlotStatus.open),
      ),
    ];
    state = state.copyWith(quickSlots: slots);
  }

  void assignQuickSlot(int index,
      {String? userId,
      String? userName,
      String? customName,
      String? customEmail}) {
    final newSlots = [...state.quickSlots];
    newSlots[index] = newSlots[index].copyWith(
      userId: userId,
      userName: userName,
      customPlayerName: customName,
      customPlayerEmail: customEmail,
      status: (userId != null || customEmail != null)
          ? SlotStatus.held
          : SlotStatus.open,
    );
    state = state.copyWith(quickSlots: newSlots);
  }

  void clearQuickSlot(int index) {
    final newSlots = [...state.quickSlots];
    newSlots[index] = const SlotData(role: 'Player', status: SlotStatus.open);
    state = state.copyWith(quickSlots: newSlots);
  }

  void reset() => state = const HostGameFormState();
}

final hostGameFormProvider =
    StateNotifierProvider<HostGameFormNotifier, HostGameFormState>(
  (ref) => HostGameFormNotifier(),
);

// ── Internal helpers ──────────────────────────────────────────────────────────

class _RoleCount {
  final String role;
  final int count;
  const _RoleCount({required this.role, required this.count});
}

const _sportDefaults = <String, List<_RoleCount>>{
  'Cricket': [
    _RoleCount(role: 'Batsman', count: 4),
    _RoleCount(role: 'Bowler', count: 4),
    _RoleCount(role: 'All-rounder', count: 2),
    _RoleCount(role: 'Wicket Keeper', count: 1),
  ],
  'Football': [
    _RoleCount(role: 'Forward', count: 3),
    _RoleCount(role: 'Midfielder', count: 3),
    _RoleCount(role: 'Defender', count: 4),
    _RoleCount(role: 'GK', count: 1),
  ],
  'Basketball': [
    _RoleCount(role: 'Guard', count: 2),
    _RoleCount(role: 'Forward', count: 2),
    _RoleCount(role: 'Center', count: 1),
  ],
  'Volleyball': [
    _RoleCount(role: 'Attacker', count: 2),
    _RoleCount(role: 'Setter', count: 1),
    _RoleCount(role: 'Blocker', count: 2),
    _RoleCount(role: 'Libero', count: 1),
  ],
  'Badminton': [_RoleCount(role: 'Player', count: 2)],
  'Tennis': [_RoleCount(role: 'Player', count: 2)],
};
