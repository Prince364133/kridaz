import 'venue_model.dart';

class Court {
  final String id;
  final String venueId;
  final String name;
  final String? type;
  final double? defaultHourlyRate;
  final String? surfaceType;
  final int? maxPlayers;
  final DateTime createdAt;
  final DateTime updatedAt;

  // Optional nested venue object for denormalized responses
  final Venue? venue;

  const Court({
    required this.id,
    required this.venueId,
    required this.name,
    this.type,
    this.defaultHourlyRate,
    this.surfaceType,
    this.maxPlayers,
    required this.createdAt,
    required this.updatedAt,
    this.venue,
  });

  // For PostgreSQL - from JSON response
  factory Court.fromJson(Map<String, dynamic> json) {
    return Court(
      id: json['id']?.toString() ?? '',
      venueId:
          json['venue_id']?.toString() ?? json['venueId']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      type: json['type']?.toString(),
      defaultHourlyRate: json['default_hourly_rate']?.toDouble() ??
          json['defaultHourlyRate']?.toDouble(),
      surfaceType:
          json['surface_type']?.toString() ?? json['surfaceType']?.toString(),
      maxPlayers: json['max_players']?.toInt() ?? json['maxPlayers']?.toInt(),
      createdAt: json['created_at'] != null
          ? DateTime.parse(json['created_at'])
          : json['createdAt'] != null
              ? DateTime.parse(json['createdAt'])
              : DateTime.now(),
      updatedAt: json['updated_at'] != null
          ? DateTime.parse(json['updated_at'])
          : json['updatedAt'] != null
              ? DateTime.parse(json['updatedAt'])
              : DateTime.now(),
      venue: json['venue'] != null ? Venue.fromJson(json['venue']) : null,
    );
  }

  // For PostgreSQL - to JSON for API requests
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'venue_id': venueId,
      'name': name,
      'type': type,
      'default_hourly_rate': defaultHourlyRate,
      'surface_type': surfaceType,
      'max_players': maxPlayers,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
    };
  }

  Court copyWith({
    String? id,
    String? venueId,
    String? name,
    String? type,
    double? defaultHourlyRate,
    String? surfaceType,
    int? maxPlayers,
    DateTime? createdAt,
    DateTime? updatedAt,
    Venue? venue,
  }) {
    return Court(
      id: id ?? this.id,
      venueId: venueId ?? this.venueId,
      name: name ?? this.name,
      type: type ?? this.type,
      defaultHourlyRate: defaultHourlyRate ?? this.defaultHourlyRate,
      surfaceType: surfaceType ?? this.surfaceType,
      maxPlayers: maxPlayers ?? this.maxPlayers,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      venue: venue ?? this.venue,
    );
  }
}
