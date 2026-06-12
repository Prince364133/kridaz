/// User model for PostgreSQL backend
class UserModel {
  final String uid;
  final String email;
  final String? displayName;
  final String? photoURL;
  final String? name;
  final int? age;
  final String? gender;
  final List<String>? sports;
  final List<String>? interests;
  final DateTime createdAt;
  final DateTime updatedAt;

  const UserModel({
    required this.uid,
    required this.email,
    this.displayName,
    this.photoURL,
    this.name,
    this.age,
    this.gender,
    this.sports,
    this.interests,
    required this.createdAt,
    required this.updatedAt,
  });

  factory UserModel.fromMap(Map<String, dynamic> data) {
    return UserModel(
      uid: data['uid'] ?? '',
      email: data['email'] ?? '',
      displayName: data['displayName'],
      photoURL: data['photoURL'],
      name: data['name'],
      age: data['age'],
      gender: data['gender'],
      sports: data['sports'] != null ? List<String>.from(data['sports']) : null,
      interests: data['interests'] != null
          ? List<String>.from(data['interests'])
          : null,
      createdAt: data['createdAt'] is String
          ? DateTime.parse(data['createdAt'])
          : data['createdAt'] is DateTime
              ? data['createdAt']
              : DateTime.now(),
      updatedAt: data['updatedAt'] is String
          ? DateTime.parse(data['updatedAt'])
          : data['updatedAt'] is DateTime
              ? data['updatedAt']
              : DateTime.now(),
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'uid': uid,
      'email': email,
      'displayName': displayName,
      'photoURL': photoURL,
      'name': name,
      'age': age,
      'gender': gender,
      'sports': sports,
      'interests': interests,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  UserModel copyWith({
    String? uid,
    String? email,
    String? displayName,
    String? photoURL,
    String? name,
    int? age,
    String? gender,
    List<String>? sports,
    List<String>? interests,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return UserModel(
      uid: uid ?? this.uid,
      email: email ?? this.email,
      displayName: displayName ?? this.displayName,
      photoURL: photoURL ?? this.photoURL,
      name: name ?? this.name,
      age: age ?? this.age,
      gender: gender ?? this.gender,
      sports: sports ?? this.sports,
      interests: interests ?? this.interests,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}
