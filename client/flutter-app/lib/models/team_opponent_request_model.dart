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
