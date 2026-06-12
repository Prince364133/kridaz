enum OfficialRole { umpire, streamer, scorer }

class OfficialModel {
  final String id;
  final String name;
  final String? profilePicture;
  final double price;
  final List<String> gameTypes;
  final String? city;
  final String? state;
  final OfficialRole role;

  const OfficialModel({
    required this.id,
    required this.name,
    this.profilePicture,
    required this.price,
    required this.gameTypes,
    this.city,
    this.state,
    required this.role,
  });

  factory OfficialModel.fromJson(Map<String, dynamic> json, OfficialRole role) {
    return OfficialModel(
      id: json['id']?.toString() ?? '',
      name: json['name'] ?? '',
      profilePicture: json['profilePicture'],
      price: double.tryParse(json['price']?.toString() ?? '0') ?? 0,
      gameTypes: List<String>.from(json['gameTypes'] ?? []),
      city: json['city'],
      state: json['state'],
      role: role,
    );
  }
}
