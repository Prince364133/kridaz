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

/// Public teams list, keyed by an optional sport filter.
///
/// Note: this used to take a `Map<String, String?>` — Dart maps don't have
/// value equality, so every screen rebuild created a new map instance and
/// Riverpod treated it as a new provider, forcing a fresh network call on
/// every keystroke in the search field. A nullable `String` has proper
/// `==` semantics, so the provider only refetches when the sport actually
/// changes.
final publicTeamsProvider =
    FutureProvider.family<List<TeamModel>, String?>((ref, sport) async {
  return ref.read(teamServiceProvider).getAllPublicTeams(sport: sport);
});

class TeamFormState {
  final String name;
  final String? description;
  final String sport;
  final String? city;
  final String? imageUrl;

  const TeamFormState({
    this.name = '',
    this.description,
    this.sport = 'Cricket',
    this.city,
    this.imageUrl,
  });

  TeamFormState copyWith({
    String? name,
    String? description,
    String? sport,
    String? city,
    String? imageUrl,
  }) {
    return TeamFormState(
      name: name ?? this.name,
      description: description ?? this.description,
      sport: sport ?? this.sport,
      city: city ?? this.city,
      imageUrl: imageUrl ?? this.imageUrl,
    );
  }

  Map<String, dynamic> toPayload() => {
        'name': name,
        if (description != null) 'description': description,
        'sportType': sport,
        if (city != null) 'city': city,
        if (imageUrl != null) 'image': imageUrl,
      };
}

class TeamFormNotifier extends StateNotifier<TeamFormState> {
  TeamFormNotifier() : super(const TeamFormState());

  void update(TeamFormState Function(TeamFormState) fn) => state = fn(state);
  void reset() => state = const TeamFormState();
}

final teamFormProvider = StateNotifierProvider<TeamFormNotifier, TeamFormState>(
  (_) => TeamFormNotifier(),
);
