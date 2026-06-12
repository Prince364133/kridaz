/// Pure-Dart business entity. NO Flutter imports, NO json codecs, NO
/// freezed annotations — so the domain layer stays trivially unit-testable
/// and could theoretically be reused on a Dart server.
///
/// Map from [UserDto] → [User] in the repository implementation. Never
/// pass a DTO into the presentation layer.
class User {
  final String id;
  final String? ownerId;
  final String name;
  final String username;
  final String? email;
  final String? phone;
  final String role;
  final String? profilePicture;
  final String? city;
  final List<String> sportTypes;
  final bool isOnboarded;
  final bool isVerified;
  final double walletBalance;

  const User({
    required this.id,
    required this.name,
    required this.username,
    required this.role,
    this.ownerId,
    this.email,
    this.phone,
    this.profilePicture,
    this.city,
    this.sportTypes = const [],
    this.isOnboarded = false,
    this.isVerified = false,
    this.walletBalance = 0,
  });

  bool get isProfessional =>
      role == 'COACH' ||
      role == 'UMPIRE' ||
      role == 'OWNER' ||
      role == 'VENUE_OWNER';

  bool get isAdmin => role.toUpperCase() == 'ADMIN';

  User copyWith({
    String? name,
    String? username,
    String? email,
    String? phone,
    String? role,
    String? profilePicture,
    String? city,
    List<String>? sportTypes,
    bool? isOnboarded,
    bool? isVerified,
    double? walletBalance,
  }) =>
      User(
        id: id,
        ownerId: ownerId,
        name: name ?? this.name,
        username: username ?? this.username,
        email: email ?? this.email,
        phone: phone ?? this.phone,
        role: role ?? this.role,
        profilePicture: profilePicture ?? this.profilePicture,
        city: city ?? this.city,
        sportTypes: sportTypes ?? this.sportTypes,
        isOnboarded: isOnboarded ?? this.isOnboarded,
        isVerified: isVerified ?? this.isVerified,
        walletBalance: walletBalance ?? this.walletBalance,
      );

  @override
  bool operator ==(Object other) =>
      identical(this, other) || (other is User && other.id == id);

  @override
  int get hashCode => id.hashCode;
}
