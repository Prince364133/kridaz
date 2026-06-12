/// A match that has been created on the backend but not yet started by the
/// scorer. Shown above Recent Scores on the Games screen until the creator
/// taps it, enters the scoring password, and the live scorer takes over.
///
/// Kept small on purpose — only the fields the review screen renders and the
/// fields the /scoring route needs to bootstrap. The backend already holds
/// the canonical record at /scoring/status/:matchId; this is a UI hint, not
/// a source of truth.
class PendingMatch {
  final String matchId;
  final String matchName;
  final String teamAName;
  final String teamBName;
  final int teamAPlayerCount;
  final int teamBPlayerCount;
  final String format;
  final int overs;
  final int powerPlayOvers;
  final int maxMembers;
  final String ballType;
  final String groundType;
  final String pitchType;
  final String timing;
  final String venueName;
  final DateTime? matchDate;
  final String? umpireName;
  final String? scorerName;
  final String? streamerName;
  final String? youtubeLiveUrl;
  final bool hasScoringPassword;
  final String? tossWinner; // 'teamA' | 'teamB'
  final String tossDecision; // 'BAT' | 'BOWL'
  final String location; // alias of venueName, kept for the /scoring route
  final DateTime createdAt;

  const PendingMatch({
    required this.matchId,
    required this.matchName,
    required this.teamAName,
    required this.teamBName,
    required this.teamAPlayerCount,
    required this.teamBPlayerCount,
    required this.format,
    required this.overs,
    required this.powerPlayOvers,
    required this.maxMembers,
    required this.ballType,
    required this.groundType,
    required this.pitchType,
    required this.timing,
    required this.venueName,
    required this.matchDate,
    required this.umpireName,
    required this.scorerName,
    required this.streamerName,
    required this.youtubeLiveUrl,
    required this.hasScoringPassword,
    required this.tossWinner,
    required this.tossDecision,
    required this.location,
    required this.createdAt,
  });

  Map<String, dynamic> toJson() => {
        'matchId': matchId,
        'matchName': matchName,
        'teamAName': teamAName,
        'teamBName': teamBName,
        'teamAPlayerCount': teamAPlayerCount,
        'teamBPlayerCount': teamBPlayerCount,
        'format': format,
        'overs': overs,
        'powerPlayOvers': powerPlayOvers,
        'maxMembers': maxMembers,
        'ballType': ballType,
        'groundType': groundType,
        'pitchType': pitchType,
        'timing': timing,
        'venueName': venueName,
        'matchDate': matchDate?.toIso8601String(),
        'umpireName': umpireName,
        'scorerName': scorerName,
        'streamerName': streamerName,
        'youtubeLiveUrl': youtubeLiveUrl,
        'hasScoringPassword': hasScoringPassword,
        'tossWinner': tossWinner,
        'tossDecision': tossDecision,
        'location': location,
        'createdAt': createdAt.toIso8601String(),
      };

  factory PendingMatch.fromJson(Map<String, dynamic> json) => PendingMatch(
        matchId: json['matchId']?.toString() ?? '',
        matchName: json['matchName']?.toString() ?? 'Match',
        teamAName: json['teamAName']?.toString() ?? 'Team A',
        teamBName: json['teamBName']?.toString() ?? 'Team B',
        teamAPlayerCount: (json['teamAPlayerCount'] as num?)?.toInt() ?? 0,
        teamBPlayerCount: (json['teamBPlayerCount'] as num?)?.toInt() ?? 0,
        format: json['format']?.toString() ?? 'T20',
        overs: (json['overs'] as num?)?.toInt() ?? 20,
        powerPlayOvers: (json['powerPlayOvers'] as num?)?.toInt() ?? 6,
        maxMembers: (json['maxMembers'] as num?)?.toInt() ?? 11,
        ballType: json['ballType']?.toString() ?? 'LEATHER',
        groundType: json['groundType']?.toString() ?? 'OUTDOOR',
        pitchType: json['pitchType']?.toString() ?? 'TURF',
        timing: json['timing']?.toString() ?? 'DAY',
        venueName: json['venueName']?.toString() ?? '',
        matchDate: json['matchDate'] != null
            ? DateTime.tryParse(json['matchDate'].toString())
            : null,
        umpireName: json['umpireName']?.toString(),
        scorerName: json['scorerName']?.toString(),
        streamerName: json['streamerName']?.toString(),
        youtubeLiveUrl: json['youtubeLiveUrl']?.toString(),
        hasScoringPassword: json['hasScoringPassword'] == true,
        tossWinner: json['tossWinner']?.toString(),
        tossDecision: json['tossDecision']?.toString() ?? 'BAT',
        location: json['location']?.toString() ?? '',
        createdAt: json['createdAt'] != null
            ? DateTime.tryParse(json['createdAt'].toString()) ?? DateTime.now()
            : DateTime.now(),
      );
}
