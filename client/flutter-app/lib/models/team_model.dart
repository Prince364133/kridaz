enum TeamRole { captain, viceCaptain, player, guest }

enum TeamMemberStatus { joined, pending, accepted, declined }

enum PlayingRole { none, batsman, bowler, allRounder, wicketKeeper }

class TeamModel {
  final String id;
  final String name;
  final String? description;
  final String teamCode;
  final String? imageUrl;
  final String? logoUrl;
  final String sportType;
  final String? city;
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

  TeamMemberModel? get captain {
    for (final m in members) {
      if (m.role == TeamRole.captain) return m;
    }
    return null;
  }

  TeamMemberModel? get viceCaptain {
    for (final m in members) {
      if (m.role == TeamRole.viceCaptain) return m;
    }
    return null;
  }

  String? get captainName => captain?.userName;
}

class TeamMemberModel {
  final String teamId;
  final String userId;
  final TeamRole role;
  final PlayingRole playingRole;
  final TeamMemberStatus status;
  final String? userName;
  final String? avatarUrl;
  final String? city;

  const TeamMemberModel({
    required this.teamId,
    required this.userId,
    required this.role,
    this.playingRole = PlayingRole.none,
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
      playingRole: _parsePlayingRole(json['playingRole'] as String?),
      status: _parseStatus(json['status'] as String?),
      // Backend convention is `name` + `profilePicture`; keep the older
      // `firstName`/`profilePhoto` keys as fallbacks for any legacy payload.
      userName: (user?['name'] ?? user?['firstName'])?.toString(),
      avatarUrl: (user?['profilePicture'] ?? user?['profilePhoto'])?.toString(),
      city: user?['city']?.toString(),
    );
  }

  static TeamRole _parseRole(String? s) => switch (s) {
        'CAPTAIN' => TeamRole.captain,
        'VICE_CAPTAIN' => TeamRole.viceCaptain,
        'GUEST' => TeamRole.guest,
        _ => TeamRole.player,
      };

  static PlayingRole _parsePlayingRole(String? s) => switch (s) {
        'BATSMAN' => PlayingRole.batsman,
        'BOWLER' => PlayingRole.bowler,
        'ALL_ROUNDER' => PlayingRole.allRounder,
        'WICKET_KEEPER' => PlayingRole.wicketKeeper,
        _ => PlayingRole.none,
      };

  static TeamMemberStatus _parseStatus(String? s) => switch (s) {
        'PENDING' => TeamMemberStatus.pending,
        'ACCEPTED' => TeamMemberStatus.accepted,
        'DECLINED' => TeamMemberStatus.declined,
        _ => TeamMemberStatus.joined,
      };
}

extension TeamRoleX on TeamRole {
  String get apiValue => switch (this) {
        TeamRole.captain => 'CAPTAIN',
        TeamRole.viceCaptain => 'VICE_CAPTAIN',
        TeamRole.guest => 'GUEST',
        TeamRole.player => 'PLAYER',
      };
}

extension PlayingRoleX on PlayingRole {
  String get apiValue => switch (this) {
        PlayingRole.batsman => 'BATSMAN',
        PlayingRole.bowler => 'BOWLER',
        PlayingRole.allRounder => 'ALL_ROUNDER',
        PlayingRole.wicketKeeper => 'WICKET_KEEPER',
        PlayingRole.none => 'NONE',
      };

  String get label => switch (this) {
        PlayingRole.batsman => 'Batsman',
        PlayingRole.bowler => 'Bowler',
        PlayingRole.allRounder => 'All Rounder',
        PlayingRole.wicketKeeper => 'Wicket Keeper',
        PlayingRole.none => 'Unassigned',
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
